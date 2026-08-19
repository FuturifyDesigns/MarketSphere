import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';

import '../../config.dart';
import '../../models/models.dart';
import '../../services/data_repository.dart';
import '../../utils/helpers.dart';
import '../../utils/page_transitions.dart';
import '../../widgets/auth_widgets.dart';
import '../../widgets/brand_app_bar.dart';
import '../../widgets/common.dart';
import '../browse/provider_detail_screen.dart';

/// Customer “My enquiries” — same data as the website customer dashboard.
class MyEnquiriesScreen extends StatefulWidget {
  const MyEnquiriesScreen({super.key});

  @override
  State<MyEnquiriesScreen> createState() => _MyEnquiriesScreenState();
}

class _MyEnquiriesScreenState extends State<MyEnquiriesScreen> {
  Future<List<EnquiryItem>>? _future;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _future ??= context.read<DataRepository>().fetchCustomerEnquiries();
  }

  Future<void> _refresh() async {
    setState(() {
      _future = context.read<DataRepository>().fetchCustomerEnquiries();
    });
    await _future;
  }

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final dateFmt = DateFormat.yMMMd().add_jm();

    return Scaffold(
      appBar: BrandAppBar(
        title: 'My enquiries',
        subtitle: 'Messages you sent to providers',
        leading: IconButton(
          onPressed: () => Navigator.of(context).maybePop(),
          icon: const Icon(Icons.arrow_back_rounded),
        ),
        actions: [
          IconButton(onPressed: _refresh, icon: const Icon(Icons.refresh_rounded)),
        ],
      ),
      body: FutureBuilder<List<EnquiryItem>>(
        future: _future,
        builder: (context, snapshot) {
          if (snapshot.connectionState != ConnectionState.done) {
            return const Center(child: CircularProgressIndicator(color: Color(AppConfig.colorGold)));
          }
          if (snapshot.hasError) {
            return LiveEmptyState(
              title: 'Couldn’t load enquiries',
              body: 'Check your connection and try again.',
              actionLabel: 'Retry',
              onAction: _refresh,
              icon: Icons.wifi_off_rounded,
            );
          }
          final items = snapshot.data ?? [];
          if (items.isEmpty) {
            return LiveEmptyState(
              title: 'No enquiries yet',
              body: 'Browse providers and send an in-app enquiry — it will show here with status updates.',
              actionLabel: 'Go back',
              onAction: () => Navigator.of(context).maybePop(),
              icon: Icons.mail_outline_rounded,
            );
          }
          return RefreshIndicator(
            color: const Color(AppConfig.colorGold),
            onRefresh: _refresh,
            child: ListView.separated(
              padding: const EdgeInsets.fromLTRB(20, 8, 20, 28),
              itemCount: items.length,
              separatorBuilder: (_, _) => const SizedBox(height: 12),
              itemBuilder: (context, index) {
                final item = items[index];
                return Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: scheme.surface,
                    borderRadius: BorderRadius.circular(18),
                    border: Border.all(color: scheme.outlineVariant.withValues(alpha: 0.65)),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: Text(
                              item.subject,
                              style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16),
                            ),
                          ),
                          StatusChip(
                            label: enquiryStatusLabel(item.status),
                            tone: item.isNew ? ChipTone.gold : ChipTone.muted,
                          ),
                        ],
                      ),
                      const SizedBox(height: 6),
                      Text(
                        item.providerBusinessName ?? 'Provider',
                        style: const TextStyle(
                          color: Color(AppConfig.colorGold),
                          fontWeight: FontWeight.w700,
                          fontSize: 13,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(item.message, style: TextStyle(color: scheme.onSurfaceVariant, height: 1.4)),
                      const SizedBox(height: 10),
                      Row(
                        children: [
                          Text(
                            dateFmt.format(item.createdAt.toLocal()),
                            style: TextStyle(color: scheme.onSurfaceVariant, fontSize: 12),
                          ),
                          const Spacer(),
                          TextButton(
                            onPressed: () => pushFade(
                              context,
                              ProviderDetailScreen(providerId: item.providerId),
                            ),
                            child: const Text('View provider'),
                          ),
                        ],
                      ),
                    ],
                  ),
                );
              },
            ),
          );
        },
      ),
    );
  }
}
