import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../config.dart';
import '../../services/deep_link_service.dart';
import '../../state/engagement_controller.dart';
import '../../widgets/brand_app_bar.dart';

class NotificationsScreen extends StatelessWidget {
  const NotificationsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final engagement = context.watch<EngagementController>();
    final scheme = Theme.of(context).colorScheme;
    final notes = engagement.notifications;

    return Scaffold(
      appBar: BrandAppBar(
        title: 'Alerts',
        subtitle: engagement.unreadCount > 0 ? '${engagement.unreadCount} unread' : 'All caught up',
        actions: [
          if (engagement.unreadCount > 0)
            TextButton(
              onPressed: () => engagement.markAllRead(),
              child: const Text('Mark all read'),
            ),
        ],
      ),
      body: notes.isEmpty
          ? Center(
              child: Padding(
                padding: const EdgeInsets.all(28),
                child: Text(
                  'Alerts for new listings, price changes, availability, enquiries, and nearby providers will appear here.',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: scheme.onSurfaceVariant, height: 1.45),
                ),
              ),
            )
          : ListView.separated(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 28),
              itemCount: notes.length,
              separatorBuilder: (_, index) => const SizedBox(height: 10),
              itemBuilder: (context, index) {
                final note = notes[index];
                return Material(
                  color: note.isUnread
                      ? const Color(AppConfig.colorGold).withValues(alpha: 0.1)
                      : scheme.surface,
                  borderRadius: BorderRadius.circular(16),
                  child: InkWell(
                    borderRadius: BorderRadius.circular(16),
                    onTap: () async {
                      await engagement.markRead(note.id);
                      if (!context.mounted) return;
                      await openNotificationLink(context, note.link);
                    },
                    child: Padding(
                      padding: const EdgeInsets.all(14),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Expanded(
                                child: Text(
                                  note.title,
                                  style: TextStyle(
                                    fontWeight: FontWeight.w800,
                                    color: note.isUnread
                                        ? const Color(AppConfig.colorGoldLight)
                                        : scheme.onSurface,
                                  ),
                                ),
                              ),
                              if (note.isUnread)
                                Container(
                                  width: 8,
                                  height: 8,
                                  decoration: const BoxDecoration(
                                    color: Color(AppConfig.colorGold),
                                    shape: BoxShape.circle,
                                  ),
                                ),
                            ],
                          ),
                          const SizedBox(height: 6),
                          Text(note.body, style: TextStyle(color: scheme.onSurfaceVariant, height: 1.4)),
                          const SizedBox(height: 8),
                          Text(
                            note.type.replaceAll('_', ' '),
                            style: const TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w700,
                              color: Color(AppConfig.colorMuted),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                );
              },
            ),
    );
  }
}
