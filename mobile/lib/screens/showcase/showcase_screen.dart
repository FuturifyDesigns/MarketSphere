import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../config.dart';
import '../../models/models.dart';
import '../../services/data_repository.dart';
import '../../utils/helpers.dart';
import '../../utils/page_transitions.dart';
import '../../widgets/auth_widgets.dart';
import '../../widgets/brand_app_bar.dart';
import '../../widgets/common.dart';
import 'column_listings_screen.dart';

/// Showcase hub — same field/column idea as the website.
class ShowcaseScreen extends StatefulWidget {
  const ShowcaseScreen({super.key});

  @override
  State<ShowcaseScreen> createState() => _ShowcaseScreenState();
}

class _ShowcaseScreenState extends State<ShowcaseScreen> {
  Future<List<ShowcaseColumn>>? _future;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _future ??= context.read<DataRepository>().fetchColumns();
  }

  Future<void> _refresh() async {
    setState(() {
      _future = context.read<DataRepository>().fetchColumns();
    });
    await _future;
  }

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;

    return Column(
      children: [
        BrandAppBar(
          title: 'Showcase',
          subtitle: 'Explore fields — same columns as the website',
          actions: [
            IconButton(onPressed: _refresh, icon: const Icon(Icons.refresh_rounded)),
          ],
        ),
        Expanded(
          child: FutureBuilder<List<ShowcaseColumn>>(
            future: _future,
            builder: (context, snapshot) {
              if (snapshot.connectionState != ConnectionState.done) {
                return const Center(
                  child: CircularProgressIndicator(color: Color(AppConfig.colorGold)),
                );
              }
              if (snapshot.hasError) {
                return LiveEmptyState(
                  title: 'Couldn’t load showcase fields',
                  body: describeLoadError(snapshot.error),
                  actionLabel: 'Retry',
                  onAction: _refresh,
                  icon: Icons.wifi_off_rounded,
                );
              }

              final columns = snapshot.data ?? [];
              if (columns.isEmpty) {
                return const LiveEmptyState(
                  title: 'No showcase fields yet',
                  body: 'Fields will appear here once they are published on the website.',
                  icon: Icons.grid_view_rounded,
                );
              }

              return RefreshIndicator(
                color: const Color(AppConfig.colorGold),
                onRefresh: _refresh,
                child: ListView.separated(
                  padding: const EdgeInsets.fromLTRB(20, 8, 20, 28),
                  itemCount: columns.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 14),
                  itemBuilder: (context, index) {
                    final column = columns[index];
                    final fieldLabel =
                        'Field ${(index + 1).toString().padLeft(2, '0')} of ${columns.length.toString().padLeft(2, '0')}';
                    return PressableScale(
                      onTap: () => pushFade(
                        context,
                        ColumnListingsScreen(column: column),
                      ),
                      child: Container(
                        height: 178,
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(
                            color: scheme.outlineVariant.withValues(alpha: 0.65),
                          ),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withValues(alpha: 0.22),
                              blurRadius: 18,
                              offset: const Offset(0, 10),
                            ),
                          ],
                        ),
                        clipBehavior: Clip.antiAlias,
                        child: Stack(
                          fit: StackFit.expand,
                          children: [
                            AppNetworkImage(url: showcaseColumnCoverUrl(column.slug)),
                            DecoratedBox(
                              decoration: BoxDecoration(
                                gradient: LinearGradient(
                                  begin: Alignment.topCenter,
                                  end: Alignment.bottomCenter,
                                  stops: const [0.0, 0.42, 1.0],
                                  colors: [
                                    Colors.black.withValues(alpha: 0.2),
                                    Colors.black.withValues(alpha: 0.55),
                                    Colors.black.withValues(alpha: 0.88),
                                  ],
                                ),
                              ),
                            ),
                            Padding(
                              padding: const EdgeInsets.fromLTRB(16, 14, 16, 14),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    fieldLabel,
                                    style: TextStyle(
                                      color: const Color(AppConfig.colorGoldLight)
                                          .withValues(alpha: 0.95),
                                      fontSize: 11,
                                      fontWeight: FontWeight.w700,
                                      letterSpacing: 0.8,
                                      shadows: const [
                                        Shadow(blurRadius: 6, color: Colors.black87),
                                      ],
                                    ),
                                  ),
                                  const Spacer(),
                                  Text(
                                    column.title,
                                    style: const TextStyle(
                                      color: Color(AppConfig.colorText),
                                      fontSize: 22,
                                      fontWeight: FontWeight.w800,
                                      height: 1.15,
                                      shadows: [
                                        Shadow(blurRadius: 8, color: Colors.black87),
                                      ],
                                    ),
                                  ),
                                  const SizedBox(height: 6),
                                  Text(
                                    column.tagline?.trim().isNotEmpty == true
                                        ? column.tagline!.trim()
                                        : 'Explore ${column.title}',
                                    maxLines: 2,
                                    overflow: TextOverflow.ellipsis,
                                    style: const TextStyle(
                                      color: Color(0xFFF0E6D0),
                                      fontSize: 13.5,
                                      height: 1.35,
                                      shadows: [
                                        Shadow(blurRadius: 6, color: Colors.black87),
                                      ],
                                    ),
                                  ),
                                  const SizedBox(height: 12),
                                  Row(
                                    children: [
                                      Container(
                                        padding: const EdgeInsets.symmetric(
                                          horizontal: 10,
                                          vertical: 5,
                                        ),
                                        decoration: BoxDecoration(
                                          color: Colors.black.withValues(alpha: 0.62),
                                          borderRadius: BorderRadius.circular(999),
                                          border: Border.all(
                                            color: const Color(AppConfig.colorGold)
                                                .withValues(alpha: 0.7),
                                          ),
                                        ),
                                        child: Text(
                                          '${column.listingCount} live listing${column.listingCount == 1 ? '' : 's'}',
                                          style: const TextStyle(
                                            color: Color(AppConfig.colorGoldLight),
                                            fontWeight: FontWeight.w800,
                                            fontSize: 13,
                                            letterSpacing: 0.2,
                                          ),
                                        ),
                                      ),
                                      const Spacer(),
                                      const Icon(
                                        Icons.arrow_forward_rounded,
                                        color: Color(AppConfig.colorGold),
                                        size: 20,
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
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
