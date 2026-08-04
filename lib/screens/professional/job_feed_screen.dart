import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:telvo/models/job_model.dart';
import 'package:telvo/providers/auth_provider.dart';
import 'package:telvo/providers/job_provider.dart';
import 'package:telvo/config/routes.dart';
import 'package:telvo/utils/app_colors.dart';
import 'package:telvo/widgets/empty_state.dart';
import 'package:telvo/widgets/job_card.dart';
import 'package:telvo/widgets/custom_button.dart';
import 'package:telvo/widgets/custom_text_field.dart';
import 'package:telvo/utils/helpers.dart';
import 'package:telvo/utils/lookup_data.dart';

class JobFeedScreen extends StatefulWidget {
  const JobFeedScreen({super.key});

  @override
  State<JobFeedScreen> createState() => _JobFeedScreenState();
}

class _JobFeedScreenState extends State<JobFeedScreen> {
  bool _isCheckingConnection = true;
  bool _isOffline = false;

  final List<String> _categories = [
    'All',
    ...LookupData.jobCategories,
  ];
  String _selectedCategory = 'All';
  bool _showOnlyNearby = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _refreshIfOnline();
    });
  }

  Future<void> _refreshIfOnline() async {
    final hasInternet = await Helpers.checkInternetConnection();
    if (!mounted) return;
    setState(() {
      _isCheckingConnection = false;
      _isOffline = !hasInternet;
    });
    if (!hasInternet) {
      return;
    }
    await context.read<JobProvider>().refreshJobs();
  }

  @override
  Widget build(BuildContext context) {
    final jobProvider = context.watch<JobProvider>();
    final authProvider = context.watch<AuthProvider>();
    final currentUser = authProvider.currentUser;
    final professionalCategory = currentUser?.category?.trim();

    final filteredJobs = jobProvider.jobs.where((job) {
      if (job.customerId == currentUser?.id) {
        return false;
      }
      if (professionalCategory != null && professionalCategory.isNotEmpty) {
        final categoryMatches = (job.category ?? '').toLowerCase() ==
            professionalCategory.toLowerCase();
        if (!categoryMatches) {
          return false;
        }
      }
      if (_selectedCategory == 'All') {
        return true;
      }
      return (job.category ?? '').toLowerCase() ==
          _selectedCategory.toLowerCase();
    }).toList();
    final showOfflineState = _isOffline ||
        (jobProvider.error != null &&
            jobProvider.error!.toLowerCase().contains('internet'));

    return Scaffold(
      appBar: AppBar(
        title: const Text('Job Feed'),
        actions: [
          IconButton(
            tooltip: 'Nearby jobs only',
            onPressed: () {
              setState(() {
                _showOnlyNearby = !_showOnlyNearby;
              });
            },
            icon: Icon(
              _showOnlyNearby
                  ? Icons.location_on_rounded
                  : Icons.location_off_rounded,
              color: _showOnlyNearby ? AppColors.primary : null,
            ),
          ),
        ],
      ),
      body: Column(
        children: [
          _buildCategoryFilter(),
          Expanded(
            child: RefreshIndicator(
              color: AppColors.primary,
              onRefresh: () async {
                await jobProvider.refreshJobs();
              },
              child: jobProvider.isLoading
                  ? const Center(
                      child: CircularProgressIndicator(strokeWidth: 3),
                    )
                  : showOfflineState && filteredJobs.isEmpty
                  ? SingleChildScrollView(
                      physics: const AlwaysScrollableScrollPhysics(),
                      child: SizedBox(
                        height: MediaQuery.of(context).size.height * 0.7,
                        child: _buildOfflineState(),
                      ),
                    )
                  : filteredJobs.isEmpty
                  ? SingleChildScrollView(
                      physics: const AlwaysScrollableScrollPhysics(),
                      child: SizedBox(
                        height: MediaQuery.of(context).size.height * 0.6,
                        child: _buildEmptyState(),
                      ),
                    )
                  : ListView.builder(
                      padding: const EdgeInsets.fromLTRB(16, 8, 16, 90),
                      itemCount: filteredJobs.length,
                      itemBuilder: (context, index) {
                        final job = filteredJobs[index];
                        return JobCard(
                          job: job,
                          onTap: () {
                            _showJobDetails(job);
                          },
                          showAction: true,
                          onAction: () {
                            _showQuoteDialog(job);
                          },
                          actionText: 'Send Quote',
                        );
                      },
                    ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCategoryFilter() => Container(
    height: 52,
    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
    child: ListView.builder(
      scrollDirection: Axis.horizontal,
      itemCount: _categories.length,
      itemBuilder: (context, index) {
        final category = _categories[index];
        final isSelected = _selectedCategory == category;
        return Padding(
          padding: const EdgeInsets.only(right: 8),
          child: FilterChip(
            label: Text(category),
            selected: isSelected,
            onSelected: (selected) {
              setState(() {
                _selectedCategory = selected ? category : 'All';
              });
            },
            selectedColor: AppColors.primary,
            checkmarkColor: Colors.white,
            labelStyle: TextStyle(
              color: isSelected
                  ? Colors.white
                  : Theme.of(context).colorScheme.onSurface,
              fontWeight: FontWeight.w600,
              fontFamily: 'Poppins',
            ),
            showCheckmark: false,
          ),
        );
      },
    ),
  );

  Widget _buildEmptyState() => EmptyState(
    title: _selectedCategory == 'All'
        ? 'No jobs available'
        : 'No $_selectedCategory jobs',
    subtitle: _selectedCategory == 'All'
        ? 'Check back later for new opportunities'
        : 'Check back later for new $_selectedCategory jobs',
    imagePath: 'assets/images/empty_state.png',
  );

  Widget _buildOfflineState() => Center(
    child: Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Image.asset(
            'assets/images/no_connection.png',
            height: 180,
            fit: BoxFit.contain,
          ),
          const SizedBox(height: 20),
          const Text(
            'No Internet Connection',
            style: TextStyle(
              fontSize: 22,
              fontWeight: FontWeight.w700,
              fontFamily: 'Poppins',
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Connect to the internet to refresh available jobs.',
            textAlign: TextAlign.center,
            style: TextStyle(
              color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.65),
              fontSize: 14,
              fontFamily: 'Poppins',
            ),
          ),
          const SizedBox(height: 18),
          CustomButton(
            text: 'Refresh',
            icon: Icons.refresh_rounded,
            onPressed: _refreshIfOnline,
          ),
        ],
      ),
    ),
  );

  void _showJobDetails(JobModel job) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(32)),
      ),
      builder: (context) => DraggableScrollableSheet(
        initialChildSize: 0.85,
        minChildSize: 0.5,
        maxChildSize: 0.95,
        expand: false,
        builder: (context, scrollController) => SingleChildScrollView(
          controller: scrollController,
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 44,
                  height: 5,
                  decoration: BoxDecoration(
                    color: Theme.of(context).colorScheme.outlineVariant,
                    borderRadius: BorderRadius.circular(3),
                  ),
                ),
              ),
              const SizedBox(height: 20),
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 6,
                    ),
                    decoration: BoxDecoration(
                      color: AppColors.primary.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      job.category ?? 'Service',
                      style: const TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w700,
                        color: AppColors.primary,
                        fontFamily: 'Poppins',
                      ),
                    ),
                  ),
                  const Spacer(),
                  if (job.isEmergency == true)
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 6,
                      ),
                      decoration: BoxDecoration(
                        color: AppColors.error.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: const Row(
                        children: [
                          Icon(
                            Icons.emergency_rounded,
                            size: 14,
                            color: AppColors.error,
                          ),
                          SizedBox(width: 4),
                          Text(
                            'EMERGENCY',
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w700,
                              color: AppColors.error,
                            ),
                          ),
                        ],
                      ),
                    ),
                ],
              ),
              const SizedBox(height: 16),
              Text(
                job.category ?? 'Service',
                style: TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.w700,
                  fontFamily: 'Poppins',
                  letterSpacing: -0.5,
                  color: Theme.of(context).colorScheme.onSurface,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                job.description ?? 'No description provided',
                style: TextStyle(
                  fontSize: 15,
                  fontFamily: 'Poppins',
                  height: 1.5,
                  color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.7),
                ),
              ),
              const SizedBox(height: 20),
              // Budget and urgency
              Row(
                children: [
                  _buildDetailChip(
                    Icons.account_balance_wallet_rounded,
                    'Budget: XAF ${job.budget?.toStringAsFixed(0) ?? 'N/A'}',
                    AppColors.primary,
                  ),
                  const SizedBox(width: 8),
                  _buildDetailChip(
                    Icons.timer_rounded,
                    job.urgency ?? 'Flexible',
                    AppColors.warning,
                  ),
                ],
              ),
              const SizedBox(height: 8),
              if (job.address != null)
                Row(
                  children: [
                    _buildDetailChip(
                      Icons.location_on_rounded,
                      job.address!,
                      AppColors.info,
                    ),
                  ],
                ),
              const SizedBox(height: 20),
              // Photos
              if (job.photos?.isNotEmpty ?? false) ...[
                const Text(
                  'Photos',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                    fontFamily: 'Poppins',
                  ),
                ),
                const SizedBox(height: 8),
                SizedBox(
                  height: 120,
                  child: ListView.builder(
                    scrollDirection: Axis.horizontal,
                    itemCount: job.photos!.length,
                    itemBuilder: (context, index) {
                      return Container(
                        width: 120,
                        margin: const EdgeInsets.only(right: 8),
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(12),
                          color: Colors.grey.shade200,
                        ),
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(12),
                          child: Image.network(
                            job.photos![index],
                            fit: BoxFit.cover,
                            errorBuilder: (_, __, ___) => Center(
                              child: Icon(
                                Icons.image_not_supported_outlined,
                                color: Colors.grey.shade400,
                              ),
                            ),
                          ),
                        ),
                      );
                    },
                  ),
                ),
                const SizedBox(height: 20),
              ],
              CustomButton(
                text: 'Send Quote',
                icon: Icons.request_quote_rounded,
                onPressed: () {
                  Navigator.pop(context);
                  _showQuoteDialog(job);
                },
              ),
              const SizedBox(height: 12),
              CustomButton(
                text: 'Chat with Customer',
                isOutlined: true,
                icon: Icons.chat_bubble_outline_rounded,
                onPressed: () {
                  Navigator.pop(context);
                  if (job.customerId != null) {
                    Navigator.pushNamed(
                      context,
                      AppRoutes.chat,
                      arguments: job.customerId,
                    );
                  }
                },
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildDetailChip(IconData icon, String text, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 16, color: color),
          const SizedBox(width: 6),
          Text(
            text,
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: color,
              fontFamily: 'Poppins',
            ),
          ),
        ],
      ),
    );
  }

  void _showQuoteDialog(JobModel job) {
    final TextEditingController priceController = TextEditingController();
    final TextEditingController messageController = TextEditingController();
    final TextEditingController timeController = TextEditingController();

    showDialog(
      context: context,
      builder: (dialogContext) => AlertDialog(
        backgroundColor: Theme.of(context).colorScheme.surface,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(28),
        ),
        title: const Text(
          'Send Quote',
          style: TextStyle(fontWeight: FontWeight.w700, fontFamily: 'Poppins'),
        ),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                '${job.category ?? 'Service'} • XAF ${job.budget?.toStringAsFixed(0) ?? 'N/A'}',
                style: TextStyle(
                  fontSize: 13,
                  color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.6),
                  fontFamily: 'Poppins',
                ),
              ),
              const SizedBox(height: 16),
              CustomTextField(
                controller: priceController,
                labelText: 'Price (XAF)',
                hintText: 'e.g. 25000',
                keyboardType: TextInputType.number,
                prefixIcon: const Icon(Icons.attach_money_rounded),
              ),
              const SizedBox(height: 12),
              CustomTextField(
                controller: timeController,
                labelText: 'Estimated Time (hours)',
                hintText: 'e.g. 3',
                keyboardType: TextInputType.number,
                prefixIcon: const Icon(Icons.timer_outlined),
              ),
              const SizedBox(height: 12),
              CustomTextField(
                controller: messageController,
                labelText: 'Message',
                hintText: 'Tell the customer about your offer',
                maxLines: 3,
                prefixIcon: const Icon(Icons.chat_bubble_outline_rounded),
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogContext),
            child: const Text('Cancel'),
          ),
          ElevatedButton.icon(
            onPressed: () async {
              final currentUserId =
                  context.read<AuthProvider>().currentUser?.id;
              if (currentUserId == null) {
                Navigator.pop(dialogContext);
                return;
              }

              final price = double.tryParse(priceController.text.trim()) ?? 0;
              final estimatedTime =
                  int.tryParse(timeController.text.trim()) ?? 0;
              final message = messageController.text.trim();

              if (price <= 0 || estimatedTime <= 0 || message.isEmpty) {
                ScaffoldMessenger.of(dialogContext).showSnackBar(
                  const SnackBar(
                    content: Text('Please fill all quote fields.'),
                  ),
                );
                return;
              }

              Navigator.pop(dialogContext);
              try {
                await context.read<JobProvider>().sendQuote(
                  QuoteModel(
                    professionalId: currentUserId,
                    jobId: job.id,
                    price: price,
                    estimatedTime: estimatedTime,
                    message: message,
                    status: 'pending',
                    createdAt: DateTime.now(),
                  ),
                );
                if (!mounted) return;
                _showQuoteSuccessDialog();
              } catch (e) {
                if (!mounted) return;
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(content: Text('Failed to send quote: $e')),
                );
              }
            },
            icon: const Icon(Icons.send_rounded),
            label: const Text('Send Quote'),
          ),
        ],
      ),
    );
  }

  void _showQuoteSuccessDialog() {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => Dialog(
        backgroundColor: Theme.of(context).colorScheme.surface,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(32),
        ),
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Success checkmark
              Container(
                width: 88,
                height: 88,
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: AppColors.successGradient,
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  shape: BoxShape.circle,
                  boxShadow: [
                    BoxShadow(
                      color: AppColors.success.withValues(alpha: 0.3),
                      blurRadius: 24,
                      offset: const Offset(0, 8),
                    ),
                  ],
                ),
                child: const Icon(
                  Icons.check_rounded,
                  size: 48,
                  color: Colors.white,
                ),
              ),
              const SizedBox(height: 24),
              const Text(
                'Quote Sent Successfully!',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.w700,
                  fontFamily: 'Poppins',
                  letterSpacing: -0.3,
                ),
              ),
              const SizedBox(height: 12),
              Text(
                'The customer has received your offer.\n\nYou\'ll be notified if your quote is accepted.',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 14,
                  fontFamily: 'Poppins',
                  height: 1.5,
                  color: Theme.of(
                    context,
                  ).colorScheme.onSurface.withValues(alpha: 0.6),
                ),
              ),
              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                child: CustomButton(
                  text: 'View My Quotes',
                  icon: Icons.request_quote_rounded,
                  onPressed: () {
                    Navigator.of(context).pop();
                    Navigator.pushNamed(context, AppRoutes.earnings);
                  },
                ),
              ),
              const SizedBox(height: 12),
              SizedBox(
                width: double.infinity,
                child: CustomButton(
                  text: 'Back to Home',
                  isOutlined: true,
                  icon: Icons.home_rounded,
                  onPressed: () {
                    Navigator.of(context).pop();
                    Navigator.popUntil(
                      context,
                      (route) => route.settings.name == AppRoutes.professionalDashboard,
                    );
                  },
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}