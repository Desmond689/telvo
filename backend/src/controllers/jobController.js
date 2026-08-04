// src/controllers/jobController.js
const Job = require('../models/Job');
const User = require('../models/User');
const { ChatThread } = require('../models/Chat');
const { logger } = require('../utils/logger');
const { successResponse, errorResponse } = require('../utils/responseHandler');
const NotificationService = require('../services/notificationService');

const notificationService = new NotificationService();

const createJob = async (req, res) => {
  try {
    const jobData = {
      ...req.body,
      customerId: req.userId,
      status: 'posted',
    };
    
    const job = await Job.create(jobData);
    logger.info(`New job created: ${job.id}`);

    // Notify nearby professionals using geohash + haversine. Best-effort
    try {
      await notificationService.notifyNewJob(job.id, job.toJSON(), 10);
    } catch (notifyError) {
      logger.error('Failed to notify professionals of new job:', notifyError);
    }

    return successResponse(res, job.toJSON(), 'Job posted successfully', 201);
  } catch (error) {
    logger.error('Create job error:', error);
    return errorResponse(res, 'Failed to create job', 500);
  }
};

const getAvailableJobs = async (req, res) => {
  try {
    const { category, urgency, limit = 20 } = req.query;
    const jobs = await Job.findAvailable({ category, urgency });
    return successResponse(res, jobs.slice(0, parseInt(limit)));
  } catch (error) {
    logger.error('Get available jobs error:', error);
    return errorResponse(res, 'Failed to get available jobs', 500);
  }
};

