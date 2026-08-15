import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

import '../models/models.dart';
import '../utils/helpers.dart';

enum PendingMutationType { listingFavourite, providerFavourite, listingAlert }

class PendingMutation {
  const PendingMutation({
    required this.type,
    required this.targetId,
    required this.enabled,
    required this.createdAtMs,
  });

  final PendingMutationType type;
  final String targetId;
  final bool enabled;
  final int createdAtMs;

  Map<String, dynamic> toJson() => {
        'type': type.name,
        'targetId': targetId,
        'enabled': enabled,
        'createdAtMs': createdAtMs,
      };

  factory PendingMutation.fromJson(Map<String, dynamic> json) {
    final typeName = json['type'] as String? ?? '';
    final type = PendingMutationType.values.firstWhere(
      (e) => e.name == typeName,
      orElse: () => PendingMutationType.listingFavourite,
    );
    return PendingMutation(
      type: type,
      targetId: json['targetId'] as String? ?? '',
      enabled: json['enabled'] == true,
      createdAtMs: (json['createdAtMs'] as num?)?.toInt() ?? 0,
    );
  }
}

/// Efficient, user-scoped offline snapshots + pending mutation queue.
class LocalCacheService {
  LocalCacheService._();
  static final LocalCacheService instance = LocalCacheService._();

  static const _catalogListingsKey = 'cache_catalog_listings_v2';
  static const _catalogProvidersKey = 'cache_catalog_providers_v2';
  static const _catalogColumnsKey = 'cache_catalog_columns_v1';
  static const _recentListingsKey = 'cache_recent_listings_v2';
  static const _recentProvidersKey = 'cache_recent_providers_v2';
  static const _favListingsKeyPrefix = 'cache_fav_listings_v2_';
  static const _favProvidersKeyPrefix = 'cache_fav_providers_v2_';
  static const _favIdsListingsPrefix = 'cache_fav_ids_listings_v2_';
  static const _favIdsProvidersPrefix = 'cache_fav_ids_providers_v2_';
  static const _alertIdsPrefix = 'cache_alert_ids_v2_';
  static const _pendingPrefix = 'cache_pending_mutations_v2_';
  static const _preferredAreaKey = 'preferred_area_v2';
  static const _maxRecent = 24;
  static const _maxCatalog = 40;
  static const _maxFavourites = 60;
  static const _maxPending = 80;
  static const _maxDescriptionChars = 600;
  static const _maxImages = 8;

  String? _activeUserId;

  Future<SharedPreferences> get _prefs async => SharedPreferences.getInstance();

  void setActiveUser(String? userId) {
    _activeUserId = (userId != null && isUuid(userId)) ? userId : null;
  }

  String? get activeUserId => _activeUserId;

  Future<String?> getPreferredArea() async {
    final prefs = await _prefs;
    return prefs.getString(_preferredAreaKey);
  }

  Future<void> setPreferredArea(String? area) async {
    final prefs = await _prefs;
    final v = sanitizePreferredArea(area);
    if (v == null) {
      await prefs.remove(_preferredAreaKey);
    } else {
      await prefs.setString(_preferredAreaKey, v);
    }
  }

  Future<List<ShowcaseListing>> catalogListings() => _readListings(_catalogListingsKey);
  Future<List<ProviderItem>> catalogProviders() => _readProviders(_catalogProvidersKey);

  Future<List<ShowcaseColumn>> catalogColumns() async {
    final prefs = await _prefs;
    final raw = prefs.getString(_catalogColumnsKey);
    if (raw == null || raw.isEmpty) return [];
    try {
      final decoded = jsonDecode(raw) as List;
      return decoded
          .map((e) => ShowcaseColumn.fromJson(Map<String, dynamic>.from(e as Map)))
          .where((c) => isUuid(c.id))
          .toList();
    } catch (_) {
      return [];
    }
  }

  Future<void> saveCatalogColumns(List<ShowcaseColumn> columns) async {
    final prefs = await _prefs;
    final payload = columns.map((c) => c.toCacheJson()).toList();
    await prefs.setString(_catalogColumnsKey, jsonEncode(payload));
  }

  Future<void> saveCatalogListings(List<ShowcaseListing> listings) async {
    await _writeListings(_catalogListingsKey, listings.take(_maxCatalog).toList());
  }

  Future<void> saveCatalogProviders(List<ProviderItem> providers) async {
    await _writeProviders(_catalogProvidersKey, providers.take(_maxCatalog).toList());
  }

