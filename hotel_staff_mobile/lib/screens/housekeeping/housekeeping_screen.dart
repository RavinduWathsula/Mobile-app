import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../providers/housekeeping_provider.dart';
import '../../providers/services_provider.dart';
import '../../widgets/common/drawer_navigation.dart';
import '../../widgets/status/status_badge.dart';
import '../../widgets/loading/loading_indicator.dart';
import '../../widgets/empty_states/empty_state_view.dart';

class HousekeepingScreen extends ConsumerWidget {
  const HousekeepingScreen({super.key});

  void _updateTaskStatus(BuildContext context, WidgetRef ref, int taskId, String status) async {
    try {
      final repo = ref.read(housekeepingRepositoryProvider);
      await repo.updateTaskStatus(taskId, status);
      ref.invalidate(housekeepingTasksProvider);
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Task marked as ${status.toUpperCase()}')),
        );
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString())),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tasksAsync = ref.watch(housekeepingTasksProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Housekeeping Tasks'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => ref.refresh(housekeepingTasksProvider),
          ),
        ],
      ),
      drawer: const DrawerNavigation(),
      body: tasksAsync.when(
        loading: () => const LoadingIndicator(message: 'Loading housekeeping tasks...'),
        error: (err, stack) => EmptyStateView(
          title: 'Error loading tasks',
          description: err.toString(),
          onRetry: () => ref.refresh(housekeepingTasksProvider),
        ),
        data: (tasks) {
          if (tasks.isEmpty) {
            return const EmptyStateView(
              icon: Icons.cleaning_services_outlined,
              title: 'No Tasks Assigned',
              description: 'There are no active housekeeping tasks for today.',
            );
          }

          return ListView.builder(
            padding: const EdgeInsets.all(12),
            itemCount: tasks.length,
            itemBuilder: (context, index) {
              final task = tasks[index];
              return Card(
                child: Padding(
                  padding: const EdgeInsets.all(14),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            'Room ${task.roomNumber ?? task.roomId} (${task.roomTypeName ?? ""})',
                            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                          ),
                          StatusBadge(status: task.status),
                        ],
                      ),
                      const SizedBox(height: 6),
                      Text('Task: ${task.taskType.toUpperCase()} | Priority: ${task.priority.toUpperCase()}'),
                      if (task.notes != null) ...[
                        const SizedBox(height: 4),
                        Text('Notes: ${task.notes}', style: const TextStyle(color: Colors.grey, fontSize: 13)),
                      ],
                      const Divider(),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.end,
                        children: [
                          if (task.status != 'in_progress' && task.status != 'completed')
                            TextButton.icon(
                              icon: const Icon(Icons.play_arrow),
                              label: const Text('Start'),
                              onPressed: () => _updateTaskStatus(context, ref, task.id, 'in_progress'),
                            ),
                          if (task.status != 'completed')
                            ElevatedButton.icon(
                              icon: const Icon(Icons.check),
                              label: const Text('Complete Cleaning'),
                              onPressed: () => _updateTaskStatus(context, ref, task.id, 'completed'),
                            ),
                        ],
                      ),
                    ],
                  ),
                ),
              );
            },
          );
        },
      ),
    );
  }
}
