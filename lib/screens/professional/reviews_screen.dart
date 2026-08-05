import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:telvo/models/review_model.dart';
import 'package:telvo/providers/auth_provider.dart';
import 'package:telvo/providers/job_provider.dart';
import 'package:telvo/widgets/empty_state.dart';
import 'package:telvo/widgets/rating_stars.dart';

class ReviewsScreen extends StatefulWidget {
  const ReviewsScreen({super.key});

  @override
  State<ReviewsScreen> createState() => _ReviewsScreenState();
}

class _ReviewsScreenState extends State<ReviewsScreen> {
  late Future<List<ReviewModel>> _reviewsFuture;
  String? _targetUserId;

  @override
  void initState() {
    super.initState();
    // initState can't access ModalRoute; delay loading until didChangeDependencies
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final args = ModalRoute.of(context)?.settings.arguments;
    if (args is String) {
      _targetUserId = args;
    } else if (args is Map && args['professionalId'] is String) {
      _targetUserId = args['professionalId'] as String;
    } else {
      _targetUserId = context.read<AuthProvider>().currentUser?.id;
    }
    _reviewsFuture = _loadReviews();
  }

  Future<List<ReviewModel>> _loadReviews() {
    final userId = _targetUserId;
    if (userId == null) return Future.value(const []);
    return context.read<JobProvider>().fetchReviewsForUser(userId);
  }

  Future<void> _refresh() async {
    setState(() {
      _reviewsFuture = _loadReviews();
    });
    await _reviewsFuture;
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: const Text('Reviews'), elevation: 0),
    body: FutureBuilder<List<ReviewModel>>(
      future: _reviewsFuture,
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Center(child: CircularProgressIndicator());
        }

        if (snapshot.hasError) {
          return _buildErrorState();
        }

        final reviews = snapshot.data ?? [];

        if (reviews.isEmpty) {
          return _buildEmptyState();
        }

