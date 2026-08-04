import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:telvo/models/user_model.dart';

class ProfessionalPage {
  ProfessionalPage({
    required this.professionals,
    this.lastDocument,
    required this.hasMore,
  });

  final List<UserModel> professionals;
  final QueryDocumentSnapshot<Map<String, dynamic>>? lastDocument;
  final bool hasMore;
}

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
    String? city,
    double? minRating,
    double? minPrice,
    double? maxPrice,
    String? availabilityStatus,
    bool? onlineOnly,
    bool? verifiedOnly,
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
    if (city != null) {
      query = query.where('city', isEqualTo: city);
    }
    if (verifiedOnly ?? false) {
      query = query.where('isVerified', isEqualTo: true);
    }
    if (onlineOnly ?? false) {
      query = query.where('isOnline', isEqualTo: true);
    }
    if (availabilityStatus != null && availabilityStatus.isNotEmpty) {
      query = query.where('availabilityStatus', isEqualTo: availabilityStatus);
    }
    if (minRating != null) {
      query = query.where('rating', isGreaterThanOrEqualTo: minRating);
    }
    if (minPrice != null) {
      query = query.where('startingPrice', isGreaterThanOrEqualTo: minPrice);
    }
    if (maxPrice != null) {
      query = query.where('startingPrice', isLessThanOrEqualTo: maxPrice);
    }

    query = query
        .orderBy('rating', descending: true)
        .orderBy('jobsCompleted', descending: true)
        .orderBy('isVerified', descending: true)
        .orderBy('lastActive', descending: true)
        .orderBy('createdAt');

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
            return true;
          })
          .toList();

      _professionals = users;
      return users;
    });
  }

  Future<void> refreshProfessionals({
    String? category,
    String? area,
    String? city,
    double? minRating,
    double? minPrice,
    double? maxPrice,
    String? availabilityStatus,
    bool? onlineOnly,
    bool? verifiedOnly,
  }) async {
    try {
      _setLoading(true);
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
      if (city != null) {
        query = query.where('city', isEqualTo: city);
      }
      if (verifiedOnly ?? false) {
        query = query.where('isVerified', isEqualTo: true);
      }
      if (onlineOnly ?? false) {
        query = query.where('isOnline', isEqualTo: true);
      }
      if (availabilityStatus != null && availabilityStatus.isNotEmpty) {
        query = query.where('availabilityStatus', isEqualTo: availabilityStatus);
      }
      if (minRating != null) {
        query = query.where('rating', isGreaterThanOrEqualTo: minRating);
      }
      if (minPrice != null) {
        query = query.where('startingPrice', isGreaterThanOrEqualTo: minPrice);
      }
      if (maxPrice != null) {
        query = query.where('startingPrice', isLessThanOrEqualTo: maxPrice);
      }

      query = query
          .orderBy('rating', descending: true)
          .orderBy('jobsCompleted', descending: true)
          .orderBy('isVerified', descending: true)
          .orderBy('lastActive', descending: true)
          .orderBy('createdAt');

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
            return true;
          })
          .toList();
      _professionals = users;
      _setLoading(false);
      notifyListeners();
    } catch (e) {
      _setError(e.toString());
      _setLoading(false);
    }
  }

  Future<ProfessionalPage> fetchProfessionalsPage({
    String? category,
    String? area,
    String? city,
    double? minRating,
    double? minPrice,
    double? maxPrice,
    String? availabilityStatus,
    bool? onlineOnly,
    bool? verifiedOnly,
    QueryDocumentSnapshot<Map<String, dynamic>>? startAfter,
    int limit = 10,
  }) async {
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
    if (city != null) {
      query = query.where('city', isEqualTo: city);
    }
    if (verifiedOnly ?? false) {
      query = query.where('isVerified', isEqualTo: true);
    }
    if (onlineOnly ?? false) {
      query = query.where('isOnline', isEqualTo: true);
    }
    if (availabilityStatus != null && availabilityStatus.isNotEmpty) {
      query = query.where('availabilityStatus', isEqualTo: availabilityStatus);
    }
    if (minRating != null) {
      query = query.where('rating', isGreaterThanOrEqualTo: minRating);
    }
    if (minPrice != null) {
      query = query.where('startingPrice', isGreaterThanOrEqualTo: minPrice);
    }
    if (maxPrice != null) {
      query = query.where('startingPrice', isLessThanOrEqualTo: maxPrice);
    }

    query = query
        .orderBy('rating', descending: true)
        .orderBy('jobsCompleted', descending: true)
        .orderBy('isVerified', descending: true)
        .orderBy('lastActive', descending: true)
        .orderBy('createdAt')
        .limit(limit);

    if (startAfter != null) {
      query = query.startAfterDocument(startAfter);
    }

    final snapshot = await query.get();
    final workers = snapshot.docs
        .map((doc) {
          final user = UserModel.fromMap(doc.data());
          return user.copyWith(id: doc.id);
        })
        .where((user) {
          if (currentUserId != null && user.id == currentUserId) {
            return false;
          }
          return true;
        })
        .toList();

    final lastDocument = snapshot.docs.isNotEmpty ? snapshot.docs.last : null;
    final deduped = <String, UserModel>{};
    for (var professional in workers) {
      if (professional.id != null) {
        deduped[professional.id!] = professional;
      }
    }

    return ProfessionalPage(
      professionals: deduped.values.toList(),
      lastDocument: lastDocument,
      hasMore: snapshot.docs.length == limit,
    );
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
