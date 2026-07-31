import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../config.dart';
import '../../models/models.dart';
import '../../services/data_repository.dart';
import '../../widgets/auth_gate.dart';
import '../../widgets/auth_widgets.dart';
import '../../widgets/brand_app_bar.dart';
import '../../widgets/common.dart';
import '../../widgets/trust_widgets.dart';
import 'provider_detail_screen.dart';

class BrowseScreen extends StatefulWidget {
  const BrowseScreen({super.key});

  @override
  State<BrowseScreen> createState() => _BrowseScreenState();
}

class _BrowseScreenState extends State<BrowseScreen> {
  final _search = TextEditingController();
  Future<List<ProviderItem>>? _future;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _future ??= context.read<DataRepository>().fetchProviders();
  }

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  Future<void> _refresh() async {
    setState(() {
      _future = context.read<DataRepository>().fetchProviders(query: _search.text);
    });
    await _future;
  }

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;

    return Column(
      children: [
        const BrandAppBar(title: 'Browse', subtitle: 'Find verified providers'),
        Padding(
          padding: const EdgeInsets.fromLTRB(20, 4, 20, 12),
          child: TextField(
            controller: _search,
            textInputAction: TextInputAction.search,
            onSubmitted: (_) => _refresh(),
            decoration: InputDecoration(
              hintText: 'Search by name or location…',
              prefixIcon: const Icon(Icons.search_rounded),
              suffixIcon: IconButton(
                onPressed: _refresh,
                icon: const Icon(Icons.arrow_forward_rounded),
              ),
            ),
          ),
        ),
        Expanded(
          child: FutureBuilder<List<ProviderItem>>(
            future: _future,
            builder: (context, snapshot) {
              if (snapshot.connectionState != ConnectionState.done) {
                return const Center(child: CircularProgressIndicator(color: Color(AppConfig.colorGold)));
              }
              if (snapshot.hasError) {
                return LiveEmptyState(
                  title: 'Couldn’t load providers',
                  body: 'Check your connection and try again.',
                  actionLabel: 'Retry',
                  onAction: _refresh,
                  icon: Icons.wifi_off_rounded,
                );
              }
              final items = snapshot.data ?? [];
              if (items.isEmpty) {
                return const LiveEmptyState(
                  title: 'No providers found',
                  body: 'Try another search, or check back soon as new providers get approved.',
                  icon: Icons.storefront_outlined,
                );
              }
              return RefreshIndicator(
                color: const Color(AppConfig.colorGold),
                onRefresh: _refresh,
                child: ListView.separated(
                  padding: const EdgeInsets.fromLTRB(20, 4, 20, 28),
                  itemCount: items.length,
                  separatorBuilder: (context, index) => const SizedBox(height: 14),
                  itemBuilder: (context, index) {
                    final provider = items[index];
                    return PressableScale(
                      onTap: () => openIfSignedIn(
                        context,
                        ProviderDetailScreen(providerId: provider.id),
                      ),
                      child: Container(
                        decoration: BoxDecoration(
                          color: scheme.surface,
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(color: scheme.outlineVariant.withValues(alpha: 0.7)),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withValues(alpha: 0.18),
                              blurRadius: 16,
                              offset: const Offset(0, 8),
                            ),
                          ],
                        ),
                        child: Padding(
                          padding: const EdgeInsets.all(12),
                          child: Row(
                            children: [
                              ClipRRect(
                                borderRadius: BorderRadius.circular(14),
                                child: SizedBox(
                                  width: 84,
                                  height: 84,
                                  child: AppNetworkImage(url: provider.imageUrl),
                                ),
                              ),
                              const SizedBox(width: 14),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      provider.businessName,
                                      style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 16),
                                    ),
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
                                      Text(
                                        provider.location!,
                                        style: TextStyle(color: scheme.onSurfaceVariant),
                                      ),
                                    ],
                                    if (provider.description != null) ...[
                                      const SizedBox(height: 6),
                                      Text(
                                        provider.description!,
                                        maxLines: 2,
                                        overflow: TextOverflow.ellipsis,
                                        style: TextStyle(
                                          color: scheme.onSurfaceVariant,
                                          height: 1.35,
                                          fontSize: 13,
                                        ),
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
