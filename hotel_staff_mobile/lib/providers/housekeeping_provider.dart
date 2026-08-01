import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/housekeeping_task_model.dart';
import 'services_provider.dart';

final housekeepingFilterStatusProvider = StateProvider<String?>((ref) => null);

final housekeepingTasksProvider = FutureProvider.autoDispose<List<HousekeepingTaskModel>>((ref) async {
  final status = ref.watch(housekeepingFilterStatusProvider);
  final repo = ref.watch(housekeepingRepositoryProvider);
  return await repo.getTasks(status: status);
});
