// lib/providers/job_provider.dart
import 'dart:async';

import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:telvo/models/job_model.dart';
import 'package:telvo/services/notification_service.dart';
import 'package:telvo/utils/error_messages.dart';
import 'package:telvo/utils/helpers.dart';

class JobProvider extends ChangeNotifier {
  JobProvider() {
    _init();
  }
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  final NotificationService _notificationService = NotificationService();

  List<JobModel> _jobs = [];
  List<JobModel> _myJobs = [];
  List<QuoteModel> _quotes = [];
  List<HireRequestModel> _hireRequests = [];
  bool _isLoading = false;
  String? _error;

  StreamSubscription<QuerySnapshot<Map<String, dynamic>>>?
  _customerJobsSubscription;
  StreamSubscription<QuerySnapshot<Map<String, dynamic>>>?
  _professionalJobsSubscription;
  StreamSubscription<QuerySnapshot<Map<String, dynamic>>>?
  _jobsFeedSubscription;

  List<JobModel> get jobs => _jobs;
  List<JobModel> get myJobs => _myJobs;
  List<QuoteModel> get quotes => _quotes;
  List<HireRequestModel> get hireRequests => _hireRequests;
  bool get isLoading => _isLoading;
  String? get error => _error;

  bool _shouldShowInFeed(JobModel job, {String? currentUserId}) {
    final status = job.status?.trim().toLowerCase();
    if (status != 'posted') return false;
    if (currentUserId != null && job.customerId == currentUserId) return false;
    if ((job.acceptedQuoteId ?? '').isNotEmpty) return false;
    if ((job.professionalId ?? '').isNotEmpty) return false;
    // Exclude expired jobs (older than 24 hours)
    try {
      final now = DateTime.now();
      if (job.expiresAt != null) {
        if (job.expiresAt!.isBefore(now)) return false;
      } else if (job.createdAt != null) {
        if (now.difference(job.createdAt!).inHours >= 24) return false;
      }
    } catch (_) {}
    return true;
  }

  void _init() {
    _jobsFeedSubscription = _firestore
        .collection('jobs')
        .where('status', isEqualTo: 'posted')
        .orderBy('createdAt', descending: true)
        .snapshots()
        .listen(
          (snapshot) {
            final temp = <JobModel>[];
            for (final doc in snapshot.docs) {
              try {
                final job = JobModel.fromMap({...doc.data(), 'id': doc.id});
                final showInFeed = _shouldShowInFeed(job);
                if (showInFeed) {
                  temp.add(job);
                } else {
                  if (const bool.fromEnvironment('dart.vm.product') == false) {
                    // ignore: avoid_print
                    print('Job ${doc.id} skipped from feed. status=${job.status}, customerId=${job.customerId}, professionalId=${job.professionalId}, acceptedQuoteId=${job.acceptedQuoteId}, category=${job.category}, createdAt=${job.createdAt}');
                  }
                }
              } catch (e, st) {
                // Don't let one malformed document break the whole feed.
                // Print in debug to aid diagnosis; production will swallow to avoid noisy logs.
                if (const bool.fromEnvironment('dart.vm.product') == false) {
                  // ignore: avoid_print
                  print('Job parsing error for doc ${doc.id}: $e');
                  // ignore: avoid_print
                  print(st);
                }
                continue;
              }
            }
            _jobs = temp;
            _jobs.sort((a, b) => (b.createdAt ?? DateTime.fromMillisecondsSinceEpoch(0)).compareTo(a.createdAt ?? DateTime.fromMillisecondsSinceEpoch(0)));
            notifyListeners();
          },
          onError: (e) {
            _setError(getFriendlyErrorMessage(e));
          },
        );
  }

