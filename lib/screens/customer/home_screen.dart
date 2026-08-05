// lib/screens/customer/home_screen.dart
import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:provider/provider.dart';
import 'package:telvo/config/routes.dart';
import 'package:telvo/models/professional_display.dart';
import 'package:telvo/models/user_model.dart';
import 'package:telvo/providers/auth_provider.dart';
import 'package:telvo/providers/job_provider.dart';
import 'package:telvo/providers/user_provider.dart';
import 'package:telvo/utils/app_colors.dart';
import 'package:telvo/utils/lookup_data.dart';
import 'package:telvo/widgets/category_card.dart';
import 'package:telvo/widgets/search_bar.dart';
import 'package:telvo/widgets/empty_state.dart';
import 'package:telvo/widgets/worker_feed_card.dart';
import 'package:telvo/widgets/need_help_fast_button.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _selectedIndex = 0;
  final List<Category> categories = LookupData.jobCategories
      .map((name) => Category(
            name,
            LookupData.iconForCategory(name),
            LookupData.colorForCategory(name),
          ))
      .toList();

  final ScrollController _scrollController = ScrollController();
  final List<UserModel> _professionals = [];
  final Set<String> _loadedProfessionalIds = {};
  bool _isLoadingInitial = true;
  bool _isLoadingMore = false;
  bool _hasMore = true;
  bool _hasError = false;
  String? _errorMessage;
  QueryDocumentSnapshot<Map<String, dynamic>>? _lastDocument;

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_onScroll);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadProfessionalsPage();
    });
  }

  @override
  void dispose() {
    _scrollController.removeListener(_onScroll);
    _scrollController.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (!_scrollController.hasClients || _isLoadingMore || !_hasMore) {
      return;
    }
    final threshold = 200.0;
    final position = _scrollController.position;
    if (position.maxScrollExtent - position.pixels <= threshold) {
      _loadProfessionalsPage();
    }
  }

  Future<void> _loadProfessionalsPage() async {
    if (_isLoadingMore) {
      return;
    }

    setState(() {
      if (_professionals.isEmpty) {
        _isLoadingInitial = true;
      } else {
        _isLoadingMore = true;
      }
      _hasError = false;
    });

    try {
      final page = await context.read<UserProvider>().fetchProfessionalsPage(
            limit: 10,
            startAfter: _lastDocument,
          );
      final newProfessionals = page.professionals.where((professional) {
        return professional.id != null && !_loadedProfessionalIds.contains(professional.id);
      }).toList();

      setState(() {
        _professionals.addAll(newProfessionals);
        _loadedProfessionalIds.addAll(newProfessionals
            .where((professional) => professional.id != null)
            .map((professional) => professional.id!));
        _lastDocument = page.lastDocument;
        _hasMore = page.hasMore;
      });
    } catch (error) {
      setState(() {
        _hasError = true;
        _errorMessage = error.toString();
      });
    } finally {
      setState(() {
        _isLoadingInitial = false;
        _isLoadingMore = false;
      });
    }
  }

  Future<void> _refreshHome() async {
    setState(() {
      _professionals.clear();
      _loadedProfessionalIds.clear();
      _lastDocument = null;
      _hasMore = true;
      _errorMessage = null;
      _hasError = false;
      _isLoadingInitial = true;
    });
    await _loadProfessionalsPage();
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = context.watch<AuthProvider>();
    final user = authProvider.currentUser;

    return Scaffold(
      body: SafeArea(
        child: Column(
          children: [
            _buildHeader(user),
            const SizedBox(height: 4),
            const CustomSearchBar(),
            const SizedBox(height: 16),
            Expanded(
              child: ListView(
                controller: _scrollController,
                padding: EdgeInsets.zero,
                children: [
                  _buildCategories(),
                  const SizedBox(height: 24),
                  _buildNeedHelpFast(),
                  const SizedBox(height: 24),
                  _buildActionButtons(),
                  const SizedBox(height: 24),
                  _buildWorkerFeed(),
                  const SizedBox(height: 24),
                ],
              ),
            ),
          ],
        ),
      ),
      bottomNavigationBar: _buildBottomNavigationBar(),
    );
  }

  String _greeting() {
    final hour = DateTime.now().hour;
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  }

  Widget _buildHeader(UserModel? user) => Padding(
    padding: const EdgeInsets.fromLTRB(20, 16, 16, 8),
    child: Row(
      children: [
        Container(
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            border: Border.all(
              color: AppColors.primary.withValues(alpha: 0.3),
              width: 2,
            ),
          ),
          child: CircleAvatar(
            radius: 24,
            backgroundColor: AppColors.primaryBackground,
            backgroundImage: user?.profilePhoto != null
                ? NetworkImage(user!.profilePhoto!)
                : null,
            child: user?.profilePhoto == null
                ? const Icon(
                    Icons.person_rounded,
                    size: 28,
                    color: AppColors.primary,
                  )
                : null,
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                _greeting(),
                style: TextStyle(
                  color: Theme.of(
                    context,
                  ).colorScheme.onSurface.withValues(alpha: 0.6),
                  fontSize: 12,
                  fontFamily: 'Poppins',
                  fontWeight: FontWeight.w500,
                ),
              ),
              Text(
                user?.fullName ?? 'Guest',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w700,
                  fontFamily: 'Poppins',
                  letterSpacing: -0.3,
                  color: Theme.of(context).colorScheme.onSurface,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ),
        ),
        Container(
          decoration: BoxDecoration(
            color: Theme.of(context).colorScheme.surface,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(
              color: Theme.of(context).colorScheme.outlineVariant.withValues(alpha: 0.4),
            ),
          ),
          child: IconButton(
            onPressed: () {
              Navigator.pushNamed(context, AppRoutes.notifications);
            },
            icon: Stack(
              children: [
                const Icon(Icons.notifications_rounded, size: 24),
                Positioned(
                  right: 1,
                  top: 1,
                  child: Container(
                    width: 8,
                    height: 8,
                    decoration: const BoxDecoration(
                      color: AppColors.error,
                      shape: BoxShape.circle,
                      border: Border.fromBorderSide(
                        BorderSide(color: Colors.white, width: 1.5),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    ),
  );

  Widget _buildCategories() => SizedBox(
    height: 104,
    child: ListView.builder(
      scrollDirection: Axis.horizontal,
      padding: const EdgeInsets.symmetric(horizontal: 20),
      itemCount: categories.length,
      itemBuilder: (context, index) {
        return CategoryCard(
          category: categories[index],
          onTap: () {
            Navigator.pushNamed(context, AppRoutes.search);
          },
        );
      },
    ),
  );

  Widget _buildNeedHelpFast() => const NeedHelpFastButton();

  /// Two distinct primary actions:
  /// - Post Job: create a request and receive quotes from professionals.
  /// - Hire Worker: directly request a specific worker.
  Widget _buildActionButtons() => Padding(
    padding: const EdgeInsets.symmetric(horizontal: 20),
    child: Row(
      children: [
        Expanded(
          child: _buildActionButton(
            title: 'Post Job',
            subtitle: 'Get quotes',
            icon: Icons.post_add_rounded,
            color: AppColors.primary,
            onTap: () => Navigator.pushNamed(context, AppRoutes.jobPost),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _buildActionButton(
            title: 'Hire Worker',
            subtitle: 'Direct request',
            icon: Icons.handshake_rounded,
            color: AppColors.secondary,
            onTap: () => Navigator.pushNamed(context, AppRoutes.search),
          ),
        ),
      ],
    ),
  );

  Widget _buildActionButton({
    required String title,
    required String subtitle,
    required IconData icon,
    required Color color,
    required VoidCallback onTap,
  }) => GestureDetector(
    onTap: onTap,
    child: Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [color.withValues(alpha: 0.12), color.withValues(alpha: 0.05)],
        ),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: color.withValues(alpha: 0.3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.15),
              borderRadius: BorderRadius.circular(14),
            ),
            child: Icon(icon, color: color, size: 26),
          ),
          const SizedBox(height: 12),
          Text(
            title,
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w700,
              fontFamily: 'Poppins',
              color: Theme.of(context).colorScheme.onSurface,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            subtitle,
            style: TextStyle(
              fontSize: 12,
              fontFamily: 'Poppins',
              color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.6),
            ),
          ),
        ],
      ),
    ),
  );

  Widget _buildWorkerFeed() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Recommended Workers',
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.w700,
                  fontFamily: 'Poppins',
                  letterSpacing: -0.3,
                  color: Theme.of(context).colorScheme.onSurface,
                ),
              ),
              TextButton(
                onPressed: () {
                  Navigator.pushNamed(context, AppRoutes.search);
                },
                child: const Text('See All'),
              ),
            ],
          ),
        ),
        const SizedBox(height: 12),
        if (_hasError)
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: EmptyState(
              title: 'Unable to load professionals',
              subtitle: _errorMessage ?? 'Please check your connection and refresh.',
              imagePath: 'assets/images/no_connection.png',
            ),
          )
        else if (_isLoadingInitial)
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 24),
            child: Center(
              child: CircularProgressIndicator(strokeWidth: 3),
            ),
          )
        else if (_professionals.isEmpty)
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 24),
            child: EmptyState(
              title: 'No professionals found',
              subtitle: 'Try searching for a service or refresh the home feed.',
              imagePath: 'assets/images/empty_state.png',
            ),
          )
        else
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Column(
              children: [
                for (final professional in _professionals)
                                  WorkerFeedCard(
                                    professional: professional,
                                    onPhotoTap: () {
                                      // tapping the card opens the professional profile
                                      Navigator.pushNamed(
                                        context,
                                        AppRoutes.professionalProfile,
                                        arguments: professional,
                                      );
                                    },
                                    onHireNow: () {
                                      Navigator.pushNamed(
                                        context,
                                        AppRoutes.jobPost,
                                        arguments: professional.id,
                                      );
                                    },
                                  ),
                if (_isLoadingMore)
                  const Padding(
                    padding: EdgeInsets.symmetric(vertical: 16),
                    child: Center(
                      child: CircularProgressIndicator(strokeWidth: 3),
                    ),
                  ),
                if (!_hasMore && _professionals.isNotEmpty)
                  Padding(
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    child: Center(
                      child: Text(
                        'You have reached the end of the list.',
                        style: TextStyle(
                          color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.7),
                        ),
                      ),
                    ),
                  ),
              ],
            ),
          ),
      ],
    );
  }

  Widget _buildBottomNavigationBar() => NavigationBar(
    selectedIndex: _selectedIndex,
    onDestinationSelected: (index) async {
      if (_selectedIndex == index && index == 0) {
        await _refreshHome();
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Home refreshed')));
        }
        return;
      }

      setState(() {
        _selectedIndex = index;
      });
      switch (index) {
        case 0:
          break;
        case 1:
          Navigator.pushNamed(context, AppRoutes.search);
          break;
        case 2:
          Navigator.pushNamed(context, AppRoutes.chatList);
          break;
        case 3:
                  Navigator.pushNamed(context, AppRoutes.history);
          break;
        case 4:
          Navigator.pushNamed(context, AppRoutes.profile);
          break;
      }
    },
    backgroundColor: Theme.of(context).colorScheme.surface,
    indicatorColor: AppColors.primaryBackground,
    destinations: const [
      NavigationDestination(
        icon: Icon(Icons.home_outlined),
        selectedIcon: Icon(Icons.home_rounded),
        label: 'Home',
      ),
      NavigationDestination(
        icon: Icon(Icons.search_outlined),
        selectedIcon: Icon(Icons.search_rounded),
        label: 'Search',
      ),
      NavigationDestination(
        icon: Icon(Icons.message_outlined),
        selectedIcon: Icon(Icons.message_rounded),
        label: 'Messages',
      ),
      NavigationDestination(
        icon: Icon(Icons.work_outline_rounded),
        selectedIcon: Icon(Icons.work_rounded),
        label: 'Jobs',
      ),
      NavigationDestination(
        icon: Icon(Icons.person_outline_rounded),
        selectedIcon: Icon(Icons.person_rounded),
        label: 'Profile',
      ),
    ],
  );
}

class Category {
  Category(this.name, this.icon, this.color);
  final String name;
  final IconData icon;
  final Color color;
}