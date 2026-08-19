class Profile {
  const Profile({
    required this.id,
    required this.email,
    this.fullName,
    this.phone,
    required this.role,
    this.avatarUrl,
    this.bannedAt,
    this.createdAt,
  });

  final String id;
  final String email;
  final String? fullName;
  final String? phone;
  final String role;
  final String? avatarUrl;
  final DateTime? bannedAt;
  final DateTime? createdAt;

  bool get isBanned => bannedAt != null;
  bool get isAdmin => role == 'admin';
  bool get isProvider => role == 'provider';
  String get displayName => (fullName?.trim().isNotEmpty == true) ? fullName!.trim() : email;

  factory Profile.fromJson(Map<String, dynamic> json) {
    return Profile(
      id: json['id'] as String,
      email: (json['email'] as String?) ?? '',
      fullName: json['full_name'] as String?,
      phone: json['phone'] as String?,
      role: (json['role'] as String?) ?? 'customer',
      avatarUrl: json['avatar_url'] as String?,
      bannedAt: json['banned_at'] != null ? DateTime.tryParse(json['banned_at'] as String) : null,
      createdAt: json['created_at'] != null ? DateTime.tryParse(json['created_at'] as String) : null,
    );
  }
}

class ShowcaseListing {
  const ShowcaseListing({
    required this.id,
    required this.title,
    this.summary,
    this.description,
    this.location,
    this.priceLabel,
    required this.dealType,
    required this.imageUrls,
    required this.available,
    this.availabilityStatus,
    required this.featured,
    this.ownerName,
    this.ownerPhone,
    this.ownerEmail,
    this.columnId,
    this.columnTitle,
    this.columnSlug,
  });

  final String id;
  final String title;
  final String? summary;
  final String? description;
  final String? location;
  final String? priceLabel;
  final String dealType;
  final List<String> imageUrls;
  final bool available;
  final String? availabilityStatus;
  final bool featured;
  final String? ownerName;
  final String? ownerPhone;
  final String? ownerEmail;
  final String? columnId;
  final String? columnTitle;
  final String? columnSlug;

  String? get coverUrl => imageUrls.isNotEmpty ? imageUrls.first : null;

  Map<String, dynamic> toCacheJson() => {
        'id': id,
        'title': title,
        'summary': summary,
        'description': description,
        'location': location,
        'price_label': priceLabel,
        'deal_type': dealType,
        'image_urls': imageUrls,
        'available': available,
        'availability_status': availabilityStatus,
        'featured': featured,
        'owner_name': ownerName,
        'owner_phone': ownerPhone,
        'owner_email': ownerEmail,
        'column_id': columnId,
        'showcase_columns': {
          'id': columnId,
          'title': columnTitle,
          'slug': columnSlug,
        },
      };

  factory ShowcaseListing.fromJson(Map<String, dynamic> json) {
    final column = json['showcase_columns'];
    Map<String, dynamic>? colMap;
    if (column is Map<String, dynamic>) {
      colMap = column;
    } else if (column is List && column.isNotEmpty && column.first is Map) {
      colMap = Map<String, dynamic>.from(column.first as Map);
    }

    final images = json['image_urls'];
    return ShowcaseListing(
      id: json['id'] as String,
      title: (json['title'] as String?) ?? 'Listing',
      summary: json['summary'] as String?,
      description: json['description'] as String?,
      location: json['location'] as String?,
      priceLabel: json['price_label'] as String?,
      dealType: (json['deal_type'] as String?) ?? 'other',
      imageUrls: images is List ? images.map((e) => e.toString()).toList() : const [],
      available: json['available'] != false,
      availabilityStatus: json['availability_status'] as String?,
      featured: json['featured'] == true,
      ownerName: json['owner_name'] as String?,
      ownerPhone: json['owner_phone'] as String?,
      ownerEmail: json['owner_email'] as String?,
      columnId: (json['column_id'] as String?) ?? colMap?['id'] as String?,
      columnTitle: colMap?['title'] as String?,
      columnSlug: colMap?['slug'] as String?,
    );
  }
}

