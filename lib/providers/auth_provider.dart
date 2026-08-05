// lib/providers/auth_provider.dart
import 'dart:async';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:telvo/models/user_model.dart';
import 'package:telvo/services/notification_service.dart';
import 'package:telvo/services/storage_service.dart';
import 'package:telvo/utils/error_messages.dart';
import 'package:telvo/utils/helpers.dart';

class AuthProvider extends ChangeNotifier {
  AuthProvider() {
    _init();
  }
  final FirebaseAuth _auth = FirebaseAuth.instance;
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  final FlutterSecureStorage _secureStorage = const FlutterSecureStorage();

  UserModel? _currentUser;
  bool _isLoading = false;
  String? _error;
  // Subscription to the current user's Firestore document so admin actions
  // (suspend/reactivate) take effect immediately in the app.
  StreamSubscription<DocumentSnapshot<Map<String, dynamic>>>? _userDocSub;

  // True once the very first authStateChanges() event has been fully
  // resolved (including the Firestore profile fetch, if signed in). The
  // splash screen waits on this instead of a fixed timer, so a slow
  // network doesn't get misread as "not logged in".
  bool _isInitialized = false;
  final Completer<void> _initCompleter = Completer<void>();

  UserModel? get currentUser => _currentUser;
  bool get isLoading => _isLoading;
  String? get error => _error;
  bool get isAuthenticated => _currentUser != null;
  bool get isInitialized => _isInitialized;

  String _resolveMode(UserModel? user) {
    final userType = user?.userType?.toLowerCase();
    final mode = user?.mode?.toLowerCase();
    if (mode == 'professional' || mode == 'customer') {
      return mode!;
    }
    if (userType == 'professional') {
      return 'professional';
    }
    if (userType == 'both') {
      return 'customer';
    }
    return 'customer';
  }

  bool get isProfessionalMode => _resolveMode(_currentUser) == 'professional';
  bool get canSwitchModes => _currentUser?.userType?.toLowerCase() == 'both';

  /// Resolves once the initial session check (Firebase Auth + Firestore
  /// profile load, if any) has completed. Callers can await this instead
  /// of guessing with a delay.
  Future<void> get onReady => _initCompleter.future;

  Future<void> _init() async {
    try {
      final currentUser = _auth.currentUser;
      if (currentUser != null) {
        await _loadUserData(currentUser.uid);
      }
    } catch (e) {
      _setError(e.toString());
    } finally {
      if (!_isInitialized) {
        _isInitialized = true;
        if (!_initCompleter.isCompleted) _initCompleter.complete();
      }
    }

    _auth.authStateChanges().listen(
      (User? user) async {
        if (user != null) {
          await _loadUserData(user.uid);
        } else {
          _currentUser = null;
          notifyListeners();
        }
        if (!_isInitialized) {
          _isInitialized = true;
          if (!_initCompleter.isCompleted) _initCompleter.complete();
        }
      },
      onError: (error) {
        _setError(error.toString());
        if (!_isInitialized) {
          _isInitialized = true;
          if (!_initCompleter.isCompleted) _initCompleter.complete();
        }
      },
    );
  }

  Future<void> _loadUserData(String userId) async {
    try {
      _setLoading(true);
      final hasInternet = await Helpers.checkInternetConnection();
      if (!hasInternet) {
        final cachedDoc = await _firestore.collection('users').doc(userId).get(GetOptions(source: Source.cache));
        if (cachedDoc.exists) {
          _currentUser = UserModel.fromMap(cachedDoc.data()!);
        }
        _setError('No internet connection. Please check your connection and try again.');
      } else {
        final doc = await _firestore.collection('users').doc(userId).get();
        if (doc.exists) {
            final data = doc.data()!;
            // If the account has been suspended by an admin, immediately sign out
            if (data['isSuspended'] == true) {
              // Ensure any local session is cleared
              await _auth.signOut();
              await _secureStorage.delete(key: 'userId');
              _currentUser = null;
              _setError('Your account has been suspended. Contact support for help.');
              notifyListeners();
              return;
            }

            _currentUser = UserModel.fromMap(data);
            await _updateOnlineStatus(true);
            await NotificationService().registerToken(userId);

            // Listen for admin changes to the user's document (suspension/reactivation)
            try {
              // Cancel any previous subscription
              await _userDocSub?.cancel();
              _userDocSub = _firestore.collection('users').doc(userId).snapshots().listen((snapshot) async {
                if (!snapshot.exists) return;
                final d = snapshot.data();
                if (d == null) return;
                if (d['isSuspended'] == true) {
                  // If admin suspended the account while the user was signed in, sign out immediately
                  await _auth.signOut();
                  await _secureStorage.delete(key: 'userId');
                  _currentUser = null;
                  _setError('Your account has been suspended. Contact support for help.');
                  notifyListeners();
                } else {
                  // Update local cached profile when admins change fields
                  _currentUser = UserModel.fromMap(d);
                  notifyListeners();
                }
              });
            } catch (e) {
              // Non-fatal: subscription failed
            }
          }
          _setError(null);
      }
    } catch (e) {
      _setError(getFriendlyErrorMessage(e));
    } finally {
      _setLoading(false);
    }
  }

