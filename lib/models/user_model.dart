// lib/models/user_model.dart
class UserModel {
  UserModel({
    this.id,
    this.username,
    this.phoneNumber,
    this.email,
    this.fullName,
    this.profilePhoto,
    this.city,
    this.neighborhood,
    this.language,
    this.userType,
    this.mode,
    this.isVerified = false,
    this.isPhoneVerified = false,
    this.isEmailVerified = false,
    this.isIdVerified = false,
    this.isSelfieVerified = false,
    this.isSuspended = false,
    this.trustedContacts = const [],
    this.blockedUsers = const [],
    this.createdAt,
    this.lastActive,
    this.isOnline = false,
    this.fcmToken,
    this.latitude,
    this.longitude,
    this.geoHash,
    this.category,
    this.skills,
    this.yearsOfExperience,
    this.description,
    this.serviceAreas,
    this.portfolioPhotos,
    this.certificates,
    this.availabilitySchedule,
    this.availabilityStatus,
    this.emergencyServices = false,
    this.startingPrice,
    this.rating,
    this.jobsCompleted,
    this.responseRate,
    this.responseTime,
  });

  factory UserModel.fromMap(Map<String, dynamic> map) {
    return UserModel(
      id: map['id'],
      username: map['username'],
      phoneNumber: map['phoneNumber'],
      email: map['email'],
      fullName: map['fullName'],
      profilePhoto: map['profilePhoto'],
      city: map['city'],
      neighborhood: map['neighborhood'],
      language: map['language'],
      userType: map['userType'] != null ? (map['userType'] as String).toLowerCase() : null,
      mode: map['mode'] != null ? (map['mode'] as String).toLowerCase() : null,
      isVerified: map['isVerified'] ?? false,
      isPhoneVerified: map['isPhoneVerified'] ?? false,
      isEmailVerified: map['isEmailVerified'] ?? false,
      isIdVerified: map['isIdVerified'] ?? false,
      isSelfieVerified: map['isSelfieVerified'] ?? false,
      isSuspended: map['isSuspended'] ?? false,
      trustedContacts: List<String>.from(map['trustedContacts'] ?? []),
      blockedUsers: List<String>.from(map['blockedUsers'] ?? []),
      createdAt: map['createdAt']?.toDate(),
      lastActive: map['lastActive']?.toDate(),
      isOnline: map['isOnline'] ?? false,
      fcmToken: map['fcmToken'],
      latitude: map['latitude']?.toDouble(),
      longitude: map['longitude']?.toDouble(),
      geoHash: map['geoHash'],
      category: map['category'],
      skills: List<String>.from(map['skills'] ?? []),
      yearsOfExperience: map['yearsOfExperience'],
      // Support both 'description' and legacy/new 'bio' field names in Firestore.
      description: map['description'] ?? map['bio'],
      serviceAreas: List<String>.from(map['serviceAreas'] ?? []),
      portfolioPhotos: List<String>.from(map['portfolioPhotos'] ?? []),
      certificates: List<String>.from(map['certificates'] ?? []),
      availabilitySchedule: map['availabilitySchedule'],
      availabilityStatus: map['availabilityStatus'],
      emergencyServices: map['emergencyServices'] ?? false,
      // Support multiple possible price field names used in Firestore documents.
    // Some records may use 'startingPrice', 'hourlyRate', 'servicePrice' or 'basePrice'.
    // Prefer the canonical 'startingPrice' if present, otherwise fall back.
    startingPrice: (map['startingPrice'] ?? map['starting_price'] ?? map['hourlyRate'] ?? map['hourly_rate'] ?? map['servicePrice'] ?? map['service_price'] ?? map['basePrice'] ?? map['base_price']) != null
        ? ( (map['startingPrice'] ?? map['starting_price'] ?? map['hourlyRate'] ?? map['hourly_rate'] ?? map['servicePrice'] ?? map['service_price'] ?? map['basePrice'] ?? map['base_price']).toDouble() )
        : null,
      rating: map['rating']?.toDouble(),
      jobsCompleted: map['jobsCompleted'],
      responseRate: map['responseRate']?.toDouble(),
      responseTime: map['responseTime'],
    );
  }
  final String? id;
  final String? username;
  final String? phoneNumber;
  final String? email;
  final String? fullName;
  final String? profilePhoto;
  final String? city;
  final String? neighborhood;
  final String? language;
  final String? userType; // 'customer', 'professional', 'both'
  final String? mode; // 'customer', 'professional'
  final bool isVerified;
  final bool isPhoneVerified;
  final bool isEmailVerified;
  final bool isIdVerified;
  final bool isSelfieVerified;
  final bool isSuspended;
  final List<String> trustedContacts;
  final List<String> blockedUsers;
  final DateTime? createdAt;
  final DateTime? lastActive;
  final bool isOnline;
  final String? fcmToken;

  // Location
  final double? latitude;
  final double? longitude;
  final String? geoHash;

  // Professional specific fields
  final String? category;
  final List<String>? skills;
  final int? yearsOfExperience;
  final String? description;
  final List<String>? serviceAreas;
  final List<String>? portfolioPhotos;
  final List<String>? certificates;
  final Map<String, dynamic>? availabilitySchedule;
  final bool emergencyServices;
  final double? startingPrice;
  final double? rating;
  final int? jobsCompleted;
  final double? responseRate;
  final int? responseTime;
  final String? availabilityStatus;

