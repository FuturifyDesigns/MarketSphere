import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../config.dart';

class RolePicker extends StatelessWidget {
  const RolePicker({
    super.key,
    required this.value,
    required this.onChanged,
    this.heading = 'How are you joining?',
  });

  final String? value;
  final ValueChanged<String> onChanged;
  final String heading;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          heading,
          style: GoogleFonts.barlow(
            fontWeight: FontWeight.w700,
            fontSize: 15,
            color: scheme.onSurface,
          ),
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: _RoleCard(
                selected: value == 'customer',
                title: 'Customer',
                subtitle: 'Find & book services',
                icon: Icons.person_outline_rounded,
                onTap: () => onChanged('customer'),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _RoleCard(
                selected: value == 'provider',
                title: 'Provider',
                subtitle: 'List your business',
                icon: Icons.storefront_outlined,
                onTap: () => onChanged('provider'),
              ),
            ),
          ],
        ),
      ],
    );
  }
}

class _RoleCard extends StatelessWidget {
  const _RoleCard({
    required this.selected,
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.onTap,
  });

  final bool selected;
  final String title;
  final String subtitle;
  final IconData icon;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Material(
      color: selected ? const Color(0xFF2C2414) : scheme.surface,
      borderRadius: BorderRadius.circular(16),
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          padding: const EdgeInsets.fromLTRB(14, 16, 14, 16),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: selected
                  ? const Color(AppConfig.colorGold)
                  : scheme.outlineVariant.withValues(alpha: 0.75),
              width: selected ? 1.6 : 1,
            ),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Icon(icon, color: selected ? const Color(AppConfig.colorGold) : scheme.onSurfaceVariant),
              const SizedBox(height: 10),
              Text(
                title,
                style: TextStyle(
                  fontWeight: FontWeight.w700,
                  fontSize: 15,
                  color: scheme.onSurface,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                subtitle,
                style: TextStyle(fontSize: 12, color: scheme.onSurfaceVariant, height: 1.3),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class GoogleAuthButton extends StatelessWidget {
  const GoogleAuthButton({
    super.key,
    required this.onPressed,
    this.loading = false,
    this.label = 'Continue with Google',
    this.busyLabel = 'Signing in…',
  });

  final VoidCallback? onPressed;
  final bool loading;
  final String label;
  final String busyLabel;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    // Never use CircularProgressIndicator here — it bleeds through Google's
    // translucent account / consent sheets and looks like a stuck refresh icon.
    return OutlinedButton(
      onPressed: loading ? null : onPressed,
      style: OutlinedButton.styleFrom(
        backgroundColor: const Color(0xFFF8F9FA),
        foregroundColor: const Color(0xFF202124),
        disabledForegroundColor: const Color(0xFF5F6368),
        disabledBackgroundColor: const Color(0xFFF1F3F4),
        side: BorderSide(color: scheme.outlineVariant.withValues(alpha: 0.9)),
        minimumSize: const Size.fromHeight(52),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const GoogleGIcon(size: 22),
          const SizedBox(width: 10),
          Text(
            loading ? busyLabel : label,
            style: GoogleFonts.barlow(
              fontWeight: FontWeight.w700,
              fontSize: 15,
              color: loading ? const Color(0xFF5F6368) : const Color(0xFF202124),
            ),
          ),
        ],
      ),
    );
  }
}

class GoogleGIcon extends StatelessWidget {
  const GoogleGIcon({super.key, this.size = 22});

  final double size;

  @override
  Widget build(BuildContext context) {
    return CustomPaint(
      size: Size.square(size),
      painter: _GoogleGIconPainter(),
    );
  }
}

class _GoogleGIconPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final stroke = size.width * 0.18;
    final rect = Rect.fromLTWH(stroke / 2, stroke / 2, size.width - stroke, size.height - stroke);
    final centerY = size.height / 2;

    Paint segment(Color color) => Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = stroke
      ..strokeCap = StrokeCap.round;

    canvas.drawArc(rect, -0.15, 1.1, false, segment(const Color(0xFF4285F4)));
    canvas.drawArc(rect, 1.0, 1.2, false, segment(const Color(0xFF34A853)));
    canvas.drawArc(rect, 2.2, 1.0, false, segment(const Color(0xFFFBBC05)));
    canvas.drawArc(rect, 3.15, 1.25, false, segment(const Color(0xFFEA4335)));

