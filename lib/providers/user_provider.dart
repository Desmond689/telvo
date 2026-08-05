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

      try {
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
      } on FirebaseException catch (e) {
        final msg = e.message ?? e.toString();
        if (msg.toLowerCase().contains('requires an index') || e.code == 'failed-precondition') {
          // Fall back to a simpler query ordering only by rating to avoid composite index requirement.
          try {
            Query<Map<String, dynamic>> fallback = _firestore
                .collection('users')
                .where('userType', whereIn: ['professional', 'both']);

            if (category != null) fallback = fallback.where('category', isEqualTo: category);
            if (area != null) fallback = fallback.where('serviceAreas', arrayContains: area);
            if (city != null) fallback = fallback.where('city', isEqualTo: city);
            if (verifiedOnly ?? false) fallback = fallback.where('isVerified', isEqualTo: true);
            if (onlineOnly ?? false) fallback = fallback.where('isOnline', isEqualTo: true);
            if (availabilityStatus != null && availabilityStatus.isNotEmpty) fallback = fallback.where('availabilityStatus', isEqualTo: availabilityStatus);
            if (minRating != null) fallback = fallback.where('rating', isGreaterThanOrEqualTo: minRating);
            if (minPrice != null) fallback = fallback.where('startingPrice', isGreaterThanOrEqualTo: minPrice);
            if (maxPrice != null) fallback = fallback.where('startingPrice', isLessThanOrEqualTo: maxPrice);

            final snap2 = await fallback.orderBy('rating', descending: true).get();
            final users2 = snap2.docs
                .map((doc) => UserModel.fromMap(doc.data()).copyWith(id: doc.id))
                .where((user) => !(currentUserId != null && user.id == currentUserId))
                .toList();
            _professionals = users2;
            _setError('Some advanced sorting requires a Firestore composite index. Showing a simplified result sorted by rating.');
            _setLoading(false);
            notifyListeners();
            return;
          } catch (e2) {
            _setError(e2.toString());
            _setLoading(false);
            return;
          }
        }
        _setError(e.toString());
        _setLoading(false);
      } catch (e) {
        _setError(e.toString());
        _setLoading(false);
      }
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

    try {
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
    } on FirebaseException catch (e) {
      // Firestore often requires a composite index for complex orderBy combinations.
      final msg = e.message ?? e.toString();
      if (msg.toLowerCase().contains('requires an index') || e.code == 'failed-precondition') {
        // Fallback: run a simpler query ordering only by rating to avoid index requirements.
        try {
          Query<Map<String, dynamic>> fallback = _firestore
              .collection('users')
              .where('userType', whereIn: ['professional', 'both']);

          if (category != null) fallback = fallback.where('category', isEqualTo: category);
          if (area != null) fallback = fallback.where('serviceAreas', arrayContains: area);
          if (city != null) fallback = fallback.where('city', isEqualTo: city);
          if (verifiedOnly ?? false) fallback = fallback.where('isVerified', isEqualTo: true);
          if (onlineOnly ?? false) fallback = fallback.where('isOnline', isEqualTo: true);
          if (availabilityStatus != null && availabilityStatus.isNotEmpty) fallback = fallback.where('availabilityStatus', isEqualTo: availabilityStatus);
          if (minRating != null) fallback = fallback.where('rating', isGreaterThanOrEqualTo: minRating);
          if (minPrice != null) fallback = fallback.where('startingPrice', isGreaterThanOrEqualTo: minPrice);
          if (maxPrice != null) fallback = fallback.where('startingPrice', isLessThanOrEqualTo: maxPrice);

          fallback = fallback.orderBy('rating', descending: true).limit(limit);
          if (startAfter != null) fallback = fallback.startAfterDocument(startAfter);

          final snap2 = await fallback.get();
          final workers2 = snap2.docs
              .map((doc) => UserModel.fromMap(doc.data()).copyWith(id: doc.id))
              .where((user) => !(currentUserId != null && user.id == currentUserId))
              .toList();

          final lastDoc2 = snap2.docs.isNotEmpty ? snap2.docs.last : null;
          final deduped2 = <String, UserModel>{};
          for (var p in workers2) {
            if (p.id != null) deduped2[p.id!] = p;
          }

          // Surface a helpful error so the UI can show a link to create the index if desired.
          _setError('A faster professional query is available but requires a Firestore composite index. Showing a simplified result sorted by rating. To remove this message, create the composite index shown in the Firebase console error logs.');

          return ProfessionalPage(
            professionals: deduped2.values.toList(),
            lastDocument: lastDoc2,
            hasMore: snap2.docs.length == limit,
          );
        } catch (e2) {
          rethrow;
        }
      }
      rethrow;
    } catch (e) {
      rethrow;
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