  /// Force-refresh jobs from Firestore (one-shot). Useful for pull-to-refresh
  /// or manual refresh actions when snapshot latency isn't sufficient.
  Future<void> refreshJobs() async {
    try {
      _setLoading(true);
      final hasInternet = await Helpers.checkInternetConnection();
      if (!hasInternet) {
        _setError('No internet connection. Please check your connection and try again.');
        _setLoading(false);
        return;
      }
      final snapshot = await _firestore
          .collection('jobs')
          .where('status', isEqualTo: 'posted')
          .orderBy('createdAt', descending: true)
          .get();
      _jobs = snapshot.docs
          .map((doc) => JobModel.fromMap({...doc.data(), 'id': doc.id}))
          .where((job) => _shouldShowInFeed(job))
          .toList();
      _jobs.sort((a, b) => (b.createdAt ?? DateTime.fromMillisecondsSinceEpoch(0)).compareTo(a.createdAt ?? DateTime.fromMillisecondsSinceEpoch(0)));
      _setError(null);
      _setLoading(false);
      notifyListeners();
    } catch (e) {
      _setError(getFriendlyErrorMessage(e));
      _setLoading(false);
    }
  }

  Future<JobModel?> postJob(JobModel job) async {
    try {
      _setLoading(true);
      _setError(null);

      final docRef = _firestore.collection('jobs').doc();
      final newJob = job.copyWith(
        id: docRef.id,
        status: 'posted',
        createdAt: DateTime.now(),
      );

      // Use server timestamp for createdAt to avoid client clock issues and
      // ensure Firestore ordering by createdAt works reliably for listeners.
      final data = newJob.toMap();
      data['createdAt'] = FieldValue.serverTimestamp();
      // Set an expiry 24 hours from now so the client can hide/cleanup old jobs
      try {
        data['expiresAt'] = DateTime.now().add(const Duration(hours: 24));
      } catch (_) {}
      await docRef.set(data);

      // Read the document back to get the server timestamp and any transforms
      final createdDoc = await docRef.get();
      final createdJob = JobModel.fromMap({...createdDoc.data() ?? {}, 'id': createdDoc.id});

      // Debug: print created document for diagnosis in non-production
      if (const bool.fromEnvironment('dart.vm.product') == false) {
        // ignore: avoid_print
        print('postJob created doc ${createdDoc.id}: ${createdDoc.data()}');
      }

      // Optimistically add the created job to the local feed so professionals
      // see it immediately without waiting for the Firestore snapshot listener.
      try {
        final alreadyPresent = _jobs.any((j) => j.id == createdJob.id);
        if (!alreadyPresent && _shouldShowInFeed(createdJob)) {
          _jobs.insert(0, createdJob);
        }
      } catch (_) {}

      // Notify nearby professionals
      await _notificationService.notifyProfessionals(createdJob);

      _setLoading(false);
      notifyListeners();
      return createdJob;
    } catch (e) {
      _setError(getFriendlyErrorMessage(e));
      _setLoading(false);
      return null;
    }
  }

  /// Attaches uploaded photo URLs to a job after creation (photos are
  /// uploaded to Storage using the job's own ID as the folder name, so the
  /// job must exist first).
  Future<void> updateJobPhotos(String jobId, List<String> photoUrls) async {
    try {
      await _firestore.collection('jobs').doc(jobId).update({
        'photos': photoUrls,
      });
    } catch (e) {
      _setError(getFriendlyErrorMessage(e));
    }
  }

