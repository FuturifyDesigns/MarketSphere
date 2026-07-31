import 'dart:async';

import 'package:flutter/material.dart';

import '../config.dart';
import '../models/models.dart';
import '../utils/helpers.dart';
import 'common.dart';

/// Reliable auto photo slideshow (AnimatedSwitcher — works inside lists).
class PhotoSlideshow extends StatefulWidget {
  const PhotoSlideshow({
    super.key,
    required this.urls,
    this.height = 200,
    this.borderRadius,
    this.autoplay = true,
    this.dwell = const Duration(milliseconds: 2800),
  });

  final List<String> urls;
  final double height;
  final BorderRadius? borderRadius;
  final bool autoplay;
  final Duration dwell;

  @override
  State<PhotoSlideshow> createState() => _PhotoSlideshowState();
}

class _PhotoSlideshowState extends State<PhotoSlideshow> {
  var _index = 0;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _arm();
  }

  @override
  void didUpdateWidget(covariant PhotoSlideshow oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.urls.join() != widget.urls.join()) {
      _index = 0;
      _arm();
    }
  }

  void _arm() {
    _timer?.cancel();
    if (!widget.autoplay || widget.urls.length <= 1) return;
    _timer = Timer.periodic(widget.dwell, (_) {
      if (!mounted) return;
      setState(() => _index = (_index + 1) % widget.urls.length);
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final urls = widget.urls;
    final radius = widget.borderRadius ?? BorderRadius.circular(18);
    final url = urls.isEmpty ? null : urls[_index % urls.length];

    return SizedBox(
      height: widget.height,
      width: double.infinity,
      child: ClipRRect(
        borderRadius: radius,
        child: Stack(
          fit: StackFit.expand,
          children: [
            AnimatedSwitcher(
              duration: const Duration(milliseconds: 520),
              switchInCurve: Curves.easeOut,
              switchOutCurve: Curves.easeIn,
              child: AppNetworkImage(
                key: ValueKey('slide-${url ?? 'empty'}-$_index'),
                url: url,
              ),
            ),
            if (urls.length > 1) ...[
              Positioned(
                left: 0,
                right: 0,
                bottom: 10,
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: List.generate(urls.length.clamp(0, 8), (i) {
                    final active = i == (_index % urls.length.clamp(1, 8));
                    return AnimatedContainer(
                      duration: const Duration(milliseconds: 220),
                      width: active ? 16 : 6,
                      height: 6,
                      margin: const EdgeInsets.symmetric(horizontal: 2.5),
                      decoration: BoxDecoration(
                        color: active ? const Color(AppConfig.colorGold) : Colors.white70,
                        borderRadius: BorderRadius.circular(99),
                      ),
                    );
                  }),
                ),
              ),
              Positioned(
                right: 10,
                top: 10,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: Colors.black54,
                    borderRadius: BorderRadius.circular(999),
                  ),
                  child: Text(
                    '${_index + 1}/${urls.length}',
                    style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w600),
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class ListingSlideshowCard extends StatelessWidget {
  const ListingSlideshowCard({
    super.key,
    required this.listing,
    required this.onTap,
    this.width = 260,
    this.height = 318,
  });

  final ShowcaseListing listing;
  final VoidCallback onTap;
  final double width;
  final double height;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return PressableScale(
      onTap: onTap,
      child: SizedBox(
        width: width,
        height: height,
        child: DecoratedBox(
          decoration: BoxDecoration(
            color: scheme.surface,
            borderRadius: BorderRadius.circular(22),
            border: Border.all(color: scheme.outlineVariant.withValues(alpha: 0.7)),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.22),
                blurRadius: 18,
                offset: const Offset(0, 10),
              ),
            ],
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(22),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Stack(
                  children: [
                    PhotoSlideshow(
                      urls: listing.imageUrls,
                      height: 168,
                      borderRadius: BorderRadius.zero,
                    ),
                    Positioned(
                      left: 10,
                      top: 10,
                      child: StatusChip(label: dealTypeLabel(listing.dealType)),
                    ),
                  ],
                ),
                Expanded(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(14, 12, 14, 14),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          listing.title,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15, height: 1.25),
                        ),
                        const Spacer(),
                        if (listing.location != null)
                          Text(
                            listing.location!,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: TextStyle(color: scheme.onSurfaceVariant, fontSize: 12),
                          ),
                        if (listing.priceLabel != null) ...[
                          const SizedBox(height: 4),
                          Text(
                            listing.priceLabel!,
                            maxLines: 4,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                              color: Color(AppConfig.colorBronze),
                              fontWeight: FontWeight.w700,
                              height: 1.3,
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

/// Full-width showcase card with auto photo slideshow.
class ShowcaseListingCard extends StatelessWidget {
  const ShowcaseListingCard({
    super.key,
    required this.listing,
    required this.onTap,
  });

  final ShowcaseListing listing;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return PressableScale(
      onTap: onTap,
      child: DecoratedBox(
        decoration: BoxDecoration(
          color: scheme.surface,
          borderRadius: BorderRadius.circular(22),
          border: Border.all(color: scheme.outlineVariant.withValues(alpha: 0.7)),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.22),
              blurRadius: 18,
              offset: const Offset(0, 10),
            ),
          ],
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(22),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Stack(
                children: [
                  PhotoSlideshow(
                    urls: listing.imageUrls,
                    height: 210,
                    borderRadius: BorderRadius.zero,
                  ),
                  Positioned(
                    left: 12,
                    top: 12,
                    child: Wrap(
                      spacing: 6,
                      children: [
                        StatusChip(label: dealTypeLabel(listing.dealType)),
                        StatusChip(
                          label: availabilityLabel(listing.dealType, listing.available),
                          tone: listing.available ? ChipTone.muted : ChipTone.danger,
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 14, 16, 16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (listing.columnTitle != null)
                      Text(
                        listing.columnTitle!,
                        style: const TextStyle(
                          color: Color(AppConfig.colorGold),
                          fontWeight: FontWeight.w700,
                          fontSize: 12,
                          letterSpacing: 0.3,
                        ),
                      ),
                    const SizedBox(height: 4),
                    Text(
                      listing.title,
                      style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 17, height: 1.25),
                    ),
                    if (listing.summary != null) ...[
                      const SizedBox(height: 6),
                      Text(
                        listing.summary!,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(color: scheme.onSurfaceVariant, height: 1.35),
                      ),
                    ],
                    const SizedBox(height: 10),
                    Row(
                      children: [
                        if (listing.location != null)
                          Expanded(
                            child: Text(
                              listing.location!,
                              style: TextStyle(color: scheme.onSurfaceVariant, fontSize: 13),
                            ),
                          ),
                      ],
                    ),
                    if (listing.priceLabel != null) ...[
                      const SizedBox(height: 6),
                      Text(
                        listing.priceLabel!,
                        maxLines: 4,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          fontWeight: FontWeight.w800,
                          color: Color(AppConfig.colorBronze),
                          height: 1.3,
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
