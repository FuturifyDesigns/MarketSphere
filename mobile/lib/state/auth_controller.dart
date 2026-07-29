import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../models/models.dart';
import '../utils/helpers.dart';

class AuthController extends ChangeNotifier {
  AuthController();

  static const _pendingRoleKey = 'pending_oauth_role';

  Profile? _profile;
  var _ready = false;
  String? _error;

  Profile? get profile => _profile;
  bool get ready => _ready;
  bool get isSignedIn => Supabase.instance.client.auth.currentSession != null;
  String? get error => _error;

  Future<void> bootstrap() async {
    final client = Supabase.instance.client;
    client.auth.onAuthStateChange.listen((data) async {
      if (data.session == null) {
        _profile = null;
        notifyListeners();
        return;
      }
      await refreshProfile();
      // Role application is handled explicitly inside signInWithGoogle;
      // the listener only refreshes the profile.
    });

    if (client.auth.currentSession != null) {
      await refreshProfile();
      if (_profile?.isBanned == true) {
        await signOut();
      }
    }
    _ready = true;
    notifyListeners();
  }

  Future<void> refreshProfile() async {
    final user = Supabase.instance.client.auth.currentUser;
    if (user == null) {
      _profile = null;
      notifyListeners();
      return;
    }

    try {
      final row = await Supabase.instance.client
          .from('profiles')
          .select('id, email, full_name, phone, role, avatar_url, banned_at')
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
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_pendingRoleKey, role);
  }

  Future<void> clearOAuthRole() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_pendingRoleKey);
  }

  Future<void> _applyPendingOAuthRoleIfNeeded(User user) async {
    final prefs = await SharedPreferences.getInstance();
    final role = prefs.getString(_pendingRoleKey);
    if (role != 'provider' && role != 'customer') {
      return;
    }

    await prefs.remove(_pendingRoleKey);

    await refreshProfile();
    if (_profile == null) return;

    final metaName = (user.userMetadata?['full_name'] ?? user.userMetadata?['name'])?.toString();
    if ((_profile!.fullName == null || _profile!.fullName!.trim().isEmpty) &&
        metaName != null &&
        metaName.trim().isNotEmpty) {
      await Supabase.instance.client
          .from('profiles')
          .update({'full_name': metaName.trim()}).eq('id', user.id);
    }

    // Role must go through the RPC: a plain UPDATE is silently reverted by the
    // protect_profile_columns trigger, which reports success either way.
    if (role == 'provider' && _profile!.role == 'customer') {
      try {
        await Supabase.instance.client.rpc('claim_provider_role');
      } catch (e) {
        _error = 'Signed in, but your provider role could not be applied.';
        if (kDebugMode) {
          debugPrint('[auth] claim_provider_role failed: $e');
        }
      }
    }

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
    try {
      final response = await Supabase.instance.client.auth.signUp(
        email: email.trim(),
        password: password,
        data: {
          'full_name': fullName.trim(),
          'phone': phone,
          'role': role,
          'privacy_consent_at': DateTime.now().toUtc().toIso8601String(),
        },
      );
      if (response.session != null) {
        await refreshProfile();
      }
      notifyListeners();
      return null;
    } on AuthException catch (e) {
      _error = e.message;
      return e.message;
    } catch (_) {
      return 'Could not create account. Try again.';
    }
  }

  Future<String?> signInWithGoogle({required String role}) async {
    _error = null;
    if (role != 'customer' && role != 'provider') {
      return 'Choose Customer or Provider before continuing with Google.';
    }
    await stashOAuthRole(role);

    final webClientId = dotenv.env['GOOGLE_WEB_CLIENT_ID']?.trim() ?? '';
    if (webClientId.isEmpty) {
      await clearOAuthRole();
      return 'Google sign-in is not configured for the app yet.';
    }

    // ── Step 1: native Google account picker ──
    final google = GoogleSignIn.instance;
    await google.initialize(serverClientId: webClientId);

    late final GoogleSignInAccount googleUser;
    try {
      googleUser = await google.authenticate(
        scopeHint: const ['email', 'profile'],
      );
    } on GoogleSignInException catch (e) {
      await clearOAuthRole();
      if (e.code == GoogleSignInExceptionCode.canceled) {
        return 'Google sign-in was cancelled.';
      }
      return 'Google sign-in failed. Check that the app package and SHA-1 are registered in Google Cloud.';
    } catch (e) {
      await clearOAuthRole();
      final msg = e.toString().toLowerCase();
      if (msg.contains('canceled') || msg.contains('cancelled')) {
        return 'Google sign-in was cancelled.';
      }
      if (msg.contains('10:') || msg.contains('api_exception: 10') || msg.contains('apiexception: 10')) {
        return 'Google setup incomplete. Add an Android OAuth client with package com.marketspheregroup.market_sphere and your debug/release SHA-1.';
      }
      return 'Google sign-in failed. Try again.';
    }

    final idToken = googleUser.authentication.idToken;
    if (idToken == null || idToken.isEmpty) {
      await clearOAuthRole();
      return 'Google did not return an ID token. Confirm GOOGLE_WEB_CLIENT_ID is your Web client ID.';
    }

    // ── Step 2: get an access token (best-effort, not required) ──
    String? accessToken;
    try {
      GoogleSignInClientAuthorization? authz =
          await googleUser.authorizationClient.authorizationForScopes(const ['email', 'profile']);
      authz ??= await googleUser.authorizationClient.authorizeScopes(const ['email', 'profile']);
      accessToken = authz.accessToken;
    } catch (_) {
      // accessToken is optional for signInWithIdToken; proceed without it.
    }

    // ── Step 3: exchange with Supabase ──
    try {
      await Supabase.instance.client.auth.signInWithIdToken(
        provider: OAuthProvider.google,
        idToken: idToken,
        accessToken: accessToken,
      );
    } on AuthException catch (e) {
      await clearOAuthRole();
      _error = e.message;
      return e.message;
    } catch (_) {
      await clearOAuthRole();
      return 'Google sign-in failed. Try again.';
    }

    // ── Step 4: apply chosen role & finish ──
    final user = Supabase.instance.client.auth.currentUser;
    if (user == null) {
      await clearOAuthRole();
      return 'Google sign-in failed. No session created.';
    }

    await refreshProfile();
    if (_profile?.isBanned == true) {
      await signOut();
      await clearOAuthRole();
      return 'This account has been suspended. Contact support.';
    }
    await _applyPendingOAuthRoleIfNeeded(user);
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
    }
    try {
      final updates = <String, dynamic>{};
      if (fullName != null) updates['full_name'] = fullName.trim();
      if (phone != null) updates['phone'] = phone.trim().isEmpty ? null : phone.trim();
      if (avatarUrl != null) {
        final url = avatarUrl.trim();
        if (url.isNotEmpty && !(url.startsWith('https://') || url.startsWith('http://'))) {
          return 'Invalid photo URL.';
        }
        updates['avatar_url'] = url.isEmpty ? null : url;
      }
      if (updates.isEmpty) return null;
      await Supabase.instance.client.from('profiles').update(updates).eq('id', user.id);
      await refreshProfile();
      return null;
    } catch (_) {
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
    _profile = null;
    notifyListeners();
  }
}
