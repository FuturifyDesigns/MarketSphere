import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../config.dart';
import '../models/models.dart';
import '../services/app_secure_storage.dart';
import '../services/env_config.dart';
import '../utils/helpers.dart';

enum GoogleSignInPhase { idle, pickingAccount, exchanging, done }

class AuthController extends ChangeNotifier {
  AuthController();

  static const _pendingRoleKey = 'pending_oauth_role';
  static const _allowedRoles = {'customer', 'provider'};
  static final _secure = AppSecureStorage.instance;

  Profile? _profile;
  var _ready = false;
  String? _error;

  Profile? get profile => _profile;
  bool get ready => _ready;
  bool get isSignedIn => Supabase.instance.client.auth.currentSession != null;
  /// UI and gates must use this — never show "Signed in" from a stale profile alone.
  bool get isAuthenticated => isSignedIn && _profile != null;
  String? get error => _error;

  void _clearLocalAuth() {
    _profile = null;
    _error = null;
  }

  Future<void> bootstrap() async {
    final client = Supabase.instance.client;
    client.auth.onAuthStateChange.listen((data) async {
      if (data.session == null) {
        _clearLocalAuth();
        notifyListeners();
        return;
      }
      await refreshProfile();
      // Role application is handled explicitly inside signInWithGoogle;
      // the listener only refreshes the profile.
    });

    // Drop corrupt / expired local sessions — otherwise PostgREST returns 401
    // (PGRST301) for every table query and the app looks "disconnected".
    if (client.auth.currentSession != null) {
      try {
        await client.auth.getUser();
      } catch (e) {
        if (kDebugMode) debugPrint('[auth] clearing invalid session: $e');
        try {
          await client.auth.signOut(scope: SignOutScope.local);
        } catch (_) {}
        _clearLocalAuth();
      }
    }

    if (client.auth.currentSession != null) {
      await refreshProfile();
      if (_profile?.isBanned == true) {
        await signOut();
      }
    } else {
      _clearLocalAuth();
    }
    _ready = true;
    notifyListeners();
  }

  Future<void> refreshProfile() async {
    final session = Supabase.instance.client.auth.currentSession;
    final user = Supabase.instance.client.auth.currentUser;
    if (session == null || user == null) {
      _clearLocalAuth();
      notifyListeners();
      return;
    }

    try {
      final row = await Supabase.instance.client
          .from('profiles')
          .select('id, email, full_name, phone, role, avatar_url, banned_at, created_at')
          .eq('id', user.id)
          .maybeSingle();

      if (row == null) {
        _profile = Profile(
          id: user.id,
          email: user.email ?? '',
          role: 'customer',
        );
      } else {
        _profile = Profile.fromJson(Map<String, dynamic>.from(row));
      }
      notifyListeners();
    } catch (_) {
      // Keep last known profile when offline so the app stays usable.
      _profile ??= Profile(
        id: user.id,
        email: user.email ?? '',
        role: 'customer',
      );
      notifyListeners();
    }
  }

