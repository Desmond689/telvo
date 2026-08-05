import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:telvo/config/routes.dart';
import 'package:telvo/models/job_model.dart';
import 'package:telvo/providers/auth_provider.dart';
import 'package:telvo/providers/job_provider.dart';
import 'package:telvo/widgets/empty_state.dart';
import 'package:telvo/widgets/job_card.dart';

class HistoryScreen extends StatefulWidget {
  const HistoryScreen({super.key});

  @override
  State<HistoryScreen> createState() => _HistoryScreenState();
}

class _HistoryScreenState extends State<HistoryScreen>
    with SingleTickerProviderStateMixin {
  TabController? _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _loadHistory();
  }

  Future<void> _loadHistory() async {
    final authProvider = context.read<AuthProvider>();
    final jobProvider = context.read<JobProvider>();
    if (authProvider.currentUser != null) {
      await jobProvider.loadMyJobs(authProvider.currentUser!.id!);
    }
  }

  @override
  void dispose() {
    _tabController?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final jobProvider = context.watch<JobProvider>();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Job History'),
        elevation: 0,
        bottom: TabBar(
          controller: _tabController,
          tabs: const [
            Tab(text: 'Completed'),
            Tab(text: 'Ongoing'),
            Tab(text: 'Cancelled'),
          ],
        ),
      ),
      body: jobProvider.isLoading
          ? const Center(child: CircularProgressIndicator())
          : TabBarView(
              controller: _tabController,
              children: [
                _buildHistoryList(
                  jobProvider.myJobs
                      .where((j) => j.status == 'completed')
                      .toList(),
                  emptyMessage: 'Completed jobs are only visible to admins.',
                ),
                _buildHistoryList(
                  jobProvider.myJobs
                      .where(
                        (j) => ['accepted', 'working', 'in_progress', 'worker_selected', 'posted', 'quotes_received', 'notified'].contains(j.status),
                      )
                      .toList(),
                ),
                _buildHistoryList(
                  jobProvider.myJobs
                      .where((j) => j.status == 'cancelled')
                      .toList(),
                ),
              ],
            ),
    );
  }

  Widget _buildHistoryList(List<JobModel> jobs, {String? emptyMessage}) {
    if (jobs.isEmpty) {
      return EmptyState(
        title: 'No jobs found',
        subtitle: emptyMessage ?? 'Your job history will appear here.',
        imagePath: 'assets/images/empty_state.png',
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: jobs.length,
      itemBuilder: (context, index) {
        final job = jobs[index];
        return JobCard(
          job: job,
          onTap: () {
                    // Open Job Details screen instead of immediately opening tracking.
                    Navigator.pushNamed(context, AppRoutes.jobDetails, arguments: job);
                  },
                );
      },
    );
  }
}
