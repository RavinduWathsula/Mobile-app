import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_typography.dart';

class StatusBadge extends StatelessWidget {
  final String status;

  const StatusBadge({
    super.key,
    required this.status,
  });

  @override
  Widget build(BuildContext context) {
    final normalized = status.toLowerCase().replaceAll(' ', '_');
    Color bg = AppColors.surfaceVariant;
    Color fg = AppColors.textSecondary;

    switch (normalized) {
      case 'confirmed':
      case 'available':
      case 'completed':
      case 'ready':
      case 'served':
      case 'paid':
        bg = AppColors.successBackground;
        fg = AppColors.success;
        break;

      case 'pending':
      case 'preparing':
      case 'dirty':
      case 'in_progress':
        bg = AppColors.warningBackground;
        fg = AppColors.warning;
        break;

      case 'checked_in':
      case 'occupied':
        bg = AppColors.infoBackground;
        fg = AppColors.info;
        break;

      case 'cancelled':
      case 'maintenance':
      case 'out_of_order':
      case 'overdue':
        bg = AppColors.dangerBackground;
        fg = AppColors.danger;
        break;

      default:
        bg = AppColors.surfaceVariant;
        fg = AppColors.textSecondary;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        status.replaceAll('_', ' ').toUpperCase(),
        style: AppTypography.badgeText.copyWith(color: fg),
      ),
    );
  }
}
