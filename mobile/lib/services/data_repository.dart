import 'package:supabase_flutter/supabase_flutter.dart';

import '../models/models.dart';
import '../utils/helpers.dart';
import 'connectivity_service.dart';
import 'local_cache_service.dart';

class DataRepository {
  SupabaseClient get _db => Supabase.instance.client;
  final _cache = LocalCacheService.instance;
  final _net = ConnectivityService.instance;
  final Map<String, Future<dynamic>> _inflight = {};

  static const _listingSelect =
      'id, title, summary, description, location, price_label, deal_type, image_urls, available, featured, owner_name, owner_phone, owner_email, showcase_columns(id, slug, title)';

  static const _providerSelect =
      'id, business_name, description, location, logo_url, cover_url, gallery_urls, contact_email, contact_phone';

  String? get _uid => _db.auth.currentUser?.id;

  Future<T> _singleFlight<T>(String key, Future<T> Function() run) {
    final existing = _inflight[key];
    if (existing != null) return existing as Future<T>;
    final future = run().whenComplete(() => _inflight.remove(key));
    _inflight[key] = future;
    return future;
  }

  Future<List<ShowcaseListing>> fetchShowcaseListings({int limit = 40}) {
    final capped = limit.clamp(1, 60);
    return _singleFlight('listings:$capped', () async {
      if (_net.isOffline) {
        return _cache.offlineListingFeed(limit: capped);
      }
      try {
        final rows = await _db
            .from('showcase_listings')
            .select(_listingSelect)
            .eq('status', 'published')
            .order('featured', ascending: false)
            .order('sort_order', ascending: true)
            .order('created_at', ascending: false)
            .limit(capped);

        final list = (rows as List)
            .map((row) => ShowcaseListing.fromJson(Map<String, dynamic>.from(row as Map)))
            .where((e) => isUuid(e.id))
            .toList();
        await _cache.saveCatalogListings(list);
        return list;
      } catch (_) {
        return _cache.offlineListingFeed(limit: capped);
      }
    });
  }

  Future<ShowcaseListing?> fetchListing(String id) async {
    if (!isUuid(id)) return null;
    if (_net.isOffline) return _cache.findListing(id);
    try {
      final row = await _db
          .from('showcase_listings')
          .select(_listingSelect)
          .eq('id', id)
          .eq('status', 'published')
          .maybeSingle();
      if (row == null) return _cache.findListing(id);
      final listing = ShowcaseListing.fromJson(Map<String, dynamic>.from(row));
      await _cache.recordListingView(listing);
      return listing;
    } catch (_) {
      return _cache.findListing(id);
    }
  }

  Future<List<ShowcaseColumn>> fetchColumns() async {
    if (_net.isOffline) return const [];
    final rows = await _db
        .from('showcase_columns')
        .select('id, slug, title, tagline')
        .eq('active', true)
        .order('sort_order', ascending: true);
    return (rows as List)
        .map((row) => ShowcaseColumn.fromJson(Map<String, dynamic>.from(row as Map)))
        .toList();
  }

  Future<List<ProviderItem>> fetchProviders({String? query, int limit = 40}) {
    final capped = limit.clamp(1, 60);
    final q = query?.trim() ?? '';
    return _singleFlight('providers:$capped:${q.toLowerCase()}', () async {
      if (_net.isOffline) {
        return _cache.offlineProviderFeed(limit: capped, query: query);
      }
      try {
        var query = _db.from('providers').select(_providerSelect).eq('status', 'approved');

        if (q.isNotEmpty) {
          final safe = q.replaceAll(RegExp(r'[%_,]'), ' ').trim();
          if (safe.isNotEmpty) {
            query = query.or(
              'business_name.ilike.%$safe%,location.ilike.%$safe%,description.ilike.%$safe%',
            );
          }
        }

        final rows = await query.order('created_at', ascending: false).limit(capped);

        var list = (rows as List)
            .map((row) => ProviderItem.fromJson(Map<String, dynamic>.from(row as Map)))
            .where((e) => isUuid(e.id))
            .toList();

        list = await _attachReviewStats(list);
        await _cache.saveCatalogProviders(list);
        return list;
      } catch (_) {
        return _cache.offlineProviderFeed(limit: capped, query: query);
      }
    });
  }

