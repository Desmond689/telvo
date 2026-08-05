// lib/models/job_model.dart

// ReviewModel used to be duplicated in this file with a stripped-down set
// of fields (no isAnonymous/isResponse/responseText/responseAt). That's
// now consolidated into a single definition in review_model.dart,
// re-exported here so existing `import '.../job_model.dart'` call sites
// that only ever needed ReviewModel keep working unchanged.
import 'review_model.dart';
export 'review_model.dart';

class JobModel {
  JobModel({
    this.id,
    this.customerId,
    this.professionalId,
    this.category,
    this.serviceType,
    this.description,
    this.photos,
    this.voiceNote,
    this.budget,
    this.urgency,
    this.status,
    this.address,
    this.latitude,
    this.longitude,
    this.createdAt,
    this.expiresAt,
    this.scheduledDate,
    this.completedDate,
    this.quotes,
    this.acceptedQuoteId,
    this.paymentMethod,
    this.isPaid,
    this.finalPrice,
    this.review,
    this.geoHash,
    this.isEmergency,
    this.isRecurring,
    this.recurringFrequency,
    this.businessId,
    this.professionalName,
  });

  factory JobModel.fromMap(Map<String, dynamic> map) {
    return JobModel(
      id: map['id'],
      customerId: map['customerId'],
      professionalId: map['professionalId'],
      category: map['category'],
      serviceType: map['serviceType'],
      description: map['description'],
      photos: List<String>.from(map['photos'] ?? []),
      voiceNote: map['voiceNote'],
      budget: map['budget']?.toDouble(),
      urgency: map['urgency'],
      status: map['status'],
      address: map['address'],
      latitude: map['latitude']?.toDouble(),
      longitude: map['longitude']?.toDouble(),
      geoHash: map['geoHash'],
      createdAt: _parseDate(map['createdAt']),
      expiresAt: _parseDate(map['expiresAt']),
      scheduledDate: _parseDate(map['scheduledDate']),
      completedDate: _parseDate(map['completedDate']),
      quotes: map['quotes'] != null
          ? List<QuoteModel>.from(
              map['quotes'].map((q) => QuoteModel.fromMap(q)),
            )
          : null,
      acceptedQuoteId: map['acceptedQuoteId'],
      paymentMethod: map['paymentMethod'],
      isPaid: map['isPaid'] ?? false,
      finalPrice: map['finalPrice']?.toDouble(),
      review: map['review'] != null ? ReviewModel.fromMap(map['review']) : null,
      isEmergency: map['isEmergency'] ?? false,
      isRecurring: map['isRecurring'] ?? false,
      recurringFrequency: map['recurringFrequency'],
      businessId: map['businessId'],
      professionalName: map['professionalName'],
    );
  }
  final String? id;
  final String? customerId;
  final String? professionalId;
  final String? category;
  final String? serviceType;
  final String? description;
  final List<String>? photos;
  final String? voiceNote;
  final double? budget;
  final String? urgency; // 'emergency', 'today', 'tomorrow', 'flexible'
  final String?
  status; // 'posted', 'notified', 'quotes_received', 'accepted', 'worker_travels', 'arrived', 'working', 'completed', 'cancelled'
  final String? address;
  final double? latitude;
  final double? longitude;
  final String? geoHash;
  final DateTime? createdAt;
  final DateTime? expiresAt;
  final DateTime? scheduledDate;
  final DateTime? completedDate;
  final List<QuoteModel>? quotes;
  final String? acceptedQuoteId;
  final String? paymentMethod;
  final bool? isPaid;
  final double? finalPrice;
  final ReviewModel? review;
  final bool? isEmergency;
  final bool? isRecurring;
  final int? recurringFrequency;
  final String? businessId;
  final String? professionalName;

  Map<String, dynamic> toMap() => {
    'id': id,
    'customerId': customerId,
    'professionalId': professionalId,
    'category': category,
    'serviceType': serviceType,
    'description': description,
    'photos': photos,
    'voiceNote': voiceNote,
    'budget': budget,
    'urgency': urgency,
    'status': status,
    'address': address,
    'latitude': latitude,
    'longitude': longitude,
    'geoHash': geoHash,
    // When writing to Firestore, prefer storing serverTimestamp when createdAt is null
    'createdAt': createdAt,
    'scheduledDate': scheduledDate,
    'completedDate': completedDate,
    'quotes': quotes?.map((q) => q.toMap()).toList(),
    'acceptedQuoteId': acceptedQuoteId,
    'paymentMethod': paymentMethod,
    'isPaid': isPaid,
    'finalPrice': finalPrice,
    'review': review?.toMap(),
    'isEmergency': isEmergency,
    'isRecurring': isRecurring,
    'recurringFrequency': recurringFrequency,
    'businessId': businessId,
    'expiresAt': expiresAt,
    'professionalName': professionalName,
  };

