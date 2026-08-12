import 'package:flutter/material.dart';
import '../../models/housekeeping_task_model.dart';
import '../../core/theme/app_colors.dart';
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
    final isHighPriority = task.priority.toLowerCase() == 'high' || task.priority.toLowerCase() == 'urgent';
    final isCompleted = task.status.toLowerCase() == 'completed';
    final isInProgress = task.status.toLowerCase() == 'in_progress';

    // Accent colors
    final accentColor = isCompleted 
        ? Colors.grey.shade400 
        : (isHighPriority ? const Color(0xFFEF4444) : const Color(0xFF3B82F6));
    final bgColor = isCompleted ? Colors.grey.shade50 : Colors.white;

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withAlpha(5),
            blurRadius: 20,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Stack(
        children: [
          // Left Edge Accent Line
          Positioned(
            left: 0,
            top: 0,
            bottom: 0,
            child: Container(
              width: 5,
              decoration: BoxDecoration(
                color: accentColor,
                borderRadius: const BorderRadius.only(
                  topLeft: Radius.circular(16),
                  bottomLeft: Radius.circular(16),
                ),
              ),
            ),
          ),
          
          Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Header: Room & Status
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
                            style: TextStyle(
                              fontSize: 22,
                              fontWeight: FontWeight.w800,
                              color: isCompleted ? Colors.grey.shade600 : Colors.black87,
                              letterSpacing: -0.5,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            task.roomTypeName ?? 'Standard Room',
                            style: TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w500,
                              color: Colors.grey.shade500,
                            ),
                          ),
                        ],
                      ),
                    ),
                    _buildStatusPill(task.status),
                  ],
                ),
                
                const Padding(
                  padding: EdgeInsets.symmetric(vertical: 16),
                  child: Divider(height: 1, thickness: 1),
                ),
                
                // Info Section
                Row(
                  children: [
                    Expanded(
                      child: _buildInfoItem(
                        icon: task.taskType.toLowerCase() == 'maintenance' ? Icons.build_circle_outlined : Icons.cleaning_services_outlined,
                        title: 'Task Type',
                        value: task.taskType.toUpperCase(),
                        valueColor: isCompleted ? Colors.grey.shade600 : AppColors.primary,
                      ),
                    ),
                    Expanded(
                      child: _buildInfoItem(
                        icon: Icons.person_outline_rounded,
                        title: 'Assignee',
                        value: task.assigneeName ?? 'Unassigned',
                        valueColor: isCompleted ? Colors.grey.shade600 : Colors.black87,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: _buildInfoItem(
                        icon: Icons.flag_outlined,
                        title: 'Priority',
                        value: task.priority.toUpperCase(),
                        valueColor: isHighPriority && !isCompleted ? AppColors.danger : Colors.grey.shade700,
                        isBold: isHighPriority,
                      ),
                    ),
                    Expanded(
                      child: _buildInfoItem(
                        icon: Icons.calendar_today_outlined,
                        title: 'Scheduled',
                        value: task.scheduledDate.isNotEmpty ? _formatDate(task.scheduledDate) : 'Today',
                        valueColor: Colors.grey.shade700,
                      ),
                    ),
                  ],
                ),

                // Notes Section
                if (task.notes != null && task.notes!.isNotEmpty) ...[
                  const SizedBox(height: 16),
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.grey.shade100,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Icon(Icons.notes_rounded, size: 18, color: Colors.grey.shade600),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Text(
                            task.notes!,
                            style: TextStyle(
                              fontSize: 13,
                              color: Colors.grey.shade800,
                              height: 1.4,
                              fontStyle: FontStyle.italic,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
                
                // Actions Footer
                if (!isCompleted) ...[
                  const SizedBox(height: 20),
                  _buildActionRow(isInProgress, accentColor),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatusPill(String status) {
    Color bgColor;
    Color textColor;
    String text = status.toUpperCase().replaceAll('_', ' ');

    switch (status.toLowerCase()) {
      case 'completed':
        bgColor = Colors.green.shade50;
        textColor = Colors.green.shade700;
        break;
      case 'in_progress':
        bgColor = Colors.blue.shade50;
        textColor = Colors.blue.shade700;
        break;
      case 'pending':
      default:
        bgColor = Colors.orange.shade50;
        textColor = Colors.orange.shade800;
        break;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        text,
        style: TextStyle(
          color: textColor,
          fontSize: 11,
          fontWeight: FontWeight.bold,
          letterSpacing: 0.5,
        ),
      ),
    );
  }

  Widget _buildInfoItem({
    required IconData icon,
    required String title,
    required String value,
    required Color valueColor,
    bool isBold = false,
  }) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        Icon(icon, size: 18, color: Colors.grey.shade400),
        const SizedBox(width: 8),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: TextStyle(fontSize: 11, color: Colors.grey.shade500, fontWeight: FontWeight.w500),
              ),
              const SizedBox(height: 2),
              Text(
                value,
                style: TextStyle(
                  fontSize: 13,
                  color: valueColor,
                  fontWeight: isBold ? FontWeight.bold : FontWeight.w600,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildActionRow(bool isInProgress, Color accentColor) {
    if (isInProgress) {
      return SizedBox(
        width: double.infinity,
        height: 50,
        child: FilledButton.tonalIcon(
          onPressed: onComplete,
          style: FilledButton.styleFrom(
            backgroundColor: Colors.green.shade50,
            foregroundColor: Colors.green.shade700,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          ),
          icon: const Icon(Icons.check_circle_rounded, size: 20),
          label: const Text('Mark as Completed', style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold)),
        ),
      );
    }
    
    return SizedBox(
      width: double.infinity,
      height: 50,
      child: OutlinedButton.icon(
        onPressed: onStart,
        style: OutlinedButton.styleFrom(
          foregroundColor: accentColor,
          side: BorderSide(color: accentColor.withAlpha(50), width: 1.5),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          backgroundColor: accentColor.withAlpha(10),
        ),
        icon: const Icon(Icons.play_circle_outline_rounded, size: 20),
        label: const Text('Start Task', style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold)),
      ),
    );
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
