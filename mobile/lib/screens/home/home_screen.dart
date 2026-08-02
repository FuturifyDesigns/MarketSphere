import 'dart:async';

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';

import '../../config.dart';
import '../../models/models.dart';
import '../../services/data_repository.dart';
import '../../state/auth_controller.dart';
import '../../state/engagement_controller.dart';
import '../../utils/helpers.dart';
import '../../utils/page_transitions.dart';
import '../../widgets/auth_gate.dart';
import '../../widgets/auth_widgets.dart';
import '../../widgets/brand_app_bar.dart';
import '../../widgets/common.dart';
import '../../widgets/listing_slideshow.dart';
import '../../widgets/trust_widgets.dart';
import '../browse/provider_detail_screen.dart';
import '../dashboard/my_enquiries_screen.dart';
import '../dashboard/provider_dashboard_screen.dart';
import '../notifications/notifications_screen.dart';
import '../saved/saved_screen.dart';
import '../settings/connection_test_screen.dart';
import '../settings/settings_screen.dart';
import '../showcase/listing_detail_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  Future<({List<ShowcaseListing> listings, List<ProviderItem> providers})>? _future;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _future ??= _load();
  }

  Future<({List<ShowcaseListing> listings, List<ProviderItem> providers})> _load() async {
    final repo = context.read<DataRepository>();
    // Listings drive the feed; providers must never break it. The repository
    // already bounds every call, so these are only a last-resort backstop.
    final listings = await repo.fetchShowcaseListings(limit: 20).timeout(
          const Duration(seconds: 30),
        );
    List<ProviderItem> providers;
    try {
      providers = await repo.fetchProviders(limit: 12).timeout(
            const Duration(seconds: 30),
          );
    } catch (_) {
      providers = const [];
    }
    return (listings: listings, providers: providers);
  }

  Future<void> _refresh() async {
    setState(() => _future = _load());
    await _future;
  }

  @override
  Widget build(BuildContext context) {
    final profile = context.watch<AuthController>().profile;
    final engagement = context.watch<EngagementController>();
    final firstName = profile?.displayName.split(' ').first;
    final scheme = Theme.of(context).colorScheme;

    return RefreshIndicator(
      color: const Color(AppConfig.colorGold),
      onRefresh: _refresh,
      child: CustomScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        slivers: [
          SliverToBoxAdapter(
            child: BrandAppBar(
              title: firstName == null ? 'Market Sphere' : 'Hello, $firstName',
              subtitle: AppConfig.tagline,
              actions: [
                IconButton(
                  tooltip: 'Saved',
                  onPressed: () => pushFade(context, const SavedScreen()),
                  icon: const Icon(Icons.favorite_outline_rounded),
                ),
                IconButton(
                  tooltip: 'Alerts',
                  onPressed: () => pushFade(context, const NotificationsScreen()),
                  icon: Badge(
                    isLabelVisible: engagement.unreadCount > 0,
                    label: Text('${engagement.unreadCount}'),
                    child: const Icon(Icons.notifications_outlined),
                  ),
                ),
                IconButton(
                  tooltip: 'Settings',
                  onPressed: () => pushFade(context, const SettingsScreen()),
                  icon: const Icon(Icons.tune_rounded),
                ),
              ],
            ),
          ),
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(20, 6, 20, 8),
              child: Container(
                padding: const EdgeInsets.fromLTRB(20, 22, 20, 22),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(26),
                  gradient: const LinearGradient(
                    colors: [Color(0xFF1A1408), Color(AppConfig.colorNight), Color(0xFF2A2214)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: const Color(AppConfig.colorGold).withValues(alpha: 0.18),
                      blurRadius: 24,
                      offset: const Offset(0, 10),
                    ),
                  ],
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          if (profile != null) ...[
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                              decoration: BoxDecoration(
                                color: const Color(AppConfig.colorGold).withValues(alpha: 0.18),
                                borderRadius: BorderRadius.circular(999),
                                border: Border.all(
                                  color: const Color(AppConfig.colorGold).withValues(alpha: 0.35),
                                ),
                              ),
                              child: Text(
                                profile.isProvider
                                    ? 'Signed in as Provider'
                                    : profile.isAdmin
                                        ? 'Signed in as Admin'
                                        : 'Signed in as Customer',
                                style: const TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.w700,
                                  letterSpacing: 0.2,
                                  color: Color(AppConfig.colorGoldLight),
                                ),
                              ),
                            ),
                            const SizedBox(height: 12),
                          ],
                          Text(
                            'Discover opportunities',
                            style: GoogleFonts.barlowCondensed(
                              color: const Color(AppConfig.colorGold),
                              fontSize: 28,
                              fontWeight: FontWeight.w700,
                              height: 1.1,
                            ),
                          ),
                          const SizedBox(height: 10),
                          Text(
                            profile == null
                                ? 'Showcase listings and verified providers — updated live from the website.'
                                : profile.isProvider
                                    ? 'Manage your listing, services, and enquiry inbox from Account → Provider dashboard.'
                                    : 'Browse listings, save providers, and track enquiries from your dashboard.',
                            style: const TextStyle(color: Color(0xFFD8C9A8), height: 1.45),
                          ),
                          if (profile != null && profile.isProvider) ...[
                            const SizedBox(height: 14),
                            FilledButton.tonal(
                              onPressed: () => pushFade(context, const ProviderDashboardScreen()),
                              child: const Text('Open provider dashboard'),
                            ),
                          ],
                          if (profile != null && !profile.isProvider && !profile.isAdmin) ...[
                            const SizedBox(height: 14),
                            OutlinedButton(
                              onPressed: () => pushFade(context, const MyEnquiriesScreen()),
                              child: const Text('My enquiries'),
                            ),
                          ],
                        ],
                      ),
                    ),
                    const SizedBox(width: 12),
                    ClipOval(
                      child: Image.asset('assets/branding/logo-512.png', width: 64, height: 64),
                    ),
                  ],
                ),
              ),
            ),
          ),
          SliverToBoxAdapter(
            child: FutureBuilder(
              future: _future,
              builder: (context, snapshot) {
                if (_future == null || snapshot.connectionState != ConnectionState.done) {
                  return const Padding(
                    padding: EdgeInsets.only(top: 56),
                    child: Center(child: CircularProgressIndicator(color: Color(AppConfig.colorGold))),
                  );
                }
                if (snapshot.hasError) {
                  return Padding(
                    padding: const EdgeInsets.symmetric(vertical: 24),
                    child: LiveEmptyState(
                      title: 'Couldn’t load the feed',
                      body: describeLoadError(snapshot.error),
                      actionLabel: 'Retry',
                      onAction: _refresh,
                      secondaryLabel: 'Run connection test',
                      onSecondary: () => pushFade(context, const ConnectionTestScreen()),
                      icon: Icons.wifi_off_rounded,
                    ),
                  );
                }

                final data = snapshot.data!;
                return Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const SizedBox(height: 10),
                    if (engagement.recentListings.isNotEmpty || engagement.recentProviders.isNotEmpty) ...[
                      SectionHeader(
                        title: 'Continue offline',
                        subtitle: 'Recently viewed — available even on weak signal',
                        action: TextButton(
                          onPressed: () => pushFade(context, const SavedScreen()),
                          child: const Text('All saved'),
                        ),
                      ),
                      SizedBox(
                        height: 44,
                        child: ListView(
                          scrollDirection: Axis.horizontal,
                          padding: const EdgeInsets.fromLTRB(20, 0, 20, 8),
                          children: [
                            ...engagement.recentListings.take(6).map(
                                  (l) => Padding(
                                    padding: const EdgeInsets.only(right: 8),
                                    child: ActionChip(
                                      label: Text(l.title, overflow: TextOverflow.ellipsis),
                                      onPressed: () => openIfSignedIn(
                                        context,
                                        ListingDetailScreen(listingId: l.id, initial: l),
                                      ),
                                    ),
                                  ),
                                ),
                            ...engagement.recentProviders.take(4).map(
                                  (p) => Padding(
                                    padding: const EdgeInsets.only(right: 8),
                                    child: ActionChip(
                                      avatar: const Icon(Icons.verified_rounded, size: 16),
                                      label: Text(p.businessName, overflow: TextOverflow.ellipsis),
                                      onPressed: () => openIfSignedIn(
                                        context,
                                        ProviderDetailScreen(providerId: p.id),
                                      ),
                                    ),
                                  ),
                                ),
                          ],
                        ),
                      ),
                    ],
                    SectionHeader(
                      title: 'Featured listings',
                      subtitle: 'Photos advance automatically',
                      action: TextButton(
                        onPressed: () {},
                        child: Text('Live', style: TextStyle(color: scheme.primary, fontWeight: FontWeight.w700)),
                      ),
                    ),
                    if (data.listings.isEmpty)
                      const LiveEmptyState(
                        title: 'Showcase is warming up',
                        body: 'New listings appear here as soon as they’re published.',
                        icon: Icons.grid_view_rounded,
                      )
                    else
                      SizedBox(
                        height: 330,
                        child: ListView.separated(
                          padding: const EdgeInsets.fromLTRB(20, 4, 20, 8),
                          scrollDirection: Axis.horizontal,
                          itemCount: data.listings.length,
                          separatorBuilder: (context, index) => const SizedBox(width: 14),
                          itemBuilder: (context, index) {
                            final listing = data.listings[index];
                            return ListingSlideshowCard(
                              listing: listing,
                              onTap: () => openIfSignedIn(
                                context,
                                ListingDetailScreen(listingId: listing.id, initial: listing),
                              ),
                            );
                          },
                        ),
                      ),
                    const SizedBox(height: 8),
                    const SectionHeader(
                      title: 'Providers',
                      subtitle: 'Approved professionals',
                    ),
                    if (data.providers.isEmpty)
                      LiveEmptyState(
                        title: 'Providers are onboarding',
                        body:
                            'This space fills as providers get approved. Explore showcase listings in the meantime.',
                        icon: Icons.storefront_outlined,
                      )
                    else
                      ...data.providers.map(
                        (provider) => Padding(
                          padding: const EdgeInsets.fromLTRB(20, 0, 20, 14),
                          child: _ProviderTile(
                            provider: provider,
                            onTap: () => openIfSignedIn(
                              context,
                              ProviderDetailScreen(providerId: provider.id),
                            ),
                          ),
                        ),
                      ),
                    const SizedBox(height: 28),
                  ],
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

class _ProviderTile extends StatelessWidget {
  const _ProviderTile({required this.provider, required this.onTap});

  final ProviderItem provider;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return PressableScale(
      onTap: onTap,
      child: Container(
        decoration: BoxDecoration(
          color: scheme.surface,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: scheme.outlineVariant.withValues(alpha: 0.7)),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.18),
              blurRadius: 14,
              offset: const Offset(0, 8),
            ),
          ],
        ),
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Row(
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(14),
                child: SizedBox(
                  width: 72,
                  height: 72,
                  child: AppNetworkImage(url: provider.imageUrl),
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(provider.businessName, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 16)),
                    const SizedBox(height: 6),
                    const Wrap(
                      spacing: 6,
                      runSpacing: 6,
                      children: [
                        VerifiedBadge(compact: true),
                        MsApprovedStamp(compact: true),
                      ],
                    ),
                    if (provider.location != null) ...[
                      const SizedBox(height: 6),
                      Text(provider.location!, style: TextStyle(color: scheme.onSurfaceVariant, fontSize: 13)),
                    ],
                    if (provider.description != null) ...[
                      const SizedBox(height: 4),
                      Text(
                        provider.description!,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(fontSize: 13, color: scheme.onSurfaceVariant, height: 1.35),
                      ),
                    ],
                  ],
                ),
              ),
              Icon(Icons.chevron_right_rounded, color: scheme.onSurfaceVariant),
            ],
          ),
        ),
      ),
    );
  }
}
