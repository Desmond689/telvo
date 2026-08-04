// src/models/Chat.js
const { db, getDocumentById, updateDocument, deleteDocument, queryDocuments, createDocument, COLLECTIONS } = require('../config/database');

const chatIdFor = (userA, userB) => {
  return [userA, userB].sort().join('_');
};

class ChatMessage {
  constructor(data) {
    this.id = data.id;
    this.chatId = data.chatId;
    this.senderId = data.senderId;
    this.receiverId = data.receiverId;
    this.message = data.message;
    this.type = data.type || 'text';
    this.mediaUrl = data.mediaUrl;
    this.timestamp = data.timestamp || new Date();
    this.read = data.read ?? data.isRead ?? false;
    this.isDelivered = data.isDelivered ?? false;
    this.isSeen = data.isSeen ?? false;
  }

  toJSON() {
    return {
      id: this.id,
      chatId: this.chatId,
      senderId: this.senderId,
      receiverId: this.receiverId,
      message: this.message,
      type: this.type,
      mediaUrl: this.mediaUrl,
      timestamp: this.timestamp,
      read: this.read,
      isDelivered: this.isDelivered,
      isSeen: this.isSeen,
    };
  }

  static async create(chatId, data) {
    const messageRef = db.collection(COLLECTIONS.CHATS).doc(chatId).collection(COLLECTIONS.MESSAGES).doc();
    const payload = {
      chatId,
      senderId: data.senderId,
      receiverId: data.receiverId,
      message: data.message,
      type: data.type || 'text',
      mediaUrl: data.mediaUrl ?? null,
      timestamp: data.timestamp || new Date(),
      read: data.read ?? false,
      isDelivered: data.isDelivered ?? false,
      isSeen: data.isSeen ?? false,
    };
    await messageRef.set(payload);
    return new ChatMessage({ id: messageRef.id, ...payload });
  }

  async save() {
    if (!this.chatId || !this.id) {
      throw new Error('ChatMessage.save() requires chatId and id');
    }
    const data = this.toJSON();
    delete data.id;
    await db.collection(COLLECTIONS.CHATS)
      .doc(this.chatId)
      .collection(COLLECTIONS.MESSAGES)
      .doc(this.id)
      .set(data, { merge: true });
    return this;
  }

  async markAsRead() {
    this.read = true;
    this.isSeen = true;
    await this.save();
    return this;
  }

  async markAsDelivered() {
    this.isDelivered = true;
    await this.save();
    return this;
  }

  async delete() {
    if (!this.chatId || !this.id) {
      throw new Error('ChatMessage.delete() requires chatId and id');
    }
    await db.collection(COLLECTIONS.CHATS)
      .doc(this.chatId)
      .collection(COLLECTIONS.MESSAGES)
      .doc(this.id)
      .delete();
    return true;
  }
}

class ChatThread {
  constructor(data) {
    this.id = data.id;
    this.participantIds = data.participantIds || [data.user1Id, data.user2Id].filter(Boolean);
    this.user1Id = data.user1Id;
    this.user2Id = data.user2Id;
    this.user1Name = data.user1Name;
    this.user1Photo = data.user1Photo;
    this.user2Name = data.user2Name;
    this.user2Photo = data.user2Photo;
    this.lastMessage = data.lastMessage;
    this.lastMessageTime = data.lastMessageTime || data.lastMessageAt || null;
    this.unreadCount = typeof data.unreadCount === 'object' && data.unreadCount !== null ? data.unreadCount : {};
    this.isActive = data.isActive !== undefined ? data.isActive : true;
    this.jobId = data.jobId || null;
    this.createdAt = data.createdAt || null;
    this.updatedAt = data.updatedAt || null;
  }

