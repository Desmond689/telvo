import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';

class FirebaseConfig {
  static FirebaseApp? _app;
  static FirebaseAuth? _auth;
  static FirebaseFirestore? _firestore;

  static Future<void> initialize() async {
    final app = await Firebase.initializeApp(
      options: FirebaseOptions(
        apiKey: dotenv.env['FIREBASE_API_KEY']!,
        appId: dotenv.env['FIREBASE_APP_ID']!,
        messagingSenderId: dotenv.env['FIREBASE_SENDER_ID']!,
        projectId: dotenv.env['FIREBASE_PROJECT_ID']!,
        authDomain: dotenv.env['FIREBASE_AUTH_DOMAIN']!,
      ),
    );

    _app = app;
    _auth = FirebaseAuth.instanceFor(app: app);
    _firestore = FirebaseFirestore.instanceFor(app: app);
  }

  static FirebaseAuth get auth => _auth!;
  static FirebaseFirestore get firestore => _firestore!;
  static FirebaseApp get app => _app!;

  static Future<void> setPersistence() async {
    await auth.setPersistence(Persistence.LOCAL);
  }
}
