import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:telvo/models/job_model.dart';
import 'package:telvo/models/user_model.dart';
import 'package:telvo/providers/auth_provider.dart';
import 'package:telvo/providers/job_provider.dart';
import 'package:telvo/providers/payment_provider.dart';
import 'package:telvo/config/routes.dart';
import 'package:telvo/utils/app_colors.dart';

class ProfessionalDashboardScreen extends StatefulWidget {
  const ProfessionalDashboardScreen({super.key});

  @override
  State<ProfessionalDashboardScreen> createState() =>
      _ProfessionalDashboardScreenState();
}

class _ProfessionalDashboardScreenState
    extends State<ProfessionalDashboardScreen> {
  int _selectedIndex = 0;
  bool _isLoadingData = true;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _loadData());
  }

  Future<void> _loadData() async {
    final userId = context.read<AuthProvider>().currentUser?.id;
    if (userId == null) {
      setState(() => _isLoadingData = false);
      return;
    }
    await Future.wait([
      context.read<JobProvider>().loadProfessionalJobs(userId),
      context.read<PaymentProvider>().loadProfessionalPayments(userId),
    ]);
    if (mounted) setState(() => _isLoadingData = false);
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
            Expanded(
              child: RefreshIndicator(
                onRefresh: _loadData,
                child: SingleChildScrollView(
                  physics: const AlwaysScrollableScrollPhysics(),
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    children: [
                      _buildStats(user),
                      const SizedBox(height: 24),
                      _buildQuickActions(),
                      const SizedBox(height: 28),
                      _buildRecentJobs(),
                      const SizedBox(height: 80),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
      bottomNavigationBar: _buildBottomNavigationBar(),
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          Navigator.pushNamed(context, AppRoutes.jobFeed);
        },
        child: const Icon(Icons.work_rounded),
      ),
      floatingActionButtonLocation: FloatingActionButtonLocation.endFloat,
    );
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
            radius: 28,
            backgroundColor: AppColors.primaryBackground,
            backgroundImage: user?.profilePhoto != null
                ? NetworkImage(user!.profilePhoto!)
                : null,
            child: user?.profilePhoto == null
                ? const Icon(
                    Icons.person_rounded,
                    size: 32,
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
                'Hello ${user?.fullName ?? 'Professional'}!',
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
              Row(
                children: [
                  Container(
                    width: 8,
                    height: 8,
                    decoration: BoxDecoration(
                      color: (user?.isOnline ?? false)
                          ? AppColors.online
                          : AppColors.offline,
                      shape: BoxShape.circle,
                    ),
                  ),
                  const SizedBox(width: 6),
                  Text(
                    (user?.isOnline ?? false) ? 'Online' : 'Offline',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w500,
                      fontFamily: 'Poppins',
                      color: Theme.of(
                        context,
                      ).colorScheme.onSurface.withValues(alpha: 0.6),
                    ),
                  ),
                ],
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
            icon: const Icon(Icons.notifications_rounded, size: 24),
          ),
        ),
      ],
    ),
  );

  Widget _buildStats(UserModel? user) {
    final payments = context.watch<PaymentProvider>().payments;
    final now = DateTime.now();
    final startOfDay = DateTime(now.year, now.month, now.day);
    final startOfWeek = startOfDay.subtract(Duration(days: now.weekday - 1));
    final startOfMonth = DateTime(now.year, now.month);

    double sumSince(DateTime cutoff) => payments
        .where((p) => (p.createdAt ?? now).isAfter(cutoff))
        .fold(0.0, (sum, p) => sum + (p.amount ?? 0));

    final stats = [
      {
        'label': "Today's Earnings",
        'value': _formatXaf(sumSince(startOfDay)),
        'icon': Icons.today_rounded,
        'color': AppColors.primary,
      },
      {
        'label': 'Weekly Earnings',
        'value': _formatXaf(sumSince(startOfWeek)),
        'icon': Icons.date_range_rounded,
        'color': AppColors.info,
      },
      {
        'label': 'Monthly Earnings',
        'value': _formatXaf(sumSince(startOfMonth)),
        'icon': Icons.calendar_month_rounded,
        'color': AppColors.warning,
      },
      {
        'label': 'Rating',
        'value': user?.rating != null
            ? '${user!.rating!.toStringAsFixed(1)} \u2b50'
            : 'No ratings yet',
        'icon': Icons.star_rounded,
        'color': const Color(0xFFFBBF24),
      },
    ];

    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        crossAxisSpacing: 12,
        mainAxisSpacing: 12,
        childAspectRatio: 1.35,
      ),
      itemCount: stats.length,
      itemBuilder: (context, index) {
        final stat = stats[index];
        return Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [
                Theme.of(context).colorScheme.surface,
                Theme.of(context).colorScheme.surface,
              ],
            ),
            borderRadius: BorderRadius.circular(20),
            border: Border.all(
              color: Theme.of(context).colorScheme.outlineVariant.withValues(alpha: 0.35),
            ),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: (stat['color'] as Color).withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(
                  stat['icon'] as IconData,
                  color: stat['color'] as Color,
                  size: 20,
                ),
              ),
              const SizedBox(height: 10),
              Text(
                stat['label'] as String,
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w500,
                  color: Theme.of(
                    context,
                  ).colorScheme.onSurface.withValues(alpha: 0.6),
                ),
                overflow: TextOverflow.ellipsis,
              ),
              const SizedBox(height: 2),
              Text(
                stat['value'] as String,
                style: TextStyle(
                  fontSize: 17,
                  fontWeight: FontWeight.w700,
                  fontFamily: 'Poppins',
                  color: Theme.of(context).colorScheme.onSurface,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ),
        );
      },
    );
  }

  String _formatXaf(double amount) {
    final formatted = amount
        .toStringAsFixed(0)
        .replaceAllMapped(
          RegExp(r'\B(?=(\d{3})+(?!\d))'),
          (match) => ',',
        );
    return 'XAF $formatted';
  }

  Widget _buildQuickActions() => Row(
    children: [
      Expanded(
        child: _buildActionCard(
          'Job Feed',
          Icons.work_rounded,
          AppColors.primary,
          () => Navigator.pushNamed(context, AppRoutes.jobFeed),
        ),
      ),
      const SizedBox(width: 12),
      Expanded(
        child: _buildActionCard(
          'Availability',
          Icons.toggle_on_rounded,
          AppColors.info,
          () => Navigator.pushNamed(context, AppRoutes.availability),
        ),
      ),
      const SizedBox(width: 12),
      Expanded(
        child: _buildActionCard(
          'Earnings',
          Icons.account_balance_wallet_rounded,
          AppColors.warning,
          () => Navigator.pushNamed(context, AppRoutes.earnings),
        ),
      ),
    ],
  );

  Widget _buildActionCard(
    String title,
    IconData icon,
    Color color,
    VoidCallback onTap,
  ) => GestureDetector(
    onTap: onTap,
    child: Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: color.withValues(alpha: 0.15),
        ),
      ),
      child: Column(
        children: [
          Icon(icon, color: color, size: 28),
          const SizedBox(height: 8),
          Text(
            title,
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w700,
              fontFamily: 'Poppins',
              color: color,
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    ),
  );

  Widget _buildRecentJobs() {
    final allJobs = context.watch<JobProvider>().myJobs;
    final recentJobs = allJobs.take(3).toList();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              'Recent Jobs',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w700,
                fontFamily: 'Poppins',
                letterSpacing: -0.3,
                color: Theme.of(context).colorScheme.onSurface,
              ),
            ),
            if (allJobs.isNotEmpty)
              TextButton(
                onPressed: () => Navigator.pushNamed(
                  context,
                  AppRoutes.jobHistory,
                  arguments: allJobs,
                ),
                child: const Text('See All'),
              ),
          ],
        ),
        const SizedBox(height: 8),
        if (_isLoadingData)
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 24),
            child: Center(child: CircularProgressIndicator(strokeWidth: 3)),
          )
        else if (recentJobs.isEmpty)
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 24),
            child: Center(
              child: Text(
                'No jobs yet.',
                style: TextStyle(
                  fontFamily: 'Poppins',
                  color: Theme.of(
                    context,
                  ).colorScheme.onSurface.withValues(alpha: 0.6),
                ),
              ),
            ),
          )
        else
          ListView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: recentJobs.length,
            itemBuilder: (context, index) => _buildJobTile(recentJobs[index]),
          ),
      ],
    );
  }

  Widget _buildJobTile(JobModel job) => Container(
    margin: const EdgeInsets.only(bottom: 10),
    padding: const EdgeInsets.all(14),
    decoration: BoxDecoration(
      color: Theme.of(context).colorScheme.surface,
      borderRadius: BorderRadius.circular(16),
      border: Border.all(
        color: Theme.of(context).colorScheme.outlineVariant.withValues(alpha: 0.35),
      ),
    ),
    child: Row(
      children: [
        Container(
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(
            color: AppColors.primary.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(12),
          ),
          child: const Icon(
            Icons.work_rounded,
            color: AppColors.primary,
            size: 22,
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                job.serviceType ?? job.category ?? 'Service',
                style: const TextStyle(
                  fontWeight: FontWeight.w700,
                  fontFamily: 'Poppins',
                  fontSize: 14,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                'Status: ${_statusLabel(job.status)}',
                style: TextStyle(
                  fontSize: 12,
                  fontFamily: 'Poppins',
                  color: Theme.of(
                    context,
                  ).colorScheme.onSurface.withValues(alpha: 0.6),
                ),
              ),
            ],
          ),
        ),
        if (job.budget != null)
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
            decoration: BoxDecoration(
              color: AppColors.primary.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Text(
              _formatXaf(job.budget!),
              style: const TextStyle(
                fontWeight: FontWeight.w700,
                fontSize: 13,
                fontFamily: 'Poppins',
                color: AppColors.primary,
              ),
            ),
          ),
      ],
    ),
  );

  String _statusLabel(String? status) {
    if (status == null || status.isEmpty) return 'Unknown';
    return status
        .split('_')
        .map((w) => w.isEmpty ? w : w[0].toUpperCase() + w.substring(1))
        .join(' ');
  }

  Widget _buildBottomNavigationBar() => NavigationBar(
    selectedIndex: _selectedIndex,
    onDestinationSelected: (index) {
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
          Navigator.pushNamed(context, AppRoutes.jobFeed);
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
        icon: Icon(Icons.dashboard_outlined),
        selectedIcon: Icon(Icons.dashboard_rounded),
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