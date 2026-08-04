import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:rxdart/rxdart.dart';
import 'package:telvo/models/chat_model.dart';
import 'package:telvo/models/user_model.dart';

class ChatProvider extends ChangeNotifier {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;

  final List<ChatThread> _threads = [];
  final List<ChatMessage> _messages = [];
  bool _isLoading = false;
  String? _error;

  List<ChatThread> get threads => _threads;
  List<ChatMessage> get messages => _messages;
  bool get isLoading => _isLoading;
  String? get error => _error;

  Stream<List<ChatThread>> getUserThreads(String userId) {
    final streams = [
      _firestore.collection('chats').where('user1Id', isEqualTo: userId).snapshots(),
      _firestore.collection('chats').where('user2Id', isEqualTo: userId).snapshots(),
      _firestore.collection('chats').where('participantIds', arrayContains: userId).snapshots(),
    ];

    return Rx.combineLatestList<QuerySnapshot<Map<String, dynamic>>>(
      streams,
    ).map((snapshots) {
      final threads = <ChatThread>[];
      for (final snapshot in snapshots) {
        threads.addAll(
          snapshot.docs.map(
            (doc) => ChatThread.fromMap({...doc.data(), 'id': doc.id}),
          ),
        );
      }
      final uniqueById = <String, ChatThread>{};
      for (final thread in threads) {
        if (thread.id != null) uniqueById[thread.id!] = thread;
      }
      final uniqueThreads = uniqueById.values.toList();
      uniqueThreads.sort((a, b) {
        final timeA =
            a.lastMessageTime ?? DateTime.fromMillisecondsSinceEpoch(0);
        final timeB =
            b.lastMessageTime ?? DateTime.fromMillisecondsSinceEpoch(0);
        return timeB.compareTo(timeA);
      });
      return uniqueThreads;
    });
  }

  Stream<List<ChatThread>> getUserAllThreads(String userId) {
    final user1Stream = _firestore
        .collection('chats')
        .where('user1Id', isEqualTo: userId)
        .snapshots();

    final user2Stream = _firestore
        .collection('chats')
        .where('user2Id', isEqualTo: userId)
        .snapshots();

    final participantsStream = _firestore
        .collection('chats')
        .where('participantIds', arrayContains: userId)
        .snapshots();

    return Rx.combineLatest3<
      QuerySnapshot<Map<String, dynamic>>,
      QuerySnapshot<Map<String, dynamic>>,
      QuerySnapshot<Map<String, dynamic>>,
      List<ChatThread>
    >(user1Stream, user2Stream, participantsStream, (
      snapshot1,
      snapshot2,
      snapshot3,
    ) {
      final threads = <ChatThread>[];
      threads.addAll(
        snapshot1.docs.map(
          (doc) => ChatThread.fromMap({...doc.data(), 'id': doc.id}),
        ),
      );
      threads.addAll(
        snapshot2.docs.map(
          (doc) => ChatThread.fromMap({...doc.data(), 'id': doc.id}),
        ),
      );
      threads.addAll(
        snapshot3.docs.map(
          (doc) => ChatThread.fromMap({...doc.data(), 'id': doc.id}),
        ),
      );

      final uniqueById = <String, ChatThread>{};
      for (final thread in threads) {
        if (thread.id != null) uniqueById[thread.id!] = thread;
      }

      final uniqueThreads = uniqueById.values.toList();
      uniqueThreads.sort((a, b) {
        final timeA =
            a.lastMessageTime ?? DateTime.fromMillisecondsSinceEpoch(0);
        final timeB =
            b.lastMessageTime ?? DateTime.fromMillisecondsSinceEpoch(0);
        return timeB.compareTo(timeA);
      });
      return uniqueThreads;
    });
  }

  Future<void> markAsRead(String chatId, String userId) async {
    try {
      final messages = await _firestore
          .collection('chats')
          .doc(chatId)
          .collection('messages')
          .where('receiverId', isEqualTo: userId)
          .where('read', isEqualTo: false)
          .get();

      for (final doc in messages.docs) {
        await doc.reference.update({'read': true});
      }

      await _firestore.collection('chats').doc(chatId).update({
        'unreadCount.$userId': 0,
      });
    } catch (e) {
      debugPrint('Error marking messages as read: $e');
    }
  }

