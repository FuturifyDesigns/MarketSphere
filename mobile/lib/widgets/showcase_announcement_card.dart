import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:url_launcher/url_launcher.dart';

import '../config.dart';
import '../models/models.dart';
import '../utils/share_contact.dart';
import 'common.dart';

class ShowcaseAnnouncementCard extends StatelessWidget {
  const ShowcaseAnnouncementCard({
    super.key,
    required this.announcement,
    this.showColumn = false,
  });

  final ShowcaseAnnouncement announcement;
  final bool showColumn;

  IconData get _categoryIcon => switch (announcement.category) {
        'job' => Icons.work_outline_rounded,
        'event' => Icons.event_outlined,
        'notice' => Icons.notifications_active_outlined,
        _ => Icons.campaign_outlined,
      };

  Color get _accent => switch (announcement.category) {
        'job' => const Color(0xFF38BDF8),
        'advertisement' => const Color(0xFFF59E0B),
        'event' => const Color(0xFFA855F7),
        'notice' => const Color(0xFFEF6A6A),
        _ => const Color(AppConfig.colorGold),
      };

  String? get _deadlineLabel {
    final deadline = announcement.expiresAt;
    if (deadline == null) return null;
    final days = deadline.difference(DateTime.now()).inDays;
    if (days <= 0) return 'Closes today';
    if (days == 1) return 'Closes tomorrow';
    if (days < 7) return 'Closes in $days days';
    return 'Deadline ${DateFormat('d MMM yyyy').format(deadline.toLocal())}';
  }

  Future<void> _openLink() async {
    final raw = announcement.linkUrl?.trim();
    if (raw == null || raw.isEmpty) return;
    final normalized = raw.startsWith('http://') || raw.startsWith('https://')
        ? raw
        : 'https://$raw';
    await launchUrl(Uri.parse(normalized), mode: LaunchMode.externalApplication);
  }

  String get _enquiryMessage =>
      'Hello, I am enquiring about "${announcement.title}" on Market Sphere Group. Please share more information.';

  @override
  Widget build(BuildContext context) {
    final deadline = _deadlineLabel;
    return Container(
      decoration: BoxDecoration(
        color: const Color(0xFF171B22),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: _accent.withValues(alpha: 0.55)),
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (announcement.imageUrl?.trim().isNotEmpty == true)
            SizedBox(
              height: 150,
              width: double.infinity,
              child: AppNetworkImage(url: announcement.imageUrl),
            ),
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Wrap(
                  spacing: 7,
                  runSpacing: 7,
                  children: [
                    _AnnouncementBadge(
                      icon: _categoryIcon,
                      label: announcement.categoryLabel,
                      color: _accent,
                    ),
                    if (announcement.badge?.trim().isNotEmpty == true)
                      _AnnouncementBadge(
                        label: announcement.badge!.trim(),
                        color: const Color(AppConfig.colorGold),
                      ),
                    if (announcement.pinned)
                      const _AnnouncementBadge(
                        icon: Icons.push_pin_outlined,
                        label: 'Featured',
                        color: Color(AppConfig.colorGold),
                      ),
                  ],
                ),
                if (showColumn && announcement.columnTitle?.trim().isNotEmpty == true) ...[
                  const SizedBox(height: 10),
                  Text(
                    announcement.columnTitle!,
                    style: const TextStyle(
                      color: Color(AppConfig.colorGold),
                      fontWeight: FontWeight.w700,
                      fontSize: 12,
                    ),
                  ),
                ],
                const SizedBox(height: 10),
                Text(
                  announcement.title,
                  style: const TextStyle(fontSize: 19, fontWeight: FontWeight.w800, height: 1.2),
                ),
                const SizedBox(height: 7),
                Text(
                  announcement.body,
                  style: const TextStyle(color: Color(0xFFD4CCBC), height: 1.45),
                ),
                if (deadline != null) ...[
                  const SizedBox(height: 11),
                  Row(
                    children: [
                      const Icon(Icons.schedule_rounded, size: 16, color: Color(0xFFFBBF24)),
                      const SizedBox(width: 6),
                      Text(
                        deadline,
                        style: const TextStyle(color: Color(0xFFFBBF24), fontWeight: FontWeight.w700),
                      ),
                    ],
                  ),
                ],
                if (announcement.linkUrl?.trim().isNotEmpty == true ||
                    announcement.contactPhone?.trim().isNotEmpty == true ||
                    announcement.contactEmail?.trim().isNotEmpty == true) ...[
                  const SizedBox(height: 14),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      if (announcement.linkUrl?.trim().isNotEmpty == true)
                        FilledButton.icon(
                          onPressed: _openLink,
                          icon: const Icon(Icons.open_in_new_rounded, size: 17),
                          label: Text(
                            announcement.linkLabel?.trim().isNotEmpty == true
                                ? announcement.linkLabel!.trim()
                                : announcement.category == 'job'
                                    ? 'Apply now'
                                    : 'Learn more',
                          ),
                        ),
                      if (announcement.contactPhone?.trim().isNotEmpty == true)
                        OutlinedButton.icon(
                          onPressed: () => launchWhatsApp(
                            phone: announcement.contactPhone!,
                            message: _enquiryMessage,
                          ),
                          icon: const Icon(Icons.chat_outlined, size: 17),
                          label: const Text('WhatsApp'),
                        ),
                      if (announcement.contactEmail?.trim().isNotEmpty == true)
                        OutlinedButton.icon(
                          onPressed: () => launchMailto(
                            email: announcement.contactEmail!,
                            subject: 'Enquiry: ${announcement.title}',
                            body: _enquiryMessage,
                          ),
                          icon: const Icon(Icons.mail_outline_rounded, size: 17),
                          label: const Text('Email'),
                        ),
                    ],
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

class _AnnouncementBadge extends StatelessWidget {
  const _AnnouncementBadge({required this.label, required this.color, this.icon});

  final String label;
  final Color color;
  final IconData? icon;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 5),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.13),
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: color.withValues(alpha: 0.4)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (icon != null) ...[
            Icon(icon, size: 13, color: color),
            const SizedBox(width: 5),
          ],
          Text(
            label,
            style: TextStyle(color: color, fontWeight: FontWeight.w800, fontSize: 11),
          ),
        ],
      ),
    );
  }
}
