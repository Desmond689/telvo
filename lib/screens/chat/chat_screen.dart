import 'dart:io';
import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';
import 'package:telvo/providers/chat_provider.dart';
import 'package:telvo/providers/auth_provider.dart';
import 'package:telvo/services/storage_service.dart';
import 'package:telvo/models/chat_model.dart';
import 'package:telvo/models/user_model.dart';
import 'package:telvo/utils/error_messages.dart';
import 'package:telvo/utils/helpers.dart';
import 'package:telvo/widgets/empty_state.dart';

class ChatScreen extends StatefulWidget {
  const ChatScreen({super.key});

  @override
  State<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  final TextEditingController _messageController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  ChatThread? _thread;
  UserModel? _otherUser;
  bool _isLoading = true;
  bool _hasMarkedRead = false;

  @override
  void dispose() {
    _messageController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_thread != null || !_isLoading) return;

    final args = ModalRoute.of(context)?.settings.arguments;
    final authProvider = context.read<AuthProvider>();
    final currentUserId = authProvider.currentUser?.id;

    if (args is ChatThread) {
      _thread = args;
      _loadOtherUser();
    } else if (args is String && currentUserId != null) {
      _createThreadFromUserId(currentUserId, args);
    } else {
      setState(() {
        _isLoading = false;
      });
    }
  }

  Future<void> _createThreadFromUserId(
    String currentUserId,
    String otherUserId,
  ) async {
    setState(() {
      _isLoading = true;
    });

    try {
      _thread = await context.read<ChatProvider>().createChat(
        currentUserId,
        otherUserId,
      );
      if (mounted) {
        await _loadOtherUser();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(getFriendlyErrorMessage(e))),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  Future<void> _loadOtherUser() async {
    final authProvider = context.read<AuthProvider>();
    final userId = authProvider.currentUser?.id;
    final otherId = _thread!.user1Id == userId
        ? _thread!.user2Id
        : _thread!.user1Id;

    String? fallbackOtherId;
    if (_thread!.participantIds != null) {
      final found = _thread!.participantIds!
          .where((id) => id != userId)
          .toList();
      fallbackOtherId = found.isNotEmpty ? found.first : null;
    }

    final resolvedOtherId = otherId ?? fallbackOtherId;

    try {
      if (resolvedOtherId == null) return;
      final doc = await FirebaseFirestore.instance
          .collection('users')
          .doc(resolvedOtherId)
          .get();
      if (doc.exists) {
        _otherUser = UserModel.fromMap({...doc.data()!, 'id': doc.id});
      }
    } catch (_) {
      // Non-fatal: the chat still works, just without the other user's name/photo.
    }

    if (mounted) setState(() => _isLoading = false);
  }

  Future<void> _sendMessage() async {
    if (_messageController.text.trim().isEmpty) return;

    final authProvider = context.read<AuthProvider>();
    final userId = authProvider.currentUser?.id;

    if (userId == null || _thread == null) return;

    final receiverId = _resolveReceiverId(userId);
    if (receiverId.isEmpty) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Unable to determine recipient.')),
        );
      }
      return;
    }

    final message = ChatMessage(
      chatId: _thread!.id,
      senderId: userId,
      receiverId: receiverId,
      message: _messageController.text.trim(),
      timestamp: DateTime.now(),
    );

    try {
      await context.read<ChatProvider>().sendMessage(message);
      _messageController.clear();

      // Scroll to bottom
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (_scrollController.hasClients) {
          _scrollController.animateTo(
            _scrollController.position.maxScrollExtent,
            duration: const Duration(milliseconds: 300),
            curve: Curves.easeOut,
          );
        }
      });
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(getFriendlyErrorMessage(e))),
        );
      }
    }
  }

  Future<void> _attachImage() async {
    final authProvider = context.read<AuthProvider>();
    final userId = authProvider.currentUser?.id;
    if (userId == null || _thread == null) return;

    final picked = await ImagePicker().pickImage(
      source: ImageSource.gallery,
      imageQuality: 80,
    );
    if (picked == null || !mounted) return;

    ScaffoldMessenger.of(
      context,
    ).showSnackBar(const SnackBar(content: Text('Sending photo...')));

    try {
      // Upload directly to Cloudinary (no Firebase Storage needed).
      final url = await StorageService().uploadFileDirect(
        file: File(picked.path),
        folder: 'chat_images/${_thread!.id}',
        fileName: '${DateTime.now().millisecondsSinceEpoch}.jpg',
      );
      if (url == null || url.isEmpty) {
        throw Exception('Upload failed');
      }

      final receiverId = _resolveReceiverId(userId);
      if (receiverId.isEmpty) {
        throw Exception('Unable to determine image recipient.');
      }

      final message = ChatMessage(
        chatId: _thread!.id,
        senderId: userId,
        receiverId: receiverId,
        type: 'image',
        mediaUrl: url,
        timestamp: DateTime.now(),
      );

      await context.read<ChatProvider>().sendMessage(message);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(getFriendlyErrorMessage(e))),
        );
      }
    }
  }

  String _resolveReceiverId(String currentUserId) {
    if (_thread == null) return '';
    final participantIds = _thread!.participantIds;
    if (participantIds != null && participantIds.isNotEmpty) {
      final receiverId = participantIds
          .firstWhere((id) => id != currentUserId, orElse: () => '');
      if (receiverId.isNotEmpty) return receiverId;
    }

    if (_thread!.user1Id != null && _thread!.user2Id != null) {
      return _thread!.user1Id == currentUserId
          ? _thread!.user2Id ?? ''
          : _thread!.user1Id ?? '';
    }

    return '';
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = context.watch<AuthProvider>();
    final chatProvider = context.watch<ChatProvider>();
    final userId = authProvider.currentUser?.id;

    if (_isLoading) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    if (_thread == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Chat')),
        body: const Center(child: Text('Unable to start chat.')),
      );
    }

    final otherName =
        _otherUser?.fullName ??
        (_thread!.user1Id == userId ? _thread!.user2Name : _thread!.user1Name);
    final otherPhoto =
        _otherUser?.profilePhoto ??
        (_thread!.user1Id == userId
            ? _thread!.user2Photo
            : _thread!.user1Photo);

    return Scaffold(
      appBar: AppBar(
        title: Row(
          children: [
            CircleAvatar(
              radius: 20,
              backgroundImage: otherPhoto != null
                  ? NetworkImage(otherPhoto)
                  : null,
              child: const Icon(Icons.person),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    otherName ?? 'Unknown',
                    style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 2),
                  Text(
                    _otherUser?.isOnline == true
                        ? 'Online'
                        : _otherUser?.lastActive != null
                            ? 'Last active ${_formatRelativeTime(_otherUser!.lastActive!)}'
                            : 'Offline',
                    style: TextStyle(
                      fontSize: 12,
                      color: Colors.white.withOpacity(0.85),
                    ),
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
          ],
        ),
        elevation: 0,
        actions: [
          IconButton(
            onPressed: () {
              final phone = _otherUser?.phoneNumber;
              if (phone == null || phone.isEmpty) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text('No phone number on file for this user.'),
                  ),
                );
                return;
              }
              Helpers.callNumber(context, phone);
            },
            icon: const Icon(Icons.call),
          ),
          PopupMenuButton<String>(
            onSelected: (value) {
              if (value == 'profile') {
                Navigator.pushNamed(
                  context,
                  '/professional-profile',
                  arguments: _otherUser,
                );
              } else if (value == 'report') {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text('Reporting isn\'t available yet.'),
                  ),
                );
              }
            },
            itemBuilder: (context) => const [
              PopupMenuItem(value: 'profile', child: Text('View profile')),
              PopupMenuItem(value: 'report', child: Text('Report')),
            ],
          ),
        ],
      ),
      body: Column(
        children: [
          Expanded(
            child: _thread == null
                ? const Center(child: Text('No messages'))
                : StreamBuilder<List<ChatMessage>>(
                    stream: chatProvider.getChatMessages(_thread!.id!),
                    builder: (context, snapshot) {
                      if (snapshot.hasError) {
                        return Center(child: Text('Error: ${snapshot.error}'));
                      }

                      if (!snapshot.hasData) {
                        return const Center(child: CircularProgressIndicator());
                      }

                      final messages = snapshot.data!;
                      if (messages.isEmpty) {
                        return const EmptyState(
                          title: 'No messages yet',
                          subtitle:
                              'Start a conversation with the professional.',
                          imagePath: 'assets/images/empty_state.png',
                        );
                      }

                      final shouldMarkRead = userId != null && messages.any(
                        (message) => message.receiverId == userId && message.isRead == false,
                      );
                      if (shouldMarkRead) {
                        WidgetsBinding.instance.addPostFrameCallback((_) async {
                          await chatProvider.markAsRead(_thread!.id!, userId);
                          if (mounted) {
                            setState(() {
                              _hasMarkedRead = true;
                            });
                          }
                        });
                      }
 
                      WidgetsBinding.instance.addPostFrameCallback((_) {
                        if (_scrollController.hasClients) {
                          _scrollController.animateTo(
                            _scrollController.position.maxScrollExtent,
                            duration: const Duration(milliseconds: 300),
                            curve: Curves.easeOut,
                          );
                        }
                      });

                      return ListView.builder(
                        controller: _scrollController,
                        reverse: true,
                        padding: const EdgeInsets.all(16),
                        itemCount: messages.length,
                        itemBuilder: (context, index) {
                          final message = messages[index];
                          final isMe = message.senderId == userId;
                          return _buildMessageBubble(message, isMe);
                        },
                      );
                    },
                  ),
          ),
          _buildMessageInput(),
        ],
      ),
    );
  }

  Widget _buildEmptyState() => const EmptyState(
    title: 'No messages yet',
    subtitle: 'Start a conversation with the professional.',
    imagePath: 'assets/images/empty_state.png',
  );

  Widget _buildMessageBubble(ChatMessage message, bool isMe) => Align(
    alignment: isMe ? Alignment.centerRight : Alignment.centerLeft,
    child: Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: message.type == 'image'
          ? const EdgeInsets.all(4)
          : const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: isMe ? const Color(0xFF00C853) : Colors.grey.shade200,
        borderRadius: BorderRadius.circular(12),
      ),
      constraints: BoxConstraints(
        maxWidth: MediaQuery.of(context).size.width * 0.75,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          if (message.type == 'image' &&
              message.mediaUrl != null &&
              message.mediaUrl!.isNotEmpty)
            ClipRRect(
              borderRadius: BorderRadius.circular(10),
              child: Image.network(
                message.mediaUrl!,
                fit: BoxFit.cover,
                loadingBuilder: (context, child, progress) => progress == null
                    ? child
                    : const Padding(
                        padding: EdgeInsets.all(24),
                        child: CircularProgressIndicator(),
                      ),
                errorBuilder: (context, error, stackTrace) => const Padding(
                  padding: EdgeInsets.all(16),
                  child: Icon(Icons.broken_image, color: Colors.grey),
                ),
              ),
            )
          else
            Text(
              message.message ?? '',
              style: TextStyle(color: isMe ? Colors.white : Colors.black),
            ),
          const SizedBox(height: 4),
          Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                _formatTime(message.timestamp ?? DateTime.now()),
                style: TextStyle(
                  fontSize: 10,
                  color: isMe ? Colors.white70 : Colors.grey.shade600,
                ),
              ),
              if (isMe)
                Padding(
                  padding: const EdgeInsets.only(left: 6),
                  child: Icon(
                    message.isRead == true ? Icons.done_all : Icons.done,
                    size: 12,
                    color: message.isRead == true
                        ? Colors.white70
                        : Colors.white54,
                  ),
                ),
            ],
          ),
        ],
      ),
    ),
  );

  Widget _buildMessageInput() => Container(
    padding: const EdgeInsets.all(8),
    decoration: BoxDecoration(
      color: Colors.white,
      border: Border(top: BorderSide(color: Colors.grey.shade200)),
    ),
    child: Row(
      children: [
        IconButton(
          onPressed: _attachImage,
          icon: const Icon(Icons.attach_file, color: Colors.grey),
        ),
        Expanded(
          child: TextField(
            controller: _messageController,
            decoration: InputDecoration(
              hintText: 'Type a message...',
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(24),
                borderSide: BorderSide.none,
              ),
              filled: true,
              fillColor: Colors.grey.shade100,
              contentPadding: const EdgeInsets.symmetric(
                horizontal: 16,
                vertical: 8,
              ),
            ),
            onSubmitted: (_) => _sendMessage(),
          ),
        ),
        const SizedBox(width: 8),
        GestureDetector(
          onTap: _sendMessage,
          child: Container(
            padding: const EdgeInsets.all(8),
            decoration: const BoxDecoration(
              color: Color(0xFF00C853),
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.send, color: Colors.white),
          ),
        ),
      ],
    ),
  );

  String _formatTime(DateTime time) =>
      '${time.hour.toString().padLeft(2, '0')}:${time.minute.toString().padLeft(2, '0')}';

  String _formatRelativeTime(DateTime time) {
    final difference = DateTime.now().difference(time);
    if (difference.inMinutes < 1) return 'just now';
    if (difference.inHours < 1) return '${difference.inMinutes}m ago';
    if (difference.inDays < 1) return '${difference.inHours}h ago';
    return '${difference.inDays}d ago';
  }
}
