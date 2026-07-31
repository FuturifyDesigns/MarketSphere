import 'package:flutter/material.dart';

import '../config.dart';

class VerifiedBadge extends StatelessWidget {
  const VerifiedBadge({super.key, this.compact = false});

  final bool compact;

  @override
  Widget build(BuildContext context) {
    return _TrustPill(
      icon: Icons.verified_rounded,
      label: compact ? 'Verified' : 'Verified provider',
      foreground: const Color(AppConfig.colorNight),
      background: const Color(AppConfig.colorGold),
    );
  }
}

class MsApprovedStamp extends StatelessWidget {
  const MsApprovedStamp({super.key, this.compact = false});

  final bool compact;

  @override
  Widget build(BuildContext context) {
    return _TrustPill(
      icon: Icons.workspace_premium_rounded,
      label: compact ? 'MS Approved' : 'Market Sphere Approved',
      foreground: const Color(AppConfig.colorGoldLight),
      background: const Color(0xFF2A2418),
      border: Border.all(color: const Color(AppConfig.colorGold).withValues(alpha: 0.45)),
    );
  }
}

class RatingStars extends StatelessWidget {
  const RatingStars({
    super.key,
    required this.rating,
    this.size = 18,
    this.showValue = true,
    this.count,
  });

  final double rating;
  final double size;
  final bool showValue;
  final int? count;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        ...List.generate(5, (i) {
          final filled = rating >= i + 1;
          final half = !filled && rating > i && rating < i + 1;
          return Icon(
            filled
                ? Icons.star_rounded
                : half
                    ? Icons.star_half_rounded
                    : Icons.star_outline_rounded,
            size: size,
            color: const Color(AppConfig.colorGold),
          );
        }),
        if (showValue) ...[
          const SizedBox(width: 6),
          Text(
            rating.toStringAsFixed(1),
            style: const TextStyle(
              fontWeight: FontWeight.w700,
              color: Color(AppConfig.colorGoldLight),
            ),
          ),
        ],
        if (count != null) ...[
          const SizedBox(width: 4),
          Text(
            '($count)',
            style: TextStyle(
              color: Theme.of(context).colorScheme.onSurfaceVariant,
              fontSize: 12,
            ),
          ),
        ],
      ],
    );
  }
}

class InteractiveStarPicker extends StatelessWidget {
  const InteractiveStarPicker({
    super.key,
    required this.value,
    required this.onChanged,
  });

  final int value;
  final ValueChanged<int> onChanged;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: List.generate(5, (i) {
        final star = i + 1;
        return IconButton(
          onPressed: () => onChanged(star),
          icon: Icon(
            star <= value ? Icons.star_rounded : Icons.star_outline_rounded,
            color: const Color(AppConfig.colorGold),
            size: 32,
          ),
        );
      }),
    );
  }
}

class _TrustPill extends StatelessWidget {
  const _TrustPill({
    required this.icon,
    required this.label,
    required this.foreground,
    required this.background,
    this.border,
  });

  final IconData icon;
  final String label;
  final Color foreground;
  final Color background;
  final BoxBorder? border;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: background,
        borderRadius: BorderRadius.circular(999),
        border: border,
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: foreground),
          const SizedBox(width: 5),
          Text(
            label,
            style: TextStyle(
              color: foreground,
              fontSize: 11,
              fontWeight: FontWeight.w800,
              letterSpacing: 0.2,
            ),
          ),
        ],
      ),
    );
  }
}
