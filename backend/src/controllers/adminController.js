// src/controllers/adminController.js
const User = require('../models/User');
const Job = require('../models/Job');
const Payment = require('../models/Payment');
const Review = require('../models/Review');
const Admin = require('../models/Admin');
const { logger } = require('../utils/logger');
const { successResponse, errorResponse } = require('../utils/responseHandler');

const { getFirestore } = require('../config/firebase');

const getDashboardStats = async (req, res) => {
  try {
    const db = getFirestore();
    const [usersSnap, jobsSnap, paymentsSnap, disputesSnap, fraudSnap] = await Promise.all([
      db.collection('users').get(),
      db.collection('jobs').get(),
      db.collection('payments').get(),
      db.collection('reports').where('status', '==', 'pending').get(),
      db.collection('reports').where('type', '==', 'fraud').where('status', '==', 'pending').get(),
    ]);

    let totalProfessionals = 0;
    let pendingVerifications = 0;
    usersSnap.forEach((doc) => {
      const data = doc.data();
      if (data.userType === 'professional' || (Array.isArray(data.userType) && data.userType.includes('professional'))) {
        totalProfessionals += 1;
      }
      if (data.verificationStatus === 'pending') {
        pendingVerifications += 1;
      }
    });

    let totalRevenue = 0;
    paymentsSnap.forEach((doc) => {
      const data = doc.data();
      if (data.status === 'completed') {
        totalRevenue += data.amount || 0;
      }
    });

    let activeJobs = 0;
    const categoryStats = {};
    jobsSnap.forEach((doc) => {
      const data = doc.data();
      if (['accepted', 'working'].includes(data.status)) {
        activeJobs += 1;
      }
      if (data.category) {
        categoryStats[data.category] = (categoryStats[data.category] || 0) + 1;
      }
    });

    const stats = {
      totalUsers: usersSnap.size,
      totalProfessionals,
      totalJobs: jobsSnap.size,
      totalRevenue,
      pendingVerifications,
      activeJobs,
      disputes: disputesSnap.size,
      fraudReports: fraudSnap.size,
      categoryStats,
    };

    return successResponse(res, stats);
  } catch (error) {
    logger.error('Get admin stats error:', error);
    return errorResponse(res, 'Failed to get admin stats', 500);
  }
};

const getAllUsers = async (req, res) => {
  try {
    const { limit = 50, offset = 0, search = '', role = 'all' } = req.query;
    
    // In production, implement proper filtering and pagination
    const users = [];
    
    return successResponse(res, {
      data: users,
      total: users.length,
      page: parseInt(offset) + 1,
      limit: parseInt(limit),
    });
  } catch (error) {
    logger.error('Get users error:', error);
    return errorResponse(res, 'Failed to get users', 500);
  }
};

const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }
    return successResponse(res, user.toJSON());
  } catch (error) {
    logger.error('Get user error:', error);
    return errorResponse(res, 'Failed to get user', 500);
  }
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }
    
    const allowedFields = ['fullName', 'email', 'isVerified', 'isSuspended', 'userType'];
    let suspendChange = null;
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        if (field === 'isSuspended' && req.body[field] !== user.isSuspended) {
          suspendChange = req.body[field] === true;
        }
        user[field] = req.body[field];
      }
    }
    
    // Persist Firestore user doc first
    await user.save();

    // If suspension was toggled, propagate to Firebase Auth and revoke tokens so active sessions are invalidated.
    if (suspendChange !== null) {
      try {
        const { getAuth } = require('../config/firebase');
        const auth = getAuth();
        // Update Firebase Auth disabled flag
        await auth.updateUser(user.id, { disabled: suspendChange });

        // If suspending, revoke refresh tokens to force re-authentication on clients
        if (suspendChange === true) {
          await auth.revokeRefreshTokens(user.id);
        }
      } catch (err) {
        // Log but don't fail the request — the Firestore change succeeded.
        logger.error('Failed to propagate suspension to Firebase Auth:', err);
      }
    }

    return successResponse(res, user.toJSON(), 'User updated successfully');
  } catch (error) {
    logger.error('Admin update user error:', error);
    return errorResponse(res, 'Failed to update user', 500);
  }
};

const verifyProfessional = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);
    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }
    
    if (!user.isProfessional()) {
      return errorResponse(res, 'User is not a professional', 400);
    }
    
    user.isVerified = true;
    user.isIdVerified = true;
    user.isSelfieVerified = true;
    await user.save();
    
    return successResponse(res, user.toJSON(), 'Professional verified successfully');
  } catch (error) {
    logger.error('Verify professional error:', error);
    return errorResponse(res, 'Failed to verify professional', 500);
  }
};

const getAllJobs = async (req, res) => {
  try {
    const { status, category, limit = 50, offset = 0 } = req.query;
    const jobs = []; // In production, fetch from Firestore
    
    return successResponse(res, {
      data: jobs,
      total: jobs.length,
      page: parseInt(offset) + 1,
      limit: parseInt(limit),
    });
  } catch (error) {
    logger.error('Admin get jobs error:', error);
    return errorResponse(res, 'Failed to get jobs', 500);
  }
};

