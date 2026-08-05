import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:telvo/models/job_model.dart';
import 'package:telvo/config/routes.dart';
import 'package:telvo/providers/job_provider.dart';
import 'package:telvo/widgets/custom_button.dart';

class JobDetailsScreen extends StatefulWidget {
  const JobDetailsScreen({super.key});

  @override
  State<JobDetailsScreen> createState() => _JobDetailsScreenState();
}

class _JobDetailsScreenState extends State<JobDetailsScreen> {
  JobModel? _job;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _job = ModalRoute.of(context)?.settings.arguments as JobModel?;
      setState(() {});
    });
  }

  @override
  Widget build(BuildContext context) {
    if (_job == null) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    final hasWorker = _job?.professionalId != null && _job?.professionalId!.isNotEmpty;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Job Details'),
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              _job?.category ?? 'Service',
              style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: 8),
            Text(
              _job?.status ?? 'pending',
              style: const TextStyle(fontSize: 14, color: Colors.grey),
            ),
            const SizedBox(height: 16),
            Text('Job ID', style: TextStyle(color: Colors.grey.shade700)),
            const SizedBox(height: 4),
            Text('#${_job?.id ?? 'N/A'}', style: const TextStyle(fontWeight: FontWeight.w700)),
            const SizedBox(height: 12),
            if (_job?.budget != null) ...[
              Text('Budget', style: TextStyle(color: Colors.grey.shade700)),
              const SizedBox(height: 4),
              Text('XAF ${_job!.budget!.toStringAsFixed(0)}', style: const TextStyle(fontWeight: FontWeight.w700)),
              const SizedBox(height: 12),
            ],
            Text('Posted', style: TextStyle(color: Colors.grey.shade700)),
            const SizedBox(height: 4),
            Text(_job?.createdAt?.toLocal().toString() ?? 'Unknown'),
            const SizedBox(height: 12),
            if (_job?.address != null) ...[
              Text('Location', style: TextStyle(color: Colors.grey.shade700)),
              const SizedBox(height: 4),
              Text(_job!.address!),
              const SizedBox(height: 12),
            ],
            Text('Description', style: TextStyle(color: Colors.grey.shade700)),
            const SizedBox(height: 4),
            Text(_job?.description ?? 'No description provided'),
            const SizedBox(height: 20),
            Text('Current Status', style: TextStyle(color: Colors.grey.shade700)),
            const SizedBox(height: 8),
            Text(
              hasWorker ? 'Worker Accepted' : 'Waiting for professionals...',
              style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 16),
            ),
            const SizedBox(height: 20),
            // Actions
            Row(
              children: [
                Expanded(
                  child: CustomButton(
                    text: 'Edit Job',
                    isOutlined: true,
                    onPressed: () {
                      // Only allow edit if no professional assigned
                      if (hasWorker) {
                        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Cannot edit job after a professional is assigned')));
                        return;
                      }
                      // navigate to job post with job as argument for editing
                      Navigator.pushNamed(context, AppRoutes.jobPost, arguments: _job);
                    },
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: CustomButton(
                    text: 'Cancel Job',
                    backgroundColor: Colors.red,
                    isOutlined: true,
                    onPressed: () async {
                      final confirm = await showDialog<bool>(
                        context: context,
                        builder: (c) => AlertDialog(
                          title: const Text('Cancel Job?'),
                          content: const Text('Are you sure you want to cancel this job?'),
                          actions: [
                            TextButton(onPressed: () => Navigator.pop(c, false), child: const Text('No')),
                            TextButton(onPressed: () => Navigator.pop(c, true), child: const Text('Yes', style: TextStyle(color: Colors.red))),
                          ],
                        ),
                      );
                      if (confirm != true) return;
                      if (_job?.id == null) return;
                      try {
                        await context.read<JobProvider>().cancelJob(_job!.id!);
                        if (!mounted) return;
                        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Job cancelled')));
                        Navigator.pop(context);
                      } catch (e) {
                        if (!mounted) return;
                        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed to cancel job: $e')));
                      }
                    },
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),
            if (hasWorker) ...[
              const Divider(),
              const SizedBox(height: 8),
              // Assigned professional block — only show available data and actions
              Container(
                padding: const EdgeInsets.symmetric(vertical: 8),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    CircleAvatar(
                      radius: 28,
                      // No reliable professional photo on JobModel; show placeholder
                      child: const Icon(Icons.person, size: 28),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('Assigned Professional', style: TextStyle(fontWeight: FontWeight.w700)),
                          const SizedBox(height: 4),
                          Text(
                            _job?.professionalId ?? 'Unknown',
                            style: const TextStyle(color: Colors.grey, fontSize: 12),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 8),
                    Column(
                      children: [
                        CustomButton(
                          text: 'Message',
                          isOutlined: true,
                          onPressed: () {
                            if (_job?.professionalId != null) {
                              Navigator.pushNamed(context, AppRoutes.chat, arguments: _job!.professionalId);
                            }
                          },
                        ),
                        const SizedBox(height: 6),
                        CustomButton(
                          text: 'Live Tracking',
                          onPressed: () {
                            Navigator.pushNamed(context, AppRoutes.jobTracking, arguments: _job);
                          },
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
