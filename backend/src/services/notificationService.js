// src/services/notificationService.js
const { getFirestore, getMessaging, admin } = require('../config/firebase');
const { logger } = require('../utils/logger');
const axios = require('axios');

class NotificationService {
  constructor() {
    this.db = getFirestore();
  }

  async sendPushNotification(userId, title, body, data = {}) {
    let delivered = false;
    try {
      // Resolve a friendly action URL for the web notification page.
      const finalData = { ...data };
      if (!finalData.actionUrl && finalData.type === 'message' && finalData.senderId) {
        finalData.actionUrl = `messages?with=${finalData.senderId}`;
      }
      if (!finalData.actionUrl && finalData.type === 'payment') {
        finalData.actionUrl = 'notifications';
      }

      const userDoc = await this.db.collection('users').doc(userId).get();
      if (!userDoc.exists) {
        logger.warn(`User ${userId} not found for push notification`);
        return false;
      }

      const fcmToken = userDoc.data().fcmToken;

      if (fcmToken) {
        try {
          await getMessaging().send({
            token: fcmToken,
            notification: { title, body },
            // FCM data payloads must be flat string maps
            data: Object.fromEntries(
              Object.entries(finalData).map(([k, v]) => [k, String(v)])
            ),
          });
          delivered = true;
        } catch (fcmError) {
          // A stale/invalid token shouldn't crash the request - the
          // notification still gets recorded in-app below.
          if (
            fcmError.code === 'messaging/registration-token-not-registered' ||
            fcmError.code === 'messaging/invalid-registration-token'
          ) {
            logger.warn(`Stale FCM token for user ${userId}, clearing it`);
            await this.db.collection('users').doc(userId).update({
              fcmToken: admin.firestore.FieldValue.delete(),
            });
          } else {
            logger.error('FCM send error:', fcmError);
          }
        }
      } else {
        logger.warn(`No FCM token for user ${userId} - saving in-app notification only`);
      }

      // Always save to database so the in-app notifications list works
      // even when the device push failed or the app was uninstalled.
      await this.db.collection('notifications').add({
        userId,
        title,
        body,
        data: finalData,
        isRead: false,
        isSent: delivered,
        createdAt: new Date(),
        sentAt: new Date(),
      });

      return true;
    } catch (error) {
      logger.error('Push notification error:', error);
      return false;
    }
  }

  async sendEmail(to, subject, htmlContent) {
    try {
      // In production, use nodemailer or SendGrid
      logger.info(`📧 Email to ${to}: ${subject}`);
      
      // Save email to database for tracking
      await this.db.collection('emails').add({
        to,
        subject,
        htmlContent,
        status: 'sent',
        createdAt: new Date(),
      });

      return true;
    } catch (error) {
      logger.error('Email sending error:', error);
      return false;
    }
  }

  async sendSMS(to, message) {
    try {
      // In production, use Twilio or other SMS provider
      logger.info(`📱 SMS to ${to}: ${message}`);
      
      // Save SMS to database for tracking
      await this.db.collection('sms').add({
        to,
        message,
        status: 'sent',
        createdAt: new Date(),
      });

      return true;
    } catch (error) {
      logger.error('SMS sending error:', error);
      return false;
    }
  }

  async notifyNewJob(jobId, jobData, radiusKm = 10) {
    try {
      const geoService = require('./geoService');
      // Find nearby professionals using geohash prefix + haversine filter
      const professionals = await geoService.findProfessionalsNearby(
        { latitude: jobData.latitude, longitude: jobData.longitude, category: jobData.category },
        radiusKm,
        100
      );

      if (!professionals || professionals.length === 0) {
        logger.info('No nearby professionals found for job', jobId);
        return true;
      }

      await Promise.all(
        professionals.map((pro) =>
          this.sendPushNotification(
            pro.id,
            'New Job Available',
            `${jobData.category} job - ${(jobData.budget || '')} XAF`,
            { type: 'new_job', jobId }
          )
        )
      );

      return true;
    } catch (error) {
      logger.error('Notify new job error:', error);
      return false;
    }
  }

  async notifyQuoteAccepted(jobId, professionalId) {
    try {
      await this.sendPushNotification(
        professionalId,
        'Quote Accepted!',
        'Your quote has been accepted by the customer.',
        {
          type: 'quote_accepted',
          jobId,
        }
      );
      return true;
    } catch (error) {
      logger.error('Notify quote accepted error:', error);
      return false;
    }
  }

  async notifyJobUpdate(jobId, userId, message) {
    try {
      await this.sendPushNotification(
        userId,
        'Job Update',
        message,
        {
          type: 'job_update',
          jobId,
        }
      );
      return true;
    } catch (error) {
      logger.error('Notify job update error:', error);
      return false;
    }
  }

  async notifyPaymentReceived(userId, amount) {
    try {
      await this.sendPushNotification(
        userId,
        'Payment Received',
        `You received XAF ${amount} for your job.`,
        {
          type: 'payment',
          amount: amount.toString(),
        }
      );
      return true;
    } catch (error) {
      logger.error('Notify payment received error:', error);
      return false;
    }
  }

  async notifyAdmins(title, body, data = {}) {
    try {
      const admins = await this.db.collection('users').where('userType', '==', 'admin').get();
      const tasks = admins.docs.map((adminDoc) => this.sendPushNotification(adminDoc.id, title, body, data));
      await Promise.all(tasks);
      return true;
    } catch (error) {
      logger.error('Notify admins error:', error);
      return false;
    }
  }

  async notifyMessage(chatId, userId, message, senderId) {
    try {
      await this.sendPushNotification(
        userId,
        'New Message',
        message.substring(0, 50),
        {
          type: 'message',
          chatId,
          senderId,
        }
      );
      return true;
    } catch (error) {
      logger.error('Notify message error:', error);
      return false;
    }
  }
}

module.exports = NotificationService;