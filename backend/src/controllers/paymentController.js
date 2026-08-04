// src/controllers/paymentController.js
const Payment = require('../models/Payment');
const Job = require('../models/Job');
const Wallet = require('../models/Wallet');
const NotificationService = require('../services/notificationService');
const notificationService = new NotificationService();
const { logger } = require('../utils/logger');
const { successResponse, errorResponse } = require('../utils/responseHandler');

const processPayment = async (req, res) => {
  try {
    const { jobId, method, amount } = req.body;
    
    const job = await Job.findById(jobId);
    if (!job) {
      return errorResponse(res, 'Job not found', 404);
    }
    
    if (job.customerId !== req.userId) {
      return errorResponse(res, 'Unauthorized to process payment', 403);
    }
    
    if (job.isPaid) {
      return errorResponse(res, 'Job already paid', 400);
    }
    
    // Calculate commission
    const commission = amount * 0.1; // 10% commission
    const professionalAmount = amount - commission;
    
    // Create payment record
    const payment = await Payment.create({
      jobId,
      customerId: req.userId,
      professionalId: job.professionalId,
      amount,
      method,
      status: 'processing',
    });
    
    // Process payment based on method
    if (method === 'cash') {
      await payment.complete();
      
      // Update wallet
      let wallet = await Wallet.findByUserId(job.professionalId);
      if (!wallet) {
        wallet = await Wallet.create(job.professionalId);
      }
      await wallet.addFunds(professionalAmount, `Payment for job ${jobId}`);
      
      await job.processPayment(method, amount);
      await notificationService.notifyPaymentReceived(job.professionalId, amount);
      await notificationService.notifyAdmins(
        'New Payment Received',
        `A customer paid XAF ${amount} for job ${jobId}.`,
        {
          type: 'payment',
          jobId,
          paymentId: payment.id,
          customerId: req.userId,
          professionalId: job.professionalId,
        }
      );
      
      return successResponse(res, payment.toJSON(), 'Payment processed successfully');
    } else {
      // Other payment methods (coming soon)
      return errorResponse(res, `${method} payment is coming soon`, 400);
    }
  } catch (error) {
    logger.error('Process payment error:', error);
    return errorResponse(res, 'Failed to process payment', 500);
  }
};

const getPaymentHistory = async (req, res) => {
  try {
    const payments = await Payment.findByCustomer(req.userId);
    return successResponse(res, payments);
  } catch (error) {
    logger.error('Get payment history error:', error);
    return errorResponse(res, 'Failed to get payment history', 500);
  }
};

const getPaymentById = async (req, res) => {
  try {
    const { id } = req.params;
    const payment = await Payment.findById(id);
    if (!payment) {
      return errorResponse(res, 'Payment not found', 404);
    }
    
    if (payment.customerId !== req.userId && 
        payment.professionalId !== req.userId && 
        !req.user.isAdmin()) {
      return errorResponse(res, 'Unauthorized to view payment', 403);
    }
    
    return successResponse(res, payment.toJSON());
  } catch (error) {
    logger.error('Get payment error:', error);
    return errorResponse(res, 'Failed to get payment', 500);
  }
};

const requestRefund = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    const payment = await Payment.findById(id);
    if (!payment) {
      return errorResponse(res, 'Payment not found', 404);
    }
    
    if (payment.customerId !== req.userId && !req.user.isAdmin()) {
      return errorResponse(res, 'Unauthorized to request refund', 403);
    }
    
    if (!payment.isCompleted()) {
      return errorResponse(res, 'Only completed payments can be refunded', 400);
    }
    
    await payment.refund(reason || 'Customer requested refund');
    
    // Reverse wallet transaction
    const wallet = await Wallet.findByUserId(payment.professionalId);
    if (wallet) {
      await wallet.deductFunds(payment.amount, `Refund for payment ${payment.id}`);
    }
    
    return successResponse(res, payment.toJSON(), 'Refund processed successfully');
  } catch (error) {
    logger.error('Request refund error:', error);
    return errorResponse(res, 'Failed to process refund', 500);
  }
};

module.exports = {
  processPayment,
  getPaymentHistory,
  getPaymentById,
  requestRefund,
};