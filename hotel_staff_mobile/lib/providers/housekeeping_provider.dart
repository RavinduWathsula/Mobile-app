import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/housekeeping_task_model.dart';
import 'services_provider.dart';

final housekeepingFilterStatusProvider = StateProvider<String>((ref) => 'All');
final housekeepingSearchQueryProvider = StateProvider<String>((ref) => '');

final housekeepingTasksProvider = FutureProvider.autoDispose<List<HousekeepingTaskModel>>((ref) async {
  final filter = ref.watch(housekeepingFilterStatusProvider);
  final searchQuery = ref.watch(housekeepingSearchQueryProvider).toLowerCase();
  
  final repo = ref.watch(housekeepingRepositoryProvider);
  final tasks = await repo.getTasks();

  return tasks.where((task) {
    bool matchesFilter = true;
    switch (filter) {
      case 'Pending':
        matchesFilter = task.status.toLowerCase() == 'pending';
        break;
      case 'In Progress':
        matchesFilter = task.status.toLowerCase() == 'in_progress';
        break;
      case 'Completed':
        matchesFilter = task.status.toLowerCase() == 'completed';
        break;
      case 'High Priority':
        matchesFilter = task.priority.toLowerCase() == 'high';
        break;
      case 'All':
      default:
        matchesFilter = true;
    }

    bool matchesSearch = true;
    if (searchQuery.isNotEmpty) {
      final roomStr = task.roomNumber?.toLowerCase() ?? task.roomId.toString().toLowerCase();
      matchesSearch = roomStr.contains(searchQuery);
    }

    return matchesFilter && matchesSearch;
  }).toList();
});
