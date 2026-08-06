// src/routes/jobRoutes.js
const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const { auth, requireProfessional, requireCustomer } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/responseHandler');
const { logger } = require('../utils/logger');
const Job = require('../models/Job');
const User = require('../models/User');

// Create job
router.post('/',
  auth,
  requireCustomer,
  [
    body('category')
      .notEmpty().withMessage('Category is required'),
    body('description')
      .notEmpty().withMessage('Description is required')
      .isLength({ min: 10, max: 1000 }).withMessage('Description must be between 10 and 1000 characters'),
    body('budget')
      .optional()
      .isFloat({ min: 0 }).withMessage('Budget must be a positive number'),
    body('urgency')
      .optional()
      .isIn(['emergency', 'today', 'tomorrow', 'flexible']).withMessage('Invalid urgency'),
    body('address')
      .optional()
      .isString().withMessage('Address must be a string'),
  ],
  validate,
  async (req, res) => {
    try {
      const jobData = {
        ...req.body,
        customerId: req.userId,
        status: 'posted',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      };
       
      const job = await Job.create(jobData);
      
      // Notify professionals (in production, use push notifications)
      logger.info(`New job created: ${job.id}`);
      
      return successResponse(res, job.toJSON(), 'Job posted successfully', 201);
    } catch (error) {
      logger.error('Create job error:', error);
      return errorResponse(res, 'Failed to create job', 500);
    }
  }
);

// Get available jobs
router.get('/available',
  auth,
  async (req, res) => {
    try {
      const { category, urgency, limit = 20 } = req.query;
      
      const jobs = await Job.findAvailable({
        category,
        urgency,
      });
      
      return successResponse(res, jobs.slice(0, parseInt(limit)));
    } catch (error) {
      logger.error('Get available jobs error:', error);
      return errorResponse(res, 'Failed to get available jobs', 500);
    }
  }
);

// Get job by ID
router.get('/:id',
  auth,
  async (req, res) => {
    try {
      const { id } = req.params;
      
      const job = await Job.findById(id);
      if (!job) {
        return errorResponse(res, 'Job not found', 404);
      }
      
      // Check if user is authorized to view
      if (job.customerId !== req.userId && 
          job.professionalId !== req.userId && 
          !req.user.isAdmin()) {
        return errorResponse(res, 'Unauthorized to view this job', 403);
      }
      
      return successResponse(res, job.toJSON());
    } catch (error) {
      logger.error('Get job error:', error);
      return errorResponse(res, 'Failed to get job', 500);
    }
  }
);

// Update job
router.put('/:id',
  auth,
  requireCustomer,
  [
    body('category')
      .optional(),
    body('description')
      .optional()
      .isLength({ min: 10, max: 1000 }).withMessage('Description must be between 10 and 1000 characters'),
    body('budget')
      .optional()
      .isFloat({ min: 0 }).withMessage('Budget must be a positive number'),
    body('urgency')
      .optional()
      .isIn(['emergency', 'today', 'tomorrow', 'flexible']).withMessage('Invalid urgency'),
  ],
  validate,
  async (req, res) => {
    try {
      const { id } = req.params;
      
      const job = await Job.findById(id);
      if (!job) {
        return errorResponse(res, 'Job not found', 404);
      }
      
      // Check if user owns the job
      if (job.customerId !== req.userId) {
        return errorResponse(res, 'Unauthorized to update this job', 403);
      }
      
      // Don't allow updates to completed or cancelled jobs
      if (job.isCompleted() || job.isCancelled()) {
        return errorResponse(res, 'Cannot update completed or cancelled job', 400);
      }
      
      const allowedFields = ['category', 'description', 'budget', 'urgency', 'address'];
      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          job[field] = req.body[field];
        }
      }
      
      await job.save();
      return successResponse(res, job.toJSON(), 'Job updated successfully');
    } catch (error) {
      logger.error('Update job error:', error);
      return errorResponse(res, 'Failed to update job', 500);
    }
  }
);

