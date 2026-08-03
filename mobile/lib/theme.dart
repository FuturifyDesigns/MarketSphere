import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import 'config.dart';

class AppTheme {
  AppTheme._();

  static ThemeData get dark => _build(Brightness.dark);

  static ThemeData _build(Brightness brightness) {
    const bg = Color(AppConfig.colorNight);
    const surface = Color(0xFF171B22);
    const onSurface = Color(0xFFF7F0E4);
    const muted = Color(0xFFC4B89A);

    final base = ThemeData(
      useMaterial3: true,
      brightness: brightness,
      scaffoldBackgroundColor: bg,
      colorScheme: ColorScheme.fromSeed(
        seedColor: const Color(AppConfig.colorGold),
        brightness: brightness,
        primary: const Color(AppConfig.colorGold),
        onPrimary: const Color(AppConfig.colorNight),
        surface: surface,
        onSurface: onSurface,
        onSurfaceVariant: muted,
        outlineVariant: const Color(0xFF4A4336),
        surfaceContainerHighest: const Color(0xFF242A33),
      ),
    );

    return base.copyWith(
      textTheme: GoogleFonts.barlowTextTheme(base.textTheme).apply(
        bodyColor: onSurface,
        displayColor: onSurface,
      ),
      iconTheme: const IconThemeData(color: Color(AppConfig.colorGoldLight)),
      primaryIconTheme: const IconThemeData(color: Color(AppConfig.colorGoldLight)),
      appBarTheme: AppBarTheme(
        elevation: 0,
        scrolledUnderElevation: 0,
        centerTitle: false,
        backgroundColor: bg,
        foregroundColor: onSurface,
        iconTheme: const IconThemeData(color: Color(AppConfig.colorGoldLight)),
        actionsIconTheme: const IconThemeData(color: Color(AppConfig.colorGoldLight)),
        titleTextStyle: GoogleFonts.barlowCondensed(
          fontSize: 22,
          fontWeight: FontWeight.w600,
          color: onSurface,
          letterSpacing: 0.4,
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: surface,
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        hintStyle: TextStyle(color: muted.withValues(alpha: 0.85)),
        labelStyle: const TextStyle(color: muted),
        prefixIconColor: muted,
        suffixIconColor: muted,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: BorderSide(color: muted.withValues(alpha: 0.35)),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: BorderSide(color: muted.withValues(alpha: 0.35)),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: Color(AppConfig.colorGold), width: 1.5),
        ),
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          backgroundColor: const Color(AppConfig.colorGold),
          foregroundColor: const Color(AppConfig.colorNight),
          // Finite min width — Size.fromHeight uses infinity and breaks Row buttons.
          minimumSize: const Size(88, 48),
          side: BorderSide.none,
          elevation: 0,
          shadowColor: Colors.transparent,
          surfaceTintColor: Colors.transparent,
          overlayColor: const Color(AppConfig.colorNight).withValues(alpha: 0.12),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
          textStyle: GoogleFonts.barlow(fontWeight: FontWeight.w700, fontSize: 16),
        ).copyWith(
          side: const WidgetStatePropertyAll(BorderSide.none),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: const Color(AppConfig.colorGoldLight),
          minimumSize: const Size(88, 48),
          side: BorderSide(
            color: const Color(AppConfig.colorGold).withValues(alpha: 0.45),
          ),
          backgroundColor: const Color(0xFF151A20),
          elevation: 0,
          shadowColor: Colors.transparent,
          surfaceTintColor: Colors.transparent,
          overlayColor: const Color(AppConfig.colorGold).withValues(alpha: 0.12),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
          textStyle: GoogleFonts.barlow(fontWeight: FontWeight.w600, fontSize: 16),
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: const Color(AppConfig.colorGoldLight),
          overlayColor: const Color(AppConfig.colorGold).withValues(alpha: 0.12),
          textStyle: GoogleFonts.barlow(fontWeight: FontWeight.w700),
        ),
      ),
      chipTheme: ChipThemeData(
        backgroundColor: const Color(0xFF242A33),
        selectedColor: const Color(AppConfig.colorGold),
        disabledColor: const Color(0xFF1C222A),
        labelStyle: GoogleFonts.barlow(color: onSurface, fontWeight: FontWeight.w600, fontSize: 12),
        secondaryLabelStyle: GoogleFonts.barlow(
          color: const Color(AppConfig.colorNight),
          fontWeight: FontWeight.w700,
          fontSize: 12,
        ),
        side: BorderSide.none,
        surfaceTintColor: Colors.transparent,
        shadowColor: Colors.transparent,
        selectedShadowColor: Colors.transparent,
        pressElevation: 0,
        elevation: 0,
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 0),
      ),
      navigationBarTheme: NavigationBarThemeData(
        backgroundColor: surface,
        indicatorColor: const Color(AppConfig.colorGold).withValues(alpha: 0.22),
        labelTextStyle: WidgetStateProperty.resolveWith((states) {
          final selected = states.contains(WidgetState.selected);
          return GoogleFonts.barlow(
            fontSize: 12,
            fontWeight: selected ? FontWeight.w700 : FontWeight.w600,
            color: selected ? const Color(AppConfig.colorGold) : muted,
          );
        }),
      ),
      switchTheme: SwitchThemeData(
        thumbColor: WidgetStateProperty.resolveWith((states) {
          if (states.contains(WidgetState.selected)) return const Color(AppConfig.colorNight);
          return null;
        }),
        trackColor: WidgetStateProperty.resolveWith((states) {
          if (states.contains(WidgetState.selected)) return const Color(AppConfig.colorGold);
          return null;
        }),
      ),
      listTileTheme: ListTileThemeData(
        iconColor: const Color(AppConfig.colorGoldLight),
        textColor: onSurface,
        subtitleTextStyle: GoogleFonts.barlow(color: muted, fontSize: 13),
        titleTextStyle: GoogleFonts.barlow(color: onSurface, fontWeight: FontWeight.w600, fontSize: 16),
      ),
      snackBarTheme: SnackBarThemeData(
        backgroundColor: surface,
        contentTextStyle: GoogleFonts.barlow(color: onSurface),
      ),
    );
  }
}
