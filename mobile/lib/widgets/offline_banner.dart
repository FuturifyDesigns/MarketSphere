import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../config.dart';
import '../state/engagement_controller.dart';

class OfflineBanner extends StatelessWidget {
  const OfflineBanner({super.key});

  @override
  Widget build(BuildContext context) {
    final engagement = context.watch<EngagementController>();
    if (!engagement.isOffline && engagement.pendingSyncCount == 0 && !engagement.isSyncing) {
      return const SizedBox.shrink();
    }

    final offline = engagement.isOffline;
    final text = offline
        ? (engagement.pendingSyncCount > 0
            ? 'Offline · ${engagement.pendingSyncCount} change${engagement.pendingSyncCount == 1 ? '' : 's'} will sync later'
            : 'Offline · showing saved content on this device')
        : engagement.isSyncing
            ? 'Syncing your saved changes…'
            : 'Back online · ${engagement.pendingSyncCount} change${engagement.pendingSyncCount == 1 ? '' : 's'} pending';

    return Material(
      color: offline ? const Color(0xFF2A2418) : const Color(0xFF1A2A1F),
      child: SafeArea(
        bottom: false,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
          child: Row(
            children: [
              Icon(
                offline ? Icons.cloud_off_rounded : Icons.cloud_sync_rounded,
                size: 18,
                color: offline ? const Color(AppConfig.colorGold) : const Color(0xFF8FCB9B),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  text,
                  style: TextStyle(
                    fontSize: 12.5,
                    fontWeight: FontWeight.w600,
                    color: offline ? const Color(AppConfig.colorGoldLight) : const Color(0xFFD7F0DC),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
