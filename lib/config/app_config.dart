import 'package:flutter_dotenv/flutter_dotenv.dart';

class AppConfig {
  static const String appName = 'Telvo';
  static const String appVersion = '1.0.0';
  static String get apiBaseUrl =>
      dotenv.env['API_BASE_URL'] ?? 'https://api.telvo.app';
  static String get cloudinaryCloudName =>
      dotenv.env['CLOUDINARY_CLOUD_NAME'] ?? 'rxtcnv16';
  static String get cloudinaryUploadPreset =>
      dotenv.env['CLOUDINARY_UPLOAD_PRESET'] ?? '';
  static const int otpResendTimeout = 60; // seconds
  static const int maxPhotosPerJob = 10;
  static const int maxPhotosPerReview = 5;
  static const double defaultLatitude = 3.8480;
  static const double defaultLongitude = 11.5021;
  static const String defaultLanguage = 'en';
  static const String defaultCurrency = 'XAF';
  static const List<String> supportedLanguages = ['en', 'fr'];
  static const List<String> supportedCurrencies = ['XAF', 'USD', 'EUR'];

  // Feature flags
  static const bool enableAI = true;
  static const bool enableSOS = true;
  static const bool enableBiometric = true;
  static const bool enableLiveTracking = false;
  static const bool enableEscrow = false;
}