  Future<void> sendQuote(QuoteModel quote) async {
    try {
      _setLoading(true);
      _setError(null);

      // Ensure job still accepts quotes (not already accepted)
      final jobRef = _firestore.collection('jobs').doc(quote.jobId);
      final jobDoc = await jobRef.get();
      if (!jobDoc.exists) {
        _setError('Job not found');
        _setLoading(false);
        return;
      }
      final jobData = jobDoc.data() ?? {};
      final acceptedQuoteId = jobData['acceptedQuoteId'] as String? ?? '';
      final status = (jobData['status'] as String?)?.toLowerCase() ?? '';
      // Check expiry
      final expiryRaw = jobData['expiresAt'];
      DateTime? expiresAt;
      try {
        if (expiryRaw == null) {
          expiresAt = null;
        } else if (expiryRaw is DateTime) {
          expiresAt = expiryRaw as DateTime;
        } else if (expiryRaw is Map && expiryRaw.containsKey('_seconds')) {
          final seconds = expiryRaw['_seconds'] as int? ?? 0;
          final nanoseconds = expiryRaw['_nanoseconds'] as int? ?? 0;
          expiresAt = DateTime.fromMillisecondsSinceEpoch(seconds * 1000 + (nanoseconds ~/ 1000000));
        } else {
          try {
            // Firestore Timestamp
            final dynamic v = expiryRaw;
            final dt = v.toDate();
            if (dt is DateTime) expiresAt = dt;
          } catch (_) {
            if (expiryRaw is String) expiresAt = DateTime.tryParse(expiryRaw);
          }
        }
      } catch (_) { expiresAt = null; }

      if (expiresAt == null && jobData['createdAt'] != null) {
        try {
          final createdAtRaw = jobData['createdAt'];
          if (createdAtRaw is DateTime) {
            expiresAt = createdAtRaw.add(const Duration(hours: 24));
          } else if (createdAtRaw is Map && createdAtRaw.containsKey('_seconds')) {
            final seconds = createdAtRaw['_seconds'] as int? ?? 0;
            final nanoseconds = createdAtRaw['_nanoseconds'] as int? ?? 0;
            expiresAt = DateTime.fromMillisecondsSinceEpoch(seconds * 1000 + (nanoseconds ~/ 1000000)).add(const Duration(hours: 24));
          } else {
            try {
              final dynamic v = createdAtRaw;
              final dt = v.toDate();
              if (dt is DateTime) expiresAt = dt.add(const Duration(hours: 24));
            } catch (_) {
              if (createdAtRaw is String) {
                final parsed = DateTime.tryParse(createdAtRaw);
                if (parsed != null) expiresAt = parsed.add(const Duration(hours: 24));
              }
            }
          }
        } catch (_) {
          expiresAt = null;
        }
      }

      if (expiresAt != null && expiresAt.isBefore(DateTime.now())) {
        _setError('This job has expired and is no longer accepting quotes.');
        _setLoading(false);
        return;
      }
      if (acceptedQuoteId.isNotEmpty || status == 'accepted' || status == 'worker_selected') {
        _setError('This job is no longer accepting quotes.');
        _setLoading(false);
        return;
      }

      final docRef = _firestore.collection('quotes').doc();
      final newQuote = quote.copyWith(id: docRef.id, createdAt: DateTime.now());
      await docRef.set(newQuote.toMap());

      // Add quote to job and update status
      await jobRef.update({
        'quotes': FieldValue.arrayUnion([newQuote.toMap()]),
        'status': 'quotes_received',
      });

      await _notificationService.notifyNewQuote(newQuote);

      _setLoading(false);
      notifyListeners();
    } catch (e) {
      _setError(getFriendlyErrorMessage(e));
      _setLoading(false);
    }
  }

