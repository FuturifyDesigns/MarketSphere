import 'package:flutter/material.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:timezone/timezone.dart' as tz;

import '../config.dart';

/// Schedules friendly local "We miss you" reminders when the user leaves the app.
class MissYouService {
  MissYouService._();
  static final MissYouService instance = MissYouService._();

  static const _prefsLastOpenKey = 'miss_you_last_open_ms';
  static const _notificationBaseId = 4200;

  final FlutterLocalNotificationsPlugin _plugin = FlutterLocalNotificationsPlugin();
  var _ready = false;

  static const _messages = <(String, String)>[
    (
      'We miss you at Market Sphere',
      'New opportunities and providers are waiting. Open the app and explore what\'s new.',
    ),
    (
      'Still looking for the right fit?',
      'Browse verified listings and send enquiries in minutes — we\'re here when you are.',
    ),
    (
      'Master your field with Market Sphere',
      'Come back for fresh showcase listings, services, and local opportunities in Botswana.',
    ),
  ];

  Future<void> init() async {
    if (_ready) return;

    const androidInit = AndroidInitializationSettings('@mipmap/ic_launcher');
    const initSettings = InitializationSettings(android: androidInit);

    await _plugin.initialize(initSettings);

    final android = _plugin.resolvePlatformSpecificImplementation<
        AndroidFlutterLocalNotificationsPlugin>();
    await android?.createNotificationChannel(
      const AndroidNotificationChannel(
        AppConfig.missYouChannelId,
        AppConfig.missYouChannelName,
        description: AppConfig.missYouChannelDescription,
        importance: Importance.defaultImportance,
      ),
    );
    await android?.requestNotificationsPermission();

    _ready = true;
  }

  Future<void> markAppOpened() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setInt(_prefsLastOpenKey, DateTime.now().millisecondsSinceEpoch);
    await cancelReminders();
  }

  Future<void> cancelReminders() async {
    if (!_ready) await init();
    for (var i = 0; i < AppConfig.missYouAfterDays.length; i++) {
      await _plugin.cancel(_notificationBaseId + i);
    }
  }

  Future<void> scheduleReminders() async {
    if (!_ready) await init();
    await cancelReminders();

    final now = tz.TZDateTime.now(tz.local);

    for (var i = 0; i < AppConfig.missYouAfterDays.length; i++) {
      final days = AppConfig.missYouAfterDays[i];
      final message = _messages[i % _messages.length];
      final when = now.add(Duration(days: days));
      // Prefer late morning local time.
      final scheduled = tz.TZDateTime(
        tz.local,
        when.year,
        when.month,
        when.day,
        10,
        30,
      );

      await _plugin.zonedSchedule(
        _notificationBaseId + i,
        message.$1,
        message.$2,
        scheduled.isAfter(now) ? scheduled : scheduled.add(const Duration(days: 1)),
        NotificationDetails(
          android: AndroidNotificationDetails(
            AppConfig.missYouChannelId,
            AppConfig.missYouChannelName,
            channelDescription: AppConfig.missYouChannelDescription,
            importance: Importance.defaultImportance,
            priority: Priority.defaultPriority,
            icon: '@mipmap/ic_launcher',
            color: const Color(AppConfig.colorGold),
            styleInformation: BigTextStyleInformation(message.$2),
          ),
        ),
        androidScheduleMode: AndroidScheduleMode.inexactAllowWhileIdle,
      );
    }
  }
}
