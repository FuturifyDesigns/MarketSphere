import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../models/models.dart';
import '../services/connectivity_service.dart';
import '../services/data_repository.dart';
import '../services/local_cache_service.dart';
import '../utils/helpers.dart';

class EngagementController extends ChangeNotifier {
  EngagementController(this._repo);

  final DataRepository _repo;
  final _cache = LocalCacheService.instance;
  final _net = ConnectivityService.instance;

  Set<String> _favProviders = {};
  Set<String> _favListings = {};
  Map<String, ListingAlert> _alerts = {};
  List<ShowcaseListing> _recentListings = [];
  List<ProviderItem> _recentProviders = [];
  List<ShowcaseListing> _savedListings = [];
  List<ProviderItem> _savedProviders = [];
  List<AppNotification> _notifications = [];
  String? _preferredArea;
  String? _userId;
  var _ready = false;
  var _syncing = false;
  var _pendingCount = 0;
  RealtimeChannel? _notifChannel;
  final _inFlight = <String>{};
  VoidCallback? _netListener;

  bool get ready => _ready;
  bool get isSyncing => _syncing;
  bool get isOffline => _net.isOffline;
  int get pendingSyncCount => _pendingCount;
  Set<String> get favouriteProviderIds => _favProviders;
  Set<String> get favouriteListingIds => _favListings;
  Map<String, ListingAlert> get listingAlerts => _alerts;
  List<ShowcaseListing> get recentListings => _recentListings;
  List<ProviderItem> get recentProviders => _recentProviders;
  List<ShowcaseListing> get savedListings => _savedListings;
  List<ProviderItem> get savedProviders => _savedProviders;
  List<AppNotification> get notifications => _notifications;
  String? get preferredArea => _preferredArea;
  int get unreadCount => _notifications.where((n) => n.isUnread).length;

  bool isProviderSaved(String id) => _favProviders.contains(id);
  bool isListingSaved(String id) => _favListings.contains(id);
  bool isListingAlertOn(String id) => _alerts.containsKey(id);

  Future<void> bootstrap({String? userId}) async {
    await _net.init();
    _preferredArea = await _cache.getPreferredArea();
    _recentListings = await _cache.recentListings();
    _recentProviders = await _cache.recentProviders();
    _ready = true;
    notifyListeners();

    _netListener ??= () {
      if (_net.isOnline) {
        unawaited(flushPendingMutations());
        if (_userId != null) unawaited(refreshForUser(_userId!));
      }
      notifyListeners();
    };
    _net.addListener(_netListener!);

    await onAuthChanged(userId);
    // One-time hygiene for installs that cached phones/emails before slim rules.
    await _cache.scrubContactPiiFromCaches(
      (userId != null && isUuid(userId)) ? userId : null,
    );
  }

  Future<void> onAuthChanged(String? userId) async {
    await _notifChannel?.unsubscribe();
    _notifChannel = null;

    final next = (userId != null && isUuid(userId)) ? userId : null;
    if (_userId != null && next == null) {
      final previousUserId = _userId!;
      // Keep favourites offline for that user, but scrub contact PII from disk.
      _favProviders = {};
      _favListings = {};
      _alerts = {};
      _notifications = [];
      _savedListings = [];
      _savedProviders = [];
      _pendingCount = 0;
      _userId = null;
      _cache.setActiveUser(null);
      await _cache.scrubContactPiiFromCaches(previousUserId);
      notifyListeners();
      return;
    }

    _userId = next;
    _cache.setActiveUser(next);

    if (next == null) {
      notifyListeners();
      return;
    }

    _savedListings = await _cache.cachedFavouriteListings(next);
    _savedProviders = await _cache.cachedFavouriteProviders(next);
    _favListings = await _cache.cachedFavouriteListingIds(next);
    _favProviders = await _cache.cachedFavouriteProviderIds(next);
    final alertIds = await _cache.cachedAlertListingIds(next);
    _alerts = {
      for (final id in alertIds)
        id: ListingAlert(
          id: 'cached',
          listingId: id,
          notifyPrice: true,
          notifyAvailability: true,
        ),
    };
    _pendingCount = (await _cache.pendingMutations(next)).length;
    notifyListeners();

    await refreshForUser(next);
    if (_net.isOnline) {
      await flushPendingMutations();
      _listenNotifications(next);
    }
  }

