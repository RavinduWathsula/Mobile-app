import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_typography.dart';

class GuestCard extends StatelessWidget {
  final String name;
  final String? roomNumber;
  final String? phone;
  final String? email;
  final VoidCallback? onTap;

  const GuestCard({
    super.key,
    required this.name,
    this.roomNumber,
    this.phone,
    this.email,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              CircleAvatar(
                radius: 24,
                backgroundColor: AppColors.primary.withValues(alpha: 0.1),
                child: Text(
                  name.isNotEmpty ? name[0].toUpperCase() : 'G',
                  style: AppTypography.titleMedium.copyWith(
                    color: AppColors.primary,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(name, style: AppTypography.titleMedium),
                    if (roomNumber != null) ...[
                      const SizedBox(height: 2),
                      Text('Room $roomNumber', style: AppTypography.bodySmall),
                    ],
                    if (phone != null || email != null) ...[
                      const SizedBox(height: 2),
                      Text(phone ?? email ?? '', style: AppTypography.bodySmall.copyWith(color: AppColors.textMuted)),
                    ],
                  ],
                ),
              ),
              const Icon(Icons.chevron_right, color: AppColors.textMuted),
            ],
          ),
        ),
      ),
    );
  }
}