  Future<void> acceptQuote(String jobId, String quoteId) async {
    try {
      _setLoading(true);
      _setError(null);

      final quoteRef = _firestore.collection('quotes').doc(quoteId);
      final quoteSnapshot = await quoteRef.get();
      if (!quoteSnapshot.exists) {
        _setError('Quote not found');
        _setLoading(false);
        return;
      }

      final quoteData = quoteSnapshot.data()!;
      final professionalId = quoteData['professionalId'] as String?;
      final quoteStatus = (quoteData['status'] as String?)?.toLowerCase() ?? '';
      if (quoteStatus != 'pending') {
        _setError('Quote is no longer available');
        _setLoading(false);
        return;
      }

      String? professionalName;
      if (professionalId != null && professionalId.isNotEmpty) {
        final profDoc = await _firestore.collection('users').doc(professionalId).get();
        if (profDoc.exists) {
          professionalName = profDoc.data()?['fullName'] as String?;
        }
      }

      final jobRef = _firestore.collection('jobs').doc(jobId);
      final now = DateTime.now();

      await _firestore.runTransaction((transaction) async {
        final jobSnapshot = await transaction.get(jobRef);
        if (!jobSnapshot.exists) {
          throw Exception('Job not found');
        }

        final jobData = jobSnapshot.data()!;
        final acceptedQuoteId = (jobData['acceptedQuoteId'] as String?)?.trim() ?? '';
        final status = (jobData['status'] as String?)?.toLowerCase() ?? '';

        DateTime? expiresAt;
        final expiryRaw = jobData['expiresAt'];
        if (expiryRaw is DateTime) {
          expiresAt = expiryRaw;
        } else if (expiryRaw is Map && expiryRaw.containsKey('_seconds')) {
          final seconds = expiryRaw['_seconds'] as int? ?? 0;
          final nanoseconds = expiryRaw['_nanoseconds'] as int? ?? 0;
          expiresAt = DateTime.fromMillisecondsSinceEpoch(seconds * 1000 + (nanoseconds ~/ 1000000));
        } else if (expiryRaw != null) {
          try {
            final value = expiryRaw;
            final dt = value.toDate();
            if (dt is DateTime) expiresAt = dt;
          } catch (_) {}
        }

        if (expiresAt == null && jobData['createdAt'] != null) {
          final createdAtRaw = jobData['createdAt'];
          if (createdAtRaw is DateTime) {
            expiresAt = createdAtRaw.add(const Duration(hours: 24));
          } else if (createdAtRaw is Map && createdAtRaw.containsKey('_seconds')) {
            final seconds = createdAtRaw['_seconds'] as int? ?? 0;
            final nanoseconds = createdAtRaw['_nanoseconds'] as int? ?? 0;
            expiresAt = DateTime.fromMillisecondsSinceEpoch(seconds * 1000 + (nanoseconds ~/ 1000000)).add(const Duration(hours: 24));
          } else {
            try {
              final value = createdAtRaw;
              final dt = value.toDate();
              if (dt is DateTime) expiresAt = dt.add(const Duration(hours: 24));
            } catch (_) {}
          }
        }

        if (expiresAt != null && expiresAt.isBefore(now)) {
          throw Exception('This job has expired and is no longer accepting quotes.');
        }

        if (acceptedQuoteId.isNotEmpty || status == 'accepted' || status == 'worker_selected') {
          throw Exception('This job is no longer accepting quotes.');
        }

        transaction.update(jobRef, {
          'status': 'accepted',
          'acceptedQuoteId': quoteId,
          'professionalId': professionalId,
          if (professionalName != null) 'professionalName': professionalName,
          'expiresAt': now.add(const Duration(hours: 24)),
        });
        transaction.update(quoteRef, {
          'status': 'accepted',
        });
      });

      final otherQuotes = await _firestore
          .collection('quotes')
          .where('jobId', isEqualTo: jobId)
          .get();
      for (final doc in otherQuotes.docs) {
        if (doc.id != quoteId && (doc.data()['status'] as String?)?.toLowerCase() == 'pending') {
          await doc.reference.update({'status': 'rejected'});
        }
      }

      final quote = QuoteModel.fromMap({...quoteData, 'id': quoteId});
      if (quote.jobId != null) {
        await _notificationService.notifyQuoteAccepted(quote);
      }

      try {
        final idx = _jobs.indexWhere((j) => j.id == jobId);
        if (idx != -1) {
          final existing = _jobs[idx];
          _jobs[idx] = existing.copyWith(
            status: 'accepted',
            acceptedQuoteId: quoteId,
            professionalId: professionalId,
            professionalName: professionalName,
            expiresAt: now.add(const Duration(hours: 24)),
          );
        }
      } catch (_) {}

      try {
        final myIdx = _myJobs.indexWhere((j) => j.id == jobId);
        if (myIdx != -1) {
          final existing = _myJobs[myIdx];
          _myJobs[myIdx] = existing.copyWith(
            status: 'accepted',
            acceptedQuoteId: quoteId,
            professionalId: professionalId,
            professionalName: professionalName,
            expiresAt: now.add(const Duration(hours: 24)),
          );
        }
      } catch (_) {}

      try {
        _quotes = _quotes.map((q) {
          if (q.id == quoteId) {
            return q.copyWith(status: 'accepted');
          }
          if (q.jobId == jobId && q.status?.toLowerCase() == 'pending') {
            return q.copyWith(status: 'rejected');
          }
          return q;
        }).toList();
      } catch (_) {}

      _setLoading(false);
      notifyListeners();
    } catch (e) {
      _setError(getFriendlyErrorMessage(e));
      _setLoading(false);
    }
  }