  Future<void> refreshForUser(String userId) async {
    if (!isUuid(userId) || userId != _userId) return;
    if (_net.isOffline) {
      _savedListings = await _cache.cachedFavouriteListings(userId);
      _savedProviders = await _cache.cachedFavouriteProviders(userId);
      notifyListeners();
      return;
    }

    try {
      final results = await Future.wait([
        _repo.fetchFavouriteProviderIds(userId),
        _repo.fetchFavouriteListingIds(userId),
        _repo.fetchListingAlerts(userId),
        _repo.fetchNotifications(),
      ]);
      if (userId != _userId) return;

      _favProviders = results[0] as Set<String>;
      _favListings = results[1] as Set<String>;
      _alerts = results[2] as Map<String, ListingAlert>;
      _notifications = results[3] as List<AppNotification>;

      await _cache.saveFavouriteProviderIds(_favProviders, userId);
      await _cache.saveFavouriteListingIds(_favListings, userId);
      await _cache.saveAlertListingIds(_alerts.keys.toSet(), userId);

      final listings = await _repo.fetchListingsByIds(_favListings);
      final providers = await _repo.fetchProvidersByIds(_favProviders);
      // Replace cache even when empty so deletes sync correctly.
      _savedListings = listings;
      _savedProviders = providers;
      await _cache.saveFavouriteListings(listings, userId);
      await _cache.saveFavouriteProviders(providers, userId);
      notifyListeners();
    } catch (_) {
      _savedListings = await _cache.cachedFavouriteListings(userId);
      _savedProviders = await _cache.cachedFavouriteProviders(userId);
      notifyListeners();
    }
  }

  void _listenNotifications(String userId) {
    if (_net.isOffline) return;
    final client = Supabase.instance.client;
    _notifChannel = client
        .channel('notifications-$userId')
        .onPostgresChanges(
          event: PostgresChangeEvent.insert,
          schema: 'public',
          table: 'notifications',
          filter: PostgresChangeFilter(
            type: PostgresChangeFilterType.eq,
            column: 'user_id',
            value: userId,
          ),
          callback: (payload) {
            try {
              final row = payload.newRecord;
              final note = AppNotification.fromJson(Map<String, dynamic>.from(row));
              if (note.metadata['user_id'] != null && note.metadata['user_id'] != userId) return;
              _notifications = [note, ..._notifications.where((n) => n.id != note.id)].take(80).toList();
              notifyListeners();
              NotificationBridge.instance.showFromAppNotification(note);
            } catch (_) {}
          },
        )
        .subscribe();
  }

  Future<void> recordListingView(ShowcaseListing listing) async {
    if (!isUuid(listing.id)) return;
    await _cache.recordListingView(listing);
    _recentListings = await _cache.recentListings();
    notifyListeners();
  }

  Future<void> recordProviderView(ProviderItem provider) async {
    if (!isUuid(provider.id)) return;
    await _cache.recordProviderView(provider);
    _recentProviders = await _cache.recentProviders();
    notifyListeners();
  }

  Future<String?> toggleProviderFavourite(String userId, ProviderItem provider) async {
    final gate = _gateWrite(userId, provider.id, 'fav-provider');
    if (gate != null) return gate;
    final key = 'fav-provider:${provider.id}';
    _inFlight.add(key);
    try {
      final next = !_favProviders.contains(provider.id);
      _applyProviderFavLocal(provider, next);
      notifyListeners();

      final err = await _repo.setProviderFavourite(
        customerId: userId,
        providerId: provider.id,
        saved: next,
      );
      if (err == 'offline' || (_net.isOffline && err != null)) {
        await _cache.enqueueMutation(
          PendingMutation(
            type: PendingMutationType.providerFavourite,
            targetId: provider.id,
            enabled: next,
            createdAtMs: DateTime.now().millisecondsSinceEpoch,
          ),
          userId,
        );
        _pendingCount = (await _cache.pendingMutations(userId)).length;
        notifyListeners();
        return null;
      }
      if (err != null) {
        _applyProviderFavLocal(provider, !next); // rollback
        notifyListeners();
        return err;
      }
      return null;
    } finally {
      _inFlight.remove(key);
    }
  }

