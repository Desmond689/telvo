import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:telvo/config/firebase_config.dart';
import 'package:telvo/models/user_model.dart';

class AuthService {
  final FirebaseAuth _auth = FirebaseConfig.auth;
  final FirebaseFirestore _firestore = FirebaseConfig.firestore;

  Future<UserModel?> signInWithPhone(String phoneNumber) async {
    try {
      // This would be handled with OTP verification
      return null;
    } catch (e) {
      rethrow;
    }
  }

  Future<UserModel?> signInWithGoogle() async {
    try {
      final GoogleAuthProvider googleProvider = GoogleAuthProvider();
      final userCredential = await _auth.signInWithPopup(googleProvider);
      return await _handleUserSignIn(userCredential.user);
    } catch (e) {
      rethrow;
    }
  }

  Future<UserModel?> signInWithApple() async {
    try {
      final AppleAuthProvider appleProvider = AppleAuthProvider();
      final userCredential = await _auth.signInWithPopup(appleProvider);
      return await _handleUserSignIn(userCredential.user);
    } catch (e) {
      rethrow;
    }
  }

  Future<UserModel?> signInWithFacebook() async {
    try {
      final FacebookAuthProvider facebookProvider = FacebookAuthProvider();
      final userCredential = await _auth.signInWithPopup(facebookProvider);
      return await _handleUserSignIn(userCredential.user);
    } catch (e) {
      rethrow;
    }
  }

  Future<UserModel?> _handleUserSignIn(User? user) async {
    if (user == null) return null;

    final doc = await _firestore.collection('users').doc(user.uid).get();

    if (doc.exists) {
      return UserModel.fromMap(doc.data()!);
    } else {
      final newUser = UserModel(
        id: user.uid,
        phoneNumber: user.phoneNumber,
        email: user.email,
        fullName: user.displayName,
        profilePhoto: user.photoURL,
        userType: 'customer',
        mode: 'customer',
        isPhoneVerified: user.phoneNumber != null,
        isEmailVerified: user.emailVerified,
        isSuspended: false,
        rating: 0,
        jobsCompleted: 0,
        responseRate: 0,
        responseTime: 0,
        isOnline: false,
        createdAt: DateTime.now(),
      );
      await _firestore.collection('users').doc(user.uid).set(newUser.toMap());
      return newUser;
    }
  }

  Future<void> signOut() async {
    await _auth.signOut();
  }

  Future<void> deleteAccount(String userId) async {
    await _firestore.collection('users').doc(userId).delete();
    await _auth.currentUser?.delete();
  }

  Future<UserModel?> getCurrentUser() async {
    final user = _auth.currentUser;
    if (user == null) return null;

    final doc = await _firestore.collection('users').doc(user.uid).get();
    if (doc.exists) {
      return UserModel.fromMap(doc.data()!);
    }
    return null;
  }
}