  toJSON() {
    return {
      participantIds: this.participantIds,
      user1Id: this.user1Id,
      user2Id: this.user2Id,
      user1Name: this.user1Name,
      user1Photo: this.user1Photo,
      user2Name: this.user2Name,
      user2Photo: this.user2Photo,
      lastMessage: this.lastMessage,
      lastMessageTime: this.lastMessageTime,
      unreadCount: this.unreadCount,
      isActive: this.isActive,
      jobId: this.jobId,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  static async findById(id) {
    const data = await getDocumentById(COLLECTIONS.CHATS, id);
    if (!data) return null;
    return new ChatThread(data);
  }

  static async findByUsers(user1Id, user2Id) {
    const chatId = chatIdFor(user1Id, user2Id);
    const existing = await getDocumentById(COLLECTIONS.CHATS, chatId);
    if (existing) {
      return new ChatThread(existing);
    }

    const results = await queryDocuments(COLLECTIONS.CHATS, [
      { field: 'participantIds', operator: 'array-contains', value: user1Id },
    ]);
    for (const result of results) {
      if (Array.isArray(result.participantIds) && result.participantIds.includes(user2Id)) {
        return new ChatThread(result);
      }
    }

    const results1 = await queryDocuments(COLLECTIONS.CHATS, [
      { field: 'user1Id', operator: '==', value: user1Id },
      { field: 'user2Id', operator: '==', value: user2Id },
    ]);
    if (results1.length > 0) {
      return new ChatThread(results1[0]);
    }

    const results2 = await queryDocuments(COLLECTIONS.CHATS, [
      { field: 'user1Id', operator: '==', value: user2Id },
      { field: 'user2Id', operator: '==', value: user1Id },
    ]);
    if (results2.length > 0) {
      return new ChatThread(results2[0]);
    }

    return null;
  }

  static async findByUser(userId) {
    const results = await queryDocuments(COLLECTIONS.CHATS, [
      { field: 'participantIds', operator: 'array-contains', value: userId },
    ]);

    const results1 = await queryDocuments(COLLECTIONS.CHATS, [
      { field: 'user1Id', operator: '==', value: userId },
    ]);
    const results2 = await queryDocuments(COLLECTIONS.CHATS, [
      { field: 'user2Id', operator: '==', value: userId },
    ]);

    const allResults = [...results, ...results1, ...results2];
    const uniqueResults = [];
    const seen = new Set();

    for (const result of allResults) {
      if (!seen.has(result.id)) {
        seen.add(result.id);
        uniqueResults.push(result);
      }
    }

    uniqueResults.sort((a, b) => {
      const timeA = a.lastMessageTime || new Date(0);
      const timeB = b.lastMessageTime || new Date(0);
      return timeB - timeA;
    });

    return uniqueResults.map(data => new ChatThread(data));
  }

  static async create(data) {
    if (data.id) {
      const chatRef = db.collection(COLLECTIONS.CHATS).doc(data.id);
      const payload = {
        ...data,
        participantIds: data.participantIds || [data.user1Id, data.user2Id].filter(Boolean),
        unreadCount: typeof data.unreadCount === 'object' && data.unreadCount !== null ? data.unreadCount : {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await chatRef.set(payload, { merge: true });
      return new ChatThread({ id: data.id, ...payload });
    }

    const result = await createDocument(COLLECTIONS.CHATS, {
      ...data,
      participantIds: data.participantIds || [data.user1Id, data.user2Id].filter(Boolean),
      unreadCount: typeof data.unreadCount === 'object' && data.unreadCount !== null ? data.unreadCount : {},
    });
    return new ChatThread(result);
  }

  async save() {
    const data = this.toJSON();
    delete data.id;
    data.updatedAt = new Date();
    await updateDocument(COLLECTIONS.CHATS, this.id, data);
    return this;
  }

  async getMessages(limit = 50) {
    if (!this.id) {
      return [];
    }
    const snapshot = await db.collection(COLLECTIONS.CHATS)
      .doc(this.id)
      .collection(COLLECTIONS.MESSAGES)
      .orderBy('timestamp', 'desc')
      .limit(limit)
      .get();

    return snapshot.docs.map((doc) => new ChatMessage({ id: doc.id, ...doc.data() }));
  }

  async addMessage(message) {
    if (!this.id) {
      throw new Error('ChatThread.addMessage() requires an existing chat id');
    }

    const msg = await ChatMessage.create(this.id, {
      ...message,
      read: false,
      isDelivered: true,
      isSeen: false,
      timestamp: new Date(),
    });

    this.lastMessage = message.message;
    this.lastMessageTime = new Date();

    const unreadCountMap = typeof this.unreadCount === 'object' ? { ...this.unreadCount } : {};
    if (message.receiverId) {
      unreadCountMap[message.receiverId] = (unreadCountMap[message.receiverId] || 0) + 1;
    }
    this.unreadCount = unreadCountMap;

    await updateDocument(COLLECTIONS.CHATS, this.id, {
      lastMessage: this.lastMessage,
      lastMessageTime: this.lastMessageTime,
      unreadCount: this.unreadCount,
    });

    return msg;
  }

  async markAllRead(userId) {
    if (userId !== this.user1Id && userId !== this.user2Id) {
      return this;
    }

    const unreadCountMap = typeof this.unreadCount === 'object' ? { ...this.unreadCount } : {};
    unreadCountMap[userId] = 0;
    this.unreadCount = unreadCountMap;
    await updateDocument(COLLECTIONS.CHATS, this.id, {
      unreadCount: this.unreadCount,
    });

    const messages = await this.getMessages(100);
    for (const msg of messages) {
      if (msg.receiverId === userId && !msg.read) {
        await msg.markAsRead();
      }
    }

    return this;
  }
}

module.exports = { ChatMessage, ChatThread };