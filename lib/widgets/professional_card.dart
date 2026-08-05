import 'package:flutter/material.dart';
import 'package:telvo/models/professional_display.dart';

// Compact horizontal professional card — designed to avoid overflow and be
// vertically compact (approx 100-120 logical pixels tall).
class ProfessionalCard extends StatelessWidget {
  final Professional professional;
  final VoidCallback onTap;

  const ProfessionalCard({
    super.key,
    required this.professional,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Container(
          height: 110,
          margin: const EdgeInsets.symmetric(vertical: 8),
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: theme.colorScheme.surface,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: theme.colorScheme.outlineVariant.withOpacity(0.12),
            ),
          ),
          child: Row(
            children: [
              // LEFT: Avatar
              ClipRRect(
                borderRadius: BorderRadius.circular(8),
                child: SizedBox(
                  width: 72,
                  height: 72,
                  child: professional.photoUrl != null
                      ? Image.network(
                          professional.photoUrl!,
                          fit: BoxFit.cover,
                          errorBuilder: (context, error, stackTrace) => Container(
                            color: Colors.grey.shade200,
                            child: Center(
                              child: Text(
                                professional.name.isNotEmpty
                                    ? professional.name.substring(0, 1).toUpperCase()
                                    : '?',
                                style: TextStyle(
                                  fontSize: 28,
                                  fontWeight: FontWeight.w700,
                                  color: theme.colorScheme.onSurface.withOpacity(0.6),
                                ),
                              ),
                            ),
                          ),
                        )
                      : Container(
                          color: Colors.grey.shade200,
                          child: Center(
                            child: Text(
                              professional.name.isNotEmpty
                                  ? professional.name.substring(0, 1).toUpperCase()
                                  : '?',
                              style: TextStyle(
                                fontSize: 28,
                                fontWeight: FontWeight.w700,
                                color: theme.colorScheme.onSurface.withOpacity(0.6),
                              ),
                            ),
                          ),
                        ),
                ),
              ),

              const SizedBox(width: 12),

              // CENTER: Expanded content
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    // Line 1: Name + rating
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            professional.name,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w700,
                              color: theme.colorScheme.onSurface,
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Row(
                          children: [
                            const Icon(Icons.star_rounded, size: 16, color: Colors.amber),
                            const SizedBox(width: 4),
                            Text(
                              professional.rating.toStringAsFixed(1),
                              style: TextStyle(
                                fontWeight: FontWeight.w700,
                                color: theme.colorScheme.onSurface,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),

                    const SizedBox(height: 6),

                    // Line 2: Category / title
                    Text(
                      professional.title,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        fontSize: 13,
                        color: theme.colorScheme.onSurface.withOpacity(0.7),
                      ),
                    ),

                    const SizedBox(height: 6),

                    // Line 3: Secondary info (jobs)
                    Text(
                      '${professional.jobs} jobs',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        fontSize: 12,
                        color: theme.colorScheme.onSurface.withOpacity(0.6),
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(width: 12),

              // RIGHT: Hire Now button (vertically centered)
              SizedBox(
                width: 92,
                child: Center(
                  child: ElevatedButton(
                    onPressed: () {
                      // Reuse existing hiring navigation: navigate to JobPost with professional id
                      Navigator.of(context).pushNamed(
                        '/job-post',
                        arguments: null, // parent should provide professional id when wiring onTap if needed
                      );
                    },
                    child: const Text('Hire Now'),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
