import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../config.dart';
import '../../state/auth_controller.dart';
import '../../state/engagement_controller.dart';
import '../../utils/page_transitions.dart';
import '../../widgets/brand_app_bar.dart';
import '../auth/login_screen.dart';
import '../auth/register_screen.dart';
import '../auth/welcome_screen.dart';
import '../dashboard/my_enquiries_screen.dart';
import '../dashboard/provider_dashboard_screen.dart';
import '../notifications/notifications_screen.dart';
import '../saved/saved_screen.dart';
import '../settings/about_screen.dart';
import '../settings/edit_profile_screen.dart';
import '../settings/settings_screen.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthController>();
    final engagement = context.watch<EngagementController>();
    final profile = auth.profile;
    final scheme = Theme.of(context).colorScheme;

    return Scaffold(
      appBar: BrandAppBar(
        title: 'Account',
        subtitle: 'Your Market Sphere profile',
        actions: [
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
      body: ListView(
        padding: const EdgeInsets.fromLTRB(20, 8, 20, 32),
        children: [
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: scheme.surface,
              borderRadius: BorderRadius.circular(24),
              border: Border.all(color: scheme.outlineVariant.withValues(alpha: 0.55)),
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [
                  scheme.surface,
                  const Color(AppConfig.colorGold).withValues(alpha: 0.08),
                ],
              ),
            ),
            child: auth.isSignedIn && profile != null
                ? Column(
                    children: [
                      CircleAvatar(
                        radius: 42,
                        backgroundColor: const Color(AppConfig.colorSand),
                        backgroundImage:
                            profile.avatarUrl != null ? NetworkImage(profile.avatarUrl!) : null,
                        child: profile.avatarUrl == null
                            ? Text(
                                profile.displayName.isNotEmpty
                                    ? profile.displayName[0].toUpperCase()
                                    : '?',
                                style: const TextStyle(
                                  fontSize: 28,
                                  fontWeight: FontWeight.w700,
                                  color: Color(AppConfig.colorNight),
                                ),
                              )
                            : null,
                      ),
                      const SizedBox(height: 14),
                      Text(
                        profile.displayName,
                        textAlign: TextAlign.center,
                        style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w700),
                      ),
                      const SizedBox(height: 4),
                      Text(profile.email, style: TextStyle(color: scheme.onSurfaceVariant)),
                      const SizedBox(height: 12),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(
                          color: const Color(AppConfig.colorGold).withValues(alpha: 0.2),
                          borderRadius: BorderRadius.circular(999),
                        ),
                        child: Text(
                          profile.isProvider
                              ? 'Provider account'
                              : profile.isAdmin
                                  ? 'Admin account'
                                  : 'Customer account',
                          style: const TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w700,
                            color: Color(AppConfig.colorGoldLight),
                          ),
                        ),
                      ),
                      const SizedBox(height: 18),
                      FilledButton.icon(
                        onPressed: () => pushFade(context, const EditProfileScreen()),
                        icon: const Icon(Icons.edit_outlined),
                        label: const Text('Edit profile'),
                      ),
                      if (profile.isProvider || profile.isAdmin) ...[
                        const SizedBox(height: 10),
                        FilledButton.tonalIcon(
                          onPressed: () => pushFade(context, const ProviderDashboardScreen()),
                          icon: const Icon(Icons.storefront_outlined),
                          label: const Text('Provider dashboard'),
                        ),
                      ] else ...[
                        const SizedBox(height: 10),
                        OutlinedButton.icon(
                          onPressed: () => pushFade(context, const MyEnquiriesScreen()),
                          icon: const Icon(Icons.mail_outline_rounded),
                          label: const Text('My enquiries'),
                        ),
                      ],
                    ],
                  )
                : Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'You’re browsing as a guest',
                        style: TextStyle(fontSize: 22, fontWeight: FontWeight.w700),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Sign in to sync your Market Sphere account across website and app.',
                        style: TextStyle(color: scheme.onSurfaceVariant, height: 1.4),
                      ),
                      const SizedBox(height: 18),
                      FilledButton(
                        onPressed: () => pushFade(context, const LoginScreen()),
                        child: const Text('Sign in'),
                      ),
                      const SizedBox(height: 10),
                      OutlinedButton(
                        onPressed: () => pushFade(context, const RegisterScreen()),
                        child: const Text('Create account'),
                      ),
                    ],
                  ),
          ),
          const SizedBox(height: 22),
          Text(
            'Dashboard',
            style: TextStyle(
              fontWeight: FontWeight.w700,
              color: scheme.onSurface,
            ),
          ),
          const SizedBox(height: 10),
          _card(context, [
            if (auth.isSignedIn && profile != null && (profile.isProvider || profile.isAdmin))
              _item(
                Icons.dashboard_customize_outlined,
                'Provider dashboard',
                () => pushFade(context, const ProviderDashboardScreen()),
              ),
            if (auth.isSignedIn && profile != null && !profile.isProvider && !profile.isAdmin)
              _item(
                Icons.mail_outline_rounded,
                'My enquiries',
                () => pushFade(context, const MyEnquiriesScreen()),
              ),
            _item(
              Icons.favorite_outline_rounded,
              'Saved favourites',
              () => pushFade(context, const SavedScreen()),
            ),
            _item(
              Icons.notifications_active_outlined,
              engagement.unreadCount > 0
                  ? 'Alerts (${engagement.unreadCount} unread)'
                  : 'Alerts & notify me',
              () => pushFade(context, const NotificationsScreen()),
            ),
            _item(Icons.history_rounded, 'Recently viewed', () => pushFade(context, const SavedScreen())),
          ]),
          const SizedBox(height: 22),
          Text(
            'Company & legal',
            style: TextStyle(
              fontWeight: FontWeight.w700,
              color: scheme.onSurface,
            ),
          ),
          const SizedBox(height: 10),
          _card(context, [
            _item(Icons.info_outline_rounded, 'About Market Sphere Group', () => pushFade(context, const AboutScreen())),
            _item(Icons.mail_outline, 'Contact support', () => launchUrl(Uri(scheme: 'mailto', path: AppConfig.supportEmail))),
            _item(
              Icons.phone_outlined,
              'Call ${AppConfig.supportPhone}',
              () => launchUrl(Uri(scheme: 'tel', path: AppConfig.supportPhone.replaceAll(RegExp(r'[^\d+]'), ''))),
            ),
            _item(
              Icons.privacy_tip_outlined,
              'Privacy Policy',
              () => launchUrl(Uri.parse('${AppConfig.siteUrl}privacy'), mode: LaunchMode.externalApplication),
            ),
            _item(
              Icons.description_outlined,
              'Terms of Service',
              () => launchUrl(Uri.parse('${AppConfig.siteUrl}terms'), mode: LaunchMode.externalApplication),
            ),
          ]),
          const SizedBox(height: 12),
          _card(context, [
            _item(Icons.tune_rounded, 'App settings', () => pushFade(context, const SettingsScreen())),
            _item(
              Icons.language_rounded,
              'Open website',
              () => launchUrl(Uri.parse(AppConfig.siteUrl), mode: LaunchMode.externalApplication),
            ),
          ]),
          if (auth.isSignedIn) ...[
            const SizedBox(height: 22),
            FilledButton.tonal(
              onPressed: () async {
                await auth.signOut();
                if (!context.mounted) return;
                pushAndRemoveFade(context, const WelcomeScreen());
              },
              child: const Text('Sign out'),
            ),
          ],
        ],
      ),
    );
  }

  Widget _card(BuildContext context, List<Widget> children) {
    final scheme = Theme.of(context).colorScheme;
    return Material(
      color: scheme.surface,
      borderRadius: BorderRadius.circular(18),
      child: Column(children: children),
    );
  }

  Widget _item(IconData icon, String title, VoidCallback onTap) {
    return ListTile(
      leading: Icon(icon),
      title: Text(title, style: const TextStyle(fontWeight: FontWeight.w600)),
      trailing: const Icon(Icons.chevron_right_rounded),
      onTap: onTap,
    );
  }
}