  Future<void> rejectQuote(String jobId, String quoteId) async {
    try {
      _setLoading(true);
      _setError(null);

      await _firestore.collection('quotes').doc(quoteId).update({
        'status': 'rejected',
      });

      _setLoading(false);
      notifyListeners();
    } catch (e) {
      _setError(getFriendlyErrorMessage(e));
      _setLoading(false);
    }
  }

  Future<void> updateJobStatus(String jobId, String status) async {
    try {
      _setLoading(true);
      _setError(null);

      final jobRef = _firestore.collection('jobs').doc(jobId);
      final update = <String, dynamic>{
        'status': status,
        if (status == 'accepted')
          'acceptedDate': DateTime.now()
        else if (status == 'in_progress')
          'startedDate': DateTime.now()
        else if (status == 'completed')
          'completedDate': DateTime.now(),
      };
      await jobRef.update(update);

      await _notificationService.notifyJobUpdate(jobId, status);

      _setLoading(false);
      notifyListeners();
    } catch (e) {
      _setError(getFriendlyErrorMessage(e));
      _setLoading(false);
    }
  }

  /// Fetches all reviews left for [userId], newest first, enriched with the
  /// reviewer's current name and photo (reviews only store reviewerId).
  Future<List<ReviewModel>> fetchReviewsForUser(String userId) async {
    final snapshot = await _firestore
        .collection('reviews')
        .where('reviewedId', isEqualTo: userId)
        .orderBy('createdAt', descending: true)
        .get();

    final reviews = snapshot.docs
        .map((doc) => ReviewModel.fromMap(doc.data()))
        .toList();

    // Batch-load reviewer profiles (skip anonymous reviews).
    final reviewerIds = reviews
        .where((r) => r.isAnonymous != true && r.reviewerId != null)
        .map((r) => r.reviewerId!)
        .toSet();

    final reviewerInfo = <String, Map<String, String?>>{};
    for (final id in reviewerIds) {
      final doc = await _firestore.collection('users').doc(id).get();
      if (doc.exists) {
        final data = doc.data()!;
        reviewerInfo[id] = {
          'name': data['fullName'] as String?,
          'photo': data['profilePhoto'] as String?,
        };
      }
    }

    return reviews.map((r) {
      final info = r.reviewerId != null ? reviewerInfo[r.reviewerId] : null;
      return r.copyWith(
        reviewerName: r.isAnonymous == true
            ? 'Anonymous'
            : (info?['name'] ?? 'Telvo user'),
        reviewerPhoto: r.isAnonymous == true ? null : info?['photo'],
      );
    }).toList();
  }

  /// Saves a professional's reply to a review.
  Future<bool> respondToReview(String reviewId, String responseText) async {
    try {
      await _firestore.collection('reviews').doc(reviewId).update({
        'isResponse': true,
        'responseText': responseText,
        'responseAt': DateTime.now(),
      });
      return true;
    } catch (e) {
      _setError(getFriendlyErrorMessage(e));
      return false;
    }
  }

  Future<void> submitReview(ReviewModel review) async {
    try {
      _setLoading(true);
      _setError(null);

      final docRef = _firestore.collection('reviews').doc();
      final newReview = review.copyWith(id: docRef.id);
      await docRef.set(newReview.toMap());

      // Update job with review
      final jobRef = _firestore.collection('jobs').doc(review.jobId);
      await jobRef.update({
        'review': newReview.toMap(),
        'status': 'reviewed',
      });

      // Update professional rating
      final userRef = _firestore.collection('users').doc(review.reviewedId);
      final userDoc = await userRef.get();
      if (userDoc.exists) {
        final userData = userDoc.data()!;
        final currentRating = userData['rating'] ?? 0.0;
        final jobsCompleted = userData['jobsCompleted'] ?? 0;
        final newRating =
            ((currentRating * jobsCompleted) + review.rating!) /
            (jobsCompleted + 1);

        await userRef.update({
          'rating': newRating,
          'jobsCompleted': jobsCompleted + 1,
        });
      }

      _setLoading(false);
      notifyListeners();
    } catch (e) {
      _setError(getFriendlyErrorMessage(e));
      _setLoading(false);
    }
  }

