import 'dart:async';

import 'package:app_links/app_links.dart';
import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../screens/auth/email_verified_screen.dart';
import '../screens/browse/provider_detail_screen.dart';
import '../screens/showcase/listing_detail_screen.dart';
import '../utils/helpers.dart';
import '../utils/page_transitions.dart';
import '../widgets/auth_gate.dart';

/// Handles https://marketspheregroup.com/... and custom-scheme deep links.
class DeepLinkService {
  DeepLinkService._();
  static final DeepLinkService instance = DeepLinkService._();

  static const _appScheme = 'com.marketspheregroup.market_sphere';
  static const _allowedHttpsHosts = {
    'marketspheregroup.com',
    'www.marketspheregroup.com',
  };

  final _appLinks = AppLinks();
  StreamSubscription<Uri>? _sub;
  GlobalKey<NavigatorState>? _navKey;
  var _handlingVerify = false;

  void attach({required GlobalKey<NavigatorState> navigatorKey}) {
    _navKey = navigatorKey;
  }

  Future<void> start() async {
    try {
      final initial = await _appLinks.getInitialLink();
      if (initial != null) {
        Future<void>.delayed(const Duration(milliseconds: 600), () => _handle(initial));
      }
    } catch (_) {}

    await _sub?.cancel();
    _sub = _appLinks.uriLinkStream.listen(_handle);
  }

  Future<void> dispose() async {
    await _sub?.cancel();
  }

  bool _isTrusted(Uri uri) {
    if (uri.scheme == _appScheme) return true;
    if (uri.scheme == 'https' && _allowedHttpsHosts.contains(uri.host)) return true;
    return false;
  }

  bool _isEmailVerifyLink(Uri uri) {
    if (uri.scheme != _appScheme) return false;
    if (uri.host == 'auth') {
      final path = uri.path.replaceAll('/', '');
      return path == 'verified' || path == 'verify' || uri.pathSegments.contains('verified');
    }
    // Some clients flatten to scheme://verified
    return uri.host == 'verified' || uri.host == 'auth-verified';
  }

  Future<void> _handle(Uri uri) async {
    if (!_isTrusted(uri)) return;
    if (uri.host == 'login-callback') return;

    if (_isEmailVerifyLink(uri)) {
      await _handleEmailVerification(uri);
      return;
    }

    final listingId = _extractListingId(uri);
    final providerId = _extractProviderId(uri);
    final context = _navKey?.currentContext;
    if (context == null) return;

    if (listingId != null && isUuid(listingId)) {
      await openCachedDetail(context, ListingDetailScreen(listingId: listingId));
      return;
    }
    if (providerId != null && isUuid(providerId)) {
      await openCachedDetail(context, ProviderDetailScreen(providerId: providerId));
    }
  }

  Future<void> _handleEmailVerification(Uri uri) async {
    if (_handlingVerify) return;
    _handlingVerify = true;
    final nav = _navKey?.currentState;
    final context = _navKey?.currentContext;
    try {
      String? error;
      try {
        final tokenHash = uri.queryParameters['token_hash'];
        final typeRaw = uri.queryParameters['type'];
        final code = uri.queryParameters['code'];

        if (tokenHash != null && tokenHash.isNotEmpty && typeRaw != null && typeRaw.isNotEmpty) {
          final otpType = OtpType.values.firstWhere(
            (t) => t.name == typeRaw,
            orElse: () => OtpType.signup,
          );
          final res = await Supabase.instance.client.auth.verifyOTP(
            tokenHash: tokenHash,
            type: otpType,
          );
          if (res.session == null && res.user == null) {
            error = 'Could not confirm this email link.';
          }
        } else if (code != null && code.isNotEmpty) {
          await Supabase.instance.client.auth.exchangeCodeForSession(code);
        } else {
          // Implicit / fragment tokens after Supabase redirect.
          await Supabase.instance.client.auth.getSessionFromUrl(uri);
        }

        // Mirror website verify: end session so the user signs in fresh in the app.
        if (Supabase.instance.client.auth.currentSession != null) {
          await Supabase.instance.client.auth.signOut();
        }
      } catch (e) {
        error = e is AuthException ? e.message : 'This confirmation link is invalid or has expired.';
      }

      if (nav == null || context == null || !context.mounted) return;
      await pushFade(
        context,
        EmailVerifiedScreen(
          success: error == null,
          errorMessage: error,
        ),
      );
    } finally {
      _handlingVerify = false;
    }
  }

  String? _extractListingId(Uri uri) {
    if (uri.scheme == _appScheme && uri.host == 'listing') {
      if (uri.pathSegments.isNotEmpty) return uri.pathSegments.first;
      final id = uri.path.replaceFirst('/', '');
      return id.isEmpty ? null : id;
    }
    final segments = uri.pathSegments;
    if (segments.length >= 3 && segments[0] == 'showcase') {
      return segments[2];
    }
    return null;
  }

  String? _extractProviderId(Uri uri) {
    if (uri.scheme == _appScheme && uri.host == 'provider') {
      if (uri.pathSegments.isNotEmpty) return uri.pathSegments.first;
      final id = uri.path.replaceFirst('/', '');
      return id.isEmpty ? null : id;
    }
    final segments = uri.pathSegments;
    if (segments.length >= 2 && (segments[0] == 'providers' || segments[0] == 'provider')) {
      return segments[1];
    }
    return null;
  }
}

Future<void> openNotificationLink(BuildContext context, String? link) async {
  if (link == null || link.isEmpty) return;

  if (link.startsWith('http')) {
    final uri = Uri.tryParse(link);
    if (uri == null) return;
    if (uri.scheme != 'https') return;
    if (uri.host != 'marketspheregroup.com' && uri.host != 'www.marketspheregroup.com') {
      return;
    }
  }

  final path = link.startsWith('http') ? Uri.parse(link).path : link;
  final segments = path.split('/').where((s) => s.isNotEmpty).toList();
  if (segments.length >= 3 && segments[0] == 'showcase') {
    final id = segments[2];
    if (!isUuid(id)) return;
    await openCachedDetail(context, ListingDetailScreen(listingId: id));
    return;
  }
  if (segments.length >= 2 && segments[0] == 'providers') {
    if (!isUuid(segments[1])) return;
    await openCachedDetail(context, ProviderDetailScreen(providerId: segments[1]));
  }
}
