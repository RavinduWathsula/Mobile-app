import 'package:flutter/material.dart';
import '../../models/room_model.dart';
import '../status/status_badge.dart';
import '../../core/utils/formatters.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_typography.dart';

class RoomCard extends StatelessWidget {
  final RoomModel room;
  final VoidCallback? onTap;

  const RoomCard({
    super.key,
    required this.room,
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
              Container(
                width: 52,
                height: 52,
                decoration: BoxDecoration(
                  color: AppColors.primary.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Center(
                  child: Text(
                    room.roomNumber,
                    style: AppTypography.titleMedium.copyWith(
                      color: AppColors.primary,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      room.roomTypeName ?? 'Standard Room',
                      style: AppTypography.titleMedium,
                    ),
                    const SizedBox(height: 2),
                    Text(
                      'Floor ${room.floor} • ${room.status.replaceAll('_', ' ').toUpperCase()}',
                      style: AppTypography.bodySmall,
                    ),
                    const SizedBox(height: 2),
                    Text(
                      '${Formatters.formatCurrency(room.basePrice)} / night',
                      style: AppTypography.bodySmall.copyWith(
                        color: AppColors.primary,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ),
              StatusBadge(status: room.status),
            ],
          ),
        ),
      ),
    );
  }
}
