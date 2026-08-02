import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../config.dart';
import '../../state/engagement_controller.dart';
import '../../widgets/auth_gate.dart';
import '../../widgets/brand_app_bar.dart';
import '../../widgets/common.dart';
import '../../widgets/showcase_text_cover.dart';
import '../../widgets/trust_widgets.dart';
import '../browse/provider_detail_screen.dart';
import '../showcase/listing_detail_screen.dart';

class SavedScreen extends StatelessWidget {
  const SavedScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final engagement = context.watch<EngagementController>();
    final scheme = Theme.of(context).colorScheme;

    return Scaffold(
      appBar: const BrandAppBar(title: 'Saved', subtitle: 'Favourites & offline cache'),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(20, 8, 20, 32),
        children: [
          Text(
            'Saved items stay on this device so you can reopen them when signal is weak.',
            style: TextStyle(color: scheme.onSurfaceVariant, height: 1.4),
          ),
          const SizedBox(height: 18),
          const SectionHeader(title: 'Favourite listings'),
          if (engagement.savedListings.isEmpty)
            Text('No saved listings yet.', style: TextStyle(color: scheme.onSurfaceVariant))
          else
            ...engagement.savedListings.map(
              (listing) => Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: PressableScale(
                  onTap: () => openIfSignedIn(
                    context,
                    ListingDetailScreen(listingId: listing.id, initial: listing),
                  ),
                  child: _SavedTile(
                    title: listing.title,
                    subtitle: listing.location ?? listing.priceLabel,
                    imageUrl: listing.coverUrl,
                  ),
                ),
              ),
            ),
          const SizedBox(height: 10),
          const SectionHeader(title: 'Favourite providers'),
          if (engagement.savedProviders.isEmpty)
            Text('No saved providers yet.', style: TextStyle(color: scheme.onSurfaceVariant))
          else
            ...engagement.savedProviders.map(
              (provider) => Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: PressableScale(
                  onTap: () => openIfSignedIn(
                    context,
                    ProviderDetailScreen(providerId: provider.id),
                  ),
                  child: _SavedTile(
                    title: provider.businessName,
                    subtitle: provider.location,
                    imageUrl: provider.imageUrl,
                    trailing: provider.isMsApproved
                        ? const MsApprovedStamp(compact: true)
                        : const VerifiedBadge(compact: true),
                  ),
                ),
              ),
            ),
          const SizedBox(height: 10),
          const SectionHeader(title: 'Recently viewed'),
          if (engagement.recentListings.isEmpty && engagement.recentProviders.isEmpty)
            Text('Nothing viewed yet.', style: TextStyle(color: scheme.onSurfaceVariant))
          else ...[
            ...engagement.recentListings.take(8).map(
                  (listing) => ListTile(
                    contentPadding: EdgeInsets.zero,
                    leading: const Icon(Icons.history_rounded, color: Color(AppConfig.colorGold)),
                    title: Text(listing.title),
                    subtitle: Text(listing.location ?? 'Listing'),
                    onTap: () => openIfSignedIn(
                      context,
                      ListingDetailScreen(listingId: listing.id, initial: listing),
                    ),
                  ),
                ),
            ...engagement.recentProviders.take(8).map(
                  (provider) => ListTile(
                    contentPadding: EdgeInsets.zero,
                    leading: const Icon(Icons.storefront_outlined, color: Color(AppConfig.colorGold)),
                    title: Text(provider.businessName),
                    subtitle: Text(provider.location ?? 'Provider'),
                    onTap: () => openIfSignedIn(
                      context,
                      ProviderDetailScreen(providerId: provider.id),
                    ),
                  ),
                ),
          ],
        ],
      ),
    );
  }
}

class _SavedTile extends StatelessWidget {
  const _SavedTile({
    required this.title,
    this.subtitle,
    this.imageUrl,
    this.trailing,
  });

  final String title;
  final String? subtitle;
  final String? imageUrl;
  final Widget? trailing;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Container(
      decoration: BoxDecoration(
        color: scheme.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: scheme.outlineVariant.withValues(alpha: 0.7)),
      ),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Row(
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(12),
              child: SizedBox(
                width: 64,
                height: 64,
                child: imageUrl == null || imageUrl!.isEmpty
                    ? ShowcaseTextCover(title: title, height: 64)
                    : AppNetworkImage(url: imageUrl),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: const TextStyle(fontWeight: FontWeight.w700)),
                  if (subtitle != null) ...[
                    const SizedBox(height: 4),
                    Text(subtitle!, style: TextStyle(color: scheme.onSurfaceVariant, fontSize: 13)),
                  ],
                  if (trailing != null) ...[
                    const SizedBox(height: 6),
                    trailing!,
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