        return RefreshIndicator(
          onRefresh: _refresh,
          child: SingleChildScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.all(16.0),
            child: Column(
              children: [
                _buildRatingSummary(reviews),
                const SizedBox(height: 24),
                Align(
                  alignment: Alignment.centerLeft,
                  child: Text(
                    'All Reviews',
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                ...reviews.map((review) => _buildReviewItem(context, review)),
              ],
            ),
          ),
        );
      },
    ),
  );

  Widget _buildEmptyState() => RefreshIndicator(
    onRefresh: _refresh,
    child: LayoutBuilder(
      builder: (context, constraints) => SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        child: ConstrainedBox(
          constraints: BoxConstraints(minHeight: constraints.maxHeight),
          child: Center(
            child: Padding(
              padding: const EdgeInsets.all(32.0),
              child: EmptyState(
                title: 'No reviews yet.',
                subtitle:
                    'Reviews from customers will show up here after you complete jobs.',
                imagePath: 'assets/images/empty_state.png',
                actionText: 'Refresh',
                onAction: _refresh,
              ),
            ),
          ),
        ),
      ),
    ),
  );

  Widget _buildErrorState() => LayoutBuilder(
    builder: (context, constraints) => SingleChildScrollView(
      child: ConstrainedBox(
        constraints: BoxConstraints(minHeight: constraints.maxHeight),
        child: Center(
          child: Padding(
            padding: const EdgeInsets.all(32.0),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(
                  Icons.error_outline,
                  size: 48,
                  color: Theme.of(context).colorScheme.error,
                ),
                const SizedBox(height: 16),
                Text(
                  "Couldn't load reviews.",
                  style: Theme.of(context).textTheme.titleMedium,
                ),
                const SizedBox(height: 16),
                ElevatedButton(onPressed: _refresh, child: const Text('Retry')),
              ],
            ),
          ),
        ),
      ),
    ),
  );

  Widget _buildRatingSummary(List<ReviewModel> reviews) {
    final theme = Theme.of(context);
    final ratings = reviews
        .map((r) => r.rating ?? 0)
        .where((r) => r > 0)
        .toList();
    final average = ratings.isEmpty
        ? 0.0
        : ratings.reduce((a, b) => a + b) / ratings.length;

    final counts = <int, int>{5: 0, 4: 0, 3: 0, 2: 0, 1: 0};
    for (final r in ratings) {
      final bucket = r.round().clamp(1, 5);
      counts[bucket] = (counts[bucket] ?? 0) + 1;
    }

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: theme.colorScheme.surfaceContainerHighest,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        children: [
          Column(
            children: [
              Text(
                average.toStringAsFixed(1),
                style: theme.textTheme.headlineMedium?.copyWith(
                  fontSize: 48,
                  fontWeight: FontWeight.bold,
                ),
              ),
              RatingStars(rating: average),
              const SizedBox(height: 4),
              Text(
                '${reviews.length} review${reviews.length == 1 ? '' : 's'}',
                style: theme.textTheme.bodySmall?.copyWith(
                  color: theme.colorScheme.onSurface.withValues(alpha: 0.6),
                ),
              ),
            ],
          ),
          const SizedBox(width: 32),
          Expanded(
            child: Column(
              children: [
                for (int star = 5; star >= 1; star--)
                  _buildRatingBar(
                    star.toDouble(),
                    ratings.isEmpty
                        ? 0.0
                        : (counts[star] ?? 0) / ratings.length,
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRatingBar(double rating, double percentage) {
    final theme = Theme.of(context);
    return Row(
      children: [
        Text(rating.toStringAsFixed(0), style: const TextStyle(fontSize: 12)),
        const SizedBox(width: 4),
        const Icon(Icons.star, size: 14, color: Colors.amber),
        const SizedBox(width: 8),
        Expanded(
          child: LinearProgressIndicator(
            value: percentage,
            backgroundColor: theme.colorScheme.onSurface.withValues(
              alpha: 0.08,
            ),
            valueColor: const AlwaysStoppedAnimation<Color>(Colors.amber),
          ),
        ),
        const SizedBox(width: 8),
        SizedBox(
          width: 32,
          child: Text(
            '${(percentage * 100).toInt()}%',
            style: theme.textTheme.bodySmall?.copyWith(
              color: theme.colorScheme.onSurface.withValues(alpha: 0.6),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildReviewItem(BuildContext context, ReviewModel review) {
    final theme = Theme.of(context);
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: theme.colorScheme.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: theme.colorScheme.onSurface.withValues(alpha: 0.1),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              CircleAvatar(
                backgroundImage:
                    (review.reviewerPhoto != null &&
                        review.reviewerPhoto!.isNotEmpty)
                    ? NetworkImage(review.reviewerPhoto!)
                    : null,
                child:
                    (review.reviewerPhoto == null ||
                        review.reviewerPhoto!.isEmpty)
                    ? const Icon(Icons.person)
                    : null,
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      review.reviewerName ?? 'Telvo user',
                      style: const TextStyle(fontWeight: FontWeight.bold),
                    ),
                    Row(
                      children: [
                        RatingStars(rating: review.rating ?? 0, size: 14),
                        const SizedBox(width: 8),
                        Text(
                          _formatDate(review.createdAt),
                          style: theme.textTheme.bodySmall?.copyWith(
                            color: theme.colorScheme.onSurface.withValues(
                              alpha: 0.6,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
          if (review.comment != null && review.comment!.isNotEmpty) ...[
            const SizedBox(height: 8),
            Text(review.comment!, style: const TextStyle(fontSize: 14)),
          ],
          if (review.isResponse == true &&
              review.responseText != null &&
              review.responseText!.isNotEmpty) ...[
            const SizedBox(height: 12),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: theme.colorScheme.primary.withValues(alpha: 0.06),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Your reply',
                    style: theme.textTheme.bodySmall?.copyWith(
                      fontWeight: FontWeight.bold,
                      color: theme.colorScheme.primary,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(review.responseText!),
                ],
              ),
            ),
          ] else ...[
            const SizedBox(height: 8),
            Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                TextButton(
                  onPressed: () => _openReplyDialog(context, review),
                  child: const Text('Reply'),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }

  Future<void> _openReplyDialog(
    BuildContext context,
    ReviewModel review,
  ) async {
    final controller = TextEditingController();
    final replyText = await showDialog<String>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: const Text('Reply to review'),
        content: TextField(
          controller: controller,
          autofocus: true,
          maxLines: 4,
          decoration: const InputDecoration(
            hintText: 'Write a reply...',
            border: OutlineInputBorder(),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogContext),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () =>
                Navigator.pop(dialogContext, controller.text.trim()),
            child: const Text('Post'),
          ),
        ],
      ),
    );

    if (replyText == null || replyText.isEmpty || !mounted) return;
    if (review.id == null) return;

    final success = await context.read<JobProvider>().respondToReview(
      review.id!,
      replyText,
    );

    if (!mounted) return;

    if (success) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('Reply posted.')));
      _refresh();
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Couldn't post your reply. Try again.")),
      );
    }
  }

  String _formatDate(DateTime? date) {
    if (date == null) return '';
    return '${date.year}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')}';
  }
}
