import 'package:flutter/material.dart';
import '../../models/housekeeping_task_model.dart';
import '../status/status_badge.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_typography.dart';

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
    return Card(
      clipBehavior: Clip.antiAlias,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Room ${task.roomNumber ?? task.roomId} (${task.roomTypeName ?? "Room"})',
                  style: AppTypography.titleMedium,
                ),
                StatusBadge(status: task.status),
              ],
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                  decoration: BoxDecoration(
                    color: task.priority == 'high' ? AppColors.dangerBackground : AppColors.surfaceVariant,
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    'Priority: ${task.priority.toUpperCase()}',
                    style: AppTypography.bodySmall.copyWith(
                      color: task.priority == 'high' ? AppColors.danger : AppColors.textSecondary,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                Text(
                  'Task: ${task.taskType.toUpperCase()}',
                  style: AppTypography.bodySmall,
                ),
              ],
            ),
            if (task.notes != null) ...[
              const SizedBox(height: 8),
              Text(
                'Notes: ${task.notes}',
                style: AppTypography.bodySmall.copyWith(color: AppColors.textSecondary),
              ),
            ],
            const Divider(height: 20),
            Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                if (task.status != 'in_progress' && task.status != 'completed') ...[
                  OutlinedButton.icon(
                    onPressed: onStart,
                    icon: const Icon(Icons.play_arrow, size: 16),
                    label: const Text('Start Task'),
                  ),
                  const SizedBox(width: 8),
                ],
                if (task.status != 'completed')
                  ElevatedButton.icon(
                    onPressed: onComplete,
                    icon: const Icon(Icons.check, size: 16),
                    label: const Text('Mark Complete'),
                  ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
