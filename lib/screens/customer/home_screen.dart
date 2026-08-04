// lib/screens/customer/home_screen.dart
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:telvo/config/routes.dart';
import 'package:telvo/models/professional_display.dart';
import 'package:telvo/models/user_model.dart';
import 'package:telvo/providers/auth_provider.dart';
import 'package:telvo/providers/job_provider.dart';
import 'package:telvo/providers/user_provider.dart';
import 'package:telvo/utils/app_colors.dart';
import 'package:telvo/widgets/category_card.dart';
import 'package:telvo/widgets/search_bar.dart';
import 'package:telvo/widgets/empty_state.dart';
import 'package:telvo/widgets/professional_card.dart';
import 'package:telvo/widgets/need_help_fast_button.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _selectedIndex = 0;
  final List<Category> categories = [
    Category('Plumber', Icons.plumbing_rounded, AppColors.plumbing),
    Category('Electrician', Icons.electrical_services_rounded, AppColors.electrical),
    Category('Cleaner', Icons.cleaning_services_rounded, AppColors.cleaning),
    Category('Painter', Icons.format_paint_rounded, AppColors.painting),
    Category('More', Icons.more_horiz_rounded, AppColors.offline),
  ];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<UserProvider>().refreshProfessionals();
    });
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
              child: SingleChildScrollView(
                child: Column(
                  children: [
                    _buildCategories(),
                    const SizedBox(height: 24),
                    _buildNeedHelpFast(),
                    const SizedBox(height: 24),
                    _buildActionButtons(),
                    const SizedBox(height: 24),
                    _buildTopProfessionals(),
                    const SizedBox(height: 80),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
      bottomNavigationBar: _buildBottomNavigationBar(),
      floatingActionButton: FloatingActionButton(
        onPressed: _showCreateOptions,
        child: const Icon(Icons.add_rounded),
      ),
      floatingActionButtonLocation: FloatingActionButtonLocation.endFloat,
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

  void _showCreateOptions() {
    showModalBottomSheet<void>(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(32)),
      ),
      builder: (context) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                'What would you like to do?',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w700,
                  fontFamily: 'Poppins',
                  color: Theme.of(context).colorScheme.onSurface,
                ),
              ),
              const SizedBox(height: 20),
              ListTile(
                leading: Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: AppColors.primary.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(Icons.post_add_rounded, color: AppColors.primary),
                ),
                title: const Text('Post Job'),
                subtitle: const Text('Create a request and receive quotes'),
                onTap: () {
                  Navigator.pop(context);
                  Navigator.pushNamed(context, AppRoutes.jobPost);
                },
              ),
              const SizedBox(height: 8),
              ListTile(
                leading: Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: AppColors.secondary.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(Icons.handshake_rounded, color: AppColors.secondary),
                ),
                title: const Text('Hire Worker'),
                subtitle: const Text('Directly request a specific worker'),
                onTap: () {
                  Navigator.pop(context);
                  Navigator.pushNamed(context, AppRoutes.search);
                },
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildTopProfessionals() {
    final userProvider = context.watch<UserProvider>();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Top Professionals',
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
        const SizedBox(height: 8),
        StreamBuilder<List<UserModel>>(
          stream: userProvider.getProfessionals(),
          builder: (context, snapshot) {
            if (snapshot.connectionState == ConnectionState.waiting) {
              return const Padding(
                padding: EdgeInsets.symmetric(vertical: 24),
                child: Center(
                  child: CircularProgressIndicator(strokeWidth: 3),
                ),
              );
            }

            if (snapshot.hasError) {
              return const Padding(
                padding: EdgeInsets.symmetric(vertical: 24),
                child: EmptyState(
                  title: 'Unable to load professionals',
                  subtitle: 'Please check your connection and refresh.',
                  imagePath: 'assets/images/no_connection.png',
                ),
              );
            }

            final topProfessionals = (snapshot.data ?? []).take(6).toList();

            if (topProfessionals.isEmpty) {
              return const Padding(
                padding: EdgeInsets.symmetric(vertical: 24),
                child: EmptyState(
                  title: 'No verified professionals yet',
                  subtitle: 'Check back later or search for services now.',
                  imagePath: 'assets/images/empty_state.png',
                ),
              );
            }

            return SizedBox(
              height: 210,
              child: ListView.builder(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 20),
                itemCount: topProfessionals.length,
                itemBuilder: (context, index) {
                  final professional = topProfessionals[index];
                  return ProfessionalCard(
                    professional: Professional(
                      name: professional.fullName ?? 'Unknown',
                      title: professional.category ?? 'Professional',
                      rating: professional.rating ?? 0,
                      jobs: professional.jobsCompleted ?? 0,
                      verified: professional.isVerified,
                      photoUrl: professional.profilePhoto,
                    ),
                    onTap: () {
                      Navigator.pushNamed(
                        context,
                        AppRoutes.professionalProfile,
                        arguments: professional,
                      );
                    },
                  );
                },
              ),
            );
          },
        ),
      ],
    );
  }

  Widget _buildBottomNavigationBar() => NavigationBar(
    selectedIndex: _selectedIndex,
    onDestinationSelected: (index) async {
      if (_selectedIndex == index && index == 0) {
        final userProvider = context.read<UserProvider>();
        final jobProvider = context.read<JobProvider>();
        await Future.wait([
          userProvider.refreshProfessionals(),
          jobProvider.refreshJobs(),
        ]);
        if (mounted) {
          ScaffoldMessenger.of(
            context,
          ).showSnackBar(const SnackBar(content: Text('Home refreshed')));
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
          Navigator.pushNamed(context, AppRoutes.jobTracking);
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