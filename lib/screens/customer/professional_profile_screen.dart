import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:telvo/models/user_model.dart';
import 'package:telvo/models/professional_display.dart';
import 'package:telvo/providers/auth_provider.dart';
import 'package:telvo/providers/chat_provider.dart';
import 'package:telvo/providers/user_provider.dart';
import 'package:telvo/widgets/rating_stars.dart';
import 'package:telvo/widgets/custom_button.dart';
import 'package:telvo/config/routes.dart';
import 'package:telvo/widgets/remote_image.dart';

class ProfessionalProfileScreen extends StatefulWidget {
  const ProfessionalProfileScreen({super.key});

  @override
  State<ProfessionalProfileScreen> createState() =>
      _ProfessionalProfileScreenState();
}

class _ProfessionalProfileScreenState extends State<ProfessionalProfileScreen> {
  UserModel? _professional;
  bool _isFavorite = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final args = ModalRoute.of(context)?.settings.arguments;
    if (args is UserModel) {
      _professional = args;
    } else if (args is Professional) {
      _professional = UserModel(
        id: null,
        fullName: args.name,
        category: args.title,
        profilePhoto: args.photoUrl,
        isVerified: args.verified,
      );
    }

    if (_professional?.id != null) {
      context.read<UserProvider>().getProfessionalDetails(_professional!.id!);
    }
  }

  @override
  Widget build(BuildContext context) {
    final userProvider = context.watch<UserProvider>();
    final professional = userProvider.selectedProfessional ?? _professional;

    if (professional == null) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    return Scaffold(
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            expandedHeight: 250,
            pinned: true,
            flexibleSpace: FlexibleSpaceBar(
              background: Stack(
                fit: StackFit.expand,
                children: [
                  if (professional.profilePhoto != null)
                    RemoteImage(
                      imageUrl: professional.profilePhoto,
                      fit: BoxFit.cover,
                      width: double.infinity,
                      height: double.infinity,
                    )
                  else
                    Container(
                      color: Colors.grey.shade300,
                      child: const Icon(
                        Icons.person,
                        size: 80,
                        color: Colors.grey,
                      ),
                    ),
                  Container(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: [
                          Colors.transparent,
                          Colors.black.withValues(alpha: 0.6),
                        ],
                      ),
                    ),
                  ),
                  Positioned(
                    bottom: 16,
                    left: 16,
                    right: 16,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Text(
                              professional.fullName ?? 'Unknown',
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 24,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            const SizedBox(width: 8),
                            if (professional.isVerified)
                              const Icon(
                                Icons.verified,
                                color: Color(0xFF00C853),
                                size: 24,
                              ),
                          ],
                        ),
                        Text(
                          professional.category ?? 'Professional',
                          style: TextStyle(
                            color: Colors.white.withValues(alpha: 0.9),
                            fontSize: 16,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Row(
                          children: [
                            RatingStars(rating: professional.rating ?? 0),
                            const SizedBox(width: 8),
                            Text(
                              '(${professional.jobsCompleted ?? 0} jobs)',
                              style: TextStyle(
                                color: Colors.white.withValues(alpha: 0.9),
                                fontSize: 14,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            actions: [
              IconButton(
                onPressed: () {
                  setState(() => _isFavorite = !_isFavorite);
                  // Add to favorites logic
                },
                icon: Icon(
                  _isFavorite ? Icons.favorite : Icons.favorite_border,
                  color: _isFavorite ? Colors.red : Colors.white,
                ),
              ),
              IconButton(
                onPressed: () {
                  // Share profile
                },
                icon: const Icon(Icons.share, color: Colors.white),
              ),
                PopupMenuButton<String>(
                  color: Theme.of(context).colorScheme.surface,
                  onSelected: (value) async {
                    final authProvider = context.read<AuthProvider>();
                    final currentUserId = authProvider.currentUser?.id;
                    if (value == 'report') {
                      // Ask for reason
                      final reasonController = TextEditingController();
                      final res = await showDialog<String?>(
                        context: context,
                        builder: (context) => AlertDialog(
                          title: const Text('Report User'),
                          content: TextField(
                            controller: reasonController,
                            maxLines: 3,
                            decoration: const InputDecoration(
                              hintText: 'Describe the issue',
                            ),
                          ),
                          actions: [
                            TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
                            TextButton(
                              onPressed: () => Navigator.pop(context, reasonController.text.trim()),
                              child: const Text('Submit'),
                            ),
                          ],
                        ),
                      );
                      if (res != null && res.isNotEmpty && professional.id != null) {
                        try {
                          await context.read<UserProvider>().reportUser(professional.id!, res);
                          if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Report submitted')));
                        } catch (e) {
                          if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Report failed: $e')));
                        }
                      }
                    } else if (value == 'block') {
                      if (currentUserId == null || professional.id == null) return;
                      final confirm = await showDialog<bool>(
                        context: context,
                        builder: (context) => AlertDialog(
                          title: const Text('Block User?'),
                          content: const Text('Blocked users will not be able to contact you.'),
                          actions: [
                            TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('No')),
                            TextButton(onPressed: () => Navigator.pop(context, true), child: const Text('Yes')),
                          ],
                        ),
                      );
                      if (confirm == true) {
                        try {
                          await context.read<UserProvider>().blockUser(currentUserId, professional.id!);
                          if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('User blocked')));
                        } catch (e) {
                          if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed to block user: $e')));
                        }
                      }
                    }
                  },
                  itemBuilder: (context) => const [
                    PopupMenuItem(value: 'report', child: Text('Report User')),
                    PopupMenuItem(value: 'block', child: Text('Block User')),
                  ],
                  icon: const Icon(Icons.more_vert, color: Colors.white),
                ),
              ],
          ),
          SliverList(
            delegate: SliverChildListDelegate([
              Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _buildInfoSection(professional),
                    const SizedBox(height: 16),
                    _buildSkillsSection(professional),
                    const SizedBox(height: 16),
                    _buildGallerySection(professional),
                    const SizedBox(height: 16),
                    _buildReviewsSection(professional),
                    const SizedBox(height: 24),
                    CustomButton(
                      text: 'Hire Now',
                      onPressed: () {
                        Navigator.pushNamed(
                          context,
                          AppRoutes.jobPost,
                          arguments: professional.id,
                        );
                      },
                    ),
                    const SizedBox(height: 16),
                    CustomButton(
                      text: 'Chat with Professional',
                      isOutlined: true,
                      onPressed: () async {
                        final currentUserId = context
                            .read<AuthProvider>()
                            .currentUser
                            ?.id;
                        if (professional.id == null || currentUserId == null) {
                          return;
                        }

                        final thread = await context
                            .read<ChatProvider>()
                            .createChat(currentUserId, professional.id!);

                        if (!mounted) return;
                        await Navigator.pushNamed(
                          context,
                          AppRoutes.chat,
                          arguments: thread,
                        );
                      },
                    ),
                    const SizedBox(height: 32),
                  ],
                ),
              ),
            ]),
          ),
        ],
      ),
    );
  }

  Widget _buildInfoSection(UserModel professional) {
    final theme = Theme.of(context);
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: theme.colorScheme.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: theme.colorScheme.outlineVariant.withValues(alpha: 0.35),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'About',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: theme.colorScheme.onSurface,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            professional.description?.trim().isNotEmpty == true
                ? professional.description!
                : 'No description provided yet.',
            style: TextStyle(
              fontSize: 14,
              color: theme.colorScheme.onSurfaceVariant,
            ),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              _buildInfoItem(
                Icons.location_on,
                professional.city ?? 'Location not provided',
              ),
              const SizedBox(width: 16),
              _buildInfoItem(
                Icons.work,
                '${professional.yearsOfExperience ?? 0} years',
              ),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              _buildInfoItem(
                Icons.timer,
                '${professional.responseTime ?? 0} min response',
              ),
              const SizedBox(width: 16),
              _buildInfoItem(
                Icons.verified,
                '${professional.responseRate ?? 0}% response rate',
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildInfoItem(IconData icon, String text) {
    final theme = Theme.of(context);
    return Expanded(
      child: Row(
        children: [
          Icon(icon, size: 16, color: theme.colorScheme.primary),
          const SizedBox(width: 4),
          Text(
            text,
            style: TextStyle(
              fontSize: 12,
              color: theme.colorScheme.onSurfaceVariant,
            ),
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }

  Widget _buildSkillsSection(UserModel professional) {
    final skills = professional.skills ?? [];
    final theme = Theme.of(context);
    if (skills.isEmpty) return const SizedBox.shrink();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Skills',
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
            color: theme.colorScheme.onSurface,
          ),
        ),
        const SizedBox(height: 8),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: skills
              .map(
                (skill) => Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 6,
                  ),
                  decoration: BoxDecoration(
                    color: theme.colorScheme.primaryContainer,
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(
                      color: theme.colorScheme.outlineVariant.withValues(
                        alpha: 0.35,
                      ),
                    ),
                  ),
                  child: Text(
                    skill,
                    style: TextStyle(
                      fontSize: 12,
                      color: theme.colorScheme.onPrimaryContainer,
                    ),
                  ),
                ),
              )
              .toList(),
        ),
      ],
    );
  }

  Widget _buildGallerySection(UserModel professional) {
    final photos = professional.portfolioPhotos ?? [];
    if (photos.isEmpty) return const SizedBox.shrink();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Portfolio',
          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 8),
        SizedBox(
          height: 100,
          child: ListView.builder(
            scrollDirection: Axis.horizontal,
            itemCount: photos.length,
            itemBuilder: (context, index) => Container(
              width: 100,
              margin: const EdgeInsets.only(right: 8),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(8),
                child: RemoteImage(
                  imageUrl: photos[index],
                  width: 100,
                  height: 100,
                  fit: BoxFit.cover,
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildReviewsSection(UserModel professional) {
    final theme = Theme.of(context);
    // This would fetch actual reviews from Firestore
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              'Reviews',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: theme.colorScheme.onSurface,
              ),
            ),
            TextButton(
              onPressed: () {
                Navigator.pushNamed(context, AppRoutes.reviews);
              },
              child: const Text('See All'),
            ),
          ],
        ),
        const SizedBox(height: 8),
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: theme.colorScheme.surface,
            borderRadius: BorderRadius.circular(8),
            border: Border.all(
              color: theme.colorScheme.outlineVariant.withValues(alpha: 0.35),
            ),
          ),
          child: Row(
            children: [
              RatingStars(rating: professional.rating ?? 0),
              const SizedBox(width: 8),
              Text(
                'No reviews yet',
                style: TextStyle(
                  fontSize: 14,
                  color: theme.colorScheme.onSurfaceVariant,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
