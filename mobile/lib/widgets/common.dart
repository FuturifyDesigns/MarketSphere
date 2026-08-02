import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';

import '../config.dart';

class AppNetworkImage extends StatelessWidget {
  const AppNetworkImage({
    super.key,
    required this.url,
    this.fit = BoxFit.cover,
    this.borderRadius,
    this.backgroundColor,
  });

  final String? url;
  final BoxFit fit;
  final BorderRadius? borderRadius;
  final Color? backgroundColor;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final fallback = backgroundColor ?? scheme.surfaceContainerHighest;
    final image = url == null || url!.isEmpty
        ? ColoredBox(
            color: fallback,
            child: Center(child: Icon(Icons.image_outlined, color: scheme.onSurfaceVariant)),
          )
        : ColoredBox(
            color: fallback,
            child: CachedNetworkImage(
              imageUrl: url!,
              fit: fit,
              width: double.infinity,
              height: double.infinity,
              alignment: Alignment.center,
              fadeInDuration: const Duration(milliseconds: 220),
              memCacheWidth: 1200,
              placeholder: (context, imageUrl) => ColoredBox(color: fallback),
              errorWidget: (context, imageUrl, error) => ColoredBox(
                color: fallback,
                child: Center(child: Icon(Icons.broken_image_outlined, color: scheme.onSurfaceVariant)),
              ),
            ),
          );

    final filled = SizedBox.expand(child: image);
    if (borderRadius == null) return filled;
    return ClipRRect(borderRadius: borderRadius!, child: filled);
  }
}

class PressableScale extends StatefulWidget {
  const PressableScale({
    super.key,
    required this.child,
    required this.onTap,
    this.scale = 0.985,
  });

  final Widget child;
  final VoidCallback onTap;
  final double scale;

  @override
  State<PressableScale> createState() => _PressableScaleState();
}

class _PressableScaleState extends State<PressableScale> {
  var _pressed = false;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTapDown: (_) => setState(() => _pressed = true),
      onTapCancel: () => setState(() => _pressed = false),
      onTapUp: (_) => setState(() => _pressed = false),
      onTap: widget.onTap,
      child: AnimatedScale(
        scale: _pressed ? widget.scale : 1,
        duration: const Duration(milliseconds: 120),
        curve: Curves.easeOut,
        child: widget.child,
      ),
    );
  }
}

class SectionHeader extends StatelessWidget {
  const SectionHeader({super.key, required this.title, this.subtitle, this.action});

  final String title;
  final String? subtitle;
  final Widget? action;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 8, 20, 12),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        fontWeight: FontWeight.w700,
                      ),
                ),
                if (subtitle != null) ...[
                  const SizedBox(height: 4),
                  Text(
                    subtitle!,
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: Theme.of(context).colorScheme.onSurfaceVariant,
                        ),
                  ),
                ],
              ],
            ),
          ),
          ?action,
        ],
      ),
    );
  }
}

class StatusChip extends StatelessWidget {
  const StatusChip({super.key, required this.label, this.tone = ChipTone.gold});

  final String label;
  final ChipTone tone;

  @override
  Widget build(BuildContext context) {
    final bg = switch (tone) {
      ChipTone.gold => const Color(AppConfig.colorGold),
      ChipTone.muted => const Color(0xFF2A2418),
      ChipTone.danger => const Color(0xFF3A1E1C),
    };
    final fg = switch (tone) {
      ChipTone.gold => const Color(AppConfig.colorNight),
      ChipTone.muted => const Color(AppConfig.colorGoldLight),
      ChipTone.danger => const Color(0xFFFFB4A8),
    };
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(999),
        border: tone == ChipTone.muted
            ? Border.all(color: const Color(AppConfig.colorGold).withValues(alpha: 0.25))
            : null,
      ),
      child: Text(
        label,
        style: TextStyle(color: fg, fontSize: 11, fontWeight: FontWeight.w700),
      ),
    );
  }
}

enum ChipTone { gold, muted, danger }
