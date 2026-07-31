import 'package:supabase_flutter/supabase_flutter.dart';

import 'data_repository.dart';

/// Push scaffolding.
///
/// Today: registers a local device token row (migration) and relies on
/// Supabase Realtime → [AlertNotificationService] for engagement alerts.
/// With Firebase later: store FCM token in `device_tokens` and fan out from
/// an Edge Function on `notifications` inserts.
class PushService {
  PushService._();
  static final PushService instance = PushService._();

  var enabled = true;

  Future<void> init({String? userId}) async {
    if (userId == null) return;
    // Stable per-install placeholder until Firebase Messaging is wired.
    final token = 'local-${userId.substring(0, 8)}-android';
    await DataRepository().upsertDeviceToken(userId: userId, token: token);
  }

  Future<void> syncForUser(String? userId) async {
    if (userId == null) return;
    await init(userId: userId);
    // Keep session warm for realtime notification inserts.
    Supabase.instance.client.auth.currentSession;
  }
}