  /// Jobs assigned to a professional (loadMyJobs above is customer-side -
  /// it filters by customerId, which is the wrong field for a
  /// professional's own job list).
  Future<void> loadProfessionalJobs(String professionalId) async {
    try {
      _setLoading(true);
      _setError(null);
      await _professionalJobsSubscription?.cancel();

      // Load jobs where this professional was selected or hired directly.
      _professionalJobsSubscription = _firestore
          .collection('jobs')
          .where('professionalId', isEqualTo: professionalId)
          .orderBy('createdAt', descending: true)
          .snapshots()
          .listen(
            (snapshot) {
              _myJobs = snapshot.docs
                  .map((doc) => JobModel.fromMap({...doc.data(), 'id': doc.id}))
                  .toList();
              _setLoading(false);
              notifyListeners();
            },
            onError: (e) {
              _setError(getFriendlyErrorMessage(e));
              _setLoading(false);
            },
          );
    } catch (e) {
      _setError(getFriendlyErrorMessage(e));
      _setLoading(false);
    }
  }

  Future<void> loadMyJobs(String userId) async {
    try {
      _setLoading(true);
      _setError(null);
      await _customerJobsSubscription?.cancel();

      _customerJobsSubscription = _firestore
          .collection('jobs')
          .where('customerId', isEqualTo: userId)
          .orderBy('createdAt', descending: true)
          .snapshots()
          .listen(
            (snapshot) {
              _myJobs = snapshot.docs
                  .map((doc) => JobModel.fromMap({...doc.data(), 'id': doc.id}))
                  .toList();
              _setLoading(false);
              notifyListeners();
            },
            onError: (e) {
              _setError(getFriendlyErrorMessage(e));
              _setLoading(false);
            },
          );
    } catch (e) {
      _setError(getFriendlyErrorMessage(e));
      _setLoading(false);
    }
  }

  Future<void> loadQuotes(String professionalId) async {
    try {
      _setLoading(true);
      _setError(null);

      final snapshot = await _firestore
          .collection('quotes')
          .where('professionalId', isEqualTo: professionalId)
          .orderBy('createdAt', descending: true)
          .get();

      _quotes = snapshot.docs
          .map((doc) => QuoteModel.fromMap(doc.data()))
          .toList();

      _setLoading(false);
      notifyListeners();
    } catch (e) {
      _setError(getFriendlyErrorMessage(e));
      _setLoading(false);
    }
  }

  /// Loads quotes received by the customer (for comparing/accepting quotes).
  Future<void> loadCustomerQuotes(String jobId) async {
    try {
      _setLoading(true);
      _setError(null);

      final snapshot = await _firestore
          .collection('quotes')
          .where('jobId', isEqualTo: jobId)
          .orderBy('createdAt', descending: true)
          .get();

      _quotes = snapshot.docs
          .map((doc) => QuoteModel.fromMap({...doc.data(), 'id': doc.id}))
          .toList();

      _setLoading(false);
      notifyListeners();
    } catch (e) {
      _setError(getFriendlyErrorMessage(e));
      _setLoading(false);
    }
  }

  // ─── Hire Request System ───────────────────────────────────────────