  Future<void> mergeCatalogListings(List<ShowcaseListing> listings) async {
    final map = <String, ShowcaseListing>{
      for (final item in await catalogListings()) item.id: item,
    };
    for (final item in listings) {
      map[item.id] = item;
    }
    await saveCatalogListings(map.values.toList());
  }

  Future<void> mergeCatalogProviders(List<ProviderItem> providers) async {
    final map = <String, ProviderItem>{
      for (final item in await catalogProviders()) item.id: item,
    };
    for (final item in providers) {
      map[item.id] = item;
    }
    await saveCatalogProviders(map.values.toList());
  }

  Future<List<ShowcaseListing>> recentListings() => _readListings(_recentListingsKey);
  Future<List<ProviderItem>> recentProviders() => _readProviders(_recentProvidersKey);

  Future<List<ShowcaseListing>> cachedFavouriteListings([String? userId]) async {
    final uid = userId ?? _activeUserId;
    if (uid == null) return [];
    return _readListings('$_favListingsKeyPrefix$uid');
  }

  Future<List<ProviderItem>> cachedFavouriteProviders([String? userId]) async {
    final uid = userId ?? _activeUserId;
    if (uid == null) return [];
    return _readProviders('$_favProvidersKeyPrefix$uid');
  }

  Future<Set<String>> cachedFavouriteListingIds([String? userId]) async {
    final uid = userId ?? _activeUserId;
    if (uid == null) return {};
    return _readIdSet('$_favIdsListingsPrefix$uid');
  }

  Future<Set<String>> cachedFavouriteProviderIds([String? userId]) async {
    final uid = userId ?? _activeUserId;
    if (uid == null) return {};
    return _readIdSet('$_favIdsProvidersPrefix$uid');
  }

  Future<Set<String>> cachedAlertListingIds([String? userId]) async {
    final uid = userId ?? _activeUserId;
    if (uid == null) return {};
    return _readIdSet('$_alertIdsPrefix$uid');
  }

  Future<void> saveFavouriteListingIds(Set<String> ids, [String? userId]) async {
    final uid = userId ?? _activeUserId;
    if (uid == null) return;
    await _writeIdSet('$_favIdsListingsPrefix$uid', ids);
  }

  Future<void> saveFavouriteProviderIds(Set<String> ids, [String? userId]) async {
    final uid = userId ?? _activeUserId;
    if (uid == null) return;
    await _writeIdSet('$_favIdsProvidersPrefix$uid', ids);
  }

  Future<void> saveAlertListingIds(Set<String> ids, [String? userId]) async {
    final uid = userId ?? _activeUserId;
    if (uid == null) return;
    await _writeIdSet('$_alertIdsPrefix$uid', ids);
  }

  Future<void> recordListingView(ShowcaseListing listing) async {
    if (!isUuid(listing.id)) return;
    final list = await recentListings();
    list.removeWhere((e) => e.id == listing.id);
    list.insert(0, _slimListing(listing));
    await _writeListings(_recentListingsKey, list.take(_maxRecent).toList());
  }

  Future<void> recordProviderView(ProviderItem provider) async {
    if (!isUuid(provider.id)) return;
    final list = await recentProviders();
    list.removeWhere((e) => e.id == provider.id);
    list.insert(0, _slimProvider(provider));
    await _writeProviders(_recentProvidersKey, list.take(_maxRecent).toList());
  }

  Future<void> saveFavouriteListings(List<ShowcaseListing> listings, [String? userId]) async {
    final uid = userId ?? _activeUserId;
    if (uid == null) return;
    final slim = listings.take(_maxFavourites).map(_slimListing).toList();
    await _writeListings('$_favListingsKeyPrefix$uid', slim);
    await saveFavouriteListingIds(slim.map((e) => e.id).toSet(), uid);
  }

  Future<void> saveFavouriteProviders(List<ProviderItem> providers, [String? userId]) async {
    final uid = userId ?? _activeUserId;
    if (uid == null) return;
    final slim = providers.take(_maxFavourites).map(_slimProvider).toList();
    await _writeProviders('$_favProvidersKeyPrefix$uid', slim);
    await saveFavouriteProviderIds(slim.map((e) => e.id).toSet(), uid);
  }

  Future<void> upsertFavouriteListing(ShowcaseListing listing, {required bool saved}) async {
    final uid = _activeUserId;
    if (uid == null || !isUuid(listing.id)) return;
    final list = await cachedFavouriteListings(uid);
    list.removeWhere((e) => e.id == listing.id);
    if (saved) list.insert(0, _slimListing(listing));
    await saveFavouriteListings(list, uid);
  }

