import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../config.dart';
import '../../models/models.dart';
import '../../services/data_repository.dart';
import '../../state/auth_controller.dart';
import '../../state/engagement_controller.dart';
import '../../utils/app_feedback.dart';
import '../../utils/helpers.dart';
import '../../utils/share_contact.dart';
import '../../widgets/auth_gate.dart';
import '../../widgets/common.dart';
import '../../widgets/listing_slideshow.dart';
import '../../widgets/trust_widgets.dart';

class ListingDetailScreen extends StatefulWidget {
  const ListingDetailScreen({super.key, required this.listingId, this.initial});

  final String listingId;
  final ShowcaseListing? initial;

  @override
  State<ListingDetailScreen> createState() => _ListingDetailScreenState();
}

class _ListingDetailScreenState extends State<ListingDetailScreen> {
  Future<ShowcaseListing?>? _future;
  var _loaded = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_loaded) return;
    _loaded = true;
    _future = _load();
  }

  Future<ShowcaseListing?> _load() async {
    final repo = context.read<DataRepository>();
    final engagement = context.read<EngagementController>();
    // Never trust slim/offline `initial` alone when online — refresh full row
    // (owner contacts, description) and only fall back to cache if network fails.
    ShowcaseListing? listing;
    try {
      listing = await repo.fetchListing(widget.listingId);
    } catch (_) {
      listing = null;
    }
    listing ??= widget.initial;
    if (listing != null) {
      await engagement.recordListingView(listing);
    }
    return listing;
  }

  Future<void> _requireAuthAction(
    Future<String?> Function(String userId) action, {
    String? successMessage,
  }) async {
    final auth = context.read<AuthController>();
    if (!auth.isAuthenticated) {
      await showSignUpGate(context);
      return;
    }
    final err = await action(auth.profile!.id);
    if (!mounted) return;
    if (err != null) {
      showErrorPopup(context, err);
    } else if (successMessage != null) {
      showSuccessPopup(context, successMessage);
    }
  }

  @override
  Widget build(BuildContext context) {
    final engagement = context.watch<EngagementController>();
    final scheme = Theme.of(context).colorScheme;

    return Scaffold(
      body: FutureBuilder<ShowcaseListing?>(
        future: _future,
        builder: (context, snapshot) {
          if (snapshot.connectionState != ConnectionState.done) {
            return const Center(child: CircularProgressIndicator(color: Color(AppConfig.colorGold)));
          }
          final listing = snapshot.data;
          if (listing == null) {
            return Scaffold(
              appBar: AppBar(),
              body: const Center(child: Text('Listing not found')),
            );
          }

          final saved = engagement.isListingSaved(listing.id);
          final alertOn = engagement.isListingAlertOn(listing.id);
          final body = listingEnquiryMessage(
            title: listing.title,
            columnTitle: listing.columnTitle,
            location: listing.location,
            price: listing.priceLabel,
            dealType: listing.dealType,
            summary: listing.summary,
            description: listing.description,
            listingUrl: listingWebUrl(listing),
          );

          return CustomScrollView(
            slivers: [
              SliverAppBar(
                pinned: true,
                expandedHeight: 320,
                backgroundColor: Theme.of(context).scaffoldBackgroundColor,
                actions: [
                  IconButton(
                    tooltip: saved ? 'Remove favourite' : 'Save',
                    onPressed: () => _requireAuthAction(
                      (userId) => engagement.toggleListingFavourite(userId, listing),
                      successMessage: saved ? 'Removed from favourites' : 'Saved to favourites',
                    ),
                    icon: Icon(saved ? Icons.favorite_rounded : Icons.favorite_border_rounded),
                  ),
                  IconButton(
                    tooltip: alertOn ? 'Stop alerts' : 'Notify me',
                    onPressed: () => _requireAuthAction(
                      (userId) => engagement.toggleListingAlert(userId, listing),
                      successMessage: alertOn ? 'Alerts turned off' : 'You’ll be notified of updates',
                    ),
                    icon: Icon(alertOn ? Icons.notifications_active_rounded : Icons.notifications_none_rounded),
                  ),
                  IconButton(
                    tooltip: 'Share',
                    onPressed: () async {
                      await shareListing(listing);
                      if (!context.mounted) return;
                      showInfoPopup(context, 'Share sheet opened');
                    },
                    icon: const Icon(Icons.ios_share_rounded),
                  ),
                ],
                flexibleSpace: FlexibleSpaceBar(
                  background: PhotoSlideshow(
                    urls: listing.imageUrls,
                    title: listing.title,
                    height: 320,
                    borderRadius: BorderRadius.zero,
                    dwell: const Duration(milliseconds: 2600),
                  ),
                ),
              ),
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(20, 16, 20, 28),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      if (listing.columnTitle != null)
                        Text(
                          listing.columnTitle!,
                          style: const TextStyle(
                            color: Color(AppConfig.colorGold),
                            fontWeight: FontWeight.w700,
                            letterSpacing: 0.4,
                          ),
                        ),
                      const SizedBox(height: 6),
                      Text(
                        listing.title,
                        style: const TextStyle(fontSize: 26, fontWeight: FontWeight.w700, height: 1.2),
                      ),
                      const SizedBox(height: 10),
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: [
                          StatusChip(label: dealTypeLabel(listing.dealType)),
                          StatusChip(
                            label: availabilityLabel(listing.dealType, listing.available),
                            tone: listing.available ? ChipTone.muted : ChipTone.danger,
                          ),
                          if (listing.featured) const StatusChip(label: 'Featured'),
                          const MsApprovedStamp(compact: true),
                        ],
                      ),
                      if (listing.location != null) ...[
                        const SizedBox(height: 14),
                        Row(
                          children: [
                            const Icon(Icons.place_outlined, size: 18, color: Color(AppConfig.colorMuted)),
                            const SizedBox(width: 6),
                            Expanded(child: Text(listing.location!)),
                          ],
                        ),
                      ],
                      if (listing.priceLabel != null) ...[
                        const SizedBox(height: 10),
                        Text(
                          listing.priceLabel!,
                          style: const TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.w700,
                            color: Color(AppConfig.colorBronze),
                            height: 1.35,
                          ),
                        ),
                      ],
                      if (alertOn) ...[
                        const SizedBox(height: 12),
                        Text(
                          'Notify me is on — you’ll get alerts for price and availability changes.',
                          style: TextStyle(color: scheme.onSurfaceVariant, height: 1.4),
                        ),
                      ],
                      if (listing.summary != null) ...[
                        const SizedBox(height: 16),
                        Text(listing.summary!, style: const TextStyle(fontSize: 16, height: 1.45)),
                      ],
                      if (listing.description != null) ...[
                        const SizedBox(height: 14),
                        Text(
                          listing.description!,
                          style: const TextStyle(
                            color: Color(AppConfig.colorTextSecondary),
                            height: 1.5,
                          ),
                        ),
                      ],
                      const SizedBox(height: 22),
                      Text(
                        'Contact',
                        style: TextStyle(
                          fontWeight: FontWeight.w800,
                          fontSize: 16,
                          color: scheme.onSurface,
                        ),
                      ),
                      const SizedBox(height: 10),
                      FilledButton.icon(
                        onPressed: () => launchMailto(
                          email: AppConfig.supportEmail,
                          subject: 'Showcase enquiry: ${listing.title}',
                          body: body,
                        ),
                        icon: const Icon(Icons.mail_outline),
                        label: const Text('Email Market Sphere'),
                      ),
                      const SizedBox(height: 10),
                      OutlinedButton.icon(
                        onPressed: () => launchWhatsApp(
                          phone: AppConfig.supportPhone,
                          message: body,
                        ),
                        icon: const Icon(Icons.chat_outlined),
                        label: const Text('WhatsApp Market Sphere'),
                      ),
                      if (listing.ownerPhone != null || listing.ownerEmail != null) ...[
                        const SizedBox(height: 18),
                        Text(
                          listing.ownerName == null
                              ? 'Owner contacts'
                              : 'Owner · ${listing.ownerName}',
                          style: TextStyle(
                            fontWeight: FontWeight.w700,
                            color: scheme.onSurfaceVariant,
                          ),
                        ),
                        const SizedBox(height: 10),
                        if (listing.ownerPhone != null) ...[
                          OutlinedButton.icon(
                            onPressed: () => launchTel(listing.ownerPhone!),
                            icon: const Icon(Icons.phone_outlined),
                            label: Text('Call ${listing.ownerPhone}'),
                          ),
                          const SizedBox(height: 10),
                          OutlinedButton.icon(
                            onPressed: () => launchWhatsApp(
                              phone: listing.ownerPhone!,
                              message: 'Hi, I saw your listing "${listing.title}" on Market Sphere Group.\n${listingWebUrl(listing)}',
                            ),
                            icon: const Icon(Icons.chat_outlined),
                            label: const Text('WhatsApp owner'),
                          ),
                        ],
                        if (listing.ownerEmail != null) ...[
                          const SizedBox(height: 10),
                          OutlinedButton.icon(
                            onPressed: () => launchMailto(
                              email: listing.ownerEmail!,
                              subject: 'Enquiry: ${listing.title}',
                              body: body,
                            ),
                            icon: const Icon(Icons.mail_outline),
                            label: const Text('Email owner'),
                          ),
                        ],
                      ],
                      const SizedBox(height: 12),
                      OutlinedButton.icon(
                        onPressed: () => shareListing(listing),
                        icon: const Icon(Icons.share_rounded),
                        label: const Text('Share listing'),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}
