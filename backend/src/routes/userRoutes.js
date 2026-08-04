// src/routes/userRoutes.js
const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const { auth, optionalAuth, requireProfessional, requireCustomer } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const { successResponse, errorResponse } = require('../utils/responseHandler');
const { logger } = require('../utils/logger');
const User = require('../models/User');

// Get user profile
router.get('/profile',
  auth,
  async (req, res) => {
    try {
      const user = await User.findById(req.userId);
      if (!user) {
        return errorResponse(res, 'User not found', 404);
      }
      
      return successResponse(res, user.toJSON());
    } catch (error) {
      logger.error('Get profile error:', error);
      return errorResponse(res, 'Failed to get profile', 500);
    }
  }
);

// Update user profile
router.put('/profile',
  auth,
  [
    body('fullName')
      .optional()
      .isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
    body('city')
      .optional()
      .isString().withMessage('City must be a string'),
    body('neighborhood')
      .optional()
      .isString().withMessage('Neighborhood must be a string'),
    body('language')
      .optional()
      .isString().withMessage('Language must be a string'),
    body('profilePhoto')
      .optional()
      .isURL().withMessage('Profile photo must be a valid URL'),
  ],
  validate,
  async (req, res) => {
    try {
      const user = await User.findById(req.userId);
      if (!user) {
        return errorResponse(res, 'User not found', 404);
      }
      
      const allowedFields = ['fullName', 'city', 'neighborhood', 'language', 'profilePhoto'];
      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          user[field] = req.body[field];
        }
      }
      
      await user.save();
      return successResponse(res, user.toJSON(), 'Profile updated successfully');
    } catch (error) {
      logger.error('Update profile error:', error);
      return errorResponse(res, 'Failed to update profile', 500);
    }
  }
);

// Get professionals
router.get('/professionals',
  optionalAuth,
  async (req, res) => {
    try {
      const { category, city, isOnline, limit = 20 } = req.query;
      
      const professionals = await User.getProfessionals({
        category,
        city,
        isOnline: isOnline === 'true',
        excludeUserId: req.userId,
      });
      
      return successResponse(res, professionals.slice(0, parseInt(limit)));
    } catch (error) {
      logger.error('Get professionals error:', error);
      return errorResponse(res, 'Failed to get professionals', 500);
    }
  }
);

// Get professional by ID
router.get('/professionals/:id',
  async (req, res) => {
    try {
      const { id } = req.params;
      
      const user = await User.findById(id);
      if (!user || !user.isProfessional()) {
        return errorResponse(res, 'Professional not found', 404);
      }
      
      return successResponse(res, user.toJSON());
    } catch (error) {
      logger.error('Get professional error:', error);
      return errorResponse(res, 'Failed to get professional', 500);
    }
  }
);

// Update professional profile
router.put('/professional-profile',
  auth,
  requireProfessional,
  [
    body('category')
      .optional()
      .isString().withMessage('Category must be a string'),
    body('skills')
      .optional()
      .isArray().withMessage('Skills must be an array'),
    body('yearsOfExperience')
      .optional()
      .isInt({ min: 0 }).withMessage('Years of experience must be a positive integer'),
    body('description')
      .optional()
      .isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters'),
    body('serviceAreas')
      .optional()
      .isArray().withMessage('Service areas must be an array'),
    body('portfolioPhotos')
      .optional()
      .isArray().withMessage('Portfolio photos must be an array'),
    body('emergencyServices')
      .optional()
      .isBoolean().withMessage('Emergency services must be a boolean'),
  ],
  validate,
  async (req, res) => {
    try {
      const user = await User.findById(req.userId);
      if (!user) {
        return errorResponse(res, 'User not found', 404);
      }
      
      const allowedFields = [
        'category', 'skills', 'yearsOfExperience', 'description',
        'serviceAreas', 'portfolioPhotos', 'emergencyServices'
      ];
      
      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          user[field] = req.body[field];
        }
      }
      
      await user.save();
      return successResponse(res, user.toJSON(), 'Professional profile updated successfully');
    } catch (error) {
      logger.error('Update professional profile error:', error);
      return errorResponse(res, 'Failed to update professional profile', 500);
    }
  }
);

// Add to favorites
router.post('/favorites/:professionalId',
  auth,
  requireCustomer,
  async (req, res) => {
    try {
      const { professionalId } = req.params;
      
      const professional = await User.findById(professionalId);
      if (!professional || !professional.isProfessional()) {
        return errorResponse(res, 'Professional not found', 404);
      }
      
      const user = await User.findById(req.userId);
      if (!user.favorites) user.favorites = [];
      
      if (user.favorites.includes(professionalId)) {
        return errorResponse(res, 'Already in favorites', 400);
      }
      
      user.favorites.push(professionalId);
      await user.save();
      
      return successResponse(res, user.favorites, 'Added to favorites');
    } catch (error) {
      logger.error('Add to favorites error:', error);
      return errorResponse(res, 'Failed to add to favorites', 500);
    }
  }
);

// Remove from favorites
router.delete('/favorites/:professionalId',
  auth,
  requireCustomer,
  async (req, res) => {
    try {
      const { professionalId } = req.params;
      
      const user = await User.findById(req.userId);
      if (!user.favorites) user.favorites = [];
      
      user.favorites = user.favorites.filter(id => id !== professionalId);
      await user.save();
      
      return successResponse(res, user.favorites, 'Removed from favorites');
    } catch (error) {
      logger.error('Remove from favorites error:', error);
      return errorResponse(res, 'Failed to remove from favorites', 500);
    }
  }
);

// Block user
router.post('/block/:userId',
  auth,
  async (req, res) => {
    try {
      const { userId } = req.params;
      
      if (userId === req.userId) {
        return errorResponse(res, 'Cannot block yourself', 400);
      }
      
      const user = await User.findById(req.userId);
      if (!user.blockedUsers) user.blockedUsers = [];
      
      if (user.blockedUsers.includes(userId)) {
        return errorResponse(res, 'Already blocked', 400);
      }
      
      user.blockedUsers.push(userId);
      await user.save();
      
      return successResponse(res, null, 'User blocked successfully');
    } catch (error) {
      logger.error('Block user error:', error);
      return errorResponse(res, 'Failed to block user', 500);
    }
  }
);

// Unblock user
router.delete('/block/:userId',
  auth,
  async (req, res) => {
    try {
      const { userId } = req.params;
      
      const user = await User.findById(req.userId);
      if (!user.blockedUsers) user.blockedUsers = [];
      
      user.blockedUsers = user.blockedUsers.filter(id => id !== userId);
      await user.save();
      
      return successResponse(res, null, 'User unblocked successfully');
    } catch (error) {
      logger.error('Unblock user error:', error);
      return errorResponse(res, 'Failed to unblock user', 500);
    }
  }
);

// Report user
router.post('/report/:userId',
  auth,
  [
    body('reason')
      .notEmpty().withMessage('Reason is required')
      .isString().withMessage('Reason must be a string'),
    body('description')
      .optional()
      .isString().withMessage('Description must be a string'),
  ],
  validate,
  async (req, res) => {
    try {
      const { userId } = req.params;
      const { reason, description } = req.body;
      
      // In production, save report to Firestore
      
      return successResponse(res, null, 'User reported successfully');
    } catch (error) {
      logger.error('Report user error:', error);
      return errorResponse(res, 'Failed to report user', 500);
    }
  }
);

module.exports = router;