/// App-wide configuration for Market Sphere Group Android.
class AppConfig {
  AppConfig._();

  static const String appName = 'Market Sphere Group';
  static const String tagline = 'Master Your Field for Relevance';
  static const String siteUrl = 'https://marketspheregroup.com/';
  static const String supportEmail = 'info@marketspheregroup.com';
  static const String supportPhone = '+267 74013060';

  /// Deep link for Supabase Google OAuth (add this URL in Supabase Auth redirect allow-list).
  static const String oauthRedirectUrl = 'com.marketspheregroup.market_sphere://login-callback/';

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

  static const List<int> missYouAfterDays = [2, 5, 10];
  static const String missYouChannelId = 'miss_you';
  static const String missYouChannelName = 'We miss you';
  static const String missYouChannelDescription =
      'Friendly reminders to come back to Market Sphere Group.';
}
