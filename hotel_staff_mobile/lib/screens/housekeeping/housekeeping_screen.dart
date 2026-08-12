import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../providers/housekeeping_provider.dart';
import '../../providers/services_provider.dart';
import '../../widgets/common/drawer_navigation.dart';
import '../../widgets/cards/task_card.dart';
import '../../widgets/loading/loading_indicator.dart';
import '../../widgets/empty_states/empty_state_view.dart';
import '../../core/theme/app_colors.dart';

class HousekeepingScreen extends ConsumerWidget {
  const HousekeepingScreen({super.key});

  void _updateTaskStatus(BuildContext context, WidgetRef ref, int taskId, String status) async {
    try {
      final repo = ref.read(housekeepingRepositoryProvider);
      await repo.updateTaskStatus(taskId, status);
      ref.invalidate(housekeepingTasksProvider);
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Task marked as ${status.toUpperCase()}'),
            backgroundColor: AppColors.success,
          ),
        );
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to update task: $e'),
            backgroundColor: AppColors.danger,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tasksAsync = ref.watch(housekeepingTasksProvider);
    final currentFilter = ref.watch(housekeepingFilterStatusProvider);
    final filters = ['All', 'Pending', 'In Progress', 'Completed', 'High Priority'];

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
      body: Column(
        children: [
          // Search & Filter Header
          Container(
            color: Colors.white,
            padding: const EdgeInsets.all(16),
            child: Column(
              children: [
                // Search Bar
                TextField(
                  onChanged: (value) {
                    ref.read(housekeepingSearchQueryProvider.notifier).state = value;
                  },
                  decoration: InputDecoration(
                    hintText: 'Search by room number...',
                    prefixIcon: const Icon(Icons.search, color: AppColors.textSecondary),
                    filled: true,
                    fillColor: Colors.grey.shade100,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide.none,
                    ),
                    contentPadding: const EdgeInsets.symmetric(vertical: 0),
                  ),
                ),
                const SizedBox(height: 12),
                
                // Filter Chips
                SizedBox(
                  height: 40,
                  child: ListView.separated(
                    scrollDirection: Axis.horizontal,
                    itemCount: filters.length,
                    separatorBuilder: (context, index) => const SizedBox(width: 8),
                    itemBuilder: (context, index) {
                      final filter = filters[index];
                      final isSelected = currentFilter == filter;
                      
                      return ChoiceChip(
                        label: Text(filter),
                        selected: isSelected,
                        selectedColor: AppColors.primary,
                        labelStyle: TextStyle(
                          color: isSelected ? Colors.white : AppColors.textPrimary,
                          fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                        ),
                        onSelected: (selected) {
                          if (selected) {
                            ref.read(housekeepingFilterStatusProvider.notifier).state = filter;
                          }
                        },
                      );
                    },
                  ),
                ),
              ],
            ),
          ),
          
          // Tasks List
          Expanded(
            child: tasksAsync.when(
              loading: () => const LoadingIndicator(message: 'Loading housekeeping tasks...'),
              error: (err, stack) => EmptyStateView(
                title: 'Error loading tasks',
                description: err.toString(),
                onRetry: () => ref.refresh(housekeepingTasksProvider),
              ),
              data: (tasks) {
                if (tasks.isEmpty) {
                  return EmptyStateView(
                    icon: Icons.cleaning_services_outlined,
                    title: 'No Tasks Found',
                    description: 'There are no tasks matching your current filters.',
                    onRetry: () => ref.refresh(housekeepingTasksProvider),
                  );
                }

                return RefreshIndicator(
                  onRefresh: () async {
                    ref.invalidate(housekeepingTasksProvider);
                    await ref.read(housekeepingTasksProvider.future);
                  },
                  child: ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: tasks.length,
                    itemBuilder: (context, index) {
                      final task = tasks[index];
                      return TaskCard(
                        task: task,
                        onStart: () => _updateTaskStatus(context, ref, task.id, 'in_progress'),
                        onComplete: () => _updateTaskStatus(context, ref, task.id, 'completed'),
                      );
                    },
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
