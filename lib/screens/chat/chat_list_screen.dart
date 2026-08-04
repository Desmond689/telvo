import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:telvo/config/routes.dart';
import 'package:telvo/providers/chat_provider.dart';
import 'package:telvo/providers/auth_provider.dart';
import 'package:telvo/models/chat_model.dart';
import 'package:telvo/widgets/empty_state.dart';

class ChatListScreen extends StatefulWidget {
  const ChatListScreen({super.key});

  @override
  State<ChatListScreen> createState() => _ChatListScreenState();
}

class _ChatListScreenState extends State<ChatListScreen> {
  final TextEditingController _searchController = TextEditingController();
  String _searchQuery = '';

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = context.watch<AuthProvider>();
    final chatProvider = context.watch<ChatProvider>();
    final userId = authProvider.currentUser?.id;

    return Scaffold(
      appBar: AppBar(title: const Text('Messages'), elevation: 0),
      body: userId == null
          ? const Center(child: Text('Please login to view messages'))
          : StreamBuilder<List<ChatThread>>(
              stream: chatProvider.getUserAllThreads(userId),
              builder: (context, snapshot) {
                if (snapshot.hasError) {
                  return Center(child: Text('Error: ${snapshot.error}'));
                }

                if (!snapshot.hasData) {
                  return const Center(child: CircularProgressIndicator());
                }

                final threads = snapshot.data!;
                final filteredThreads = threads.where((thread) {
                  final isUser1 = thread.user1Id == userId;
                  final otherName = (isUser1 ? thread.user2Name : thread.user1Name) ?? '';
                  final lastMessage = thread.lastMessage ?? '';
                  final query = _searchQuery.trim().toLowerCase();
                  if (query.isEmpty) return true;
                  return otherName.toLowerCase().contains(query) || lastMessage.toLowerCase().contains(query);
                }).toList();

                if (threads.isEmpty) {
                  return EmptyState(
                    title: 'No Messages',
                    subtitle: 'Start a conversation with a professional',
                    imagePath: 'assets/images/empty_state.png',
                    actionText: 'Browse Professionals',
                    onAction: () {
                      Navigator.pushNamed(context, AppRoutes.search);
                    },
                  );
                }

                return Column(
                  children: [
                    Padding(
                      padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
                      child: TextField(
                        controller: _searchController,
                        decoration: InputDecoration(
                          hintText: 'Search conversations...',
                          prefixIcon: const Icon(Icons.search),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(24),
                            borderSide: BorderSide.none,
                          ),
                          filled: true,
                          fillColor: Theme.of(context).colorScheme.surfaceVariant,
                        ),
                        onChanged: (value) {
                          setState(() {
                            _searchQuery = value;
                          });
                        },
                      ),
                    ),
                    if (filteredThreads.isEmpty)
                      Expanded(
                        child: EmptyState(
                          title: 'No matching conversations',
                          subtitle: 'Try a different keyword or start a new chat.',
                          imagePath: 'assets/images/empty_state.png',
                        ),
                      )
                    else
                      Expanded(
                        child: ListView.builder(
                          padding: const EdgeInsets.all(16),
                          itemCount: filteredThreads.length,
                          itemBuilder: (context, index) {
                            final thread = filteredThreads[index];
                            return _buildChatTile(thread, userId);
                          },
                        ),
                      ),
                  ],
                );
              },
            ),
    );
  }

  Widget _buildChatTile(ChatThread thread, String userId) {
    final isUser1 = thread.user1Id == userId;
    final otherName = isUser1 ? thread.user2Name : thread.user1Name;
    final otherPhoto = isUser1 ? thread.user2Photo : thread.user1Photo;
    final unreadCount = thread.unreadCountFor(userId);

    final theme = Theme.of(context);
    return GestureDetector(
      onTap: () {
        Navigator.pushNamed(context, AppRoutes.chat, arguments: thread);
      },
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: theme.colorScheme.surface,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: theme.colorScheme.outlineVariant.withValues(alpha: 0.35),
          ),
        ),
        child: Row(
          children: [
            CircleAvatar(
              radius: 28,
              backgroundImage: otherPhoto != null
                  ? NetworkImage(otherPhoto)
                  : null,
              child: otherPhoto == null
                  ? Text(
                      otherName?.substring(0, 1).toUpperCase() ?? '?',
                      style: const TextStyle(fontSize: 20),
                    )
                  : null,
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          otherName ?? 'Unknown User',
                          style: const TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 16,
                          ),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      if ((unreadCount ?? 0) > 0)
                        Container(
                          padding: const EdgeInsets.all(4),
                          decoration: const BoxDecoration(
                            color: Color(0xFF00C853),
                            shape: BoxShape.circle,
                          ),
                          constraints: const BoxConstraints(
                            minWidth: 20,
                            minHeight: 20,
                          ),
                          child: Text(
                            unreadCount.toString(),
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                            ),
                            textAlign: TextAlign.center,
                          ),
                        ),
                    ],
                  ),
                  Text(
                    thread.lastMessage ?? 'Start a conversation',
                    style: TextStyle(
                      color: theme.colorScheme.onSurfaceVariant,
                      fontSize: 14,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
            const SizedBox(width: 8),
            if (thread.lastMessageTime != null)
              Text(
                _formatTime(thread.lastMessageTime!),
                style: TextStyle(color: Colors.grey.shade400, fontSize: 12),
              ),
          ],
        ),
      ),
    );
  }

  String _formatTime(DateTime time) {
    final now = DateTime.now();
    final difference = now.difference(time);

    if (difference.inDays > 0) {
      return '${difference.inDays}d';
    } else if (difference.inHours > 0) {
      return '${difference.inHours}h';
    } else if (difference.inMinutes > 0) {
      return '${difference.inMinutes}m';
    } else {
      return 'now';
    }
  }
}
