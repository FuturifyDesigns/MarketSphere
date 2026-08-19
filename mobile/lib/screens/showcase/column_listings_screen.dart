import 'dart:async';

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../config.dart';
import '../../models/models.dart';
import '../../services/data_repository.dart';
import '../../state/engagement_controller.dart';
import '../../utils/helpers.dart';
import '../../utils/page_transitions.dart';
import '../../utils/showcase_ambience.dart';
import '../../widgets/auth_widgets.dart';
import '../../widgets/brand_app_bar.dart';
import '../../widgets/common.dart';
import '../../widgets/listing_slideshow.dart';
import '../../widgets/showcase_announcement_card.dart';
import 'listing_detail_screen.dart';

class _ColumnContent {
  const _ColumnContent(this.listings, this.announcements);

  final List<ShowcaseListing> listings;
  final List<ShowcaseAnnouncement> announcements;
}

/// Listings inside one showcase field/column (website `/showcase/{slug}`).
class ColumnListingsScreen extends StatefulWidget {
  const ColumnListingsScreen({super.key, required this.column});

  final ShowcaseColumn column;

  @override
  State<ColumnListingsScreen> createState() => _ColumnListingsScreenState();
}

class _ColumnListingsScreenState extends State<ColumnListingsScreen> {
  final _search = TextEditingController();
  final _ambience = ShowcaseAmbienceController();
  Future<_ColumnContent>? _future;
  String? _dealFilter;

  Future<_ColumnContent> _load() async {
    final repo = context.read<DataRepository>();
    final results = await Future.wait([
      repo.fetchShowcaseListings(columnId: widget.column.id, limit: 300),
      repo.fetchAnnouncements(columnId: widget.column.id, limit: 20),
    ]);
    return _ColumnContent(
      results[0] as List<ShowcaseListing>,
      results[1] as List<ShowcaseAnnouncement>,
    );
  }

  @override
  void initState() {
    super.initState();
    unawaited(_ambience.startIfMusicColumn(widget.column.slug));
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _future ??= _load();
  }

  @override
  void dispose() {
    unawaited(_ambience.dispose());
    _search.dispose();
    super.dispose();
  }

  Future<void> _refresh() async {
    setState(() {
      _future = _load();
    });
    await _future;
  }

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final preferredArea = context.watch<EngagementController>().preferredArea;