class ProviderItem {
  const ProviderItem({
    required this.id,
    required this.businessName,
    this.description,
    this.location,
    this.logoUrl,
    this.coverUrl,
    this.galleryUrls = const [],
    this.contactEmail,
    this.contactPhone,
    this.msApproved = false,
    this.verifiedAt,
    this.averageRating,
    this.reviewCount = 0,
  });

  final String id;
  final String businessName;
  final String? description;
  final String? location;
  final String? logoUrl;
  final String? coverUrl;
  final List<String> galleryUrls;
  final String? contactEmail;
  final String? contactPhone;
  final bool msApproved;
  final DateTime? verifiedAt;
  final double? averageRating;
  final int reviewCount;

  bool get isVerified => true; // fetched rows are always approved
  bool get isMsApproved => msApproved;

  String? get imageUrl {
    if (coverUrl != null && coverUrl!.isNotEmpty) return coverUrl;
    if (logoUrl != null && logoUrl!.isNotEmpty) return logoUrl;
    if (galleryUrls.isNotEmpty) return galleryUrls.first;
    return null;
  }

  Map<String, dynamic> toCacheJson() => {
        'id': id,
        'business_name': businessName,
        'description': description,
        'location': location,
        'logo_url': logoUrl,
        'cover_url': coverUrl,
        'gallery_urls': galleryUrls,
        'contact_email': contactEmail,
        'contact_phone': contactPhone,
        'ms_approved': msApproved,
        'verified_at': verifiedAt?.toIso8601String(),
        'average_rating': averageRating,
        'review_count': reviewCount,
      };

  factory ProviderItem.fromJson(Map<String, dynamic> json) {
    final gallery = json['gallery_urls'];
    final avg = json['average_rating'];
    return ProviderItem(
      id: json['id'] as String,
      businessName: (json['business_name'] as String?) ?? 'Provider',
      description: json['description'] as String?,
      location: json['location'] as String?,
      logoUrl: json['logo_url'] as String?,
      coverUrl: json['cover_url'] as String?,
      galleryUrls: gallery is List ? gallery.map((e) => e.toString()).toList() : const [],
      contactEmail: json['contact_email'] as String?,
      contactPhone: json['contact_phone'] as String?,
      msApproved: json.containsKey('ms_approved') ? json['ms_approved'] == true : true,
      verifiedAt: json['verified_at'] != null ? DateTime.tryParse(json['verified_at'] as String) : null,
      averageRating: avg is num ? avg.toDouble() : null,
      reviewCount: (json['review_count'] as num?)?.toInt() ?? 0,
    );
  }

  ProviderItem copyWith({
    double? averageRating,
    int? reviewCount,
    bool? msApproved,
  }) {
    return ProviderItem(
      id: id,
      businessName: businessName,
      description: description,
      location: location,
      logoUrl: logoUrl,
      coverUrl: coverUrl,
      galleryUrls: galleryUrls,
      contactEmail: contactEmail,
      contactPhone: contactPhone,
      msApproved: msApproved ?? this.msApproved,
      verifiedAt: verifiedAt,
      averageRating: averageRating ?? this.averageRating,
      reviewCount: reviewCount ?? this.reviewCount,
    );
  }
}

class ShowcaseColumn {
  const ShowcaseColumn({
    required this.id,
    required this.slug,
    required this.title,
    this.tagline,
    this.listingCount = 0,
  });

  final String id;
  final String slug;
  final String title;
  final String? tagline;
  final int listingCount;

  ShowcaseColumn copyWith({int? listingCount}) {
    return ShowcaseColumn(
      id: id,
      slug: slug,
      title: title,
      tagline: tagline,
      listingCount: listingCount ?? this.listingCount,
    );
  }

  Map<String, dynamic> toCacheJson() => {
        'id': id,
        'slug': slug,
        'title': title,
        'tagline': tagline,
        'listing_count': listingCount,
      };

  factory ShowcaseColumn.fromJson(Map<String, dynamic> json) {
    return ShowcaseColumn(
      id: json['id'] as String,
      slug: (json['slug'] as String?) ?? '',
      title: (json['title'] as String?) ?? 'Column',
      tagline: json['tagline'] as String?,
      listingCount: (json['listing_count'] as num?)?.toInt() ?? 0,
    );
  }
}

