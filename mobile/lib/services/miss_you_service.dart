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

  int get _slotCount => AppConfig.missYouTestMode
      ? AppConfig.missYouTestAfterMinutes.length
      : AppConfig.missYouAfterDays.length;

  Future<void> init() async {
    if (_ready) return;

    const androidInit = AndroidInitializationSettings('@mipmap/ic_launcher');
    const initSettings = InitializationSettings(android: androidInit);

    await _plugin.initialize(initSettings);

    final android = _plugin.resolvePlatformSpecificImplementation<
        AndroidFlutterLocalNotificationsPlugin>();
    await android?.createNotificationChannel(
      AndroidNotificationChannel(
        AppConfig.missYouChannelId,
        AppConfig.missYouChannelName,
        description: AppConfig.missYouChannelDescription,
        importance: Importance.defaultImportance,
        playSound: true,
        sound: const RawResourceAndroidNotificationSound(AppConfig.notificationSoundRaw),
        audioAttributesUsage: AudioAttributesUsage.notification,
      ),
    );
    await android?.requestNotificationsPermission();
    // Helps 1‑minute test schedules fire on time on Android 12+.
    await android?.requestExactAlarmsPermission();

    _ready = true;
  }

  Future<void> markAppOpened() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setInt(_prefsLastOpenKey, DateTime.now().millisecondsSinceEpoch);
    await cancelReminders();
  }

  Future<void> cancelReminders() async {
    if (!_ready) await init();
    // Cancel both production and test slots so toggling modes never leaves stragglers.
    final maxSlots = [
      AppConfig.missYouAfterDays.length,
      AppConfig.missYouTestAfterMinutes.length,
    ].reduce((a, b) => a > b ? a : b);
    for (var i = 0; i < maxSlots; i++) {
      await _plugin.cancel(_notificationBaseId + i);
    }
  }

  Future<void> scheduleReminders() async {
    if (!_ready) await init();
    await cancelReminders();

    final now = tz.TZDateTime.now(tz.local);
    final test = AppConfig.missYouTestMode;

    for (var i = 0; i < _slotCount; i++) {
      final message = _messages[i % _messages.length];
      final tz.TZDateTime scheduled;
      if (test) {
        final minutes = AppConfig.missYouTestAfterMinutes[i];
        scheduled = now.add(Duration(minutes: minutes));
      } else {
        final days = AppConfig.missYouAfterDays[i];
        final when = now.add(Duration(days: days));
        // Prefer late morning local time.
        var at = tz.TZDateTime(tz.local, when.year, when.month, when.day, 10, 30);
        if (!at.isAfter(now)) {
          at = at.add(const Duration(days: 1));
        }
        scheduled = at;
      }

      await _plugin.zonedSchedule(
        _notificationBaseId + i,
        test ? '[TEST] ${message.$1}' : message.$1,
        message.$2,
        scheduled,
        NotificationDetails(
          android: AndroidNotificationDetails(
            AppConfig.missYouChannelId,
            AppConfig.missYouChannelName,
            channelDescription: AppConfig.missYouChannelDescription,
            importance: Importance.defaultImportance,
            priority: Priority.defaultPriority,
            playSound: true,
            sound: const RawResourceAndroidNotificationSound(AppConfig.notificationSoundRaw),
            icon: '@mipmap/ic_launcher',
            color: const Color(AppConfig.colorGold),
            styleInformation: BigTextStyleInformation(message.$2),
          ),
        ),
        androidScheduleMode: test
            ? AndroidScheduleMode.exactAllowWhileIdle
            : AndroidScheduleMode.inexactAllowWhileIdle,
      );
    }
  }
}
