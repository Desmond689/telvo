import 'package:flutter/material.dart';
import 'package:telvo/models/user_model.dart';
import 'package:telvo/widgets/rating_stars.dart';
import 'package:telvo/utils/app_colors.dart';

class WorkerFeedCard extends StatelessWidget {
  final UserModel professional;
  final VoidCallback onPhotoTap;
  // onViewProfile removed — card is tappable. Keep onHireNow only.
  final VoidCallback onHireNow;

  const WorkerFeedCard({
    super.key,
    required this.professional,
    required this.onPhotoTap,
    required this.onHireNow,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final city = professional.city;
    final previewBio = professional.description?.trim();

    // Compact horizontal card per design spec
    return GestureDetector(
      // Tapping the card (except the Hire button) should open profile — parent should wire onPhotoTap to open profile.
      onTap: onPhotoTap,
      child: Container(
        height: 110,
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        decoration: BoxDecoration(
          color: theme.colorScheme.surface,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: theme.colorScheme.outlineVariant.withValues(alpha: 0.12)),
        ),
        child: Row(
          children: [
            // Left image — rounded rectangle 72x72
            Stack(
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(14),
                  child: Container(
                    width: 72,
                    height: 72,
                    color: theme.colorScheme.surfaceVariant,
                    child: professional.profilePhoto != null
                        ? Image.network(
                            professional.profilePhoto!,
                            width: 72,
                            height: 72,
                            fit: BoxFit.cover,
                            errorBuilder: (_, __, ___) => Center(
                              child: Icon(Icons.person_outline, size: 32, color: theme.colorScheme.onSurface.withValues(alpha: 0.4)),
                            ),
                          )
                        : Center(
                            child: Text(
                              professional.fullName?.substring(0, 1).toUpperCase() ?? 'P',
                              style: TextStyle(
                                fontSize: 28,
                                fontWeight: FontWeight.w700,
                                color: theme.colorScheme.onSurface.withValues(alpha: 0.65),
                              ),
                            ),
                          ),
                  ),
                ),
                if (professional.isVerified)
                  Positioned(
                    right: -4,
                    bottom: -4,
                    child: Container(
                      width: 30,
                      height: 30,
                      decoration: BoxDecoration(
                        color: AppColors.success,
                        shape: BoxShape.circle,
                        border: Border.all(color: Colors.white, width: 2),
                      ),
                      child: const Icon(Icons.check, size: 16, color: Colors.white),
                    ),
                  ),
              ],
            ),
            const SizedBox(width: 12),
            // Right content
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          professional.fullName ?? 'Unknown',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w700,
                            color: theme.colorScheme.onSurface,
                          ),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Row(
                        children: [
                          const Icon(Icons.star, size: 14, color: AppColors.primary),
                          const SizedBox(width: 4),
                          Text(
                            professional.rating != null ? professional.rating!.toStringAsFixed(1) : '-',
                            style: theme.textTheme.bodySmall?.copyWith(fontWeight: FontWeight.w700),
                          ),
                        ],
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  if (professional.category != null)
                    Text(
                      professional.category!,
                      style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurface.withValues(alpha: 0.7)),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  const SizedBox(height: 6),
                  if (previewBio?.isNotEmpty == true)
                    Text(
                      previewBio!,
                      style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurface.withValues(alpha: 0.65)),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          professional.startingPrice != null
                              ? 'From CFA ${professional.startingPrice!.toStringAsFixed(0)}'
                              : 'Price unavailable',
                          style: theme.textTheme.bodySmall?.copyWith(fontWeight: FontWeight.w700),
                        ),
                      ),
                      const SizedBox(width: 8),
                      // Hire Now button — small
                      SizedBox(
                        height: 36,
                        child: ElevatedButton(
                          onPressed: onHireNow,
                          style: ElevatedButton.styleFrom(
                            padding: const EdgeInsets.symmetric(horizontal: 12),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                            elevation: 0,
                          ),
                          child: const Text('Hire Now'),
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
    );
  }
}