class ShowcaseAnnouncement {
  const ShowcaseAnnouncement({
    required this.id,
    this.columnId,
    this.columnTitle,
    this.columnSlug,
    required this.title,
    required this.body,
    required this.category,
    this.badge,
    this.imageUrl,
    this.linkUrl,
    this.linkLabel,
    this.contactPhone,
    this.contactEmail,
    this.startsAt,
    this.expiresAt,
    this.pinned = false,
    this.active = true,
    this.createdAt,
  });

  final String id;
  final String? columnId;
  final String? columnTitle;
  final String? columnSlug;
  final String title;
  final String body;
  final String category;
  final String? badge;
  final String? imageUrl;
  final String? linkUrl;
  final String? linkLabel;
  final String? contactPhone;
  final String? contactEmail;
  final DateTime? startsAt;
  final DateTime? expiresAt;
  final bool pinned;
  final bool active;
  final DateTime? createdAt;

  bool get isExpired {
    if (expiresAt == null) return false;
    return expiresAt!.isBefore(DateTime.now());
  }

  bool get hasStarted {
    if (startsAt == null) return true;
    return !startsAt!.isAfter(DateTime.now());
  }

  String get categoryLabel {
    switch (category) {
      case 'job':
        return 'Job Opening';
      case 'advertisement':
        return 'Advertisement';
      case 'event':
        return 'Event';
      case 'notice':
        return 'Notice';
      default:
        return 'Announcement';
    }
  }

  Map<String, dynamic> toCacheJson() => {
        'id': id,
        'column_id': columnId,
        'title': title,
        'body': body,
        'category': category,
        'badge': badge,
        'image_url': imageUrl,
        'link_url': linkUrl,
        'link_label': linkLabel,
        'contact_phone': contactPhone,
        'contact_email': contactEmail,
        'starts_at': startsAt?.toIso8601String(),
        'expires_at': expiresAt?.toIso8601String(),
        'pinned': pinned,
        'active': active,
        'created_at': createdAt?.toIso8601String(),
        'showcase_columns': {
          'id': columnId,
          'title': columnTitle,
          'slug': columnSlug,
        },
      };

  factory ShowcaseAnnouncement.fromJson(Map<String, dynamic> json) {
    final column = json['showcase_columns'];
    Map<String, dynamic>? colMap;
    if (column is Map<String, dynamic>) {
      colMap = column;
    } else if (column is List && column.isNotEmpty && column.first is Map) {
      colMap = Map<String, dynamic>.from(column.first as Map);
    }

    return ShowcaseAnnouncement(
      id: json['id'] as String,
      columnId: (json['column_id'] as String?) ?? colMap?['id'] as String?,
      columnTitle: colMap?['title'] as String?,
      columnSlug: colMap?['slug'] as String?,
      title: (json['title'] as String?) ?? 'Announcement',
      body: (json['body'] as String?) ?? '',
      category: (json['category'] as String?) ?? 'general',
      badge: json['badge'] as String?,
      imageUrl: json['image_url'] as String?,
      linkUrl: json['link_url'] as String?,
      linkLabel: json['link_label'] as String?,
      contactPhone: json['contact_phone'] as String?,
      contactEmail: json['contact_email'] as String?,
      startsAt: json['starts_at'] != null ? DateTime.tryParse(json['starts_at'] as String) : null,
      expiresAt: json['expires_at'] != null ? DateTime.tryParse(json['expires_at'] as String) : null,
      pinned: json['pinned'] == true,
      active: json['active'] != false,
      createdAt: json['created_at'] != null ? DateTime.tryParse(json['created_at'] as String) : null,
    );
  }
}

class ProviderReview {
  const ProviderReview({
    required this.id,
    required this.providerId,
    required this.customerId,
    required this.rating,
    this.body,
    required this.approved,
    required this.createdAt,
    this.customerName,
  });

  final String id;
  final String providerId;
  final String customerId;
  final int rating;
  final String? body;
  final bool approved;
  final DateTime createdAt;
  final String? customerName;

  factory ProviderReview.fromJson(Map<String, dynamic> json) {
    final profile = json['profiles'];
    String? name;
    if (profile is Map) {
      name = profile['full_name'] as String? ?? profile['email'] as String?;
    }
    return ProviderReview(
      id: json['id'] as String,
      providerId: json['provider_id'] as String,
      customerId: json['customer_id'] as String,
      rating: (json['rating'] as num?)?.toInt() ?? 0,
      body: json['body'] as String?,
      approved: json['approved'] != false,
      createdAt: DateTime.tryParse(json['created_at'] as String? ?? '') ?? DateTime.now(),
      customerName: name,
    );
  }
}

