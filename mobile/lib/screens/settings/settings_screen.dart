import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../services/alert_notification_service.dart';
import '../../services/push_service.dart';
import '../../state/app_settings_controller.dart';
import '../../state/auth_controller.dart';
import '../../state/engagement_controller.dart';
import '../../utils/app_feedback.dart';
import '../../widgets/brand_app_bar.dart';
import '../../widgets/role_onboarding.dart';
import 'connection_test_screen.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  late final TextEditingController _area;

  @override
  void initState() {
    super.initState();
    _area = TextEditingController(
      text: context.read<EngagementController>().preferredArea ?? '',
    );
  }

  @override
  void dispose() {
    _area.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final settings = context.watch<AppSettingsController>();
    final engagement = context.watch<EngagementController>();
    final auth = context.watch<AuthController>();
    final scheme = Theme.of(context).colorScheme;

    return Scaffold(
      appBar: const BrandAppBar(title: 'Settings', subtitle: 'Preferences'),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(20, 8, 20, 32),
        children: [
          Container(
            decoration: BoxDecoration(
              color: scheme.surface,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: scheme.outlineVariant.withValues(alpha: 0.6)),
            ),
            child: Column(
              children: [
                SwitchListTile(
                  contentPadding: const EdgeInsets.fromLTRB(16, 8, 12, 8),
                  secondary: const Icon(Icons.notifications_active_outlined),
                  title: const Text('Push notifications', style: TextStyle(fontWeight: FontWeight.w700)),
                  subtitle: const Text(
                    'New listings, provider enquiries, alerts, and miss-you reminders',
                  ),
                  value: settings.pushEnabled,
                  onChanged: (v) async {
                    await settings.setPushEnabled(v);
                    AlertNotificationService.instance.setEnabled(v);
                    if (v) {
                      await PushService.instance.syncForUser(auth.profile?.id);
                    }
                    if (!context.mounted) return;
                    showSuccessPopup(
                      context,
                      v ? 'Push notifications enabled' : 'Push notifications turned off',
                    );
                  },
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 16),
            decoration: BoxDecoration(
              color: scheme.surface,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: scheme.outlineVariant.withValues(alpha: 0.6)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Preferred area', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
                const SizedBox(height: 6),
                Text(
                  'Used for “near you” style alerts and offline suggestions (e.g. Gaborone).',
                  style: TextStyle(color: scheme.onSurfaceVariant, height: 1.4),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: _area,
                  decoration: const InputDecoration(
                    hintText: 'City or area',
                    prefixIcon: Icon(Icons.place_outlined),
                  ),
                ),
                const SizedBox(height: 12),
                FilledButton(
                  onPressed: () async {
                    await engagement.setPreferredArea(_area.text);
                    if (!context.mounted) return;
                    showSuccessPopup(context, 'Preferred area saved on this device');
                  },
                  child: const Text('Save area'),
                ),
              ],
            ),
          ),
          if (auth.isSignedIn &&
              (auth.profile?.role == 'customer' || auth.profile?.role == 'provider')) ...[
            const SizedBox(height: 16),
            Container(
              decoration: BoxDecoration(
                color: scheme.surface,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: scheme.outlineVariant.withValues(alpha: 0.6)),
              ),
              child: ListTile(
                contentPadding: const EdgeInsets.fromLTRB(16, 8, 12, 8),
                leading: const Icon(Icons.tour_outlined),
                title: const Text('Replay app tour', style: TextStyle(fontWeight: FontWeight.w700)),
                subtitle: Text(
                  auth.profile?.isProvider == true
                      ? 'Show the provider onboarding again'
                      : 'Show the customer onboarding again',
                  style: TextStyle(color: scheme.onSurfaceVariant),
                ),
                trailing: const Icon(Icons.chevron_right_rounded),
                onTap: () async {
                  await replayRoleOnboarding(context);
                  if (context.mounted) Navigator.of(context).pop();
                },
              ),
            ),
          ],
          const SizedBox(height: 16),
          Container(
            decoration: BoxDecoration(
              color: scheme.surface,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: scheme.outlineVariant.withValues(alpha: 0.6)),
            ),
            child: ListTile(
              contentPadding: const EdgeInsets.fromLTRB(16, 8, 12, 8),
              leading: const Icon(Icons.wifi_tethering_rounded),
              title: const Text('Connection test', style: TextStyle(fontWeight: FontWeight.w700)),
              subtitle: Text(
                'Check why listings or providers are not loading',
                style: TextStyle(color: scheme.onSurfaceVariant),
              ),
              trailing: const Icon(Icons.chevron_right_rounded),
              onTap: () => Navigator.of(context).push(
                MaterialPageRoute<void>(builder: (_) => const ConnectionTestScreen()),
              ),
            ),
          ),
          const SizedBox(height: 18),
          Text(
            'Favourites and recently viewed listings are cached on this phone for weak-signal browsing.',
            textAlign: TextAlign.center,
            style: TextStyle(color: scheme.onSurfaceVariant, fontSize: 13, height: 1.4),
          ),
        ],
      ),
    );
  }
}
