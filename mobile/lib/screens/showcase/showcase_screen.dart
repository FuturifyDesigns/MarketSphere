import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../config.dart';
import '../../models/models.dart';
import '../../services/data_repository.dart';
import '../../utils/helpers.dart';
import '../../widgets/auth_gate.dart';
import '../../widgets/auth_widgets.dart';
import '../../widgets/brand_app_bar.dart';
import '../../widgets/listing_slideshow.dart';
import 'listing_detail_screen.dart';

class ShowcaseScreen extends StatefulWidget {
  const ShowcaseScreen({super.key});

  @override
  State<ShowcaseScreen> createState() => _ShowcaseScreenState();
}

class _ShowcaseScreenState extends State<ShowcaseScreen> {
  final _search = TextEditingController();
  Future<List<ShowcaseListing>>? _future;
  String? _dealFilter;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _future ??= context.read<DataRepository>().fetchShowcaseListings();
  }

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  Future<void> _refresh() async {
    setState(() {
      _future = context.read<DataRepository>().fetchShowcaseListings();
    });
    await _future;
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        BrandAppBar(
          title: 'Showcase',
          subtitle: 'Live listings from the website',
          actions: [
            IconButton(onPressed: _refresh, icon: const Icon(Icons.refresh_rounded)),
          ],
        ),
        Padding(
          padding: const EdgeInsets.fromLTRB(20, 4, 20, 10),
          child: TextField(
            controller: _search,
            onChanged: (_) => setState(() {}),
            decoration: const InputDecoration(
              hintText: 'Search listings…',
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
                return const Center(child: CircularProgressIndicator(color: Color(AppConfig.colorGold)));
              }
              if (snapshot.hasError) {
                return LiveEmptyState(
                  title: 'Couldn’t load showcase',
                  body: 'Pull to retry when you’re back online.',
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

              if (items.isEmpty) {
                return const LiveEmptyState(
                  title: 'No matches yet',
                  body: 'Try another filter or search term.',
                  icon: Icons.filter_alt_outlined,
                );
              }

              return RefreshIndicator(
                color: const Color(AppConfig.colorGold),
                onRefresh: _refresh,
                child: ListView.separated(
                  padding: const EdgeInsets.fromLTRB(20, 6, 20, 28),
                  itemCount: items.length,
                  separatorBuilder: (context, index) => const SizedBox(height: 16),
                  itemBuilder: (context, index) {
                    final listing = items[index];
                    return ShowcaseListingCard(
                      listing: listing,
                      onTap: () => openIfSignedIn(
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
      side: BorderSide(
        color: selected
            ? const Color(AppConfig.colorGold)
            : const Color(AppConfig.colorMuted).withValues(alpha: 0.45),
      ),
      labelStyle: TextStyle(
        color: selected ? const Color(AppConfig.colorNight) : const Color(AppConfig.colorText),
        fontWeight: FontWeight.w700,
        fontSize: 12,
      ),
    );
  }
}