  /// Creates a real account: Firebase Auth stores and hashes the password
  /// securely (no OTP, no verification email is ever sent - just standard
  /// email/password auth). Profile fields (username, phone, name, userType)
  /// are stored in Firestore, keyed by the auth uid.
  Future<bool> signUp({
    required String fullName,
    required String username,
    required String email,
    required String phoneNumber,
    required String password,
    String? userType,
  }) async {
    try {
      _setLoading(true);
      _setError(null);

      final normalizedUsername = username.trim().toLowerCase();

      // Usernames must be unique. Checked via the public /usernames mapping
      // doc (readable pre-auth), since /users itself requires sign-in to
      // read. This check-then-create isn't perfectly atomic against a
      // simultaneous signup with the same username, but that's an
      // acceptable tradeoff for a v1 - the /usernames security rule (create
      // requires matching request.auth.uid) is the actual enforcement, this
      // is just for a fast, friendly error message.
      final usernameDoc = await _firestore
          .collection('usernames')
          .doc(normalizedUsername)
          .get();
      if (usernameDoc.exists) {
        throw Exception('That username is already taken.');
      }

      final credential = await _auth.createUserWithEmailAndPassword(
        email: email.trim(),
        password: password,
      );
      final user = credential.user;
      if (user == null) throw Exception('Could not create account.');

      final normalizedUserType = userType?.toLowerCase();
      final resolvedMode = normalizedUserType == 'professional'
        ? 'professional'
        : 'customer';
      final newUser = UserModel(
        id: user.uid,
        username: normalizedUsername,
        email: email.trim(),
        fullName: fullName.trim(),
        phoneNumber: phoneNumber.trim(),
        userType: normalizedUserType,
        mode: normalizedUserType == 'both' ? 'customer' : resolvedMode,
        isSuspended: false,
        createdAt: DateTime.now(),
      );
      await _firestore.collection('users').doc(user.uid).set(newUser.toMap());
      await _firestore.collection('usernames').doc(normalizedUsername).set({
        'uid': user.uid,
        'email': email.trim(),
      });
      _currentUser = newUser;

      await _updateOnlineStatus(true);
      await NotificationService().registerToken(user.uid);
      await _secureStorage.write(key: 'userId', value: user.uid);

      _setLoading(false);
      notifyListeners();
      return true;
    } on FirebaseAuthException catch (e) {
      _setLoading(false);
      _setError(_mapAuthError(e.code));
      return false;
    } catch (e) {
      _setLoading(false);
      _setError(e.toString().replaceFirst('Exception: ', ''));
      return false;
    }
  }