  Future<void> upsertFavouriteProvider(ProviderItem provider, {required bool saved}) async {
    final uid = _activeUserId;
    if (uid == null || !isUuid(provider.id)) return;
    final list = await cachedFavouriteProviders(uid);
    list.removeWhere((e) => e.id == provider.id);
    if (saved) list.insert(0, _slimProvider(provider));
    await saveFavouriteProviders(list, uid);
  }

  Future<ShowcaseListing?> findListing(String id) async {
    if (!isUuid(id)) return null;
    for (final source in [
      await cachedFavouriteListings(),
      await recentListings(),
      await catalogListings(),
    ]) {
      for (final item in source) {
        if (item.id == id) return item;
      }
    }
    return null;
  }

  Future<ProviderItem?> findProvider(String id) async {
    if (!isUuid(id)) return null;
    for (final source in [
      await cachedFavouriteProviders(),
      await recentProviders(),
      await catalogProviders(),
    ]) {
      for (final item in source) {
        if (item.id == id) return item;
      }
    }
    return null;
  }

  Future<List<ShowcaseListing>> offlineListingFeed({int limit = 40}) async {
    final map = <String, ShowcaseListing>{};
    for (final item in [
      ...await cachedFavouriteListings(),
      ...await recentListings(),
      ...await catalogListings(),
    ]) {
      map.putIfAbsent(item.id, () => item);
    }
    return map.values.take(limit).toList();
  }

  Future<List<ProviderItem>> offlineProviderFeed({int limit = 40, String? query}) async {
    final map = <String, ProviderItem>{};
    for (final item in [
      ...await cachedFavouriteProviders(),
      ...await recentProviders(),
      ...await catalogProviders(),
    ]) {
      map.putIfAbsent(item.id, () => item);
    }
    var list = map.values.toList();
    final q = query?.trim().toLowerCase();
    if (q != null && q.isNotEmpty) {
      list = list
          .where(
            (p) =>
                p.businessName.toLowerCase().contains(q) ||
                (p.location?.toLowerCase().contains(q) ?? false) ||
                (p.description?.toLowerCase().contains(q) ?? false),
          )
          .toList();
    }
    return list.take(limit).toList();
  }

  Future<List<PendingMutation>> pendingMutations([String? userId]) async {
    final uid = userId ?? _activeUserId;
    if (uid == null) return [];
    final prefs = await _prefs;
    final raw = prefs.getString('$_pendingPrefix$uid');
    if (raw == null || raw.isEmpty) return [];
    try {
      final decoded = jsonDecode(raw) as List;
      return decoded
          .map((e) => PendingMutation.fromJson(Map<String, dynamic>.from(e as Map)))
          .where((m) => isUuid(m.targetId))
          .toList();
    } catch (_) {
      return [];
    }
  }

  Future<void> enqueueMutation(PendingMutation mutation, [String? userId]) async {
    final uid = userId ?? _activeUserId;
    if (uid == null || !isUuid(mutation.targetId)) return;
    final list = await pendingMutations(uid);
    // Collapse duplicates: keep latest intent for same type+target.
    list.removeWhere((m) => m.type == mutation.type && m.targetId == mutation.targetId);
    list.add(mutation);
    final trimmed = list.length > _maxPending ? list.sublist(list.length - _maxPending) : list;
    final prefs = await _prefs;
    await prefs.setString(
      '$_pendingPrefix$uid',
      jsonEncode(trimmed.map((e) => e.toJson()).toList()),
    );
  }

  Future<void> clearPendingMutations([String? userId]) async {
    final uid = userId ?? _activeUserId;
    if (uid == null) return;
    final prefs = await _prefs;
    await prefs.remove('$_pendingPrefix$uid');
  }

  Future<void> replacePendingMutations(List<PendingMutation> mutations, [String? userId]) async {
    final uid = userId ?? _activeUserId;
    if (uid == null) return;
    final prefs = await _prefs;
    if (mutations.isEmpty) {
      await prefs.remove('$_pendingPrefix$uid');
      return;
    }
    await prefs.setString(
      '$_pendingPrefix$uid',
      jsonEncode(mutations.map((e) => e.toJson()).toList()),
    );
  }

  Future<void> clearUserScopedCache(String userId) async {
    if (!isUuid(userId)) return;
    final prefs = await _prefs;
    await prefs.remove('$_favListingsKeyPrefix$userId');
    await prefs.remove('$_favProvidersKeyPrefix$userId');
    await prefs.remove('$_favIdsListingsPrefix$userId');
    await prefs.remove('$_favIdsProvidersPrefix$userId');
    await prefs.remove('$_alertIdsPrefix$userId');
    await prefs.remove('$_pendingPrefix$userId');
  }

