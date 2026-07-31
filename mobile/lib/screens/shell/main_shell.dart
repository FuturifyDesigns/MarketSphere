import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';

import '../../config.dart';
import '../../services/miss_you_service.dart';
import '../../state/engagement_controller.dart';
import '../../widgets/offline_banner.dart';
import '../../widgets/role_onboarding.dart';
import '../browse/browse_screen.dart';
import '../home/home_screen.dart';
import '../profile/profile_screen.dart';
import '../showcase/showcase_screen.dart';

class MainShell extends StatefulWidget {
  const MainShell({super.key});

  @override
  State<MainShell> createState() => _MainShellState();
}

class _MainShellState extends State<MainShell> with WidgetsBindingObserver {
  var _index = 0;

  static const _pages = [
    HomeScreen(),
    ShowcaseScreen(),
    BrowseScreen(),
    ProfileScreen(),
  ];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      MissYouService.instance.markAppOpened();
      final engagement = context.read<EngagementController>();
      engagement.flushPendingMutations();
    } else if (state == AppLifecycleState.paused) {
      MissYouService.instance.scheduleReminders();
    }
  }

  @override
  Widget build(BuildContext context) {
    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: const SystemUiOverlayStyle(
        statusBarColor: Colors.transparent,
        statusBarIconBrightness: Brightness.light,
        systemNavigationBarColor: Color(0xFF12161C),
        systemNavigationBarIconBrightness: Brightness.light,
      ),
      child: RoleOnboardingHost(
        child: Scaffold(
        body: Column(
          children: [
            const OfflineBanner(),
            Expanded(
              child: AnimatedSwitcher(
                duration: const Duration(milliseconds: 280),
                switchInCurve: Curves.easeOutCubic,
                switchOutCurve: Curves.easeInCubic,
                child: KeyedSubtree(
                  key: ValueKey(_index),
                  child: _pages[_index],
                ),
              ),
            ),
          ],
        ),
        bottomNavigationBar: Container(
          decoration: BoxDecoration(
            color: const Color(0xFF12161C),
            border: Border(
              top: BorderSide(color: const Color(AppConfig.colorGold).withValues(alpha: 0.16)),
            ),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.35),
                blurRadius: 24,
                offset: const Offset(0, -8),
              ),
            ],
          ),
          child: NavigationBar(
            height: 68,
            backgroundColor: Colors.transparent,
            elevation: 0,
            indicatorColor: const Color(AppConfig.colorGold).withValues(alpha: 0.2),
            selectedIndex: _index,
            labelBehavior: NavigationDestinationLabelBehavior.alwaysShow,
            onDestinationSelected: (i) => setState(() => _index = i),
            labelTextStyle: WidgetStateProperty.resolveWith((states) {
              final selected = states.contains(WidgetState.selected);
              return GoogleFonts.barlow(
                fontSize: 12,
                fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
                color: selected ? const Color(AppConfig.colorGold) : const Color(0xFFB9AE96),
              );
            }),
            destinations: const [
              NavigationDestination(
                icon: Icon(Icons.home_outlined, color: Color(0xFFB9AE96)),
                selectedIcon: Icon(Icons.home_rounded, color: Color(AppConfig.colorGold)),
                label: 'Home',
              ),
              NavigationDestination(
                icon: Icon(Icons.grid_view_outlined, color: Color(0xFFB9AE96)),
                selectedIcon: Icon(Icons.grid_view_rounded, color: Color(AppConfig.colorGold)),
                label: 'Showcase',
              ),
              NavigationDestination(
                icon: Icon(Icons.search_outlined, color: Color(0xFFB9AE96)),
                selectedIcon: Icon(Icons.search_rounded, color: Color(AppConfig.colorGold)),
                label: 'Browse',
              ),
              NavigationDestination(
                icon: Icon(Icons.person_outline, color: Color(0xFFB9AE96)),
                selectedIcon: Icon(Icons.person_rounded, color: Color(AppConfig.colorGold)),
                label: 'Account',
              ),
            ],
          ),
        ),
      ),
      ),
    );
  }
}