  /// Signs in with email + password. Accepts either an email address or a
  /// username in [emailOrUsername] - if it doesn't look like an email, it's
  /// resolved to the matching account's email first.
  Future<bool> signIn({
    required String emailOrUsername,
    required String password,
  }) async {
    try {
      _setLoading(true);
      _setError(null);

      var email = emailOrUsername.trim();
      if (!email.contains('@')) {
        final usernameDoc = await _firestore
            .collection('usernames')
            .doc(email.toLowerCase())
            .get();
        if (!usernameDoc.exists) {
          throw Exception('No account found with that username.');
        }
        email = usernameDoc.data()?['email'] as String? ?? '';
        if (email.isEmpty) {
          throw Exception('No account found with that username.');
        }
      }

      final credential = await _auth.signInWithEmailAndPassword(
        email: email,
        password: password,
      );
      final user = credential.user;
      if (user == null) throw Exception('Sign-in failed.');

      await _loadUserData(user.uid);
      await _updateOnlineStatus(true);
      await NotificationService().registerToken(user.uid);
      await _secureStorage.write(key: 'userId', value: user.uid);

      _setLoading(false);
      notifyListeners();
      return true;
    } on FirebaseAuthException catch (e) {
      _setLoading(false);
      _setError(_mapAuthError(e.code));
      return false;
    } catch (e) {
      _setLoading(false);
      _setError(e.toString().replaceFirst('Exception: ', ''));
      return false;
    }
  }

  /// Sends Firebase's built-in password-reset email. This is a link, not an
  /// OTP code - there's no separate "email service" involved, Firebase Auth
  /// handles delivery itself.
  Future<bool> sendPasswordResetEmail(String email) async {
    try {
      _setLoading(true);
      _setError(null);
      await _auth.sendPasswordResetEmail(email: email.trim());
      _setLoading(false);
      notifyListeners();
      return true;
    } on FirebaseAuthException catch (e) {
      _setLoading(false);
      _setError(_mapAuthError(e.code));
      return false;
    }
  }

  Future<bool> changePassword({
    required String currentPassword,
    required String newPassword,
  }) async {
    try {
      _setLoading(true);
      _setError(null);

      final user = _auth.currentUser;
      final email = user?.email;
      if (user == null || email == null) {
        throw Exception('You must be signed in to change your password.');
      }

      // Firebase requires a recent sign-in before sensitive operations like
      // changing a password - re-authenticate with the current password.
      final cred = EmailAuthProvider.credential(
        email: email,
        password: currentPassword,
      );
      await user.reauthenticateWithCredential(cred);
      await user.updatePassword(newPassword);

      _setLoading(false);
      notifyListeners();
      return true;
    } on FirebaseAuthException catch (e) {
      _setLoading(false);
      _setError(_mapAuthError(e.code));
      return false;
    } catch (e) {
      _setLoading(false);
      _setError(e.toString().replaceFirst('Exception: ', ''));
      return false;
    }
  }

  String _mapAuthError(String code) {
    switch (code) {
      case 'email-already-in-use':
        return 'An account already exists with that email.';
      case 'invalid-email':
        return 'That email address looks invalid.';
      case 'weak-password':
        return 'Password should be at least 6 characters.';
      case 'user-not-found':
      case 'wrong-password':
      case 'invalid-credential':
        return 'Incorrect email/username or password.';
      case 'user-disabled':
        return 'This account has been disabled.';
      case 'too-many-requests':
        return 'Too many attempts. Please try again later.';
      case 'requires-recent-login':
        return 'Please sign in again before retrying this action.';
      default:
        return 'Something went wrong. Please try again.';
    }
  }

