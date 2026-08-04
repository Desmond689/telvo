import 'package:cloud_firestore/cloud_firestore.dart';

class ChatMessage {
  ChatMessage({
    this.id,
    this.chatId,
    this.senderId,
    this.receiverId,
    this.message,
    this.type = 'text',
    this.mediaUrl,
    this.timestamp,
    this.isRead = false,
    this.isDelivered = false,
    this.isSeen = false,
  });

  factory ChatMessage.fromMap(Map<String, dynamic> map) {
    return ChatMessage(
      id: map['id'],
      chatId: map['chatId'],
      senderId: map['senderId'],
      receiverId: map['receiverId'],
      message: map['message'],
      type: map['type'] ?? 'text',
      mediaUrl: map['mediaUrl'],
      timestamp: map['timestamp']?.toDate(),
      isRead: map['read'] ?? map['isRead'] ?? false,
      isDelivered: map['isDelivered'] ?? false,
      isSeen: map['isSeen'] ?? false,
    );
  }
  final String? id;
  final String? chatId;
  final String? senderId;
  final String? receiverId;
  final String? message;
  final String? type; // 'text', 'image', 'video', 'file', 'voice'
  final String? mediaUrl;
  final DateTime? timestamp;
  final bool? isRead;
  final bool? isDelivered;
  final bool? isSeen;

  Map<String, dynamic> toMap() => {
        'id': id,
        'chatId': chatId,
        'senderId': senderId,
        'receiverId': receiverId,
        'message': message,
        'type': type,
        'mediaUrl': mediaUrl,
        'timestamp': timestamp ?? FieldValue.serverTimestamp(),
        'isRead': isRead,
        'isDelivered': isDelivered,
        'isSeen': isSeen,
      };

  ChatMessage copyWith({
    String? id,
    String? chatId,
    String? senderId,
    String? receiverId,
    String? message,
    String? type,
    String? mediaUrl,
    DateTime? timestamp,
    bool? isRead,
    bool? isDelivered,
    bool? isSeen,
  }) =>
      ChatMessage(
        id: id ?? this.id,
        chatId: chatId ?? this.chatId,
        senderId: senderId ?? this.senderId,
        receiverId: receiverId ?? this.receiverId,
        message: message ?? this.message,
        type: type ?? this.type,
        mediaUrl: mediaUrl ?? this.mediaUrl,
        timestamp: timestamp ?? this.timestamp,
        isRead: isRead ?? this.isRead,
        isDelivered: isDelivered ?? this.isDelivered,
        isSeen: isSeen ?? this.isSeen,
      );
}

class ChatThread {
  ChatThread({
    this.id,
    this.participantIds,
    this.user1Id,
    this.user2Id,
    this.lastMessage,
    this.lastMessageTime,
    this.unreadCount = 0,
    this.unreadCounts,
    this.user1Name,
    this.user1Photo,
    this.user2Name,
    this.user2Photo,
    this.isActive = true,
  });

  factory ChatThread.fromMap(Map<String, dynamic> map) {
    final participantIds = map['participantIds'] != null
        ? List<String>.from(map['participantIds'])
        : <String>[];

    final fallbackParticipantIds = <String>[];
    if (map['user1Id'] != null && map['user2Id'] != null) {
      fallbackParticipantIds.add(map['user1Id']);
      fallbackParticipantIds.add(map['user2Id']);
    }

    Map<String, int>? unreadCounts;
    if (map['unreadCount'] is Map) {
      unreadCounts = Map<String, int>.fromEntries(
        (map['unreadCount'] as Map).entries.map(
          (entry) => MapEntry(entry.key.toString(), int.tryParse(entry.value?.toString() ?? '') ?? 0),
        ),
      );
    }

    return ChatThread(
      id: map['id'],
      participantIds: participantIds.isNotEmpty ? participantIds : fallbackParticipantIds,
      user1Id: map['user1Id'],
      user2Id: map['user2Id'],
      lastMessage: map['lastMessage'],
      lastMessageTime: map['lastMessageTime']?.toDate() ?? map['lastMessageAt']?.toDate(),
      unreadCount: map['unreadCount'] is int ? map['unreadCount'] as int : 0,
      unreadCounts: unreadCounts,
      user1Name: map['user1Name'],
      user1Photo: map['user1Photo'],
      user2Name: map['user2Name'],
      user2Photo: map['user2Photo'],
      isActive: map['isActive'] ?? true,
    );
  }
  final String? id;
  final List<String>? participantIds;
  final String? user1Id;
  final String? user2Id;
  final String? lastMessage;
  final DateTime? lastMessageTime;
  final int? unreadCount;
  final Map<String, int>? unreadCounts;
  final String? user1Name;
  final String? user1Photo;
  final String? user2Name;
  final String? user2Photo;
  final bool? isActive;

  int unreadCountFor(String userId) => unreadCounts?[userId] ?? unreadCount ?? 0;

  Map<String, dynamic> toMap() => {
        'id': id,
        'participantIds': participantIds ?? [if (user1Id != null && user2Id != null) user1Id!, user2Id!],
        'user1Id': user1Id,
        'user2Id': user2Id,
        'lastMessage': lastMessage,
        'lastMessageTime': lastMessageTime ?? FieldValue.serverTimestamp(),
        'lastMessageAt': lastMessageTime ?? FieldValue.serverTimestamp(),
        'unreadCount': unreadCounts ?? unreadCount,
        'user1Name': user1Name,
        'user1Photo': user1Photo,
        'user2Name': user2Name,
        'user2Photo': user2Photo,
        'isActive': isActive,
      };

  ChatThread copyWith({
    List<String>? participantIds,
    String? id,
    String? user1Id,
    String? user2Id,
    String? lastMessage,
    DateTime? lastMessageTime,
    int? unreadCount,
    Map<String, int>? unreadCounts,
    String? user1Name,
    String? user1Photo,
    String? user2Name,
    String? user2Photo,
    bool? isActive,
  }) =>
      ChatThread(
        participantIds: participantIds ?? this.participantIds,
        id: id ?? this.id,
        user1Id: user1Id ?? this.user1Id,
        user2Id: user2Id ?? this.user2Id,
        lastMessage: lastMessage ?? this.lastMessage,
        lastMessageTime: lastMessageTime ?? this.lastMessageTime,
        unreadCount: unreadCount ?? this.unreadCount,
        unreadCounts: unreadCounts ?? this.unreadCounts,
        user1Name: user1Name ?? this.user1Name,
        user1Photo: user1Photo ?? this.user1Photo,
        user2Name: user2Name ?? this.user2Name,
        user2Photo: user2Photo ?? this.user2Photo,
        isActive: isActive ?? this.isActive,
      );
}