const updateJob = async (req, res) => {
  try {
    const { id } = req.params;
    const job = await Job.findById(id);
    if (!job) {
      return errorResponse(res, 'Job not found', 404);
    }
    
    if (req.body.status) {
      await job.updateStatus(req.body.status);
    }
    
    return successResponse(res, job.toJSON(), 'Job updated successfully');
  } catch (error) {
    logger.error('Admin update job error:', error);
    return errorResponse(res, 'Failed to update job', 500);
  }
};

const getAllPayments = async (req, res) => {
  try {
    const { status, method, limit = 50, offset = 0 } = req.query;
    const payments = []; // In production, fetch from Firestore
    
    return successResponse(res, {
      data: payments,
      total: payments.length,
      page: parseInt(offset) + 1,
      limit: parseInt(limit),
    });
  } catch (error) {
    logger.error('Admin get payments error:', error);
    return errorResponse(res, 'Failed to get payments', 500);
  }
};

const processRefund = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { reason } = req.body;
    
    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return errorResponse(res, 'Payment not found', 404);
    }
    
    if (!payment.isCompleted()) {
      return errorResponse(res, 'Only completed payments can be refunded', 400);
    }
    
    await payment.refund(reason || 'Refund requested by admin');
    return successResponse(res, payment.toJSON(), 'Refund processed successfully');
  } catch (error) {
    logger.error('Process refund error:', error);
    return errorResponse(res, 'Failed to process refund', 500);
  }
};

const getAllReviews = async (req, res) => {
  try {
    const { rating, limit = 50, offset = 0 } = req.query;
    const reviews = []; // In production, fetch from Firestore
    
    return successResponse(res, {
      data: reviews,
      total: reviews.length,
      page: parseInt(offset) + 1,
      limit: parseInt(limit),
    });
  } catch (error) {
    logger.error('Admin get reviews error:', error);
    return errorResponse(res, 'Failed to get reviews', 500);
  }
};

const deleteReview = async (req, res) => {
  try {
    const { id } = req.params;
    const review = await Review.findById(id);
    if (!review) {
      return errorResponse(res, 'Review not found', 404);
    }
    
    await review.delete();
    return successResponse(res, null, 'Review deleted successfully');
  } catch (error) {
    logger.error('Admin delete review error:', error);
    return errorResponse(res, 'Failed to delete review', 500);
  }
};

const getDisputes = async (req, res) => {
  try {
    const { status, limit = 50, offset = 0 } = req.query;
    const disputes = []; // In production, fetch from Firestore
    
    return successResponse(res, {
      data: disputes,
      total: disputes.length,
      page: parseInt(offset) + 1,
      limit: parseInt(limit),
    });
  } catch (error) {
    logger.error('Admin get disputes error:', error);
    return errorResponse(res, 'Failed to get disputes', 500);
  }
};

const resolveDispute = async (req, res) => {
  try {
    const { id } = req.params;
    const { resolution } = req.body;
    
    // In production, update dispute in Firestore
    return successResponse(res, null, 'Dispute resolved successfully');
  } catch (error) {
    logger.error('Resolve dispute error:', error);
    return errorResponse(res, 'Failed to resolve dispute', 500);
  }
};

const getFraudReports = async (req, res) => {
  try {
    const { status, limit = 50, offset = 0 } = req.query;
    const reports = []; // In production, fetch from Firestore
    
    return successResponse(res, {
      data: reports,
      total: reports.length,
      page: parseInt(offset) + 1,
      limit: parseInt(limit),
    });
  } catch (error) {
    logger.error('Admin get fraud reports error:', error);
    return errorResponse(res, 'Failed to get fraud reports', 500);
  }
};

const verifyFraudReport = async (req, res) => {
  try {
    const { id } = req.params;
    // In production, update report in Firestore
    return successResponse(res, null, 'Fraud report verified successfully');
  } catch (error) {
    logger.error('Verify fraud report error:', error);
    return errorResponse(res, 'Failed to verify fraud report', 500);
  }
};

const createPromotion = async (req, res) => {
  try {
    // In production, save promotion to Firestore
    return successResponse(res, req.body, 'Promotion created successfully', 201);
  } catch (error) {
    logger.error('Create promotion error:', error);
    return errorResponse(res, 'Failed to create promotion', 500);
  }
};

const getAdminProfile = async (req, res) => {
  try {
    if (!req.admin) {
      return errorResponse(res, 'Admin profile not found', 404);
    }

    const adminProfile = {
      id: req.adminId,
      userId: req.admin.userId,
      email: req.admin.email,
      fullName: req.admin.fullName,
      role: req.admin.role,
      permissions: req.admin.permissions || [],
      isActive: req.admin.isActive,
      lastLogin: req.admin.lastLogin,
    };
    
    return successResponse(res, adminProfile);
  } catch (error) {
    logger.error('Get admin profile error:', error);
    return errorResponse(res, 'Failed to get admin profile', 500);
  }
};

module.exports = {
  getDashboardStats,
  getAllUsers,
  getUserById,
  updateUser,
  verifyProfessional,
  getAllJobs,
  updateJob,
  getAllPayments,
  processRefund,
  getAllReviews,
  deleteReview,
  getDisputes,
  resolveDispute,
  getFraudReports,
  verifyFraudReport,
  createPromotion,
  getAdminProfile,
};