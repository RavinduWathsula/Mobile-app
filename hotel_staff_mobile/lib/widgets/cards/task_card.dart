import 'package:flutter/material.dart';
import '../../models/housekeeping_task_model.dart';
import '../status/status_badge.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_typography.dart';
import '../../core/utils/formatters.dart';

class TaskCard extends StatelessWidget {
  final HousekeepingTaskModel task;
  final VoidCallback? onStart;
  final VoidCallback? onComplete;

  const TaskCard({
    super.key,
    required this.task,
    this.onStart,
    this.onComplete,
  });

  @override
  Widget build(BuildContext context) {
    final isHighPriority = task.priority.toLowerCase() == 'high';

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isHighPriority ? AppColors.danger.withAlpha(50) : Colors.grey.shade200,
          width: isHighPriority ? 2 : 1,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withAlpha(10),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Header Section
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Room ${task.roomNumber ?? task.roomId}',
                            style: AppTypography.headlineSmall.copyWith(
                              fontWeight: FontWeight.bold,
                              color: AppColors.textPrimary,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            task.roomTypeName ?? 'Room',
                            style: AppTypography.bodyMedium.copyWith(
                              color: AppColors.textSecondary,
                            ),
                          ),
                        ],
                      ),
                    ),
                    StatusBadge(status: task.status),
                  ],
                ),
                const SizedBox(height: 16),
                
                // Details Grid
                Row(
                  children: [
                    Expanded(
                      child: _buildDetailItem(
                        icon: Icons.cleaning_services,
                        label: 'Task Type',
                        value: task.taskType.toUpperCase(),
                        valueColor: AppColors.primary,
                      ),
                    ),
                    Expanded(
                      child: _buildDetailItem(
                        icon: Icons.priority_high,
                        label: 'Priority',
                        value: task.priority.toUpperCase(),
                        valueColor: isHighPriority ? AppColors.danger : AppColors.textPrimary,
                        isBold: isHighPriority,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: _buildDetailItem(
                        icon: Icons.person_outline,
                        label: 'Assignee',
                        value: task.assigneeName ?? 'Unassigned',
                      ),
                    ),
                    Expanded(
                      child: _buildDetailItem(
                        icon: Icons.access_time,
                        label: 'Scheduled',
                        value: task.scheduledDate.isNotEmpty 
                            ? _formatDate(task.scheduledDate)
                            : 'Today',
                      ),
                    ),
                  ],
                ),

                if (task.notes != null && task.notes!.isNotEmpty) ...[
                  const SizedBox(height: 16),
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.grey.shade50,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: Colors.grey.shade200),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Icon(Icons.notes, size: 16, color: Colors.grey.shade600),
                            const SizedBox(width: 8),
                            Text(
                              'Notes',
                              style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.bold,
                                color: Colors.grey.shade700,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 4),
                        Text(
                          task.notes!,
                          style: const TextStyle(fontSize: 14, color: AppColors.textPrimary),
                        ),
                      ],
                    ),
                  ),
                ],
              ],
            ),
          ),
          
          // Action Buttons Section
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.grey.shade50,
              borderRadius: const BorderRadius.vertical(bottom: Radius.circular(16)),
              border: Border(top: BorderSide(color: Colors.grey.shade200)),
            ),
            child: _buildActionRow(),
          ),
        ],
      ),
    );
  }

  Widget _buildDetailItem({
    required IconData icon,
    required String label,
    required String value,
    Color valueColor = AppColors.textPrimary,
    bool isBold = false,
  }) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, size: 16, color: AppColors.textSecondary),
        const SizedBox(width: 8),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: const TextStyle(fontSize: 11, color: AppColors.textSecondary),
              ),
              Text(
                value,
                style: TextStyle(
                  fontSize: 13,
                  color: valueColor,
                  fontWeight: isBold ? FontWeight.bold : FontWeight.w500,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildActionRow() {
    final statusStr = task.status.toLowerCase();

    if (statusStr == 'pending') {
      return SizedBox(
        width: double.infinity,
        height: 56,
        child: ElevatedButton.icon(
          onPressed: onStart,
          style: ElevatedButton.styleFrom(
            backgroundColor: AppColors.primary,
            foregroundColor: Colors.white,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          ),
          icon: const Icon(Icons.play_circle_fill, size: 24),
          label: const Text('Start Cleaning', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
        ),
      );
    } else if (statusStr == 'in_progress') {
      return SizedBox(
        width: double.infinity,
        height: 56,
        child: ElevatedButton.icon(
          onPressed: onComplete,
          style: ElevatedButton.styleFrom(
            backgroundColor: AppColors.success,
            foregroundColor: Colors.white,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          ),
          icon: const Icon(Icons.check_circle, size: 24),
          label: const Text('Complete Cleaning', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
        ),
      );
    } else if (statusStr == 'completed') {
      return Container(
        width: double.infinity,
        height: 56,
        decoration: BoxDecoration(
          color: AppColors.success.withAlpha(20),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppColors.success.withAlpha(50)),
        ),
        child: const Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.check_circle, color: AppColors.success, size: 24),
            SizedBox(width: 8),
            Text(
              'Completed',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
                color: AppColors.success,
              ),
            ),
          ],
        ),
      );
    }

    // Fallback
    return const SizedBox.shrink();
  }

  String _formatDate(String dateStr) {
    try {
      final date = DateTime.parse(dateStr);
      return Formatters.formatDate(date);
    } catch (_) {
      return dateStr;
    }
  }
}