  /// Rewrites shared + optional user caches without phones or emails.
  Future<void> scrubContactPiiFromCaches([String? userId]) async {
    final listings = await catalogListings();
    final providers = await catalogProviders();
    final recentL = await recentListings();
    final recentP = await recentProviders();
    await saveCatalogListings(listings);
    await saveCatalogProviders(providers);
    await _writeListings(_recentListingsKey, recentL);
    await _writeProviders(_recentProvidersKey, recentP);

    if (userId != null && isUuid(userId)) {
      final favL = await cachedFavouriteListings(userId);
      final favP = await cachedFavouriteProviders(userId);
      await saveFavouriteListings(favL, userId);
      await saveFavouriteProviders(favP, userId);
    }
  }

  ShowcaseListing _slimListing(ShowcaseListing listing) {
    final desc = listing.description;
    return ShowcaseListing(
      id: listing.id,
      title: listing.title,
      summary: listing.summary,
      description: desc == null
          ? null
          : (desc.length > _maxDescriptionChars ? desc.substring(0, _maxDescriptionChars) : desc),
      location: listing.location,
      priceLabel: listing.priceLabel,
      dealType: listing.dealType,
      imageUrls: listing.imageUrls.take(_maxImages).toList(),
      available: listing.available,
      availabilityStatus: listing.availabilityStatus,
      featured: listing.featured,
      ownerName: listing.ownerName,
      // Contact details are not persisted offline (shared-device / logout risk).
      ownerPhone: null,
      ownerEmail: null,
      columnId: listing.columnId,
      columnTitle: listing.columnTitle,
      columnSlug: listing.columnSlug,
    );
  }

  ProviderItem _slimProvider(ProviderItem provider) {
    final desc = provider.description;
    return ProviderItem(
      id: provider.id,
      businessName: provider.businessName,
      description: desc == null
          ? null
          : (desc.length > _maxDescriptionChars ? desc.substring(0, _maxDescriptionChars) : desc),
      location: provider.location,
      logoUrl: provider.logoUrl,
      coverUrl: provider.coverUrl,
      galleryUrls: provider.galleryUrls.take(_maxImages).toList(),
      contactEmail: null,
      contactPhone: null,
      msApproved: provider.msApproved,
      verifiedAt: provider.verifiedAt,
      averageRating: provider.averageRating,
      reviewCount: provider.reviewCount,
    );
  }

  Future<List<ShowcaseListing>> _readListings(String key) async {
    final prefs = await _prefs;
    final raw = prefs.getString(key);
    if (raw == null || raw.isEmpty) return [];
    try {
      final decoded = jsonDecode(raw) as List;
      return decoded
          .map((e) => ShowcaseListing.fromJson(Map<String, dynamic>.from(e as Map)))
          .where((e) => isUuid(e.id))
          .toList();
    } catch (_) {
      return [];
    }
  }

  Future<List<ProviderItem>> _readProviders(String key) async {
    final prefs = await _prefs;
    final raw = prefs.getString(key);
    if (raw == null || raw.isEmpty) return [];
    try {
      final decoded = jsonDecode(raw) as List;
      return decoded
          .map((e) => ProviderItem.fromJson(Map<String, dynamic>.from(e as Map)))
          .where((e) => isUuid(e.id))
          .toList();
    } catch (_) {
      return [];
    }
  }

  Future<void> _writeListings(String key, List<ShowcaseListing> items) async {
    final prefs = await _prefs;
    await prefs.setString(
      key,
      jsonEncode(items.map((e) => _slimListing(e).toCacheJson()).toList()),
    );
  }

  Future<void> _writeProviders(String key, List<ProviderItem> items) async {
    final prefs = await _prefs;
    await prefs.setString(
      key,
      jsonEncode(items.map((e) => _slimProvider(e).toCacheJson()).toList()),
    );
  }

  Future<Set<String>> _readIdSet(String key) async {
    final prefs = await _prefs;
    final raw = prefs.getStringList(key);
    if (raw == null) return {};
    return raw.where(isUuid).toSet();
  }

  Future<void> _writeIdSet(String key, Set<String> ids) async {
    final prefs = await _prefs;
    await prefs.setStringList(key, ids.where(isUuid).take(_maxFavourites).toList());
  }
}