// Send quote
router.post('/:id/quotes',
  auth,
  requireProfessional,
  [
    body('price')
      .notEmpty().withMessage('Price is required')
      .isFloat({ min: 0 }).withMessage('Price must be a positive number'),
    body('estimatedTime')
      .optional()
      .isInt({ min: 1 }).withMessage('Estimated time must be a positive integer'),
    body('message')
      .optional()
      .isLength({ max: 500 }).withMessage('Message cannot exceed 500 characters'),
  ],
  validate,
  async (req, res) => {
    try {
      const { id } = req.params;
      
      const job = await Job.findById(id);
      if (!job) {
        return errorResponse(res, 'Job not found', 404);
      }
      
      // Don't allow quotes on completed, cancelled, already accepted, or expired jobs
      if (job.isCompleted() || job.isCancelled()) {
        return errorResponse(res, 'Cannot send quote for completed or cancelled job', 400);
      }
       
      if (job.isExpired()) {
        return errorResponse(res, 'Cannot send quote for expired job', 400);
      }

      if (job.acceptedQuoteId || job.status === 'accepted') {
        return errorResponse(res, 'Job already accepted by another professional', 400);
      }
      
      const quote = {
        id: `quote_${Date.now()}`,
        professionalId: req.userId,
        price: req.body.price,
        estimatedTime: req.body.estimatedTime || 2,
        message: req.body.message || '',
        createdAt: new Date(),
        status: 'pending',
      };
      
      await job.addQuote(quote);
      
      // Notify customer (in production)
      logger.info(`Quote sent for job ${job.id} by professional ${req.userId}`);
      
      return successResponse(res, quote, 'Quote sent successfully');
    } catch (error) {
      logger.error('Send quote error:', error);
      return errorResponse(res, 'Failed to send quote', 500);
    }
  }
);

// Accept quote
router.post('/:id/accept-quote/:quoteId',
  auth,
  requireCustomer,
  async (req, res) => {
    try {
      const { id, quoteId } = req.params;
      
      const job = await Job.findById(id);
      if (!job) {
        return errorResponse(res, 'Job not found', 404);
      }
      
      // Check if user owns the job
      if (job.customerId !== req.userId) {
        return errorResponse(res, 'Unauthorized to accept quote', 403);
      }
      
      if (job.isCompleted() || job.isCancelled()) {
        return errorResponse(res, 'Cannot accept quote for completed or cancelled job', 400);
      }

      if (job.isExpired()) {
        return errorResponse(res, 'Cannot accept quote for expired job', 400);
      }

      if (job.acceptedQuoteId) {
        return errorResponse(res, 'A quote has already been accepted for this job', 400);
      }
       
      const quote = job.quotes.find(q => q.id === quoteId);
      if (!quote) {
        return errorResponse(res, 'Quote not found', 404);
      }
       
      if (quote.status !== 'pending') {
        return errorResponse(res, 'Quote is no longer available', 400);
      }

      let professionalName = null;
      const professional = await User.findById(quote.professionalId);
      if (professional) {
        professionalName = professional.fullName || null;
      }
       
      await job.acceptQuote(quoteId, professionalName);
       
      // Notify professional (in production)
      logger.info(`Quote accepted: ${quoteId} for job ${job.id}`);
      
      return successResponse(res, job.toJSON(), 'Quote accepted successfully');
    } catch (error) {
      logger.error('Accept quote error:', error);
      return errorResponse(res, 'Failed to accept quote', 500);
    }
  }
);

