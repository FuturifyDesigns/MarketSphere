import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../firebase_options.dart';
import '../models/models.dart';
import 'alert_notification_service.dart';
import 'data_repository.dart';

@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  try {
    await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);
  } catch (_) {}
}

/// Registers FCM tokens in `device_tokens` and surfaces foreground pushes.
///
/// Server fan-out: deploy `supabase/functions/push-on-notification` and set
/// `FCM_SERVICE_ACCOUNT_JSON` (see mobile/docs/FIREBASE_PUSH_SETUP.md).
class PushService {
  PushService._();
  static final PushService instance = PushService._();

  var enabled = true;
  var _firebaseReady = false;
  var _handlersBound = false;
  String? _activeUserId;

  Future<void> init({String? userId}) async {
    _activeUserId = userId;
    await _ensureFirebase();
    if (!_firebaseReady) {
      if (userId != null) {
        final token = 'local-${userId.substring(0, 8)}-android';
        await DataRepository().upsertDeviceToken(userId: userId, token: token);
      }
      return;
    }

    final messaging = FirebaseMessaging.instance;
    await messaging.requestPermission(alert: true, badge: true, sound: true);
    await messaging.setForegroundNotificationPresentationOptions(
      alert: true,
      badge: true,
      sound: true,
    );

    if (!_handlersBound) {
      _handlersBound = true;
      FirebaseMessaging.onMessage.listen(_onForegroundMessage);
      FirebaseMessaging.onMessageOpenedApp.listen(_onOpenedMessage);
      messaging.onTokenRefresh.listen((token) async {
        final uid = _activeUserId;
        if (uid == null || !enabled) return;
        await DataRepository().upsertDeviceToken(userId: uid, token: token);
      });
    }

    if (userId != null && enabled) {
      await _registerToken(userId);
    }
  }

  Future<void> syncForUser(String? userId) async {
    _activeUserId = userId;
    if (userId == null) return;
    await init(userId: userId);
    Supabase.instance.client.auth.currentSession;
  }

  Future<void> _ensureFirebase() async {
    if (_firebaseReady) return;
    try {
      if (Firebase.apps.isEmpty) {
        await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);
      }
      _firebaseReady = true;
    } catch (e) {
      if (kDebugMode) {
        debugPrint('[push] Firebase init failed: $e');
      }
      _firebaseReady = false;
    }
  }

  Future<void> _registerToken(String userId) async {
    try {
      final token = await FirebaseMessaging.instance.getToken();
      if (token == null || token.isEmpty) return;
      await DataRepository().upsertDeviceToken(userId: userId, token: token);
      if (kDebugMode) {
        debugPrint('[push] FCM token registered (${token.length} chars)');
      }
    } catch (e) {
      if (kDebugMode) {
        debugPrint('[push] getToken failed: $e');
      }
    }
  }

  Future<void> _onForegroundMessage(RemoteMessage message) async {
    if (!enabled) return;
    final title = message.notification?.title ?? message.data['title']?.toString() ?? 'Market Sphere';
    final body = message.notification?.body ?? message.data['body']?.toString() ?? '';
    if (body.isEmpty && message.notification == null) return;

    await AlertNotificationService.instance.show(
      AppNotification(
        id: message.messageId ?? DateTime.now().millisecondsSinceEpoch.toString(),
        type: message.data['type']?.toString() ?? 'push',
        title: title,
        body: body,
        link: message.data['link']?.toString(),
        createdAt: DateTime.now(),
      ),
    );
  }

  void _onOpenedMessage(RemoteMessage message) {
    if (kDebugMode) {
      debugPrint('[push] opened message ${message.messageId} link=${message.data['link']}');
    }
  }
}
