// src/controllers/userController.js
const User = require('../models/User');
const { logger } = require('../utils/logger');
const { successResponse, errorResponse } = require('../utils/responseHandler');

const getProfile = async (req, res) => {
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
};

const updateProfile = async (req, res) => {
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
};

const getProfessionals = async (req, res) => {
  try {
    const { category, city, isOnline, limit = 20, excludeUserId } = req.query;
    const currentUserId = req.userId || excludeUserId;
    
    const professionals = await User.getProfessionals({
      category,
      city,
      isOnline: isOnline === 'true',
      excludeUserId: currentUserId,
    });
    
    return successResponse(res, professionals.slice(0, parseInt(limit)));
  } catch (error) {
    logger.error('Get professionals error:', error);
    return errorResponse(res, 'Failed to get professionals', 500);
  }
};

const getProfessionalById = async (req, res) => {
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
};

const updateProfessionalProfile = async (req, res) => {
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
};

const addToFavorites = async (req, res) => {
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
};

const removeFromFavorites = async (req, res) => {
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
};

module.exports = {
  getProfile,
  updateProfile,
  getProfessionals,
  getProfessionalById,
  updateProfessionalProfile,
  addToFavorites,
  removeFromFavorites,
};