import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:telvo/models/user_model.dart';

class UserProvider extends ChangeNotifier {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;

  List<UserModel> _professionals = [];
  List<UserModel> _favorites = [];
  UserModel? _selectedProfessional;
  bool _isLoading = false;
  String? _error;

  List<UserModel> get professionals => _professionals;
  List<UserModel> get favorites => _favorites;
  UserModel? get selectedProfessional => _selectedProfessional;
  bool get isLoading => _isLoading;
  String? get error => _error;

  Stream<List<UserModel>> getProfessionals({
    String? category,
    String? area,
    double? minRating,
    bool? onlineOnly,
  }) {
    final currentUserId = FirebaseAuth.instance.currentUser?.uid;
    Query<Map<String, dynamic>> query = _firestore
        .collection('users')
        .where('userType', whereIn: ['professional', 'both']);

    if (category != null) {
      query = query.where('category', isEqualTo: category);
    }
    if (area != null) {
      query = query.where('serviceAreas', arrayContains: area);
    }
    if (onlineOnly ?? false) {
      query = query.where('isOnline', isEqualTo: true);
    }

    return query.snapshots().map((snapshot) {
      final users = snapshot.docs
          .map((doc) {
            final user = UserModel.fromMap(doc.data());
            return user.copyWith(id: doc.id);
          })
          .where((user) {
            if (currentUserId != null && user.id == currentUserId) {
              return false;
            }
            if (minRating != null && (user.rating ?? 0) < minRating) {
              return false;
            }
            return true;
          })
          .toList();

      // Sort by rating
      users.sort((a, b) => (b.rating ?? 0).compareTo(a.rating ?? 0));

      _professionals = users;
      return users;
    });
  }

  Future<void> refreshProfessionals({
    String? category,
    String? area,
    double? minRating,
    bool? onlineOnly,
  }) async {
    try {
      _setLoading(true);
      final currentUserId = FirebaseAuth.instance.currentUser?.uid;
      Query<Map<String, dynamic>> query = _firestore
          .collection('users')
          .where('userType', whereIn: ['professional', 'both']);

      if (category != null)
        query = query.where('category', isEqualTo: category);
      if (area != null)
        query = query.where('serviceAreas', arrayContains: area);
      if (onlineOnly ?? false) query = query.where('isOnline', isEqualTo: true);

      final snapshot = await query.get();
      final users = snapshot.docs
          .map((doc) {
            final user = UserModel.fromMap(doc.data());
            return user.copyWith(id: doc.id);
          })
          .where((user) {
            if (currentUserId != null && user.id == currentUserId) {
              return false;
            }
            if (minRating != null && (user.rating ?? 0) < minRating) {
              return false;
            }
            return true;
          })
          .toList();
      users.sort((a, b) => (b.rating ?? 0).compareTo(a.rating ?? 0));
      _professionals = users;
      _setLoading(false);
      notifyListeners();
    } catch (e) {
      _setError(e.toString());
      _setLoading(false);
    }
  }

  Future<void> getProfessionalDetails(String userId) async {
    try {
      _setLoading(true);
      _setError(null);

      final doc = await _firestore.collection('users').doc(userId).get();
      if (doc.exists) {
        _selectedProfessional = UserModel.fromMap(doc.data()!).copyWith(id: doc.id);
      }

      _setLoading(false);
      notifyListeners();
    } catch (e) {
      _setError(e.toString());
      _setLoading(false);
    }
  }

  Future<void> addToFavorites(String userId, String professionalId) async {
    try {
      await _firestore.collection('users').doc(userId).update({
        'favorites': FieldValue.arrayUnion([professionalId]),
      });
    } catch (e) {
      _setError(e.toString());
    }
  }

  Future<void> removeFromFavorites(String userId, String professionalId) async {
    try {
      await _firestore.collection('users').doc(userId).update({
        'favorites': FieldValue.arrayRemove([professionalId]),
      });
    } catch (e) {
      _setError(e.toString());
    }
  }

  Future<List<UserModel>> getFavorites(String userId) async {
    try {
      _setLoading(true);
      _setError(null);

      final doc = await _firestore.collection('users').doc(userId).get();
      if (!doc.exists) {
        _favorites = [];
        _setLoading(false);
        notifyListeners();
        return [];
      }

      final favoriteIds = List<String>.from(doc.data()?['favorites'] ?? []);
      if (favoriteIds.isEmpty) {
        _favorites = [];
        _setLoading(false);
        notifyListeners();
        return [];
      }

      final snapshot = await _firestore
          .collection('users')
          .where(FieldPath.documentId, whereIn: favoriteIds)
          .get();

      _favorites = snapshot.docs
          .map((doc) => UserModel.fromMap(doc.data()).copyWith(id: doc.id))
          .toList();
      _setLoading(false);
      notifyListeners();
      return _favorites;
    } catch (e) {
      _setError(e.toString());
      _setLoading(false);
      return [];
    }
  }

  Future<void> reportUser(String userId, String reason) async {
    try {
      await _firestore.collection('reports').add({
        'userId': userId,
        'reason': reason,
        'reportedAt': FieldValue.serverTimestamp(),
        'status': 'pending',
      });
    } catch (e) {
      _setError(e.toString());
    }
  }

  Future<void> blockUser(String userId, String blockedId) async {
    try {
      await _firestore.collection('users').doc(userId).update({
        'blockedUsers': FieldValue.arrayUnion([blockedId]),
      });
    } catch (e) {
      _setError(e.toString());
    }
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