  /// Customer sends a direct hire request to a specific professional.
  Future<HireRequestModel?> sendHireRequest({
    required String customerId,
    required String customerName,
    required String professionalId,
    required String category,
    required String description,
    required double budget,
    String? address,
  }) async {
    try {
      _setLoading(true);
      _setError(null);

      final docRef = _firestore.collection('hire_requests').doc();
      final hire = HireRequestModel(
        id: docRef.id,
        customerId: customerId,
        customerName: customerName,
        professionalId: professionalId,
        category: category,
        description: description,
        budget: budget,
        address: address,
        status: 'pending',
        createdAt: DateTime.now(),
      );
      await docRef.set(hire.toMap());

      await _notificationService.notifyNewHireRequest(
        professionalId: professionalId,
        customerId: customerId,
        customerName: customerName,
        category: category,
        hireId: docRef.id,
      );

      _setLoading(false);
      notifyListeners();
      return hire;
    } catch (e) {
      _setError(getFriendlyErrorMessage(e));
      _setLoading(false);
      return null;
    }
  }

  /// Professional accepts or rejects a hire request.
  Future<void> respondToHireRequest(String hireId, bool accept) async {
    try {
      _setLoading(true);
      _setError(null);

      final hireDoc = await _firestore.collection('hire_requests').doc(hireId).get();
      if (!hireDoc.exists) {
        throw Exception('Hire request not found.');
      }
      final data = hireDoc.data()!;
      final customerId = data['customerId'] as String?;
      final professionalId = data['professionalId'] as String?;
      final professionalName = data['professionalName'] as String?;
      final status = accept ? 'accepted' : 'rejected';

      await hireDoc.reference.update({
        'status': status,
        'respondedAt': DateTime.now(),
      });

      // If accepted, promote the hire request to a job.
      if (accept && customerId != null && professionalId != null) {
        final jobDocRef = _firestore.collection('jobs').doc();
        final job = JobModel(
          id: jobDocRef.id,
          customerId: customerId,
          professionalId: professionalId,
          category: data['category'] as String?,
          description: data['description'] as String?,
          budget: (data['budget'] as num?)?.toDouble(),
          address: data['address'] as String?,
          status: 'accepted',
          createdAt: DateTime.now(),
        );
        await jobDocRef.set(job.toMap());

        // Send notification to the customer.
        await _notificationService.notifyHireAccepted(
          customerId: customerId,
          professionalName: professionalName ?? 'Professional',
          hireId: hireId,
        );
      } else {
        // Send rejection notification.
        if (customerId != null) {
          await _notificationService.notifyHireRejected(
            customerId: customerId,
            professionalName: professionalName ?? 'Professional',
            hireId: hireId,
          );
        }
      }

      _setLoading(false);
      notifyListeners();
    } catch (e) {
      _setError(getFriendlyErrorMessage(e));
      _setLoading(false);
    }
  }

  /// Loads hire requests received by a professional.
  Future<void> loadHireRequests(String professionalId) async {
    try {
      _setLoading(true);
      _setError(null);

      final snapshot = await _firestore
          .collection('hire_requests')
          .where('professionalId', isEqualTo: professionalId)
          .orderBy('createdAt', descending: true)
          .get();

      _hireRequests = snapshot.docs
          .map((doc) => HireRequestModel.fromMap({...doc.data(), 'id': doc.id}))
          .toList();

      _setLoading(false);
      notifyListeners();
    } catch (e) {
      _setError(getFriendlyErrorMessage(e));
      _setLoading(false);
    }
  }

  /// Loads hire requests sent by a customer.
  Future<void> loadCustomerHireRequests(String customerId) async {
    try {
      _setLoading(true);
      _setError(null);

      final snapshot = await _firestore
          .collection('hire_requests')
          .where('customerId', isEqualTo: customerId)
          .orderBy('createdAt', descending: true)
          .get();

      _hireRequests = snapshot.docs
          .map((doc) => HireRequestModel.fromMap({...doc.data(), 'id': doc.id}))
          .toList();

      _setLoading(false);
      notifyListeners();
    } catch (e) {
      _setError(getFriendlyErrorMessage(e));
      _setLoading(false);
    }
  }