  JobModel copyWith({
    String? id,
    String? customerId,
    String? professionalId,
    String? category,
    String? serviceType,
    String? description,
    List<String>? photos,
    String? voiceNote,
    double? budget,
    String? urgency,
    String? status,
    String? address,
    double? latitude,
    double? longitude,
    String? geoHash,
    DateTime? createdAt,
      DateTime? expiresAt,
      DateTime? scheduledDate,
      DateTime? completedDate,
    List<QuoteModel>? quotes,
    String? acceptedQuoteId,
    String? paymentMethod,
    bool? isPaid,
    double? finalPrice,
    ReviewModel? review,
    bool? isEmergency,
    bool? isRecurring,
    int? recurringFrequency,
    String? businessId,
      String? professionalName,
    }) => JobModel(
      id: id ?? this.id,
      customerId: customerId ?? this.customerId,
      professionalId: professionalId ?? this.professionalId,
      category: category ?? this.category,
      serviceType: serviceType ?? this.serviceType,
      description: description ?? this.description,
      photos: photos ?? this.photos,
      voiceNote: voiceNote ?? this.voiceNote,
      budget: budget ?? this.budget,
      urgency: urgency ?? this.urgency,
      status: status ?? this.status,
      address: address ?? this.address,
      latitude: latitude ?? this.latitude,
      longitude: longitude ?? this.longitude,
      createdAt: createdAt ?? this.createdAt,
      expiresAt: expiresAt ?? this.expiresAt,
      scheduledDate: scheduledDate ?? this.scheduledDate,
      completedDate: completedDate ?? this.completedDate,
      quotes: quotes ?? this.quotes,
      acceptedQuoteId: acceptedQuoteId ?? this.acceptedQuoteId,
      paymentMethod: paymentMethod ?? this.paymentMethod,
      isPaid: isPaid ?? this.isPaid,
      finalPrice: finalPrice ?? this.finalPrice,
      review: review ?? this.review,
      isEmergency: isEmergency ?? this.isEmergency,
      isRecurring: isRecurring ?? this.isRecurring,
      recurringFrequency: recurringFrequency ?? this.recurringFrequency,
      businessId: businessId ?? this.businessId,
      geoHash: geoHash ?? this.geoHash,
      professionalName: professionalName ?? this.professionalName,
    );
}


DateTime? _parseDate(dynamic value) {
  if (value == null) return null;
  try {
    // Firestore Timestamp
    if (value is Map && value.containsKey('_seconds')) {
      // Some platforms may return a map representation
      final seconds = value['_seconds'] as int? ?? 0;
      final nanoseconds = value['_nanoseconds'] as int? ?? 0;
      return DateTime.fromMillisecondsSinceEpoch(seconds * 1000 + (nanoseconds ~/ 1000000));
    }
    if (value is DateTime) return value;
    if (value is int) return DateTime.fromMillisecondsSinceEpoch(value);
    // Cloud Firestore Timestamp type (from package) has toDate()
    try {
      final dynamic v = value;
      final res = v.toDate();
      if (res is DateTime) return res;
    } catch (_) {}
    if (value is String) {
      return DateTime.tryParse(value);
    }
  } catch (_) {}
  return null;
}

class QuoteModel {
  QuoteModel({
    this.id,
    this.professionalId,
    this.jobId,
    this.price,
    this.estimatedTime,
    this.message,
    this.arrivalTime,
    this.warranty,
    this.status,
    this.createdAt,
  });

  factory QuoteModel.fromMap(Map<String, dynamic> map) {
    return QuoteModel(
      id: map['id'],
      professionalId: map['professionalId'],
      jobId: map['jobId'],
      price: map['price']?.toDouble(),
      estimatedTime: map['estimatedTime'] ?? map['estimatedDuration'],
      message: map['message'],
      arrivalTime: map['arrivalTime']?.toDate(),
      warranty: map['warranty'],
      status: map['status'],
      createdAt: map['createdAt']?.toDate(),
    );
  }
  final String? id;
  final String? professionalId;
  final String? jobId;
  final double? price;
  final int? estimatedTime;
  final String? message;
  final DateTime? arrivalTime;
  final String? warranty;
  final String? status; // 'pending', 'accepted', 'rejected', 'expired'
  final DateTime? createdAt;

  Map<String, dynamic> toMap() => {
    'id': id,
    'professionalId': professionalId,
    'jobId': jobId,
    'price': price,
    'estimatedTime': estimatedTime,
    'estimatedDuration': estimatedTime,
    'message': message,
    'arrivalTime': arrivalTime,
    'warranty': warranty,
    'status': status,
    'createdAt': createdAt,
  };

  QuoteModel copyWith({
    String? id,
    String? professionalId,
    String? jobId,
    double? price,
    int? estimatedTime,
    String? message,
    DateTime? arrivalTime,
    String? warranty,
    String? status,
    DateTime? createdAt,
  }) => QuoteModel(
    id: id ?? this.id,
    professionalId: professionalId ?? this.professionalId,
    jobId: jobId ?? this.jobId,
    price: price ?? this.price,
    estimatedTime: estimatedTime ?? this.estimatedTime,
    message: message ?? this.message,
    arrivalTime: arrivalTime ?? this.arrivalTime,
    warranty: warranty ?? this.warranty,
    status: status ?? this.status,
    createdAt: createdAt ?? this.createdAt,
  );
}