  Future<String?> toggleListingFavourite(String userId, ShowcaseListing listing) async {
    final gate = _gateWrite(userId, listing.id, 'fav-listing');
    if (gate != null) return gate;
    final key = 'fav-listing:${listing.id}';
    _inFlight.add(key);
    try {
      final next = !_favListings.contains(listing.id);
      _applyListingFavLocal(listing, next);
      notifyListeners();

      final err = await _repo.setListingFavourite(
        customerId: userId,
        listingId: listing.id,
        saved: next,
      );
      if (err == 'offline' || (_net.isOffline && err != null)) {
        await _cache.enqueueMutation(
          PendingMutation(
            type: PendingMutationType.listingFavourite,
            targetId: listing.id,
            enabled: next,
            createdAtMs: DateTime.now().millisecondsSinceEpoch,
          ),
          userId,
        );
        _pendingCount = (await _cache.pendingMutations(userId)).length;
        notifyListeners();
        return null;
      }
      if (err != null) {
        _applyListingFavLocal(listing, !next);
        notifyListeners();
        return err;
      }
      return null;
    } finally {
      _inFlight.remove(key);
    }
  }

  Future<String?> toggleListingAlert(String userId, ShowcaseListing listing) async {
    final gate = _gateWrite(userId, listing.id, 'alert-listing');
    if (gate != null) return gate;
    final key = 'alert-listing:${listing.id}';
    _inFlight.add(key);
    try {
      final next = !_alerts.containsKey(listing.id);
      _applyAlertLocal(listing.id, next);
      notifyListeners();

      final err = await _repo.setListingAlert(
        customerId: userId,
        listingId: listing.id,
        enabled: next,
      );
      if (err == 'offline' || (_net.isOffline && err != null)) {
        await _cache.enqueueMutation(
          PendingMutation(
            type: PendingMutationType.listingAlert,
            targetId: listing.id,
            enabled: next,
            createdAtMs: DateTime.now().millisecondsSinceEpoch,
          ),
          userId,
        );
        if (next && !_favListings.contains(listing.id)) {
          await toggleListingFavourite(userId, listing);
        }
        _pendingCount = (await _cache.pendingMutations(userId)).length;
        notifyListeners();
        return null;
      }
      if (err != null) {
        _applyAlertLocal(listing.id, !next);
        notifyListeners();
        return err;
      }
      if (next && !_favListings.contains(listing.id)) {
        await toggleListingFavourite(userId, listing);
      }
      await _cache.saveAlertListingIds(_alerts.keys.toSet(), userId);
      return null;
    } finally {
      _inFlight.remove(key);
    }
  }

  Future<void> flushPendingMutations() async {
    final userId = _userId;
    if (userId == null || _net.isOffline || _syncing) return;
    final pending = await _cache.pendingMutations(userId);
    if (pending.isEmpty) {
      _pendingCount = 0;
      notifyListeners();
      return;
    }

    _syncing = true;
    notifyListeners();
    final remaining = <PendingMutation>[];

    for (final mutation in pending) {
      if (!isUuid(mutation.targetId)) continue;
      String? err;
      switch (mutation.type) {
        case PendingMutationType.listingFavourite:
          err = await _repo.setListingFavourite(
            customerId: userId,
            listingId: mutation.targetId,
            saved: mutation.enabled,
          );
          break;
        case PendingMutationType.providerFavourite:
          err = await _repo.setProviderFavourite(
            customerId: userId,
            providerId: mutation.targetId,
            saved: mutation.enabled,
          );
          break;
        case PendingMutationType.listingAlert:
          err = await _repo.setListingAlert(
            customerId: userId,
            listingId: mutation.targetId,
            enabled: mutation.enabled,
          );
          break;
      }
      if (err != null && err != 'offline') {
        // Keep only network-ish failures for retry.
        if (err.toLowerCase().contains('offline') || err.toLowerCase().contains('network')) {
          remaining.add(mutation);
        }
        // Drop permanent permission/validation errors.
      } else if (err == 'offline') {
        remaining.add(mutation);
        remaining.addAll(pending.skip(pending.indexOf(mutation) + 1));
        break;
      }
    }

    await _cache.replacePendingMutations(remaining, userId);
    _pendingCount = remaining.length;
    _syncing = false;
    if (remaining.isEmpty) {
      await refreshForUser(userId);
    } else {
      notifyListeners();
    }
  }