  Future<ProviderItem?> fetchProvider(String id) async {
    if (!isUuid(id)) return null;
    if (_net.isOffline) return _cache.findProvider(id);
    try {
      final row = await _db
          .from('providers')
          .select(_providerSelect)
          .eq('id', id)
          .eq('status', 'approved')
          .maybeSingle();
      if (row == null) return _cache.findProvider(id);
      final provider = ProviderItem.fromJson(Map<String, dynamic>.from(row));
      final withStats = await _attachReviewStats([provider]);
      final result = withStats.first;
      await _cache.recordProviderView(result);
      return result;
    } catch (_) {
      return _cache.findProvider(id);
    }
  }

  Future<List<ProviderItem>> _attachReviewStats(List<ProviderItem> providers) async {
    if (providers.isEmpty || _net.isOffline) return providers;
    try {
      final ids = providers.map((p) => p.id).where(isUuid).toList();
      if (ids.isEmpty) return providers;

      // Prefer aggregate RPC (one row per provider) under load.
      try {
        final stats = await _db.rpc('provider_review_stats', params: {'p_ids': ids});
        if (stats is List && stats.isNotEmpty) {
          final byId = <String, Map<String, dynamic>>{};
          for (final row in stats) {
            final map = Map<String, dynamic>.from(row as Map);
            final id = map['provider_id'] as String?;
            if (id != null) byId[id] = map;
          }
          return providers.map((p) {
            final row = byId[p.id];
            if (row == null) return p;
            return p.copyWith(
              averageRating: (row['average_rating'] as num?)?.toDouble(),
              reviewCount: (row['review_count'] as num?)?.toInt() ?? 0,
            );
          }).toList();
        }
      } catch (_) {
        // Fall through to capped raw select if RPC is not deployed yet.
      }

      final rows = await _db
          .from('provider_reviews')
          .select('provider_id, rating')
          .inFilter('provider_id', ids)
          .eq('approved', true)
          .limit(800);

      final sums = <String, int>{};
      final counts = <String, int>{};
      for (final row in rows as List) {
        final map = Map<String, dynamic>.from(row as Map);
        final id = map['provider_id'] as String?;
        if (id == null || !isUuid(id)) continue;
        final rating = (map['rating'] as num?)?.toInt() ?? 0;
        if (rating < 1 || rating > 5) continue;
        sums[id] = (sums[id] ?? 0) + rating;
        counts[id] = (counts[id] ?? 0) + 1;
      }

      return providers.map((p) {
        final count = counts[p.id] ?? 0;
        if (count == 0) return p;
        return p.copyWith(
          averageRating: (sums[p.id] ?? 0) / count,
          reviewCount: count,
        );
      }).toList();
    } catch (_) {
      return providers;
    }
  }

  Future<List<ProviderReview>> fetchProviderReviews(String providerId) async {
    if (!isUuid(providerId) || _net.isOffline) return const [];
    try {
      final rows = await _db
          .from('provider_reviews')
          .select('id, provider_id, customer_id, rating, body, approved, created_at')
          .eq('provider_id', providerId)
          .eq('approved', true)
          .order('created_at', ascending: false)
          .limit(40);
      return (rows as List)
          .map((row) => ProviderReview.fromJson(Map<String, dynamic>.from(row as Map)))
          .toList();
    } catch (_) {
      return const [];
    }
  }

  Future<String?> upsertProviderReview({
    required String providerId,
    required String customerId,
    required int rating,
    String? body,
  }) async {
    final authErr = _assertActor(customerId);
    if (authErr != null) return authErr;
    if (!isUuid(providerId)) return 'Invalid provider.';
    final ratingErr = validateReviewRating(rating);
    if (ratingErr != null) return ratingErr;
    if (_net.isOffline) return 'Connect to the internet to submit a review.';

    final cleanBody = sanitizeReviewBody(body);
    try {
      await _db.from('provider_reviews').upsert({
        'provider_id': providerId,
        'customer_id': customerId,
        'rating': rating,
        'body': cleanBody,
        'approved': true,
      }, onConflict: 'provider_id,customer_id');
      return null;
    } catch (e) {
      return friendlyError(e, fallback: 'Couldn’t save your review.');
    }
  }

