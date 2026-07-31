import 'dart:async';

import 'package:app_links/app_links.dart';
import 'package:flutter/material.dart';

import '../screens/browse/provider_detail_screen.dart';
import '../screens/showcase/listing_detail_screen.dart';
import '../utils/helpers.dart';
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

  Future<void> _handle(Uri uri) async {
    if (!_isTrusted(uri)) return;
    if (uri.host == 'login-callback') return;

    final listingId = _extractListingId(uri);
    final providerId = _extractProviderId(uri);
    final context = _navKey?.currentContext;
    if (context == null) return;

    if (listingId != null && isUuid(listingId)) {
      await openIfSignedIn(context, ListingDetailScreen(listingId: listingId));
      return;
    }
    if (providerId != null && isUuid(providerId)) {
      await openIfSignedIn(context, ProviderDetailScreen(providerId: providerId));
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
    await openIfSignedIn(context, ListingDetailScreen(listingId: id));
    return;
  }
  if (segments.length >= 2 && segments[0] == 'providers') {
    if (!isUuid(segments[1])) return;
    await openIfSignedIn(context, ProviderDetailScreen(providerId: segments[1]));
  }
}