// Update job status
router.patch('/:id/status',
  auth,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      const job = await Job.findById(id);
      if (!job) {
        return errorResponse(res, 'Job not found', 404);
      }
      
      // Check authorization
      const isCustomer = job.customerId === req.userId;
      const isProfessional = job.professionalId === req.userId;
      const isAdmin = req.user.isAdmin();
      
      if (!isCustomer && !isProfessional && !isAdmin) {
        return errorResponse(res, 'Unauthorized to update job status', 403);
      }
      
      const validStatuses = ['posted', 'notified', 'quotes_received', 'accepted', 'working', 'completed', 'cancelled'];
      if (!validStatuses.includes(status)) {
        return errorResponse(res, 'Invalid status', 400);
      }
      
      // Professional can update: accepted -> working -> completed
      if (isProfessional && !isAdmin) {
        if (!['working', 'completed'].includes(status)) {
          return errorResponse(res, 'Professionals can only update to working or completed', 403);
        }
        if (job.status !== 'accepted' && job.status !== 'working') {
          return errorResponse(res, 'Cannot update job status from current state', 400);
        }
      }
      
      // Customer can cancel
      if (isCustomer && !isAdmin) {
        if (status !== 'cancelled') {
          return errorResponse(res, 'Customers can only cancel jobs', 403);
        }
        if (job.status === 'completed') {
          return errorResponse(res, 'Cannot cancel completed job', 400);
        }
      }
      
      await job.updateStatus(status);
      
      // Notify other party (in production)
      logger.info(`Job ${job.id} status updated to ${status}`);
      
      return successResponse(res, job.toJSON(), 'Job status updated successfully');
    } catch (error) {
      logger.error('Update job status error:', error);
      return errorResponse(res, 'Failed to update job status', 500);
    }
  }
);

// Get customer jobs
router.get('/my-jobs',
  auth,
  requireCustomer,
  async (req, res) => {
    try {
      const { status, limit = 20 } = req.query;
      
      const jobs = await Job.findByCustomer(req.userId, parseInt(limit));
      
      let filteredJobs = jobs;
      if (status) {
        filteredJobs = jobs.filter(job => job.status === status);
      }
      
      return successResponse(res, filteredJobs);
    } catch (error) {
      logger.error('Get my jobs error:', error);
      return errorResponse(res, 'Failed to get your jobs', 500);
    }
  }
);

// Get professional jobs
router.get('/professional-jobs',
  auth,
  requireProfessional,
  async (req, res) => {
    try {
      const { status, limit = 20 } = req.query;
      
      const jobs = await Job.findByProfessional(req.userId, parseInt(limit));
      
      let filteredJobs = jobs;
      if (status) {
        filteredJobs = jobs.filter(job => job.status === status);
      }
      
      return successResponse(res, filteredJobs);
    } catch (error) {
      logger.error('Get professional jobs error:', error);
      return errorResponse(res, 'Failed to get professional jobs', 500);
    }
  }
);

// Cancel job
router.post('/:id/cancel',
  auth,
  async (req, res) => {
    try {
      const { id } = req.params;
      
      const job = await Job.findById(id);
      if (!job) {
        return errorResponse(res, 'Job not found', 404);
      }
      
      // Check authorization
      const isCustomer = job.customerId === req.userId;
      const isProfessional = job.professionalId === req.userId;
      const isAdmin = req.user.isAdmin();
      
      if (!isCustomer && !isProfessional && !isAdmin) {
        return errorResponse(res, 'Unauthorized to cancel this job', 403);
      }
      
      if (job.isCompleted()) {
        return errorResponse(res, 'Cannot cancel completed job', 400);
      }
      
      await job.updateStatus('cancelled');
      
      return successResponse(res, job.toJSON(), 'Job cancelled successfully');
    } catch (error) {
      logger.error('Cancel job error:', error);
      return errorResponse(res, 'Failed to cancel job', 500);
    }
  }
);

// Delete job
router.delete('/:id',
  auth,
  requireCustomer,
  async (req, res) => {
    try {
      const { id } = req.params;
      
      const job = await Job.findById(id);
      if (!job) {
        return errorResponse(res, 'Job not found', 404);
      }
      
      // Only customer can delete their job
      if (job.customerId !== req.userId) {
        return errorResponse(res, 'Unauthorized to delete this job', 403);
      }
      
      // Can only delete if not completed and no quotes accepted
      if (job.isCompleted() || job.status === 'accepted') {
        return errorResponse(res, 'Cannot delete job after it has been accepted or completed', 400);
      }
      
      await job.delete();
      
      return successResponse(res, null, 'Job deleted successfully');
    } catch (error) {
      logger.error('Delete job error:', error);
      return errorResponse(res, 'Failed to delete job', 500);
    }
  }
);

module.exports = router;