  Future<Set<String>> fetchFavouriteProviderIds(String customerId) async {
    final authErr = _assertActor(customerId);
    if (authErr != null) return {};
    if (_net.isOffline) return _cache.cachedFavouriteProviderIds(customerId);
    try {
      final rows = await _db.from('favorites').select('provider_id').eq('customer_id', customerId);
      final ids = {
        for (final row in rows as List)
          if ((row as Map)['provider_id'] is String && isUuid(row['provider_id'] as String))
            row['provider_id'] as String,
      };
      await _cache.saveFavouriteProviderIds(ids, customerId);
      return ids;
    } catch (_) {
      return _cache.cachedFavouriteProviderIds(customerId);
    }
  }

  Future<Set<String>> fetchFavouriteListingIds(String customerId) async {
    final authErr = _assertActor(customerId);
    if (authErr != null) return {};
    if (_net.isOffline) return _cache.cachedFavouriteListingIds(customerId);
    try {
      final rows =
          await _db.from('listing_favorites').select('listing_id').eq('customer_id', customerId);
      final ids = {
        for (final row in rows as List)
          if ((row as Map)['listing_id'] is String && isUuid(row['listing_id'] as String))
            row['listing_id'] as String,
      };
      await _cache.saveFavouriteListingIds(ids, customerId);
      return ids;
    } catch (_) {
      return _cache.cachedFavouriteListingIds(customerId);
    }
  }

  Future<Map<String, ListingAlert>> fetchListingAlerts(String customerId) async {
    final authErr = _assertActor(customerId);
    if (authErr != null) return {};
    if (_net.isOffline) {
      final ids = await _cache.cachedAlertListingIds(customerId);
      return {
        for (final id in ids)
          id: ListingAlert(
            id: 'cached',
            listingId: id,
            notifyPrice: true,
            notifyAvailability: true,
          ),
      };
    }
    try {
      final rows = await _db
          .from('listing_alerts')
          .select('id, listing_id, notify_price, notify_availability')
          .eq('customer_id', customerId);
      final map = <String, ListingAlert>{};
      for (final row in rows as List) {
        final alert = ListingAlert.fromJson(Map<String, dynamic>.from(row as Map));
        if (!isUuid(alert.listingId)) continue;
        map[alert.listingId] = alert;
      }
      await _cache.saveAlertListingIds(map.keys.toSet(), customerId);
      return map;
    } catch (_) {
      final ids = await _cache.cachedAlertListingIds(customerId);
      return {
        for (final id in ids)
          id: ListingAlert(
            id: 'cached',
            listingId: id,
            notifyPrice: true,
            notifyAvailability: true,
          ),
      };
    }
  }

  Future<String?> setProviderFavourite({
    required String customerId,
    required String providerId,
    required bool saved,
  }) async {
    final authErr = _assertActor(customerId);
    if (authErr != null) return authErr;
    if (!isUuid(providerId)) return 'Invalid provider.';
    if (_net.isOffline) return 'offline';
    try {
      if (saved) {
        await _db.from('favorites').upsert({
          'customer_id': customerId,
          'provider_id': providerId,
        }, onConflict: 'customer_id,provider_id');
      } else {
        await _db
            .from('favorites')
            .delete()
            .eq('customer_id', customerId)
            .eq('provider_id', providerId);
      }
      return null;
    } catch (e) {
      if (_isNetworkFailure(e)) return 'offline';
      return friendlyError(e, fallback: 'Couldn’t update favourite.');
    }
  }

