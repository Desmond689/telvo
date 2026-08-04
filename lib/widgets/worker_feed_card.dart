import 'package:flutter/material.dart';
import 'package:telvo/models/user_model.dart';
import 'package:telvo/widgets/rating_stars.dart';
import 'package:telvo/utils/app_colors.dart';

class WorkerFeedCard extends StatelessWidget {
  final UserModel professional;
  final VoidCallback onPhotoTap;
  final VoidCallback onViewProfile;
  final VoidCallback onHireNow;

  const WorkerFeedCard({
    super.key,
    required this.professional,
    required this.onPhotoTap,
    required this.onViewProfile,
    required this.onHireNow,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final city = professional.city;
    final previewBio = professional.description?.trim();
    final badgeColor = professional.isVerified ? AppColors.success : Colors.transparent;

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: theme.colorScheme.surface,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: theme.colorScheme.outlineVariant.withValues(alpha: 0.2)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 18,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              GestureDetector(
                onTap: onPhotoTap,
                child: CircleAvatar(
                  radius: 32,
                  backgroundColor: theme.colorScheme.surfaceVariant,
                  backgroundImage: professional.profilePhoto != null
                      ? NetworkImage(professional.profilePhoto!)
                      : null,
                  child: professional.profilePhoto == null
                      ? Text(
                          professional.fullName?.substring(0, 1).toUpperCase() ?? 'P',
                          style: const TextStyle(
                            fontSize: 24,
                            fontWeight: FontWeight.w700,
                            color: AppColors.textSecondary,
                          ),
                        )
                      : null,
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            professional.fullName ?? 'Unknown Professional',
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w700,
                              color: theme.colorScheme.onSurface,
                            ),
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        if (professional.isVerified)
                          const Icon(
                            Icons.verified,
                            size: 18,
                            color: AppColors.success,
                          ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      professional.category ?? 'Professional',
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: theme.colorScheme.onSurface.withValues(alpha: 0.7),
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        RatingStars(rating: professional.rating ?? 0),
                        const SizedBox(width: 8),
                        Text(
                          '${professional.rating?.toStringAsFixed(1) ?? '0.0'}',
                          style: theme.textTheme.bodySmall?.copyWith(
                            color: theme.colorScheme.onSurface.withValues(alpha: 0.8),
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        const SizedBox(width: 6),
                        Text(
                          '• ${professional.jobsCompleted ?? 0} jobs',
                          style: theme.textTheme.bodySmall?.copyWith(
                            color: theme.colorScheme.onSurface.withValues(alpha: 0.7),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),
                    if (city != null && city.isNotEmpty)
                      Row(
                        children: [
                          const Icon(
                            Icons.location_on_outlined,
                            size: 16,
                            color: AppColors.textSecondary,
                          ),
                          const SizedBox(width: 4),
                          Expanded(
                            child: Text(
                              city,
                              style: theme.textTheme.bodySmall?.copyWith(
                                color: theme.colorScheme.onSurface.withValues(alpha: 0.75),
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ],
                      ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          Text(
            previewBio?.isNotEmpty == true ? previewBio! : 'No bio available yet.',
            style: theme.textTheme.bodySmall?.copyWith(
              color: theme.colorScheme.onSurfaceVariant,
            ),
            maxLines: 3,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            decoration: BoxDecoration(
              color: theme.colorScheme.primary.withValues(alpha: 0.06),
              borderRadius: BorderRadius.circular(14),
            ),
            child: Row(
              children: [
                const Icon(Icons.attach_money_rounded, size: 16, color: AppColors.primary),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    professional.startingPrice != null
                        ? 'Starting price: XAF ${professional.startingPrice!.toStringAsFixed(0)}'
                        : 'Starting price: N/A',
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: theme.colorScheme.onSurface.withValues(alpha: 0.8),
                    ),
                  ),
                ),
                if (professional.isVerified)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                    decoration: BoxDecoration(
                      color: badgeColor.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      'Verified',
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: AppColors.success,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  onPressed: onViewProfile,
                  style: OutlinedButton.styleFrom(
                    side: BorderSide(color: theme.colorScheme.outline),
                  ),
                  child: const Text('View Profile'),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: ElevatedButton(
                  onPressed: onHireNow,
                  child: const Text('Hire Now'),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
