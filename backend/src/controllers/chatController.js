// src/controllers/chatController.js
const { ChatThread } = require('../models/Chat');
const User = require('../models/User');
const NotificationService = require('../services/notificationService');
const { logger } = require('../utils/logger');
const { successResponse, errorResponse } = require('../utils/responseHandler');

const getChatThreads = async (req, res) => {
  try {
    const threads = await ChatThread.findByUser(req.userId);
    return successResponse(res, threads);
  } catch (error) {
    logger.error('Get chat threads error:', error);
    return errorResponse(res, 'Failed to get chat threads', 500);
  }
};

const getChatMessages = async (req, res) => {
  try {
    const { threadId } = req.params;
    const thread = await ChatThread.findById(threadId);
    if (!thread) {
      return errorResponse(res, 'Chat thread not found', 404);
    }
    
    if (thread.user1Id !== req.userId && thread.user2Id !== req.userId) {
      return errorResponse(res, 'Unauthorized to view this chat', 403);
    }
    
    const messages = await thread.getMessages();
    return successResponse(res, messages);
  } catch (error) {
    logger.error('Get chat messages error:', error);
    return errorResponse(res, 'Failed to get chat messages', 500);
  }
};

const sendMessage = async (req, res) => {
  try {
    const { threadId } = req.params;
    const { message, type = 'text', mediaUrl } = req.body;
    
    const thread = await ChatThread.findById(threadId);
    if (!thread) {
      return errorResponse(res, 'Chat thread not found', 404);
    }
    
    if (thread.user1Id !== req.userId && thread.user2Id !== req.userId) {
      return errorResponse(res, 'Unauthorized to send message', 403);
    }
    
    const receiverId = thread.user1Id === req.userId ? thread.user2Id : thread.user1Id;
    
    const msg = await thread.addMessage({
      senderId: req.userId,
      receiverId,
      message,
      type,
      mediaUrl,
    });

    const notificationService = new NotificationService();
    notificationService.notifyMessage(thread.id, receiverId, message, req.userId).catch((err) => {
      logger.error('Failed to send chat notification:', err);
    });
    
    return successResponse(res, msg, 'Message sent successfully');
  } catch (error) {
    logger.error('Send message error:', error);
    return errorResponse(res, 'Failed to send message', 500);
  }
};

const createChat = async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (userId === req.userId) {
      return errorResponse(res, 'Cannot create chat with yourself', 400);
    }
    
    const otherUser = await User.findById(userId);
    if (!otherUser) {
      return errorResponse(res, 'User not found', 404);
    }
    
    let thread = await ChatThread.findByUsers(req.userId, userId);
    if (thread) {
      return successResponse(res, thread, 'Chat already exists');
    }
    
    const currentUser = await User.findById(req.userId);
    
    const chatId = [req.userId, userId].sort().join('_');
    thread = await ChatThread.create({
      id: chatId,
      participantIds: [req.userId, userId],
      user1Id: req.userId,
      user2Id: userId,
      user1Name: currentUser.fullName,
      user1Photo: currentUser.profilePhoto,
      user2Name: otherUser.fullName,
      user2Photo: otherUser.profilePhoto,
      unreadCount: { [req.userId]: 0, [userId]: 0 },
      lastMessage: null,
      lastMessageTime: null,
      isActive: true,
    });
    
    return successResponse(res, thread, 'Chat created successfully', 201);
  } catch (error) {
    logger.error('Create chat error:', error);
    return errorResponse(res, 'Failed to create chat', 500);
  }
};

const markMessagesRead = async (req, res) => {
  try {
    const { threadId } = req.params;
    const thread = await ChatThread.findById(threadId);
    if (!thread) {
      return errorResponse(res, 'Chat thread not found', 404);
    }
    
    if (thread.user1Id !== req.userId && thread.user2Id !== req.userId) {
      return errorResponse(res, 'Unauthorized to mark messages read', 403);
    }
    
    await thread.markAllRead(req.userId);
    return successResponse(res, null, 'Messages marked as read');
  } catch (error) {
    logger.error('Mark messages read error:', error);
    return errorResponse(res, 'Failed to mark messages as read', 500);
  }
};

const deleteChat = async (req, res) => {
  try {
    const { threadId } = req.params;
    const thread = await ChatThread.findById(threadId);
    if (!thread) {
      return errorResponse(res, 'Chat thread not found', 404);
    }
    
    if (thread.user1Id !== req.userId && thread.user2Id !== req.userId) {
      return errorResponse(res, 'Unauthorized to delete chat', 403);
    }
    
    // Soft delete - just mark as inactive
    thread.isActive = false;
    await thread.save();
    
    return successResponse(res, null, 'Chat deleted successfully');
  } catch (error) {
    logger.error('Delete chat error:', error);
    return errorResponse(res, 'Failed to delete chat', 500);
  }
};

module.exports = {
  getChatThreads,
  getChatMessages,
  sendMessage,
  createChat,
  markMessagesRead,
  deleteChat,
};