  Future<void> stashOAuthRole(String role) async {
    if (!_allowedRoles.contains(role)) return;
    await _secure.write(key: _pendingRoleKey, value: role);
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_pendingRoleKey);
  }

  Future<void> clearOAuthRole() async {
    await _secure.delete(key: _pendingRoleKey);
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_pendingRoleKey);
  }

  Future<String?> _readPendingOAuthRole() async {
    final secure = await _secure.read(key: _pendingRoleKey);
    if (secure != null && secure.isNotEmpty) return secure;
    final prefs = await SharedPreferences.getInstance();
    final legacy = prefs.getString(_pendingRoleKey);
    if (legacy != null && legacy.isNotEmpty) {
      await _secure.write(key: _pendingRoleKey, value: legacy);
      await prefs.remove(_pendingRoleKey);
      return legacy;
    }
    return null;
  }

  /// Maps Google Sign-In failures to a user-facing message.
  /// Missing Android OAuth client / SHA-1 often surfaces as "canceled".
  static String _googleSignInErrorMessage(Object error) {
    if (error is GoogleSignInException) {
      switch (error.code) {
        case GoogleSignInExceptionCode.canceled:
          return 'Google sign-in did not complete. If you did not cancel, add an Android OAuth client in Google Cloud for package com.marketspheregroup.market_sphere with this app’s SHA-1.';
        case GoogleSignInExceptionCode.clientConfigurationError:
        case GoogleSignInExceptionCode.providerConfigurationError:
          return 'Google setup incomplete. In Google Cloud create an Android OAuth client for package com.marketspheregroup.market_sphere and add this app’s SHA-1 fingerprint.';
        case GoogleSignInExceptionCode.interrupted:
          return 'Google sign-in was interrupted. Try again.';
        case GoogleSignInExceptionCode.uiUnavailable:
          return 'Google sign-in UI is unavailable on this device. Try again or use email.';
        default:
          final detail = error.description?.trim();
          if (detail != null && detail.isNotEmpty) {
            return 'Google sign-in failed: $detail';
          }
          return 'Google sign-in failed. Check the Android OAuth client and SHA-1 in Google Cloud.';
      }
    }

    final msg = error.toString().toLowerCase();
    if (msg.contains('10:') || msg.contains('api_exception: 10') || msg.contains('apiexception: 10')) {
      return 'Google setup incomplete. Add an Android OAuth client with package com.marketspheregroup.market_sphere and this app’s SHA-1.';
    }
    if (msg.contains('canceled') || msg.contains('cancelled')) {
      return 'Google sign-in did not complete. If you did not cancel, add an Android OAuth client in Google Cloud for package com.marketspheregroup.market_sphere with this app’s SHA-1.';
    }
    return 'Google sign-in failed. Try again.';
  }

  /// True only for a brand-new auth row from this signup attempt.
  /// Returning users must not pass — otherwise a second "sign up as provider"
  /// would sign into / upgrade the existing account.
  bool _isFreshAuthSignup(User user) {
    final created = DateTime.tryParse(user.createdAt);
    if (created == null) return false;
    final createdUtc = created.toUtc();
    if (DateTime.now().toUtc().difference(createdUtc).inSeconds > 120) return false;

    final lastRaw = user.lastSignInAt;
    final last = lastRaw != null ? DateTime.tryParse(lastRaw) : null;
    if (last != null) {
      final delta = last.toUtc().difference(createdUtc).inSeconds;
      if (delta > 45) return false;
    }
    return true;
  }

  bool _profileIsFresh(Profile profile) {
    final created = profile.createdAt;
    if (created == null) return false;
    return DateTime.now().toUtc().difference(created.toUtc()).inSeconds < 120;
  }

  Future<void> _applyPendingOAuthRoleIfNeeded(User user) async {
    final role = await _readPendingOAuthRole();
    if (role != 'provider' && role != 'customer') {
      return;
    }

    // Wait for the profile trigger before claiming — don't clear the stash yet.
    for (var i = 0; i < 8; i++) {
      await refreshProfile();
      if (_profile != null) break;
      await Future<void>.delayed(const Duration(milliseconds: 250));
    }
    if (_profile == null) return;

    final metaName = (user.userMetadata?['full_name'] ?? user.userMetadata?['name'])?.toString();
    if ((_profile!.fullName == null || _profile!.fullName!.trim().isEmpty) &&
        metaName != null &&
        metaName.trim().isNotEmpty) {
      await Supabase.instance.client
          .from('profiles')
          .update({'full_name': metaName.trim()}).eq('id', user.id);
    }

    // Only first-time signup may claim provider — never upgrade via "sign up again".
    if (role == 'provider' &&
        _profile!.role == 'customer' &&
        _isFreshAuthSignup(user) &&
        _profileIsFresh(_profile!)) {
      Object? lastError;
      var claimed = false;
      for (var i = 0; i < 4; i++) {
        try {
          final result = await Supabase.instance.client.rpc('claim_provider_role');
          if (result?.toString() == 'provider') {
            claimed = true;
            break;
          }
          lastError = 'RPC returned $result';
        } catch (e) {
          lastError = e;
        }
        await Future<void>.delayed(const Duration(milliseconds: 300));
      }
      if (!claimed) {
        _error = 'Signed in, but your provider role could not be applied.';
        if (kDebugMode) {
          debugPrint('[auth] claim_provider_role failed: $lastError');
        }
      }
    }

    await clearOAuthRole();
    await refreshProfile();
  }

  Future<String?> signIn({
    required String email,
    required String password,
  }) async {
    _error = null;
    try {
      await Supabase.instance.client.auth.signInWithPassword(
        email: email.trim(),
        password: password,
      );
      await refreshProfile();
      if (_profile?.isBanned == true) {
        await signOut();
        return 'This account has been suspended. Contact support.';
      }
      notifyListeners();
      return null;
    } on AuthException catch (e) {
      _error = e.message;
      return e.message;
    } catch (_) {
      return 'Could not sign in. Check your connection and try again.';
    }
  }

  Future<String?> signUp({
    required String fullName,
    required String email,
    required String password,
    required String role,
    String? phone,
  }) async {
    _error = null;
    if (!_allowedRoles.contains(role)) {
      return 'Choose Customer or Provider before creating an account.';
    }
    const existingMsg =
        'An account already exists for this email. Please sign in instead — you cannot create a second Customer or Provider account with the same email.';
    const phoneExistsMsg =
        'This phone number is already registered to another account. Use a different number, or sign in if it is yours.';
    try {
      final normalizedEmail = email.trim().toLowerCase();
      try {
        final taken = await Supabase.instance.client.rpc(
          'email_already_registered',
          params: {'p_email': normalizedEmail},
        );
        if (taken == true) {
          _error = existingMsg;
          return existingMsg;
        }
      } catch (_) {
        // RPC may not be applied yet.
      }

      final trimmedPhone = phone?.trim() ?? '';
      if (trimmedPhone.isNotEmpty) {
        try {
          final phoneTaken = await Supabase.instance.client.rpc(
            'phone_already_registered',
            params: {
              'p_phone': trimmedPhone,
              'p_exclude_user_id': null,
            },
          );
          if (phoneTaken == true) {
            _error = phoneExistsMsg;
            return phoneExistsMsg;
          }
        } catch (_) {
          // RPC may not be applied yet.
        }
      }

      final response = await Supabase.instance.client.auth.signUp(
        email: normalizedEmail,
        password: password,
        emailRedirectTo: AppConfig.emailConfirmRedirectUrl,
        data: {
          'full_name': fullName.trim(),
          'phone': trimmedPhone.isEmpty ? null : trimmedPhone,
          'role': role,
          'privacy_consent_at': DateTime.now().toUtc().toIso8601String(),
        },
      );
      final user = response.user;
      final identitiesEmpty = user != null && (user.identities == null || user.identities!.isEmpty);
      if (identitiesEmpty) {
        if (response.session != null) {
          await Supabase.instance.client.auth.signOut();
        }
        _error = existingMsg;
        return existingMsg;
      }
      if (response.session != null && user != null) {
        if (!_isFreshAuthSignup(user)) {
          await Supabase.instance.client.auth.signOut();
          _error = existingMsg;
          return existingMsg;
        }
        final row = await Supabase.instance.client
            .from('profiles')
            .select('created_at')
            .eq('id', user.id)
            .maybeSingle();
        final created = DateTime.tryParse(row?['created_at']?.toString() ?? '');
        if (created != null && DateTime.now().toUtc().difference(created.toUtc()).inSeconds > 30) {
          await Supabase.instance.client.auth.signOut();
          _error = existingMsg;
          return existingMsg;
        }
        await refreshProfile();
      }
      notifyListeners();
      return null;
    } on AuthException catch (e) {
      final lower = e.message.toLowerCase();
      if (lower.contains('phone') &&
          (lower.contains('already') || lower.contains('registered') || lower.contains('exists'))) {
        _error = phoneExistsMsg;
        return phoneExistsMsg;
      }
      if (lower.contains('already') || lower.contains('registered') || lower.contains('exists')) {
        _error = existingMsg;
        return existingMsg;
      }
      _error = e.message;
      return e.message;
    } catch (_) {
      return 'Could not create account. Try again.';
    }
  }

  /// Native Google Sign-In (Credential Manager / account picker).
  ///
  /// [onPhase] lets the UI avoid showing loaders while Google's translucent
  /// sheets are open — Flutter spinners bleed through those dialogs.
  Future<String?> signInWithGoogle({
    String? role,
    void Function(GoogleSignInPhase phase)? onPhase,
  }) async {
    _error = null;
    final applyRole = role == 'customer' || role == 'provider';
    if (applyRole) {
      await stashOAuthRole(role!);
    } else {
      await clearOAuthRole();
    }

    final webClientId = EnvConfig.googleWebClientId;
    if (webClientId.isEmpty) {
      await clearOAuthRole();
      return 'Google sign-in is not configured for the app yet.';
    }

    // ── Step 1: native Google account picker (modern GIS / Credential Manager) ──
    final google = GoogleSignIn.instance;
    await google.initialize(serverClientId: webClientId);

    onPhase?.call(GoogleSignInPhase.pickingAccount);
    late final GoogleSignInAccount googleUser;
    try {
      googleUser = await google.authenticate(
        scopeHint: const ['email', 'profile'],
      );
    } on GoogleSignInException catch (e) {
      await clearOAuthRole();
      onPhase?.call(GoogleSignInPhase.idle);
      return _googleSignInErrorMessage(e);
    } catch (e) {
      await clearOAuthRole();
      onPhase?.call(GoogleSignInPhase.idle);
      return _googleSignInErrorMessage(e);
    }

    final idToken = googleUser.authentication.idToken;
    if (idToken == null || idToken.isEmpty) {
      await clearOAuthRole();
      onPhase?.call(GoogleSignInPhase.idle);
      return 'Google did not return an ID token. Confirm GOOGLE_WEB_CLIENT_ID is your Web client ID.';
    }

    // Keep "picking" while any Google consent UI may still be on screen.
    String? accessToken;
    try {
      GoogleSignInClientAuthorization? authz =
          await googleUser.authorizationClient.authorizationForScopes(const ['email', 'profile']);
      authz ??= await googleUser.authorizationClient.authorizeScopes(const ['email', 'profile']);
      accessToken = authz.accessToken;
    } catch (_) {
      // accessToken is optional for signInWithIdToken; proceed without it.
    }

    // Google sheets closed — safe for app-side busy text (no spinner overlays).
    onPhase?.call(GoogleSignInPhase.exchanging);

    // ── Step 3: exchange with Supabase ──
    try {
      await Supabase.instance.client.auth.signInWithIdToken(
        provider: OAuthProvider.google,
        idToken: idToken,
        accessToken: accessToken,
      );
    } on AuthException catch (e) {
      await clearOAuthRole();
      onPhase?.call(GoogleSignInPhase.idle);
      _error = e.message;
      return e.message;
    } catch (_) {
      await clearOAuthRole();
      onPhase?.call(GoogleSignInPhase.idle);
      return 'Google sign-in failed. Try again.';
    }

    // ── Step 4: apply chosen role only when signup provided one ──
    final user = Supabase.instance.client.auth.currentUser;
    if (user == null) {
      await clearOAuthRole();
      onPhase?.call(GoogleSignInPhase.idle);
      return 'Google sign-in failed. No session created.';
    }

    await refreshProfile();
    if (_profile?.isBanned == true) {
      await signOut();
      await clearOAuthRole();
      onPhase?.call(GoogleSignInPhase.idle);
      return 'This account has been suspended. Contact support.';
    }

    // Login must not auto-create accounts. Supabase still creates an auth user on
    // first Google; detect that and send them to Sign up instead.
    if (!applyRole) {
      await clearOAuthRole();
      if (_isFreshAuthSignup(user)) {
        await signOut();
        onPhase?.call(GoogleSignInPhase.idle);
        const msg =
            'No account found for this Google login. Please sign up first and choose Customer or Provider.';
        _error = msg;
        return msg;
      }
    } else {
      // Sign-up must not silently continue / upgrade an existing Google account.
      final profileStale = _profile != null && !_profileIsFresh(_profile!);
      if (!_isFreshAuthSignup(user) || profileStale) {
        await signOut();
        await clearOAuthRole();
        onPhase?.call(GoogleSignInPhase.idle);
        const msg =
            'An account already exists for this email. Please sign in instead — you cannot create another Customer or Provider account with the same email.';
        _error = msg;
        return msg;
      }
      await _applyPendingOAuthRoleIfNeeded(user);
    }
    onPhase?.call(GoogleSignInPhase.done);
    notifyListeners();
    return null;
  }

  Future<String?> updateProfile({
    String? fullName,
    String? phone,
    String? avatarUrl,
  }) async {
    final user = Supabase.instance.client.auth.currentUser;
    if (user == null) return 'Not signed in';
    if (fullName != null) {
      final nameErr = validateFullName(fullName);
      if (nameErr != null) return nameErr;
    }
    if (phone != null && phone.trim().isNotEmpty) {
      final local = phone.replaceFirst(RegExp(r'^\+267\s*'), '');
      final phoneErr = validatePhoneLocalOptional(local);
      if (phoneErr != null) return phoneErr;
      try {
        final phoneTaken = await Supabase.instance.client.rpc(
          'phone_already_registered',
          params: {
            'p_phone': phone.trim(),
            'p_exclude_user_id': user.id,
          },
        );
        if (phoneTaken == true) {
          return 'This phone number is already registered to another account. Use a different number.';
        }
      } catch (_) {
        // RPC may not be applied yet; DB trigger still enforces uniqueness.
      }
    }
    try {
      final updates = <String, dynamic>{};
      if (fullName != null) updates['full_name'] = fullName.trim();
      if (phone != null) updates['phone'] = phone.trim().isEmpty ? null : phone.trim();
      if (avatarUrl != null) {
        final url = avatarUrl.trim();
        if (url.isNotEmpty && !url.startsWith('https://')) {
          return 'Invalid photo URL.';
        }
        updates['avatar_url'] = url.isEmpty ? null : url;
      }
      if (updates.isEmpty) return null;
      await Supabase.instance.client.from('profiles').update(updates).eq('id', user.id);
      await refreshProfile();
      return null;
    } catch (e) {
      final msg = e.toString();
      if (msg.contains('PHONE_ALREADY_REGISTERED') ||
          (msg.toLowerCase().contains('phone') && msg.toLowerCase().contains('already'))) {
        return 'This phone number is already registered to another account. Use a different number.';
      }
      return 'Could not update profile. Check your connection and try again.';
    }
  }

  Future<String?> uploadAvatar(String filePath) async {
    final user = Supabase.instance.client.auth.currentUser;
    if (user == null) return 'Not signed in';
    try {
      final bytes = await File(filePath).readAsBytes();
      final path = '${user.id}/avatar-${DateTime.now().millisecondsSinceEpoch}.jpg';
      await Supabase.instance.client.storage.from('avatars').uploadBinary(
            path,
            bytes,
            fileOptions: const FileOptions(upsert: true, contentType: 'image/jpeg'),
          );
      final url = Supabase.instance.client.storage.from('avatars').getPublicUrl(path);
      return await updateProfile(avatarUrl: url);
    } catch (_) {
      return 'Could not upload photo.';
    }
  }

  Future<void> signOut() async {
    await clearOAuthRole();
    await Supabase.instance.client.auth.signOut();
    _clearLocalAuth();
    notifyListeners();
  }
}