  Future<void> setPreferredArea(String? area) async {
    final clean = sanitizePreferredArea(area);
    await _cache.setPreferredArea(clean);
    _preferredArea = clean;
    notifyListeners();
  }

  Future<void> markRead(String id) async {
    if (!isUuid(id)) return;
    _notifications = [
      for (final n in _notifications)
        if (n.id == id)
          AppNotification(
            id: n.id,
            type: n.type,
            title: n.title,
            body: n.body,
            link: n.link,
            readAt: DateTime.now(),
            createdAt: n.createdAt,
            metadata: n.metadata,
          )
        else
          n,
    ];
    notifyListeners();
    await _repo.markNotificationRead(id);
  }

  Future<void> markAllRead() async {
    _notifications = [
      for (final n in _notifications)
        AppNotification(
          id: n.id,
          type: n.type,
          title: n.title,
          body: n.body,
          link: n.link,
          readAt: n.readAt ?? DateTime.now(),
          createdAt: n.createdAt,
          metadata: n.metadata,
        ),
    ];
    notifyListeners();
    await _repo.markAllNotificationsRead();
  }

  String? _gateWrite(String userId, String targetId, String action) {
    if (!isUuid(userId) || userId != _userId) return 'Please sign in again.';
    final sessionUid = Supabase.instance.client.auth.currentUser?.id;
    if (sessionUid == null || sessionUid != userId) return 'Please sign in again.';
    if (!isUuid(targetId)) return 'Invalid item.';
    if (_inFlight.contains('$action:$targetId')) return 'Please wait…';
    return null;
  }

  void _applyProviderFavLocal(ProviderItem provider, bool saved) {
    if (saved) {
      _favProviders = {..._favProviders, provider.id};
    } else {
      _favProviders = {..._favProviders}..remove(provider.id);
    }
    unawaited(_cache.upsertFavouriteProvider(provider, saved: saved));
    unawaited(() async {
      _savedProviders = await _cache.cachedFavouriteProviders();
      notifyListeners();
    }());
  }

  void _applyListingFavLocal(ShowcaseListing listing, bool saved) {
    if (saved) {
      _favListings = {..._favListings, listing.id};
    } else {
      _favListings = {..._favListings}..remove(listing.id);
      if (!saved) {
        _alerts = {..._alerts}..remove(listing.id);
        unawaited(_cache.saveAlertListingIds(_alerts.keys.toSet()));
      }
    }
    unawaited(_cache.upsertFavouriteListing(listing, saved: saved));
    unawaited(() async {
      _savedListings = await _cache.cachedFavouriteListings();
      notifyListeners();
    }());
  }

  void _applyAlertLocal(String listingId, bool enabled) {
    if (enabled) {
      _alerts = {
        ..._alerts,
        listingId: ListingAlert(
          id: 'local',
          listingId: listingId,
          notifyPrice: true,
          notifyAvailability: true,
        ),
      };
    } else {
      _alerts = {..._alerts}..remove(listingId);
    }
  }

  @override
  void dispose() {
    if (_netListener != null) {
      _net.removeListener(_netListener!);
    }
    _notifChannel?.unsubscribe();
    super.dispose();
  }
}

/// Shows local system notifications for in-app notification inserts (works without FCM).
class NotificationBridge {
  NotificationBridge._();
  static final NotificationBridge instance = NotificationBridge._();

  Future<void> Function(AppNotification note)? _handler;

  void attach(Future<void> Function(AppNotification note) handler) {
    _handler = handler;
  }

  Future<void> showFromAppNotification(AppNotification note) async {
    final handler = _handler;
    if (handler == null) return;
    await handler(note);
  }
}
