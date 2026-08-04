import 'dart:async';
import 'package:flutter/material.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:telvo/config/routes.dart';
import 'package:telvo/services/notification_service.dart';
import 'package:telvo/services/app_navigator.dart';
import 'package:telvo/widgets/notification_banner.dart';

class ForegroundNotificationManager {
  static ForegroundNotificationManager? _instance;
  factory ForegroundNotificationManager() => _instance ??= ForegroundNotificationManager._internal();
  ForegroundNotificationManager._internal();

  OverlayEntry? _currentEntry;
  Timer? _dismissTimer;

  void initialize() {
    // Start listening to notification stream
    NotificationService().onMessageStream.listen((message) {
      showMessage(message);
    }, onError: (e) {
      debugPrint('ForegroundNotificationManager stream error: $e');
    });
  }

  void showMessage(RemoteMessage message) {
    try {
      final data = Map<String, dynamic>.from(message.data ?? {});
      final title = message.notification?.title ?? (data['title'] is String ? data['title'] as String : '');
      final body = message.notification?.body ?? (data['body'] is String ? data['body'] as String : '');
      final image = data['senderPhotoUrl'] as String? ?? data['image'] as String?;
      final type = data['type'] as String?;

      final overlayState = navigatorKey.currentState?.overlay;
      if (overlayState == null) return;

      // Remove existing banner if any
      _removeCurrentEntry();

      _currentEntry = OverlayEntry(builder: (context) {
        return Positioned(
          top: 0,
          left: 0,
          right: 0,
          child: NotificationBanner(
            imageUrl: image,
            title: title,
            body: body,
            type: type,
            data: data,
            onTap: () {
              _handleTap(type, data);
              _removeCurrentEntry();
            },
          ),
        );
      });

      overlayState.insert(_currentEntry!);

      _dismissTimer = Timer(const Duration(seconds: 4), () {
        _removeCurrentEntry();
      });
    } catch (e) {
      debugPrint('Error showing banner: $e');
    }
  }

  void _removeCurrentEntry() {
    try {
      _dismissTimer?.cancel();
      _dismissTimer = null;
      _currentEntry?.remove();
      _currentEntry = null;
    } catch (e) {
      // ignore
    }
  }

  void _handleTap(String? type, Map<String, dynamic>? data) {
    final ctx = navigatorKey.currentContext;
    if (ctx == null) return;

    try {
      if (type == 'chat') {
        final thread = data?['thread'] ?? data?['chatId'] ?? data?['threadId'];
        Navigator.pushNamed(ctx, AppRoutes.chat, arguments: thread);
        return;
      }

      if (type == 'new_job' || type == 'job_update' || type == 'job_completed') {
        // If jobId present, try to open job tracking or job details
        final jobId = data?['jobId'];
        if (jobId != null) {
          // Many screens expect a job object; fallback to notifications list which can navigate further
          Navigator.pushNamed(ctx, AppRoutes.notifications);
          return;
        }
      }

      if (type == 'payment' || type == 'job_completed') {
        Navigator.pushNamed(ctx, AppRoutes.payment);
        return;
      }

      // Default fallback: open notifications screen
      Navigator.pushNamed(ctx, AppRoutes.notifications);
    } catch (e) {
      debugPrint('Error handling banner tap: $e');
    }
  }
}
