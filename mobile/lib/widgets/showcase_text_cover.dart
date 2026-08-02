import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../config.dart';

/// Branded cover for listings published without photos (matches website ShowcaseTextCover).
class ShowcaseTextCover extends StatelessWidget {
  const ShowcaseTextCover({
    super.key,
    this.title,
    this.height,
    this.compact = false,
  });

  final String? title;
  final double? height;
  final bool compact;

  @override
  Widget build(BuildContext context) {
    final isCompact = compact || (height != null && height! < 100);
    return SizedBox(
      height: height,
      width: double.infinity,
      child: DecoratedBox(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment(-0.9, -1),
            end: Alignment(0.8, 1),
            colors: [
              Color(0xFF1A140C),
              Color(0xFF0F1218),
              Color(0xFF16110A),
            ],
            stops: [0.0, 0.48, 1.0],
          ),
        ),
        child: Stack(
          fit: StackFit.expand,
          children: [
            const DecoratedBox(
              decoration: BoxDecoration(
                gradient: RadialGradient(
                  center: Alignment(-0.7, -0.75),
                  radius: 0.95,
                  colors: [
                    Color(0x52C9A24B),
                    Color(0x00C9A24B),
                  ],
                  stops: [0.0, 0.55],
                ),
              ),
            ),
            const DecoratedBox(
              decoration: BoxDecoration(
                gradient: RadialGradient(
                  center: Alignment(0.85, 0.9),
                  radius: 0.85,
                  colors: [
                    Color(0x47785420),
                    Color(0x00785420),
                  ],
                  stops: [0.0, 0.5],
                ),
              ),
            ),
            if (!isCompact) CustomPaint(painter: _GridFadePainter()),
            Padding(
              padding: EdgeInsets.symmetric(
                horizontal: isCompact ? 6 : 16,
                vertical: isCompact ? 6 : 14,
              ),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Image.asset(
                    'assets/branding/logo-512.png',
                    width: isCompact ? 28 : 68,
                    height: isCompact ? 28 : 68,
                    fit: BoxFit.contain,
                  ),
                  if (!isCompact) ...[
                    const SizedBox(height: 10),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                      decoration: BoxDecoration(
                        color: const Color(AppConfig.colorGold).withValues(alpha: 0.14),
                        borderRadius: BorderRadius.circular(999),
                        border: Border.all(
                          color: const Color(AppConfig.colorGold).withValues(alpha: 0.4),
                        ),
                      ),
                      child: const Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.description_outlined, size: 14, color: Color(AppConfig.colorGoldLight)),
                          SizedBox(width: 5),
                          Text(
                            'TEXT LISTING',
                            style: TextStyle(
                              color: Color(AppConfig.colorGoldLight),
                              fontSize: 11,
                              fontWeight: FontWeight.w700,
                              letterSpacing: 0.7,
                            ),
                          ),
                        ],
                      ),
                    ),
                    if (title != null && title!.trim().isNotEmpty) ...[
                      const SizedBox(height: 10),
                      Text(
                        title!.trim(),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        textAlign: TextAlign.center,
                        style: GoogleFonts.barlowCondensed(
                          color: const Color(AppConfig.colorText),
                          fontSize: 18,
                          fontWeight: FontWeight.w700,
                          height: 1.2,
                        ),
                      ),
                    ],
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _GridFadePainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = const Color(0x12F5EFE4)
      ..strokeWidth = 1;
    const step = 28.0;
    for (var x = 0.0; x <= size.width; x += step) {
      canvas.drawLine(Offset(x, 0), Offset(x, size.height), paint);
    }
    for (var y = 0.0; y <= size.height; y += step) {
      canvas.drawLine(Offset(0, y), Offset(size.width, y), paint);
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
