import 'package:flutter/material.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';

import '../config.dart';
import '../models/models.dart';
import '../state/engagement_controller.dart';

/// Local push channel for real engagement alerts (price, availability, enquiries, etc.).
class AlertNotificationService {
  AlertNotificationService._();
  static final AlertNotificationService instance = AlertNotificationService._();

  static const channelId = AppConfig.alertsChannelId;
  static const channelName = AppConfig.alertsChannelName;
  static const channelDescription = AppConfig.alertsChannelDescription;

  final FlutterLocalNotificationsPlugin _plugin = FlutterLocalNotificationsPlugin();
  var _ready = false;
  var _enabled = true;
  var _id = 5200;

  Future<void> init({required bool enabled}) async {
    _enabled = enabled;
    if (_ready) return;

    const androidInit = AndroidInitializationSettings('@mipmap/ic_launcher');
    await _plugin.initialize(const InitializationSettings(android: androidInit));

    final android = _plugin.resolvePlatformSpecificImplementation<
        AndroidFlutterLocalNotificationsPlugin>();
    await android?.createNotificationChannel(
      AndroidNotificationChannel(
        channelId,
        channelName,
        description: channelDescription,
        importance: Importance.high,
        playSound: true,
        sound: const RawResourceAndroidNotificationSound(AppConfig.notificationSoundRaw),
        audioAttributesUsage: AudioAttributesUsage.notification,
      ),
    );

    NotificationBridge.instance.attach(show);
    _ready = true;
  }

  void setEnabled(bool enabled) => _enabled = enabled;

  Future<void> show(AppNotification note) async {
    if (!_enabled) return;
    if (!_ready) await init(enabled: _enabled);

    await _plugin.show(
      _id++,
      note.title,
      note.body,
      NotificationDetails(
        android: AndroidNotificationDetails(
          channelId,
          channelName,
          channelDescription: channelDescription,
          importance: Importance.high,
          priority: Priority.high,
          playSound: true,
          sound: const RawResourceAndroidNotificationSound(AppConfig.notificationSoundRaw),
          icon: '@mipmap/ic_launcher',
          color: const Color(AppConfig.colorGold),
          styleInformation: BigTextStyleInformation(note.body),
        ),
      ),
      payload: note.link,
    );
  }
}
