// src/models/User.js
const { getDocumentById, updateDocument, deleteDocument, queryDocuments, COLLECTIONS } = require('../config/database');

const PROFESSIONAL_USER_TYPES = ['professional', 'Professional', 'both', 'Both'];
const BUSINESS_USER_TYPES = ['business', 'Business'];

function normalizeUserType(userType) {
  return userType ? userType.toLowerCase() : undefined;
}

class User {
  constructor(data) {
    this.id = data.id;
    this.phoneNumber = data.phoneNumber;
    this.email = data.email;
    this.fullName = data.fullName;
    this.profilePhoto = data.profilePhoto;
    this.city = data.city;
    this.neighborhood = data.neighborhood;
    this.language = data.language;
    this.userType = data.userType;
    this.mode = data.mode;
    this.isVerified = data.isVerified || false;
    this.isPhoneVerified = data.isPhoneVerified || false;
    this.isEmailVerified = data.isEmailVerified || false;
    this.isIdVerified = data.isIdVerified || false;
    this.isSelfieVerified = data.isSelfieVerified || false;
    this.trustedContacts = data.trustedContacts || [];
    this.createdAt = data.createdAt || new Date();
    this.lastActive = data.lastActive || new Date();
    this.isOnline = data.isOnline || false;
    this.fcmToken = data.fcmToken;
    this.category = data.category;
    this.skills = data.skills || [];
    this.yearsOfExperience = data.yearsOfExperience;
    this.description = data.description;
    this.serviceAreas = data.serviceAreas || [];
    this.portfolioPhotos = data.portfolioPhotos || [];
    this.certificates = data.certificates || [];
    this.availabilitySchedule = data.availabilitySchedule || {};
    this.emergencyServices = data.emergencyServices || false;
    this.rating = data.rating || 0;
    this.jobsCompleted = data.jobsCompleted || 0;
    this.responseRate = data.responseRate || 0;
    this.responseTime = data.responseTime || 0;
    this.favorites = data.favorites || [];
    this.blockedUsers = data.blockedUsers || [];
    this.isSuspended = data.isSuspended || false;
  }

  toJSON() {
    return {
      id: this.id,
      phoneNumber: this.phoneNumber,
      email: this.email,
      fullName: this.fullName,
      profilePhoto: this.profilePhoto,
      city: this.city,
      neighborhood: this.neighborhood,
      language: this.language,
      userType: this.userType,
      mode: this.mode,
      isVerified: this.isVerified,
      isPhoneVerified: this.isPhoneVerified,
      isEmailVerified: this.isEmailVerified,
      isIdVerified: this.isIdVerified,
      isSelfieVerified: this.isSelfieVerified,
      trustedContacts: this.trustedContacts,
      createdAt: this.createdAt,
      lastActive: this.lastActive,
      isOnline: this.isOnline,
      fcmToken: this.fcmToken,
      category: this.category,
      skills: this.skills,
      yearsOfExperience: this.yearsOfExperience,
      description: this.description,
      serviceAreas: this.serviceAreas,
      portfolioPhotos: this.portfolioPhotos,
      certificates: this.certificates,
      availabilitySchedule: this.availabilitySchedule,
      emergencyServices: this.emergencyServices,
      rating: this.rating,
      jobsCompleted: this.jobsCompleted,
      responseRate: this.responseRate,
      responseTime: this.responseTime,
      favorites: this.favorites,
      blockedUsers: this.blockedUsers,
      isSuspended: this.isSuspended,
    };
  }

  static async findById(id) {
    const data = await getDocumentById(COLLECTIONS.USERS, id);
    if (!data) return null;
    return new User(data);
  }

  static async findByPhone(phoneNumber) {
    const results = await queryDocuments(COLLECTIONS.USERS, [
      { field: 'phoneNumber', operator: '==', value: phoneNumber }
    ]);
    if (results.length === 0) return null;
    return new User(results[0]);
  }

  static async findByEmail(email) {
    const results = await queryDocuments(COLLECTIONS.USERS, [
      { field: 'email', operator: '==', value: email }
    ]);
    if (results.length === 0) return null;
    return new User(results[0]);
  }

  static async getProfessionals(filters = {}) {
    const userType = normalizeUserType(filters.userType || 'professional');
    const conditions = [];
    if (userType === 'professional') {
      conditions.push({ field: 'userType', operator: 'in', value: PROFESSIONAL_USER_TYPES });
    } else if (userType === 'business') {
      conditions.push({ field: 'userType', operator: 'in', value: BUSINESS_USER_TYPES });
    } else {
      conditions.push({ field: 'userType', operator: '==', value: userType });
    }
    
    if (filters.category) {
      conditions.push({ field: 'category', operator: '==', value: filters.category });
    }
    
    if (filters.city) {
      conditions.push({ field: 'city', operator: '==', value: filters.city });
    }
    
    if (filters.isOnline !== undefined) {
      conditions.push({ field: 'isOnline', operator: '==', value: filters.isOnline });
    }

    const results = await queryDocuments(
      COLLECTIONS.USERS,
      conditions,
      { field: 'rating', direction: 'desc' }
    );

    const nonSuspended = results.filter((user) => user.isSuspended !== true);
    const filteredResults = filters.excludeUserId
      ? nonSuspended.filter((user) => user.id !== filters.excludeUserId)
      : nonSuspended;
    
    return filteredResults.map(data => new User(data));
  }

  async save() {
    const data = this.toJSON();
    delete data.id;
    await updateDocument(COLLECTIONS.USERS, this.id, data);
    return this;
  }

  async delete() {
    await deleteDocument(COLLECTIONS.USERS, this.id);
    return true;
  }

  async updateRating() {
    const reviews = await queryDocuments(COLLECTIONS.REVIEWS, [
      { field: 'reviewedId', operator: '==', value: this.id }
    ]);
    
    if (reviews.length === 0) {
      this.rating = 0;
      return this;
    }
    
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    this.rating = totalRating / reviews.length;
    this.jobsCompleted = reviews.length;
    await this.save();
    return this;
  }

  isProfessional() {
    return this.userType === 'professional' || this.userType === 'both';
  }

  isCustomer() {
    return this.userType === 'customer' || this.userType === 'both';
  }

  isAdmin() {
    return this.userType === 'admin';
  }

  canAccess(requiredType) {
    if (requiredType === 'professional') return this.isProfessional();
    if (requiredType === 'customer') return this.isCustomer();
    return true;
  }
}

module.exports = User;