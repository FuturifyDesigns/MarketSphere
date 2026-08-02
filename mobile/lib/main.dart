import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:provider/provider.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:timezone/data/latest_all.dart' as tzdata;
import 'package:timezone/timezone.dart' as tz;
import 'package:flutter_timezone/flutter_timezone.dart';

import 'config.dart';
import 'firebase_options.dart';
import 'screens/splash_screen.dart';
import 'services/alert_notification_service.dart';
import 'services/connectivity_service.dart';
import 'services/data_repository.dart';
import 'services/deep_link_service.dart';
import 'services/env_config.dart';
import 'services/miss_you_service.dart';
import 'services/push_service.dart';
import 'services/secure_session_storage.dart';
import 'state/app_settings_controller.dart';
import 'state/auth_controller.dart';
import 'state/engagement_controller.dart';
import 'theme.dart';

final _navigatorKey = GlobalKey<NavigatorState>();

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  await SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
    DeviceOrientation.portraitDown,
  ]);

  try {
    await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);
    FirebaseMessaging.onBackgroundMessage(firebaseMessagingBackgroundHandler);
  } catch (e) {
    if (kDebugMode) {
      debugPrint('[firebase] init skipped/failed: $e');
    }
  }

  // Prefer --dart-define / --dart-define-from-file so secrets are not APK assets.
  // Optional debug-only dotenv if a developer still lists `.env` under assets locally.
  if (kDebugMode) {
    try {
      await dotenv.load(fileName: '.env');
    } catch (_) {}
  }

  final supabaseUrl = EnvConfig.supabaseUrl;
  final supabaseAnonKey = EnvConfig.supabaseAnonKey;
  if (supabaseUrl.isEmpty || supabaseAnonKey.isEmpty) {
    throw StateError(
      'Missing SUPABASE_URL / SUPABASE_ANON_KEY. '
      'Pass --dart-define-from-file=.env (see mobile/README.md).',
    );
  }
  if (!supabaseUrl.startsWith('https://')) {
    throw StateError('SUPABASE_URL must use https://');
  }

  final sessionKey = 'sb-${Uri.parse(supabaseUrl).host.split('.').first}-auth-token';
  await Supabase.initialize(
    url: supabaseUrl,
    publishableKey: supabaseAnonKey,
    authOptions: FlutterAuthClientOptions(
      localStorage: SecureSessionLocalStorage(persistSessionKey: sessionKey),
      pkceAsyncStorage: SecureGotrueAsyncStorage(),
    ),
  );

  await _configureLocalTimeZone();
  await MissYouService.instance.init();
  await MissYouService.instance.markAppOpened();
  await ConnectivityService.instance.init();

  final auth = AuthController();
  await auth.bootstrap();

  final settings = AppSettingsController();
  await settings.load();

  final repo = DataRepository();
  final engagement = EngagementController(repo);
  await engagement.bootstrap(
    userId: auth.profile?.id ?? Supabase.instance.client.auth.currentUser?.id,
  );

  auth.addListener(() {
    final id = auth.isSignedIn
        ? (auth.profile?.id ?? Supabase.instance.client.auth.currentUser?.id)
        : null;
    engagement.onAuthChanged(id);
    if (id != null) {
      PushService.instance.syncForUser(id);
    }
  });

  await AlertNotificationService.instance.init(enabled: settings.pushEnabled);
  await PushService.instance.init(userId: auth.profile?.id);

  DeepLinkService.instance.attach(navigatorKey: _navigatorKey);
  await DeepLinkService.instance.start();

  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider.value(value: auth),
        ChangeNotifierProvider.value(value: settings),
        ChangeNotifierProvider.value(value: engagement),
        ChangeNotifierProvider.value(value: ConnectivityService.instance),
        Provider.value(value: repo),
      ],
      child: const MarketSphereApp(),
    ),
  );
}

Future<void> _configureLocalTimeZone() async {
  tzdata.initializeTimeZones();
  try {
    final name = await FlutterTimezone.getLocalTimezone();
    tz.setLocalLocation(tz.getLocation(name));
  } catch (_) {
    tz.setLocalLocation(tz.getLocation('Africa/Gaborone'));
  }
}

class MarketSphereApp extends StatelessWidget {
  const MarketSphereApp({super.key});

  @override
  Widget build(BuildContext context) {
    SystemChrome.setSystemUIOverlayStyle(
      const SystemUiOverlayStyle(
        statusBarColor: Colors.transparent,
        statusBarIconBrightness: Brightness.light,
        systemNavigationBarColor: Color(AppConfig.colorNight),
        systemNavigationBarIconBrightness: Brightness.light,
      ),
    );

    return MaterialApp(
      navigatorKey: _navigatorKey,
      title: AppConfig.appName,
      debugShowCheckedModeBanner: false,
      darkTheme: AppTheme.dark,
      theme: AppTheme.dark,
      themeMode: ThemeMode.dark,
      home: const SplashScreen(),
    );
  }
}