class AppNotification {
  const AppNotification({
    required this.id,
    required this.type,
    required this.title,
    required this.body,
    this.link,
    this.readAt,
    required this.createdAt,
    this.metadata = const {},
  });

  final String id;
  final String type;
  final String title;
  final String body;
  final String? link;
  final DateTime? readAt;
  final DateTime createdAt;
  final Map<String, dynamic> metadata;

  bool get isUnread => readAt == null;

  factory AppNotification.fromJson(Map<String, dynamic> json) {
    final meta = json['metadata'];
    return AppNotification(
      id: json['id'] as String,
      type: (json['type'] as String?) ?? 'info',
      title: (json['title'] as String?) ?? 'Notification',
      body: (json['body'] as String?) ?? '',
      link: json['link'] as String?,
      readAt: json['read_at'] != null ? DateTime.tryParse(json['read_at'] as String) : null,
      createdAt: DateTime.tryParse(json['created_at'] as String? ?? '') ?? DateTime.now(),
      metadata: meta is Map ? Map<String, dynamic>.from(meta) : const {},
    );
  }
}

class ListingAlert {
  const ListingAlert({
    required this.id,
    required this.listingId,
    required this.notifyPrice,
    required this.notifyAvailability,
  });

  final String id;
  final String listingId;
  final bool notifyPrice;
  final bool notifyAvailability;

  factory ListingAlert.fromJson(Map<String, dynamic> json) {
    return ListingAlert(
      id: json['id'] as String,
      listingId: json['listing_id'] as String,
      notifyPrice: json['notify_price'] != false,
      notifyAvailability: json['notify_availability'] != false,
    );
  }
}

class TeamMember {
  const TeamMember({
    required this.id,
    required this.name,
    required this.role,
    this.phone,
    this.imageUrl,
  });

  final String id;
  final String name;
  final String role;
  final String? phone;
  final String? imageUrl;

  factory TeamMember.fromJson(Map<String, dynamic> json, {required String siteBase}) {
    final rawImage = (json['image'] ?? json['image_url'])?.toString().trim() ?? '';
    return TeamMember(
      id: (json['id'] ?? json['name'] ?? '').toString(),
      name: (json['name'] as String?)?.trim().isNotEmpty == true
          ? (json['name'] as String).trim()
          : 'Team member',
      role: (json['role'] as String?)?.trim() ?? '',
      phone: (json['phone'] as String?)?.trim().isNotEmpty == true
          ? (json['phone'] as String).trim()
          : null,
      imageUrl: _resolveTeamImage(rawImage, siteBase),
    );
  }

  static String? _resolveTeamImage(String raw, String siteBase) {
    if (raw.isEmpty) return null;
    if (raw.startsWith('https://')) return raw;
    if (raw.startsWith('http://')) return null;
    final base = siteBase.endsWith('/') ? siteBase : '$siteBase/';
    final path = raw.startsWith('/') ? raw.substring(1) : raw;
    return '$base$path';
  }
}

class EnquiryItem {
  const EnquiryItem({
    required this.id,
    this.customerId,
    required this.providerId,
    required this.subject,
    required this.message,
    required this.status,
    required this.createdAt,
    this.providerBusinessName,
    this.customerName,
    this.customerEmail,
  });

  final String id;
  final String? customerId;
  final String providerId;
  final String subject;
  final String message;
  final String status;
  final DateTime createdAt;
  final String? providerBusinessName;
  final String? customerName;
  final String? customerEmail;

  bool get isNew => status == 'new';