  Future<String?> setListingFavourite({
    required String customerId,
    required String listingId,
    required bool saved,
  }) async {
    final authErr = _assertActor(customerId);
    if (authErr != null) return authErr;
    if (!isUuid(listingId)) return 'Invalid listing.';
    if (_net.isOffline) return 'offline';
    try {
      if (saved) {
        await _db.from('listing_favorites').upsert({
          'customer_id': customerId,
          'listing_id': listingId,
        }, onConflict: 'customer_id,listing_id');
      } else {
        await _db
            .from('listing_favorites')
            .delete()
            .eq('customer_id', customerId)
            .eq('listing_id', listingId);
      }
      return null;
    } catch (e) {
      if (_isNetworkFailure(e)) return 'offline';
      return friendlyError(e, fallback: 'Couldn’t update favourite.');
    }
  }

  Future<String?> setListingAlert({
    required String customerId,
    required String listingId,
    required bool enabled,
    bool notifyPrice = true,
    bool notifyAvailability = true,
  }) async {
    final authErr = _assertActor(customerId);
    if (authErr != null) return authErr;
    if (!isUuid(listingId)) return 'Invalid listing.';
    if (_net.isOffline) return 'offline';
    try {
      if (!enabled) {
        await _db
            .from('listing_alerts')
            .delete()
            .eq('customer_id', customerId)
            .eq('listing_id', listingId);
        return null;
      }
      await _db.from('listing_alerts').upsert({
        'customer_id': customerId,
        'listing_id': listingId,
        'notify_price': notifyPrice,
        'notify_availability': notifyAvailability,
      }, onConflict: 'customer_id,listing_id');
      return null;
    } catch (e) {
      if (_isNetworkFailure(e)) return 'offline';
      return friendlyError(e, fallback: 'Couldn’t update alert.');
    }
  }

  Future<List<ShowcaseListing>> fetchListingsByIds(Iterable<String> ids) async {
    final idList = ids.where(isUuid).toList();
    if (idList.isEmpty) return [];
    if (_net.isOffline) {
      final out = <ShowcaseListing>[];
      for (final id in idList) {
        final item = await _cache.findListing(id);
        if (item != null) out.add(item);
      }
      return out;
    }
    try {
      final rows = await _db
          .from('showcase_listings')
          .select(_listingSelect)
          .inFilter('id', idList)
          .eq('status', 'published');
      return (rows as List)
          .map((row) => ShowcaseListing.fromJson(Map<String, dynamic>.from(row as Map)))
          .toList();
    } catch (_) {
      final out = <ShowcaseListing>[];
      for (final id in idList) {
        final item = await _cache.findListing(id);
        if (item != null) out.add(item);
      }
      return out;
    }
  }

  Future<List<ProviderItem>> fetchProvidersByIds(Iterable<String> ids) async {
    final idList = ids.where(isUuid).toList();
    if (idList.isEmpty) return [];
    if (_net.isOffline) {
      final out = <ProviderItem>[];
      for (final id in idList) {
        final item = await _cache.findProvider(id);
        if (item != null) out.add(item);
      }
      return out;
    }
    try {
      final rows = await _db
          .from('providers')
          .select(_providerSelect)
          .inFilter('id', idList)
          .eq('status', 'approved');
      final list = (rows as List)
          .map((row) => ProviderItem.fromJson(Map<String, dynamic>.from(row as Map)))
          .toList();
      return _attachReviewStats(list);
    } catch (_) {
      final out = <ProviderItem>[];
      for (final id in idList) {
        final item = await _cache.findProvider(id);
        if (item != null) out.add(item);
      }
      return out;
    }
  }

  Future<List<AppNotification>> fetchNotifications({int limit = 40}) async {
    final uid = _uid;
    if (uid == null) return const [];
    if (_net.isOffline) return const [];
    try {
      final rows = await _db
          .from('notifications')
          .select('id, type, title, body, link, read_at, created_at, metadata')
          .eq('user_id', uid)
          .order('created_at', ascending: false)
          .limit(limit.clamp(1, 100));
      return (rows as List)
          .map((row) => AppNotification.fromJson(Map<String, dynamic>.from(row as Map)))
          .toList();
    } catch (_) {
      return const [];
    }
  }

