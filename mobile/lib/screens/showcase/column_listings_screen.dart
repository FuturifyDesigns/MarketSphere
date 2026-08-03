import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../config.dart';
import '../../models/models.dart';
import '../../services/data_repository.dart';
import '../../state/engagement_controller.dart';
import '../../utils/helpers.dart';
import '../../utils/page_transitions.dart';
import '../../widgets/auth_widgets.dart';
import '../../widgets/brand_app_bar.dart';
import '../../widgets/common.dart';
import '../../widgets/listing_slideshow.dart';
import 'listing_detail_screen.dart';

/// Listings inside one showcase field/column (website `/showcase/{slug}`).
class ColumnListingsScreen extends StatefulWidget {
  const ColumnListingsScreen({super.key, required this.column});

  final ShowcaseColumn column;

  @override
  State<ColumnListingsScreen> createState() => _ColumnListingsScreenState();
}

class _ColumnListingsScreenState extends State<ColumnListingsScreen> {
  final _search = TextEditingController();
  Future<List<ShowcaseListing>>? _future;
  String? _dealFilter;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _future ??= context.read<DataRepository>().fetchShowcaseListings(
          columnId: widget.column.id,
          limit: 300,
        );
  }

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  Future<void> _refresh() async {
    setState(() {
      _future = context.read<DataRepository>().fetchShowcaseListings(
            columnId: widget.column.id,
            limit: 300,
          );
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
              child: FutureBuilder<List<ShowcaseListing>>(
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
                  var items = snapshot.data ?? [];
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

                  if (items.isEmpty) {
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
                      itemCount: items.length,
                      separatorBuilder: (_, __) => const SizedBox(height: 16),
                      itemBuilder: (context, index) {
                        final listing = items[index];
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