    final bar = Paint()
      ..color = const Color(0xFF4285F4)
      ..style = PaintingStyle.stroke
      ..strokeWidth = stroke
      ..strokeCap = StrokeCap.round;
    canvas.drawLine(
      Offset(size.width * 0.56, centerY),
      Offset(size.width * 0.9, centerY),
      bar,
    );
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

class AuthHintText extends StatelessWidget {
  const AuthHintText(this.text, {super.key});

  final String text;

  @override
  Widget build(BuildContext context) {
    return Text(
      text,
      style: TextStyle(
        fontSize: 12,
        height: 1.35,
        color: Theme.of(context).colorScheme.onSurfaceVariant,
      ),
    );
  }
}

class PasswordChecklist extends StatelessWidget {
  const PasswordChecklist({super.key, required this.password});

  final String password;

  @override
  Widget build(BuildContext context) {
    final checks = [
      ('At least 8 characters', password.length >= 8),
      ('Contains a letter', RegExp(r'[A-Za-z]').hasMatch(password)),
      ('Contains a number', RegExp(r'\d').hasMatch(password)),
      ('Upper and lower case', RegExp(r'[a-z]').hasMatch(password) && RegExp(r'[A-Z]').hasMatch(password)),
      ('Contains a symbol', RegExp(r'[^A-Za-z0-9]').hasMatch(password)),
    ];
    final metCount = checks.where((item) => item.$2).length;
    final percent = checks.isEmpty ? 0.0 : metCount / checks.length;
    final barColor = switch (metCount) {
      <= 2 => const Color(0xFFDC4C4C),
      3 => const Color(0xFFD97706),
      4 => const Color(AppConfig.colorGold),
      _ => const Color(0xFF3A9D5C),
    };

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFF151A20),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Theme.of(context).colorScheme.outlineVariant),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(999),
            child: LinearProgressIndicator(
              value: percent,
              minHeight: 7,
              backgroundColor: const Color(0xFF262D36),
              color: barColor,
            ),
          ),
          const SizedBox(height: 10),
          ...checks.map(
            (item) => Padding(
              padding: const EdgeInsets.only(bottom: 6),
              child: Row(
                children: [
                  Icon(
                    item.$2 ? Icons.check_circle_rounded : Icons.radio_button_unchecked_rounded,
                    size: 16,
                    color: item.$2 ? barColor : Theme.of(context).colorScheme.onSurfaceVariant,
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      item.$1,
                      style: TextStyle(
                        fontSize: 12,
                        color: item.$2
                            ? Theme.of(context).colorScheme.onSurface
                            : Theme.of(context).colorScheme.onSurfaceVariant,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class LiveEmptyState extends StatelessWidget {
  const LiveEmptyState({
    super.key,
    required this.title,
    required this.body,
    this.actionLabel,
    this.onAction,
    this.secondaryLabel,
    this.onSecondary,
    this.icon = Icons.auto_awesome_outlined,
  });

  final String title;
  final String body;
  final String? actionLabel;
  final VoidCallback? onAction;
  final String? secondaryLabel;
  final VoidCallback? onSecondary;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Container(
      width: double.infinity,
      margin: const EdgeInsets.symmetric(horizontal: 20),
      padding: const EdgeInsets.fromLTRB(20, 22, 20, 22),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(22),
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            const Color(AppConfig.colorGold).withValues(alpha: 0.14),
            const Color(0xFF1A1F27),
          ],
        ),
        border: Border.all(color: const Color(AppConfig.colorGold).withValues(alpha: 0.28)),
      ),
      child: Column(
        children: [
          Container(
            width: 56,
            height: 56,
            decoration: BoxDecoration(
              color: const Color(0xFF20262F),
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: const Color(AppConfig.colorGold)),
          ),
          const SizedBox(height: 14),
          Text(
            title,
            textAlign: TextAlign.center,
            style: GoogleFonts.barlowCondensed(
              fontSize: 22,
              fontWeight: FontWeight.w700,
              color: scheme.onSurface,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            body,
            textAlign: TextAlign.center,
            style: TextStyle(color: scheme.onSurfaceVariant, height: 1.45),
          ),
          if (actionLabel != null && onAction != null) ...[
            const SizedBox(height: 16),
            FilledButton(onPressed: onAction, child: Text(actionLabel!)),
          ],
          if (secondaryLabel != null && onSecondary != null) ...[
            const SizedBox(height: 4),
            TextButton(onPressed: onSecondary, child: Text(secondaryLabel!)),
          ],
        ],
      ),
    );
  }
}