  Future<String?> markNotificationRead(String id) async {
    final uid = _uid;
    if (uid == null) return 'Please sign in again.';
    if (!isUuid(id)) return 'Invalid notification.';
    if (_net.isOffline) return null; // applied locally already
    try {
      await _db
          .from('notifications')
          .update({'read_at': DateTime.now().toUtc().toIso8601String()})
          .eq('id', id)
          .eq('user_id', uid);
      return null;
    } catch (e) {
      return friendlyError(e);
    }
  }

  Future<String?> markAllNotificationsRead() async {
    final uid = _uid;
    if (uid == null) return 'Please sign in again.';
    if (_net.isOffline) return null;
    try {
      await _db
          .from('notifications')
          .update({'read_at': DateTime.now().toUtc().toIso8601String()})
          .eq('user_id', uid)
          .isFilter('read_at', null);
      return null;
    } catch (e) {
      return friendlyError(e);
    }
  }

  Future<void> upsertDeviceToken({
    required String userId,
    required String token,
    String platform = 'android',
  }) async {
    final authErr = _assertActor(userId);
    if (authErr != null) return;
    final cleanToken = token.trim();
    if (cleanToken.isEmpty || cleanToken.length > 512) return;
    if (_net.isOffline) return;
    try {
      await _db.from('device_tokens').upsert({
        'user_id': userId,
        'token': cleanToken,
        'platform': platform,
        'updated_at': DateTime.now().toUtc().toIso8601String(),
      }, onConflict: 'user_id,token');
    } catch (_) {}
  }

  String? _assertActor(String customerId) {
    final uid = _uid;
    if (uid == null) return 'Please sign in again.';
    if (!isUuid(customerId) || customerId != uid) {
      return 'Session mismatch. Please sign in again.';
    }
    return null;
  }

  /// Leadership team from CMS `site_content` (same source as the website About page).
  Future<List<TeamMember>> fetchTeamMembers({String siteBase = 'https://marketspheregroup.com/'}) async {
    try {
      final row = await _db.from('site_content').select('value').eq('key', 'about').maybeSingle();
      final value = row?['value'];
      final map = value is Map ? Map<String, dynamic>.from(value) : null;
      final staff = map?['staff'];
      final staffMap = staff is Map ? Map<String, dynamic>.from(staff) : null;
      final members = staffMap?['members'];
      if (members is List && members.isNotEmpty) {
        return members
            .whereType<Map>()
            .map((m) => TeamMember.fromJson(Map<String, dynamic>.from(m), siteBase: siteBase))
            .where((m) => m.name.trim().isNotEmpty)
            .toList();
      }
    } catch (_) {
      // Fall through to defaults.
    }
    return defaultTeamMembers(siteBase: siteBase);
  }

  static List<TeamMember> defaultTeamMembers({String siteBase = 'https://marketspheregroup.com/'}) {
    const defaults = [
      {
        'id': 'staff-samuel',
        'name': 'Mr. Samuel Akinsola',
        'role': 'Chief Executive Officer (CEO)',
        'phone': '+267 74 013 060',
        'image': 'staff/samuel-akinsola.png',
      },
      {
        'id': 'staff-pearl',
        'name': 'Ms. Pearl Lindiwe Phatsimo',
        'role': 'Office Manager & Property Agency Personnel',
        'phone': '+267 78 377 990',
        'image': 'staff/pearl-phatsimo.png',
      },
      {
        'id': 'staff-tumisang',
        'name': 'Ms. Tumisang Gaobonya',
        'role': 'Financial & Business Partnership Personnel',
        'phone': '+267 77 414 473',
        'image': 'staff/tumisang-gaobonya.png',
      },
    ];
    return defaults
        .map((m) => TeamMember.fromJson(m, siteBase: siteBase))
        .toList();
  }

  bool _isNetworkFailure(Object e) {
    final s = e.toString().toLowerCase();
    return s.contains('socket') ||
        s.contains('network') ||
        s.contains('failed host') ||
        s.contains('timed out') ||
        s.contains('connection refused') ||
        s.contains('clientexception');
  }
}