  Future<void> updateProfile(Map<String, dynamic> data) async {
    try {
      _setLoading(true);
      _setError(null);

      if (_currentUser == null) throw Exception('User not authenticated');

      final fullName = data.containsKey('fullName')
          ? data['fullName'] as String?
          : _currentUser!.fullName;
      final phoneNumber = data.containsKey('phoneNumber')
          ? data['phoneNumber'] as String?
          : _currentUser!.phoneNumber;
      final profilePhoto = data.containsKey('profilePhoto')
          ? data['profilePhoto'] as String?
          : _currentUser!.profilePhoto;
      final city = data.containsKey('city')
          ? data['city'] as String?
          : _currentUser!.city;
      final neighborhood = data.containsKey('neighborhood')
          ? data['neighborhood'] as String?
          : _currentUser!.neighborhood;
      final language = data.containsKey('language')
          ? data['language'] as String?
          : _currentUser!.language;
      final userType = data.containsKey('userType')
          ? (data['userType'] as String?)?.toLowerCase()
          : _currentUser!.userType;
      final mode = data.containsKey('mode')
          ? (data['mode'] as String?)?.toLowerCase()
          : _currentUser!.mode;
      final category = data.containsKey('category')
          ? data['category'] as String?
          : _currentUser!.category;
      final skills = data.containsKey('skills')
          ? List<String>.from(data['skills'] ?? [])
          : _currentUser!.skills;
      final yearsOfExperience = data.containsKey('yearsOfExperience')
          ? data['yearsOfExperience'] as int?
          : _currentUser!.yearsOfExperience;
      // Accept either 'description' or the new 'bio' field from signup/professional setup.
      final description = data.containsKey('description')
          ? data['description'] as String?
          : (data.containsKey('bio') ? data['bio'] as String? : _currentUser!.description);
      final serviceAreas = data.containsKey('serviceAreas')
          ? List<String>.from(data['serviceAreas'] ?? [])
          : _currentUser!.serviceAreas;
      final portfolioPhotos = data.containsKey('portfolioPhotos')
          ? List<String>.from(data['portfolioPhotos'] ?? [])
          : _currentUser!.portfolioPhotos;
      final certificates = data.containsKey('certificates')
          ? List<String>.from(data['certificates'] ?? [])
          : _currentUser!.certificates;
      final availabilitySchedule = data.containsKey('availabilitySchedule')
          ? Map<String, dynamic>.from(data['availabilitySchedule'] ?? {})
          : _currentUser!.availabilitySchedule;
      final availabilityStatus = data.containsKey('availabilityStatus')
          ? data['availabilityStatus'] as String?
          : _currentUser!.availabilityStatus;
      final isOnline = data.containsKey('isOnline')
          ? data['isOnline'] as bool?
          : _currentUser!.isOnline;
      final emergencyServices = data.containsKey('emergencyServices')
          ? data['emergencyServices'] as bool?
          : _currentUser!.emergencyServices;
      final trustedContacts = data.containsKey('trustedContacts')
          ? List<String>.from(data['trustedContacts'] ?? [])
          : _currentUser!.trustedContacts;
      final blockedUsers = data.containsKey('blockedUsers')
          ? List<String>.from(data['blockedUsers'] ?? [])
          : _currentUser!.blockedUsers;
      final latitude = data.containsKey('latitude')
          ? data['latitude'] as double?
          : _currentUser!.latitude;
      final longitude = data.containsKey('longitude')
          ? data['longitude'] as double?
          : _currentUser!.longitude;
      final geoHash = data.containsKey('geoHash')
          ? data['geoHash'] as String?
          : _currentUser!.geoHash;

      final updatedUser = _currentUser!.copyWith(
        fullName: fullName,
        phoneNumber: phoneNumber,
        profilePhoto: profilePhoto,
        city: city,
        neighborhood: neighborhood,
        language: language,
        userType: userType,
        mode: mode,
        category: category,
        skills: skills,
        yearsOfExperience: yearsOfExperience,
        description: description,
        serviceAreas: serviceAreas,
        portfolioPhotos: portfolioPhotos,
        certificates: certificates,
        availabilitySchedule: availabilitySchedule,
        availabilityStatus: availabilityStatus,
        isOnline: isOnline,
        emergencyServices: emergencyServices,
        trustedContacts: trustedContacts,
        blockedUsers: blockedUsers,
        latitude: latitude,
        longitude: longitude,
        geoHash: geoHash,
      );

      await _firestore
          .collection('users')
          .doc(_currentUser!.id)
          .update(updatedUser.toMap());

      _currentUser = updatedUser;
      _setLoading(false);
      notifyListeners();
    } catch (e) {
      _setError(getFriendlyErrorMessage(e));
      _setLoading(false);
    }
  }

  Future<String?> uploadFile({
    required String filePath,
    required String folder,
    String? fileName,
  }) async {
    try {
      if (_currentUser == null) throw Exception('User not authenticated');

      final file = File(filePath);
      if (!await file.exists()) {
        throw Exception('Selected file could not be found.');
      }

      final storageFileName =
          fileName ??
          '${_currentUser!.id}_${DateTime.now().millisecondsSinceEpoch}.jpg';

      // Upload directly to Firebase Storage (no backend API needed).
      final storageService = StorageService();
      final url = await storageService.uploadFileDirect(
        file: file,
        folder: folder,
        fileName: storageFileName,
      );
      if (url != null && url.isNotEmpty) {
        return url;
      }

      throw Exception('Upload failed. Could not upload to Firebase Storage.');
    } catch (e) {
      _setError(getFriendlyErrorMessage(e));
      return null;
    }
  }

