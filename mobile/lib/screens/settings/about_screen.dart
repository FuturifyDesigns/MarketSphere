import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../config.dart';
import '../../models/models.dart';
import '../../services/data_repository.dart';
import '../../widgets/brand_app_bar.dart';
import '../../widgets/common.dart';

class AboutScreen extends StatefulWidget {
  const AboutScreen({super.key});

  @override
  State<AboutScreen> createState() => _AboutScreenState();
}

class _AboutScreenState extends State<AboutScreen> {
  Future<List<TeamMember>>? _teamFuture;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _teamFuture ??= context.read<DataRepository>().fetchTeamMembers(siteBase: AppConfig.siteUrl);
  }

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;

    return Scaffold(
      appBar: const BrandAppBar(title: 'About', subtitle: 'Market Sphere Group'),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(20, 12, 20, 32),
        children: [
          Center(child: Image.asset('assets/branding/logo-512.png', width: 96, height: 96)),
          const SizedBox(height: 16),
          Text(
            AppConfig.appName,
            textAlign: TextAlign.center,
            style: GoogleFonts.barlowCondensed(fontSize: 28, fontWeight: FontWeight.w700),
          ),
          const SizedBox(height: 6),
          const Text(
            AppConfig.tagline,
            textAlign: TextAlign.center,
            style: TextStyle(color: Color(AppConfig.colorMuted)),
          ),
          const SizedBox(height: 22),
          _block(context, 'Overview', AppConfig.overview),
          const SizedBox(height: 14),
          _block(context, 'Head office', AppConfig.headOffice),
          const SizedBox(height: 14),
          _block(context, 'Address', AppConfig.address),
          const SizedBox(height: 14),
          _block(context, 'Registration', AppConfig.registration),
          const SizedBox(height: 14),
          _block(context, 'Email', AppConfig.supportEmail),
          const SizedBox(height: 14),
          _block(context, 'Phone', AppConfig.supportPhone),
          const SizedBox(height: 22),
          Text(
            'Our team',
            style: GoogleFonts.barlowCondensed(
              fontSize: 24,
              fontWeight: FontWeight.w700,
              color: const Color(AppConfig.colorText),
            ),
          ),
          const SizedBox(height: 6),
          Text(
            'The people guiding Market Sphere Group — connecting communities with trusted professionals across Botswana.',
            style: TextStyle(color: scheme.onSurfaceVariant, height: 1.45),
          ),
          const SizedBox(height: 14),
          FutureBuilder<List<TeamMember>>(
            future: _teamFuture,
            builder: (context, snapshot) {
              if (snapshot.connectionState != ConnectionState.done) {
                return const Padding(
                  padding: EdgeInsets.symmetric(vertical: 24),
                  child: Center(
                    child: CircularProgressIndicator(color: Color(AppConfig.colorGold)),
                  ),
                );
              }
              final members = snapshot.data ?? const <TeamMember>[];
              if (members.isEmpty) {
                return Text(
                  'Team details will appear here soon.',
                  style: TextStyle(color: scheme.onSurfaceVariant),
                );
              }
              return Column(
                children: [
                  for (var i = 0; i < members.length; i++) ...[
                    if (i > 0) const SizedBox(height: 12),
                    _TeamMemberCard(member: members[i]),
                  ],
                ],
              );
            },
          ),
          const SizedBox(height: 22),
          const Text(
            'Core values',
            style: TextStyle(
              fontWeight: FontWeight.w700,
              fontSize: 16,
              color: Color(AppConfig.colorText),
            ),
          ),
          const SizedBox(height: 10),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: AppConfig.coreValues
                .map(
                  (value) => Chip(
                    label: Text(
                      value,
                      style: const TextStyle(
                        color: Color(AppConfig.colorNight),
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    backgroundColor: const Color(AppConfig.colorGoldLight),
                    side: BorderSide.none,
                  ),
                )
                .toList(),
          ),
        ],
      ),
    );
  }

  Widget _block(BuildContext context, String title, String body) {
    final scheme = Theme.of(context).colorScheme;
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: scheme.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: scheme.outlineVariant.withValues(alpha: 0.6)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: const TextStyle(
              fontWeight: FontWeight.w700,
              color: Color(AppConfig.colorGold),
            ),
          ),
          const SizedBox(height: 6),
          Text(
            body,
            style: const TextStyle(
              height: 1.45,
              color: Color(AppConfig.colorTextSecondary),
            ),
          ),
        ],
      ),
    );
  }
}

class _TeamMemberCard extends StatelessWidget {
  const _TeamMemberCard({required this.member});

  final TeamMember member;

  Future<void> _call() async {
    final phone = member.phone?.replaceAll(RegExp(r'\s+'), '') ?? '';
    if (phone.isEmpty) return;
    final uri = Uri(scheme: 'tel', path: phone);
    await launchUrl(uri);
  }

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: scheme.surface,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: scheme.outlineVariant.withValues(alpha: 0.65)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          ClipOval(
            child: SizedBox(
              width: 84,
              height: 84,
              child: ColoredBox(
                color: Colors.transparent,
                child: AppNetworkImage(
                  url: member.imageUrl,
                  backgroundColor: Colors.transparent,
                ),
              ),
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  member.name,
                  style: const TextStyle(
                    fontWeight: FontWeight.w800,
                    fontSize: 16,
                    color: Color(AppConfig.colorText),
                  ),
                ),
                if (member.role.isNotEmpty) ...[
                  const SizedBox(height: 4),
                  Text(
                    member.role,
                    style: TextStyle(
                      color: scheme.onSurfaceVariant,
                      height: 1.35,
                      fontSize: 13.5,
                    ),
                  ),
                ],
                if (member.phone != null) ...[
                  const SizedBox(height: 10),
                  TextButton.icon(
                    onPressed: _call,
                    style: TextButton.styleFrom(
                      foregroundColor: const Color(AppConfig.colorGold),
                      padding: EdgeInsets.zero,
                      minimumSize: Size.zero,
                      tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                    ),
                    icon: const Icon(Icons.phone_outlined, size: 16),
                    label: Text(member.phone!),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}