  Future<List<JobModel>> searchJobs({
    String? category,
    String? serviceType,
    String? area,
    double? maxDistance,
    double? minBudget,
    double? maxBudget,
    bool? emergency,
  }) async {
    try {
      Query query = _firestore
          .collection('jobs')
          .where('status', isEqualTo: 'posted');

      if (category != null) {
        query = query.where('category', isEqualTo: category);
      }
      if (serviceType != null) {
        query = query.where('serviceType', isEqualTo: serviceType);
      }
      if (emergency != null) {
        query = query.where('isEmergency', isEqualTo: emergency);
      }

      final snapshot = await query.orderBy('createdAt', descending: true).get();

      return snapshot.docs
          .map((doc) => JobModel.fromMap(doc.data()! as Map<String, dynamic>))
          .toList();
    } catch (e) {
      _setError(getFriendlyErrorMessage(e));
      return [];
    }
  }

  Future<List<JobModel>> getJobsByCategory(String category) async {
    try {
      final snapshot = await _firestore
          .collection('jobs')
          .where('category', isEqualTo: category)
          .where('status', isEqualTo: 'posted')
          .orderBy('createdAt', descending: true)
          .limit(10)
          .get();

      return snapshot.docs
          .map((doc) => JobModel.fromMap({...doc.data(), 'id': doc.id}))
          .toList();
    } catch (e) {
      _setError(getFriendlyErrorMessage(e));
      return [];
    }
  }

  Future<List<Map<String, dynamic>>> getTopProfessionals() async {
    try {
      final snapshot = await _firestore
          .collection('users')
          .where('userType', whereIn: ['professional', 'both'])
          .orderBy('rating', descending: true)
          .limit(10)
          .get();

      return snapshot.docs.map((doc) => doc.data()).toList();
    } catch (e) {
      _setError(getFriendlyErrorMessage(e));
      return [];
    }
  }

  Future<void> cancelJob(String jobId) async {
    try {
      _setLoading(true);
      _setError(null);

      await _firestore.collection('jobs').doc(jobId).update({
        'status': 'cancelled',
      });

      await _notificationService.notifyJobUpdate(jobId, 'cancelled');

      _setLoading(false);
      notifyListeners();
    } catch (e) {
      _setError(getFriendlyErrorMessage(e));
      _setLoading(false);
    }
  }

  Future<void> deleteJob(String jobId) async {
    try {
      _setLoading(true);
      _setError(null);

      await _firestore.collection('jobs').doc(jobId).delete();

      _setLoading(false);
      notifyListeners();
    } catch (e) {
      _setError(getFriendlyErrorMessage(e));
      _setLoading(false);
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

  @override
  void dispose() {
    _customerJobsSubscription?.cancel();
    _professionalJobsSubscription?.cancel();
    _jobsFeedSubscription?.cancel();
    super.dispose();
  }
}

/// Model for a direct hire request (customer → specific professional).
class HireRequestModel {
  HireRequestModel({
    this.id,
    this.customerId,
    this.customerName,
    this.professionalId,
    this.professionalName,
    this.category,
    this.description,
    this.budget,
    this.address,
    this.status,
    this.createdAt,
    this.respondedAt,
  });

  factory HireRequestModel.fromMap(Map<String, dynamic> map) {
    return HireRequestModel(
      id: map['id'],
      customerId: map['customerId'],
      customerName: map['customerName'],
      professionalId: map['professionalId'],
      professionalName: map['professionalName'],
      category: map['category'],
      description: map['description'],
      budget: map['budget']?.toDouble(),
      address: map['address'],
      status: map['status'],
      createdAt: map['createdAt']?.toDate(),
      respondedAt: map['respondedAt']?.toDate(),
    );
  }
  final String? id;
  final String? customerId;
  final String? customerName;
  final String? professionalId;
  final String? professionalName;
  final String? category;
  final String? description;
  final double? budget;
  final String? address;
  final String? status; // 'pending', 'accepted', 'rejected', 'cancelled'
  final DateTime? createdAt;
  final DateTime? respondedAt;

  Map<String, dynamic> toMap() => {
    'id': id,
    'customerId': customerId,
    'customerName': customerName,
    'professionalId': professionalId,
    'professionalName': professionalName,
    'category': category,
    'description': description,
    'budget': budget,
    'address': address,
    'status': status,
    'createdAt': createdAt ?? FieldValue.serverTimestamp(),
    'respondedAt': respondedAt,
  };
}