  String _chatIdFor(String userA, String userB) {
    final ids = [userA, userB]..sort();
    return ids.join('_');
  }

  Future<ChatThread> createChat(String user1Id, String user2Id) async {
    try {
      final chatId = _chatIdFor(user1Id, user2Id);
      final chatDocRef = _firestore.collection('chats').doc(chatId);
      final existingDoc = await chatDocRef.get();
      if (existingDoc.exists) {
        return ChatThread.fromMap({
          ...existingDoc.data()!,
          'id': existingDoc.id,
        });
      }

      // Fallback for older or migrated chat documents created without predictable IDs.
      final existing1 = await _firestore
          .collection('chats')
          .where('user1Id', isEqualTo: user1Id)
          .where('user2Id', isEqualTo: user2Id)
          .get();
      if (existing1.docs.isNotEmpty) {
        final doc = existing1.docs.first;
        return ChatThread.fromMap({...doc.data(), 'id': doc.id});
      }

      final existing2 = await _firestore
          .collection('chats')
          .where('user1Id', isEqualTo: user2Id)
          .where('user2Id', isEqualTo: user1Id)
          .get();
      if (existing2.docs.isNotEmpty) {
        final doc = existing2.docs.first;
        return ChatThread.fromMap({...doc.data(), 'id': doc.id});
      }

      // Create a new deterministic chat thread document.
      final user1Doc = await _firestore.collection('users').doc(user1Id).get();
      final user2Doc = await _firestore.collection('users').doc(user2Id).get();

      final user1 = UserModel.fromMap(user1Doc.data()!);
      final user2 = UserModel.fromMap(user2Doc.data()!);

      final thread = ChatThread(
        id: chatId,
        participantIds: [user1Id, user2Id],
        user1Id: user1Id,
        user2Id: user2Id,
        user1Name: user1.fullName,
        user1Photo: user1.profilePhoto,
        user2Name: user2.fullName,
        user2Photo: user2.profilePhoto,
        lastMessage: null,
        lastMessageTime: null,
        unreadCount: 0,
        unreadCounts: {user1Id: 0, user2Id: 0},
        isActive: true,
      );

      await chatDocRef.set(thread.toMap());
      return thread;
    } catch (e) {
      _setError(e.toString());
      rethrow;
    }
  }

  Future<void> sendMessage(ChatMessage message) async {
    try {
      final messageId = message.id ?? _firestore.collection('chats').doc().collection('messages').doc().id;
      final payload = message
          .copyWith(
            id: messageId,
            timestamp: message.timestamp ?? DateTime.now(),
            isRead: false,
          )
          .toMap();

      final chatId = message.chatId;
      if (chatId == null) {
        throw Exception('Chat ID is required to send a message.');
      }

      await _firestore
          .collection('chats')
          .doc(chatId)
          .collection('messages')
          .doc(messageId)
          .set(payload);

      await _firestore.collection('chats').doc(chatId).set({
        'lastMessage': message.message,
        'lastMessageTime': FieldValue.serverTimestamp(),
        'lastMessageAt': FieldValue.serverTimestamp(),
        'unreadCount': {
          message.receiverId!: FieldValue.increment(1),
        },
      }, SetOptions(merge: true));
    } catch (e) {
      _setError(e.toString());
      rethrow;
    }
  }

  Stream<List<ChatMessage>> getChatMessages(String chatId) {
    return _firestore
        .collection('chats')
        .doc(chatId)
        .collection('messages')
        .orderBy('timestamp', descending: true)
        .snapshots()
        .map((snapshot) {
          return snapshot.docs
              .map(
                (doc) => ChatMessage.fromMap({...doc.data(), 'id': doc.id}),
              )
              .toList();
        });
  }

  Future<void> deleteChat(String chatId) async {
    try {
      await _firestore.collection('chats').doc(chatId).delete();
      _threads.removeWhere((thread) => thread.id == chatId);
      notifyListeners();
    } catch (e) {
      _setError(e.toString());
    }
  }

  void _setLoading(bool loading) {
    _isLoading = loading;
    notifyListeners();
  }

  void _setError(String? error) {
    _error = error;
    notifyListeners();
  }

  void clearError() {
    _error = null;
    notifyListeners();
  }
}