const getJobById = async (req, res) => {
  try {
    const { id } = req.params;
    const job = await Job.findById(id);
    if (!job) {
      return errorResponse(res, 'Job not found', 404);
    }
    
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
};

const updateJob = async (req, res) => {
  try {
    const { id } = req.params;
    const job = await Job.findById(id);
    if (!job) {
      return errorResponse(res, 'Job not found', 404);
    }
    
    if (job.customerId !== req.userId) {
      return errorResponse(res, 'Unauthorized to update this job', 403);
    }
    
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
};

const sendQuote = async (req, res) => {
  try {
    const { id } = req.params;
    const job = await Job.findById(id);
    if (!job) {
      return errorResponse(res, 'Job not found', 404);
    }
    
    if (job.isCompleted() || job.isCancelled()) {
      return errorResponse(res, 'Cannot send quote for completed or cancelled job', 400);
    }
    
    if (job.status === 'accepted') {
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
    logger.info(`Quote sent for job ${job.id} by professional ${req.userId}`);

    try {
      await notificationService.sendPushNotification(
        job.customerId,
        'New Quote Received',
        `You received a quote of ${quote.price} for your job.`,
        { jobId: job.id, quoteId: quote.id, type: 'new_quote' }
      );
    } catch (notifyError) {
      logger.error('Failed to notify customer of new quote:', notifyError);
    }

    return successResponse(res, quote, 'Quote sent successfully');
  } catch (error) {
    logger.error('Send quote error:', error);
    return errorResponse(res, 'Failed to send quote', 500);
  }
};

const acceptQuote = async (req, res) => {
  try {
    const { id, quoteId } = req.params;
    const job = await Job.findById(id);
    if (!job) {
      return errorResponse(res, 'Job not found', 404);
    }
    
    if (job.customerId !== req.userId) {
      return errorResponse(res, 'Unauthorized to accept quote', 403);
    }
    
    if (job.isCompleted() || job.isCancelled()) {
      return errorResponse(res, 'Cannot accept quote for completed or cancelled job', 400);
    }
    
    const quote = job.quotes.find(q => q.id === quoteId);
    if (!quote) {
      return errorResponse(res, 'Quote not found', 404);
    }
    
    if (quote.status !== 'pending') {
      return errorResponse(res, 'Quote is no longer available', 400);
    }
    
    await job.acceptQuote(quoteId);
    logger.info(`Quote accepted: ${quoteId} for job ${job.id}`);

    try {
      const customer = await User.findById(job.customerId);
      const professional = await User.findById(quote.professionalId);
      const existingThread = await ChatThread.findByUsers(job.customerId, quote.professionalId);
      if (!existingThread) {
        const chatId = [job.customerId, quote.professionalId].sort().join('_');
        await ChatThread.create({
          id: chatId,
          participantIds: [job.customerId, quote.professionalId],
          user1Id: job.customerId,
          user2Id: quote.professionalId,
          user1Name: customer?.fullName,
          user1Photo: customer?.profilePhoto,
          user2Name: professional?.fullName,
          user2Photo: professional?.profilePhoto,
          unreadCount: { [job.customerId]: 0, [quote.professionalId]: 0 },
          lastMessage: `Job ${job.id} has been accepted. Start discussing details here.`,
          lastMessageTime: new Date(),
          jobId: job.id,
          isActive: true,
        });
      } else if (!existingThread.jobId) {
        existingThread.jobId = job.id;
        await existingThread.save();
      }
    } catch (chatError) {
      logger.error('Failed to create chat thread for accepted job:', chatError);
    }

    try {
      await notificationService.sendPushNotification(
        quote.professionalId,
        'Quote Accepted!',
        'Your quote has been accepted by the customer.',
        { jobId: job.id, quoteId: quote.id, type: 'quote_accepted' }
      );
    } catch (notifyError) {
      logger.error('Failed to notify professional of accepted quote:', notifyError);
    }

    return successResponse(res, job.toJSON(), 'Quote accepted successfully');
  } catch (error) {
    logger.error('Accept quote error:', error);
    return errorResponse(res, 'Failed to accept quote', 500);
  }
};

const updateJobStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const job = await Job.findById(id);
    if (!job) {
      return errorResponse(res, 'Job not found', 404);
    }
    
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
    
    if (isProfessional && !isAdmin) {
      if (!['working', 'completed'].includes(status)) {
        return errorResponse(res, 'Professionals can only update to working or completed', 403);
      }
      if (job.status !== 'accepted' && job.status !== 'working') {
        return errorResponse(res, 'Cannot update job status from current state', 400);
      }
    }
    
    if (isCustomer && !isAdmin) {
      if (status !== 'cancelled') {
        return errorResponse(res, 'Customers can only cancel jobs', 403);
      }
      if (job.status === 'completed') {
        return errorResponse(res, 'Cannot cancel completed job', 400);
      }
    }
    
    await job.updateStatus(status);
    logger.info(`Job ${job.id} status updated to ${status}`);

    try {
      // Notify whichever party didn't trigger this update.
      const recipientId = isCustomer ? job.professionalId : job.customerId;
      if (recipientId) {
        const statusMessages = {
          working: 'Work has started on your job.',
          completed: 'Your job has been marked as completed.',
          cancelled: 'This job has been cancelled.',
        };
        await notificationService.sendPushNotification(
          recipientId,
          'Job Update',
          statusMessages[status] || `Job status changed to ${status}.`,
          { jobId: job.id, type: 'job_update', status }
        );
      }
    } catch (notifyError) {
      logger.error('Failed to notify job status update:', notifyError);
    }

    return successResponse(res, job.toJSON(), 'Job status updated successfully');
  } catch (error) {
    logger.error('Update job status error:', error);
    return errorResponse(res, 'Failed to update job status', 500);
  }
};

const getMyJobs = async (req, res) => {
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
};

const getProfessionalJobs = async (req, res) => {
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
};

const cancelJob = async (req, res) => {
  try {
    const { id } = req.params;
    const job = await Job.findById(id);
    if (!job) {
      return errorResponse(res, 'Job not found', 404);
    }
    
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
};

const deleteJob = async (req, res) => {
  try {
    const { id } = req.params;
    const job = await Job.findById(id);
    if (!job) {
      return errorResponse(res, 'Job not found', 404);
    }
    
    if (job.customerId !== req.userId) {
      return errorResponse(res, 'Unauthorized to delete this job', 403);
    }
    
    if (job.isCompleted() || job.status === 'accepted') {
      return errorResponse(res, 'Cannot delete job after it has been accepted or completed', 400);
    }
    
    await job.delete();
    return successResponse(res, null, 'Job deleted successfully');
  } catch (error) {
    logger.error('Delete job error:', error);
    return errorResponse(res, 'Failed to delete job', 500);
  }
};

module.exports = {
  createJob,
  getAvailableJobs,
  getJobById,
  updateJob,
  sendQuote,
  acceptQuote,
  updateJobStatus,
  getMyJobs,
  getProfessionalJobs,
  cancelJob,
  deleteJob,
};