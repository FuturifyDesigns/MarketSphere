import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../services/alert_notification_service.dart';
import '../services/miss_you_service.dart';
import '../services/push_service.dart';

class AppSettingsController extends ChangeNotifier {
  AppSettingsController();

  static const _pushKey = 'app_push_enabled';

  var _pushEnabled = true;
  var _ready = false;

  bool get pushEnabled => _pushEnabled;
  bool get ready => _ready;

  Future<void> load() async {
    final prefs = await SharedPreferences.getInstance();
    _pushEnabled = prefs.getBool(_pushKey) ?? true;
    PushService.instance.enabled = _pushEnabled;
    AlertNotificationService.instance.setEnabled(_pushEnabled);
    _ready = true;
    notifyListeners();
  }

  Future<void> setPushEnabled(bool enabled, {String? userId}) async {
    _pushEnabled = enabled;
    notifyListeners();
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_pushKey, enabled);
    AlertNotificationService.instance.setEnabled(enabled);
    await PushService.instance.setEnabled(enabled, userId: userId);
    if (enabled) {
      await MissYouService.instance.init();
      await MissYouService.instance.scheduleReminders();
    } else {
      await MissYouService.instance.cancelReminders();
    }
  }
}
