import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:telvo/models/job_model.dart';
import 'package:telvo/config/routes.dart';
import 'package:telvo/widgets/custom_button.dart';
import 'package:telvo/providers/job_provider.dart';

class JobTrackingScreen extends StatefulWidget {
  const JobTrackingScreen({super.key});

  @override
  State<JobTrackingScreen> createState() => _JobTrackingScreenState();
}

class _JobTrackingScreenState extends State<JobTrackingScreen> {
  JobModel? _job;
  int _currentStep = 0;

  final List<Map<String, dynamic>> _steps = [
    {'icon': Icons.post_add, 'label': 'Job Posted', 'completed': true},
    {
      'icon': Icons.notifications_active,
      'label': 'Workers Notified',
      'completed': true,
    },
    {'icon': Icons.receipt, 'label': 'Quotes Received', 'completed': true},
    {'icon': Icons.timer_off, 'label': 'Quotes Expired', 'completed': false},
    {
      'icon': Icons.check_circle,
      'label': 'Worker Accepted',
      'completed': false,
    },
    {'icon': Icons.cancel, 'label': 'Worker Rejected', 'completed': false},
    {'icon': Icons.directions_walk, 'label': 'On The Way', 'completed': false},
    {'icon': Icons.home, 'label': 'Back To Home', 'completed': false},
  ];

  @override
  void initState() {
    super.initState();
    _job = ModalRoute.of(context)?.settings.arguments as JobModel?;
    _updateStep();
  }

  void _updateStep() {
    if (_job == null) return;

    final statusMap = {
      'posted': 0,
      'notified': 1,
      'quotes_received': 2,
      'quotes_expired': 3,
      'accepted': 4,
      'rejected': 5,
      'on_the_way': 6,
      'completed': 7,
    };

    _currentStep = statusMap[_job?.status] ?? 0;
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: const Text('Live Tracking'), elevation: 0),
    body: Padding(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        children: [
          _buildJobInfo(),
          const SizedBox(height: 24),
          Expanded(child: _buildTimeline()),
          const SizedBox(height: 16),
          _buildActionButtons(),
        ],
      ),
    ),
  );

  Widget _buildJobInfo() => Container(
    padding: const EdgeInsets.all(16),
    decoration: BoxDecoration(
      color: Colors.grey.shade50,
      borderRadius: BorderRadius.circular(12),
      border: Border.all(color: Colors.grey.shade200),
    ),
    child: Column(
      children: [
        Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: Colors.green.shade50,
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.work, color: Color(0xFF00C853)),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    _job?.category ?? 'Service',
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  Text(
                    _job?.description ?? 'No description',
                    style: TextStyle(fontSize: 14, color: Colors.grey.shade600),
                  ),
                ],
              ),
            ),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
              decoration: BoxDecoration(
                color: _getStatusColor(_job?.status),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text(
                _job?.status?.toUpperCase() ?? 'PENDING',
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 10,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ],
        ),
        if (_job?.budget != null) ...[
          const Divider(),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Budget',
                style: TextStyle(fontSize: 14, color: Colors.grey),
              ),
              Text(
                'XAF ${_job?.budget?.toStringAsFixed(0)}',
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
        ],
      ],
    ),
  );

  Widget _buildTimeline() => ListView.builder(
    itemCount: _steps.length,
    itemBuilder: (context, index) {
      final step = _steps[index];
      final isCompleted = index <= _currentStep;
      final isActive = index == _currentStep;

      return Row(
        children: [
          Column(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: isCompleted
                      ? const Color(0xFF00C853)
                      : Colors.grey.shade300,
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  step['icon'],
                  color: isCompleted ? Colors.white : Colors.grey.shade600,
                  size: 20,
                ),
              ),
              if (index < _steps.length - 1)
                Container(
                  width: 2,
                  height: 40,
                  color: isCompleted
                      ? const Color(0xFF00C853)
                      : Colors.grey.shade300,
                ),
            ],
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  step['label'],
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: isActive ? FontWeight.bold : FontWeight.normal,
                    color: isCompleted ? Colors.black : Colors.grey.shade500,
                  ),
                ),
                if (isActive)
                  Text(
                    'In progress...',
                    style: TextStyle(
                      fontSize: 12,
                      color: const Color(0xFF00C853),
                    ),
                  ),
              ],
            ),
          ),
          if (isActive)
            const SizedBox(
              width: 20,
              height: 20,
              child: CircularProgressIndicator(
                strokeWidth: 2,
                valueColor: AlwaysStoppedAnimation<Color>(Color(0xFF00C853)),
              ),
            ),
        ],
      );
    },
  );

  Widget _buildActionButtons() => Row(
    children: [
      Expanded(
        child: CustomButton(
          text: 'Cancel Job',
          isOutlined: true,
          backgroundColor: Colors.red,
          onPressed: () {
            _showCancelDialog();
          },
        ),
      ),
      const SizedBox(width: 12),
      Expanded(
        child: CustomButton(
          text: 'Contact Worker',
          onPressed: () {
            if (_job?.professionalId != null) {
              Navigator.pushNamed(
                context,
                AppRoutes.chat,
                arguments: _job!.professionalId,
              );
            }
          },
        ),
      ),
    ],
  );

  void _showCancelDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Cancel Job?'),
        content: const Text(
          'Are you sure you want to cancel this job? This action cannot be undone.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('No'),
          ),
          TextButton(
            onPressed: () async {
              Navigator.pop(context); // close dialog
              if (_job?.id == null) return;
              try {
                await context.read<JobProvider>().cancelJob(_job!.id!);
                if (!mounted) return;
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Job cancelled')),
                );
              } catch (e) {
                if (!mounted) return;
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(content: Text('Failed to cancel job: $e')),
                );
              }
              Navigator.pop(context); // go back from tracking screen
            },
            style: TextButton.styleFrom(foregroundColor: Colors.red),
            child: const Text('Yes, Cancel'),
          ),
        ],
      ),
    );
  }

  Color _getStatusColor(String? status) {
    switch (status) {
      case 'posted':
        return Colors.blue;
      case 'accepted':
        return Colors.green;
      case 'rejected':
        return Colors.red;
      case 'completed':
        return Colors.purple;
      default:
        return Colors.orange;
    }
  }
}
