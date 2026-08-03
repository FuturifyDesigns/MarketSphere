/// App-wide configuration for Market Sphere Group Android.
class AppConfig {
  AppConfig._();

  static const String appName = 'Market Sphere Group';
  static const String tagline = 'Master Your Field for Relevance';
  static const String siteUrl = 'https://marketspheregroup.com/';
  /// Hosted JSON the app polls for newer APK builds (see /public/app/).
  static const String appVersionUrl = '${siteUrl}app/version.json';
  static const String appApkUrl = '${siteUrl}app/market-sphere.apk';
  static const String supportEmail = 'info@marketspheregroup.com';
  static const String supportPhone = '+267 74013060';

  /// Deep link for Supabase Google OAuth (add this URL in Supabase Auth redirect allow-list).
  static const String oauthRedirectUrl = 'com.marketspheregroup.market_sphere://login-callback/';

  /// Email confirmation redirect for the Android app only (website uses /auth/verify).
  /// Add the same URL in Supabase Auth → Redirect URLs.
  static const String emailConfirmRedirectUrl =
      'com.marketspheregroup.market_sphere://auth/verified';

  static const String registration = 'UIN BW00000887185';
  static const String headOffice = 'Gaborone, Botswana';
  static const String address =
      '10102 MAFULO House, next to Old Prison Headquarters, Taung Broadhurst, Gaborone, Botswana';
  static const String overview =
      'Market Sphere Group (Pty) Ltd provides professional and socio-economic services across entrepreneurship, music education, real estate, career development, academic tuition, youth empowerment, platform marketing, and farming practice.';
  static const List<String> coreValues = [
    'Botho',
    'Professionalism',
    'Customer satisfaction',
    'Innovation',
    'Excellence',
    'Empowerment',
    'Reliability',
    'Sustainable growth',
  ];

  static const int colorNight = 0xFF0E1116;
  static const int colorDay = 0xFFFAF8F4;
  static const int colorGold = 0xFFC9A24B;
  static const int colorGoldLight = 0xFFE8D5A0;
  static const int colorSand = 0xFFE8DCC4;
  /// Warm accent for prices / labels on dark surfaces (readable).
  static const int colorBronze = 0xFFE0C57A;
  static const int colorText = 0xFFF7F0E4;
  static const int colorTextSecondary = 0xFFD8C9A8;
  static const int colorMuted = 0xFFC4B89A;

  /// TEMP test switch: when true, schedules reminders in minutes (not days).
  /// Set back to `false` before shipping a public build.
  static const bool missYouTestMode = false;
  static const List<int> missYouAfterDays = [2, 5, 10];
  /// Used only while [missYouTestMode] is true.
  static const List<int> missYouTestAfterMinutes = [1, 2, 3];
  /// Android `res/raw` name (no extension) for the custom notification chime.
  static const String notificationSoundRaw = 'notif_sound';
  /// Bumped when sound/channel settings change (Android locks channel sound forever).
  static const String alertsChannelId = 'engagement_alerts_v3';
  static const String alertsChannelName = 'Market Sphere alerts';
  static const String alertsChannelDescription =
      'New listings, price changes, availability, enquiries, and nearby providers.';
  static const String missYouChannelId = 'miss_you_v3';
  static const String missYouChannelName = 'We miss you';
  static const String missYouChannelDescription =
      'Friendly reminders to come back to Market Sphere Group.';
}