    return Scaffold(
      body: SafeArea(
        child: Column(
          children: [
            BrandAppBar(
              title: widget.column.title,
              subtitle: widget.column.tagline?.trim().isNotEmpty == true
                  ? widget.column.tagline
                  : 'Showcase field',
              leading: IconButton(
                onPressed: () => Navigator.of(context).maybePop(),
                icon: const Icon(Icons.arrow_back_rounded),
              ),
              actions: [
                IconButton(onPressed: _refresh, icon: const Icon(Icons.refresh_rounded)),
              ],
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 0, 20, 10),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(16),
                child: SizedBox(
                  height: 110,
                  width: double.infinity,
                  child: Stack(
                    fit: StackFit.expand,
                    children: [
                      AppNetworkImage(url: showcaseColumnCoverUrl(widget.column.slug)),
                      DecoratedBox(
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            begin: Alignment.centerLeft,
                            end: Alignment.centerRight,
                            colors: [
                              Colors.black.withValues(alpha: 0.55),
                              Colors.black.withValues(alpha: 0.15),
                            ],
                          ),
                        ),
                      ),
                      Padding(
                        padding: const EdgeInsets.all(14),
                        child: Align(
                          alignment: Alignment.bottomLeft,
                          child: Text(
                            '${widget.column.listingCount} live listing${widget.column.listingCount == 1 ? '' : 's'}',
                            style: const TextStyle(
                              color: Color(AppConfig.colorBronze),
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 0, 20, 10),
              child: TextField(
                controller: _search,
                onChanged: (_) => setState(() {}),
                decoration: const InputDecoration(
                  hintText: 'Search in this field…',
                  prefixIcon: Icon(Icons.search_rounded),
                ),
              ),
            ),
            SizedBox(
              height: 42,
              child: ListView(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 20),
                children: [
                  _FilterChip(
                    label: 'All',
                    selected: _dealFilter == null,
                    onTap: () => setState(() => _dealFilter = null),
                  ),
                  ...dealTypeLabels.entries.map(
                    (e) => Padding(
                      padding: const EdgeInsets.only(left: 8),
                      child: _FilterChip(
                        label: e.value,
                        selected: _dealFilter == e.key,
                        onTap: () => setState(() => _dealFilter = e.key),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 10),
            Expanded(
              child: FutureBuilder<_ColumnContent>(
                future: _future,
                builder: (context, snapshot) {
                  if (snapshot.connectionState != ConnectionState.done) {
                    return const Center(
                      child: CircularProgressIndicator(color: Color(AppConfig.colorGold)),
                    );
                  }
                  if (snapshot.hasError) {
                    return LiveEmptyState(
                      title: 'Couldn’t load listings',
                      body: describeLoadError(snapshot.error),
                      actionLabel: 'Retry',
                      onAction: _refresh,
                      icon: Icons.wifi_off_rounded,
                    );
                  }

                  final q = _search.text.trim().toLowerCase();
                  final announcements = snapshot.data!.announcements;
                  var items = snapshot.data!.listings;
                  if (_dealFilter != null) {
                    items = items.where((l) => l.dealType == _dealFilter).toList();
                  }
                  if (q.isNotEmpty) {
                    items = items
                        .where(
                          (l) =>
                              l.title.toLowerCase().contains(q) ||
                              (l.location?.toLowerCase().contains(q) ?? false) ||
                              (l.summary?.toLowerCase().contains(q) ?? false),
                        )
                        .toList();
                  }
                  items = prioritizeByPreferredArea(
                    items,
                    preferredArea,
                    (l) => l.location,
                  );

                  if (items.isEmpty && announcements.isEmpty) {
                    return LiveEmptyState(
                      title: 'No listings in this field',
                      body: 'Try another filter, or check back when new listings go live.',
                      icon: Icons.filter_alt_outlined,
                      actionLabel: 'Clear filters',
                      onAction: () => setState(() {
                        _dealFilter = null;
                        _search.clear();
                      }),
                    );
                  }

                  return RefreshIndicator(
                    color: const Color(AppConfig.colorGold),
                    onRefresh: _refresh,
                    child: ListView.separated(
                      padding: const EdgeInsets.fromLTRB(20, 6, 20, 28),
                      itemCount: items.length + (announcements.isEmpty ? 0 : 1),
                      separatorBuilder: (_, _) => const SizedBox(height: 16),
                      itemBuilder: (context, index) {
                        if (announcements.isNotEmpty && index == 0) {
                          return Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Announcements & opportunities in ${widget.column.title}',
                                style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800),
                              ),
                              const SizedBox(height: 12),
                              ...announcements.map(
                                (item) => Padding(
                                  padding: const EdgeInsets.only(bottom: 12),
                                  child: ShowcaseAnnouncementCard(announcement: item),
                                ),
                              ),
                            ],
                          );
                        }
                        final listingIndex = index - (announcements.isEmpty ? 0 : 1);
                        final listing = items[listingIndex];
                        return ShowcaseListingCard(
                          listing: listing,
                          onTap: () => pushFade(
                            context,
                            ListingDetailScreen(listingId: listing.id, initial: listing),
                          ),
                        );
                      },
                    ),
                  );
                },
              ),
            ),
          ],
        ),
      ),
      backgroundColor: scheme.surface,
    );
  }
}

class _FilterChip extends StatelessWidget {
  const _FilterChip({required this.label, required this.selected, required this.onTap});

  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return ChoiceChip(
      label: Text(label),
      selected: selected,
      onSelected: (_) => onTap(),
      selectedColor: const Color(AppConfig.colorGold),
      backgroundColor: const Color(0xFF242A33),
      checkmarkColor: const Color(AppConfig.colorNight),
      side: BorderSide.none,
      surfaceTintColor: Colors.transparent,
      shadowColor: Colors.transparent,
      pressElevation: 0,
      elevation: 0,
      shape: const StadiumBorder(),
      labelStyle: TextStyle(
        color: selected ? const Color(AppConfig.colorNight) : const Color(AppConfig.colorText),
        fontWeight: FontWeight.w700,
        fontSize: 12,
      ),
    );
  }
}