  Map<String, dynamic> toMap() => {
    'id': id,
    'username': username,
    'phoneNumber': phoneNumber,
    'email': email,
    'fullName': fullName,
    'profilePhoto': profilePhoto,
    'city': city,
    'neighborhood': neighborhood,
    'language': language,
    'userType': userType,
    'mode': mode,
    'isVerified': isVerified,
    'isPhoneVerified': isPhoneVerified,
    'isEmailVerified': isEmailVerified,
    'isIdVerified': isIdVerified,
    'isSelfieVerified': isSelfieVerified,
        'isSuspended': isSuspended,
        'trustedContacts': trustedContacts,
        'blockedUsers': blockedUsers,
    'createdAt': createdAt,
    'lastActive': lastActive,
    'isOnline': isOnline,
    'fcmToken': fcmToken,
    'latitude': latitude,
    'longitude': longitude,
    'geoHash': geoHash,
    'category': category,
    'skills': skills,
    'yearsOfExperience': yearsOfExperience,
    'description': description,
        // Also write a 'bio' alias for any consumers expecting that key.
        'bio': description,
        'serviceAreas': serviceAreas,
        'portfolioPhotos': portfolioPhotos,
        'certificates': certificates,
        'availabilitySchedule': availabilitySchedule,
        'availabilityStatus': availabilityStatus,
        'emergencyServices': emergencyServices,
        'startingPrice': startingPrice,
        'rating': rating,
        'jobsCompleted': jobsCompleted,
        'responseRate': responseRate,
        'responseTime': responseTime,
      };

  UserModel copyWith({
    String? id,
    String? username,
    String? phoneNumber,
    String? email,
    String? fullName,
    String? profilePhoto,
    String? city,
    String? neighborhood,
    String? language,
    String? userType,
    String? mode,
    bool? isVerified,
    bool? isPhoneVerified,
    bool? isEmailVerified,
    bool? isIdVerified,
    bool? isSelfieVerified,
    bool? isSuspended,
    List<String>? trustedContacts,
    List<String>? blockedUsers,
    DateTime? createdAt,
    DateTime? lastActive,
    bool? isOnline,
    String? fcmToken,
    double? latitude,
    double? longitude,
    String? geoHash,
    String? category,
    List<String>? skills,
    int? yearsOfExperience,
    String? description,
    List<String>? serviceAreas,
    List<String>? portfolioPhotos,
    List<String>? certificates,
    Map<String, dynamic>? availabilitySchedule,
    String? availabilityStatus,
    bool? emergencyServices,
    double? startingPrice,
    double? rating,
    int? jobsCompleted,
    double? responseRate,
    int? responseTime,
  }) => UserModel(
    id: id ?? this.id,
    username: username ?? this.username,
    phoneNumber: phoneNumber ?? this.phoneNumber,
    email: email ?? this.email,
    fullName: fullName ?? this.fullName,
    profilePhoto: profilePhoto ?? this.profilePhoto,
    city: city ?? this.city,
    neighborhood: neighborhood ?? this.neighborhood,
    language: language ?? this.language,
    userType: userType ?? this.userType,
    mode: mode ?? this.mode,
    isVerified: isVerified ?? this.isVerified,
    isPhoneVerified: isPhoneVerified ?? this.isPhoneVerified,
    isEmailVerified: isEmailVerified ?? this.isEmailVerified,
    isIdVerified: isIdVerified ?? this.isIdVerified,
    isSelfieVerified: isSelfieVerified ?? this.isSelfieVerified,
    isSuspended: isSuspended ?? this.isSuspended,
    trustedContacts: trustedContacts ?? this.trustedContacts,
    blockedUsers: blockedUsers ?? this.blockedUsers,
    createdAt: createdAt ?? this.createdAt,
    lastActive: lastActive ?? this.lastActive,
    isOnline: isOnline ?? this.isOnline,
    fcmToken: fcmToken ?? this.fcmToken,
    latitude: latitude ?? this.latitude,
    longitude: longitude ?? this.longitude,
    geoHash: geoHash ?? this.geoHash,
    category: category ?? this.category,
    skills: skills ?? this.skills,
    yearsOfExperience: yearsOfExperience ?? this.yearsOfExperience,
    description: description ?? this.description,
    serviceAreas: serviceAreas ?? this.serviceAreas,
    portfolioPhotos: portfolioPhotos ?? this.portfolioPhotos,
    certificates: certificates ?? this.certificates,
    availabilitySchedule: availabilitySchedule ?? this.availabilitySchedule,
    availabilityStatus: availabilityStatus ?? this.availabilityStatus,
    emergencyServices: emergencyServices ?? this.emergencyServices,
    startingPrice: startingPrice ?? this.startingPrice,
    rating: rating ?? this.rating,
    jobsCompleted: jobsCompleted ?? this.jobsCompleted,
    responseRate: responseRate ?? this.responseRate,
    responseTime: responseTime ?? this.responseTime,
  );
}