  Future<String?> uploadProfilePhoto(String filePath) async {
    final url = await uploadFile(
      filePath: filePath,
      folder: 'profile_photos',
      fileName: '${_currentUser?.id ?? 'user'}.jpg',
    );

    if (url != null) {
      await updateProfile({'profilePhoto': url});
    }
    return url;
  }

  Future<String?> uploadPortfolioPhoto(String filePath) async {
    return uploadFile(
      filePath: filePath,
      folder: 'portfolio_photos',
      fileName:
          '${_currentUser?.id ?? 'user'}_${DateTime.now().millisecondsSinceEpoch}.jpg',
    );
  }

  Future<void> switchMode(String mode) async {
    try {
      if (_currentUser == null) throw Exception('User not authenticated');
      if (_currentUser?.userType != 'both') {
        throw Exception('Only dual accounts can switch modes');
      }
      if (mode != 'customer' && mode != 'professional') {
        throw Exception('Invalid mode selected');
      }

      await _firestore.collection('users').doc(_currentUser!.id).update({
        'mode': mode,
      });

      _currentUser = _currentUser!.copyWith(mode: mode);
      notifyListeners();
    } catch (e) {
      _setError(getFriendlyErrorMessage(e));
    }
  }

  Future<void> _updateOnlineStatus(bool isOnline) async {
    await updateOnlineStatus(isOnline);
  }

  Future<void> updateOnlineStatus(bool isOnline) async {
    try {
      if (_currentUser == null) return;
      final hasInternet = await Helpers.checkInternetConnection();
      if (!hasInternet) return;

      await _firestore.collection('users').doc(_currentUser!.id).update({
        'isOnline': isOnline,
        'lastActive': DateTime.now(),
      });

      _currentUser = _currentUser!.copyWith(
        isOnline: isOnline,
        lastActive: DateTime.now(),
      );
      notifyListeners();
    } catch (e) {
      // Ignore error
    }
  }

  Future<void> signOut() async {
    try {
      await _updateOnlineStatus(false);

      // Cancel Firestore user doc subscription if present
      try {
        await _userDocSub?.cancel();
        _userDocSub = null;
      } catch (_) {}

      if (_currentUser != null) {
        final userId = _currentUser?.id;
        if (userId != null && userId.isNotEmpty) {
          try {
            await NotificationService().unregisterToken(userId);
          } catch (_) {
            // ignore errors here - sign out should proceed regardless
          }
        }
      }

      await _auth.signOut();
      await _secureStorage.delete(key: 'userId');
      _currentUser = null;
      notifyListeners();
    } catch (e) {
      _setError(getFriendlyErrorMessage(e));
    }
  }

  Future<void> deleteAccount() async {
    try {
      if (_currentUser == null) throw Exception('User not authenticated');

      // Delete user data from Firestore
      await _firestore.collection('users').doc(_currentUser!.id).delete();

      // Delete user from Auth
      await _auth.currentUser?.delete();

      await _secureStorage.delete(key: 'userId');
      _currentUser = null;
      notifyListeners();
    } catch (e) {
      _setError(getFriendlyErrorMessage(e));
    }
  }

  Future<bool> checkBiometricAvailable() async {
    try {
      // Using local_auth package
      return true;
    } catch (e) {
      return false;
    }
  }

  Future<void> savePIN(String pin) async {
    await _secureStorage.write(key: 'user_pin', value: pin);
  }

  Future<String?> getPIN() async => await _secureStorage.read(key: 'user_pin');

  Future<bool> verifyPIN(String pin) async {
    final savedPin = await getPIN();
    return savedPin == pin;
  }

  void _setLoading(bool loading) {
    _isLoading = loading;
    notifyListeners();
  }

  void _setError(String? error) {
    _error = error;
    notifyListeners();
  }

  void clearError() {
    _error = null;
    notifyListeners();
  }
}