  factory EnquiryItem.fromJson(Map<String, dynamic> json) {
    final providers = json['providers'];
    final profiles = json['profiles'];
    String? businessName;
    String? customerName;
    String? customerEmail;
    if (providers is Map) {
      businessName = providers['business_name'] as String?;
    }
    if (profiles is Map) {
      customerName = profiles['full_name'] as String?;
      customerEmail = profiles['email'] as String?;
    }
    return EnquiryItem(
      id: json['id'] as String,
      customerId: json['customer_id'] as String?,
      providerId: json['provider_id'] as String,
      subject: (json['subject'] as String?) ?? '',
      message: (json['message'] as String?) ?? '',
      status: (json['status'] as String?) ?? 'new',
      createdAt: DateTime.tryParse(json['created_at'] as String? ?? '') ?? DateTime.now(),
      providerBusinessName: businessName,
      customerName: customerName,
      customerEmail: customerEmail,
    );
  }
}

class ServiceCategory {
  const ServiceCategory({
    required this.id,
    required this.name,
    this.slug,
  });

  final String id;
  final String name;
  final String? slug;

  factory ServiceCategory.fromJson(Map<String, dynamic> json) {
    return ServiceCategory(
      id: json['id'] as String,
      name: (json['name'] as String?) ?? 'Category',
      slug: json['slug'] as String?,
    );
  }
}

class OwnedProviderService {
  const OwnedProviderService({
    required this.id,
    required this.providerId,
    required this.title,
    this.description,
    this.categoryId,
    this.categoryName,
  });

  final String id;
  final String providerId;
  final String title;
  final String? description;
  final String? categoryId;
  final String? categoryName;

  factory OwnedProviderService.fromJson(Map<String, dynamic> json) {
    final categories = json['categories'];
    String? categoryName;
    if (categories is Map) {
      categoryName = categories['name'] as String?;
    }
    return OwnedProviderService(
      id: json['id'] as String,
      providerId: json['provider_id'] as String,
      title: (json['title'] as String?) ?? 'Service',
      description: json['description'] as String?,
      categoryId: json['category_id'] as String?,
      categoryName: categoryName,
    );
  }
}

class OwnedProvider {
  const OwnedProvider({
    required this.id,
    required this.userId,
    required this.businessName,
    this.description,
    this.location,
    this.logoUrl,
    this.coverUrl,
    this.galleryUrls = const [],
    this.contactEmail,
    this.contactPhone,
    required this.status,
    this.services = const [],
  });

  final String id;
  final String userId;
  final String businessName;
  final String? description;
  final String? location;
  final String? logoUrl;
  final String? coverUrl;
  final List<String> galleryUrls;
  final String? contactEmail;
  final String? contactPhone;
  final String status;
  final List<OwnedProviderService> services;

  OwnedProvider copyWith({
    String? businessName,
    String? description,
    String? location,
    String? logoUrl,
    String? coverUrl,
    List<String>? galleryUrls,
    String? contactEmail,
    String? contactPhone,
    String? status,
    List<OwnedProviderService>? services,
  }) {
    return OwnedProvider(
      id: id,
      userId: userId,
      businessName: businessName ?? this.businessName,
      description: description ?? this.description,
      location: location ?? this.location,
      logoUrl: logoUrl ?? this.logoUrl,
      coverUrl: coverUrl ?? this.coverUrl,
      galleryUrls: galleryUrls ?? this.galleryUrls,
      contactEmail: contactEmail ?? this.contactEmail,
      contactPhone: contactPhone ?? this.contactPhone,
      status: status ?? this.status,
      services: services ?? this.services,
    );
  }

  factory OwnedProvider.fromJson(Map<String, dynamic> json) {
    final servicesRaw = json['provider_services'];
    final services = servicesRaw is List
        ? servicesRaw
            .whereType<Map>()
            .map((e) => OwnedProviderService.fromJson(Map<String, dynamic>.from(e)))
            .toList()
        : const <OwnedProviderService>[];
    final gallery = json['gallery_urls'];
    return OwnedProvider(
      id: json['id'] as String,
      userId: json['user_id'] as String,
      businessName: (json['business_name'] as String?) ?? 'My Business',
      description: json['description'] as String?,
      location: json['location'] as String?,
      logoUrl: json['logo_url'] as String?,
      coverUrl: json['cover_url'] as String?,
      galleryUrls: gallery is List ? gallery.map((e) => e.toString()).toList() : const [],
      contactEmail: json['contact_email'] as String?,
      contactPhone: json['contact_phone'] as String?,
      status: (json['status'] as String?) ?? 'pending',
      services: services,
    );
  }
}
