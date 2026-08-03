package com.marketspheregroup.market_sphere

import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.media.AudioAttributes
import android.net.Uri
import android.os.Build
import android.view.WindowManager
import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodChannel

class MainActivity : FlutterActivity() {
    private val securityChannel = "com.marketspheregroup.market_sphere/security"

    override fun onCreate(savedInstanceState: android.os.Bundle?) {
        // Create channels before Flutter/FCM show notifications so custom sound sticks.
        ensureNotificationChannels(this)
        super.onCreate(savedInstanceState)
    }

    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)
        MethodChannel(flutterEngine.dartExecutor.binaryMessenger, securityChannel)
            .setMethodCallHandler { call, result ->
                when (call.method) {
                    "setSecureFlag" -> {
                        val enabled = call.argument<Boolean>("enabled") ?: false
                        if (enabled) {
                            window.setFlags(
                                WindowManager.LayoutParams.FLAG_SECURE,
                                WindowManager.LayoutParams.FLAG_SECURE,
                            )
                        } else {
                            window.clearFlags(WindowManager.LayoutParams.FLAG_SECURE)
                        }
                        result.success(null)
                    }
                    else -> result.notImplemented()
                }
            }
    }

    companion object {
        const val ALERTS_CHANNEL_ID = "engagement_alerts_v3"
        const val MISS_YOU_CHANNEL_ID = "miss_you_v3"

        fun ensureNotificationChannels(context: Context) {
            if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return

            val manager = context.getSystemService(NotificationManager::class.java) ?: return
            val soundUri = Uri.parse(
                "android.resource://${context.packageName}/${R.raw.notif_sound}",
            )
            val attrs = AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_NOTIFICATION)
                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                .build()

            val alerts = NotificationChannel(
                ALERTS_CHANNEL_ID,
                "Market Sphere alerts",
                NotificationManager.IMPORTANCE_HIGH,
            ).apply {
                description = "New listings, price changes, availability, enquiries, and nearby providers."
                setSound(soundUri, attrs)
                enableVibration(true)
            }

            val missYou = NotificationChannel(
                MISS_YOU_CHANNEL_ID,
                "We miss you",
                NotificationManager.IMPORTANCE_DEFAULT,
            ).apply {
                description = "Friendly reminders to come back to Market Sphere Group."
                setSound(soundUri, attrs)
                enableVibration(true)
            }

            manager.createNotificationChannel(alerts)
            manager.createNotificationChannel(missYou)
        }
    }
}
