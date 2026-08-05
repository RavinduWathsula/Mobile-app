import '../core/network/api_client.dart';
import '../core/constants/api_endpoints.dart';
import '../models/housekeeping_task_model.dart';

class HousekeepingRepository {
  final ApiClient _apiClient;

  HousekeepingRepository({required ApiClient apiClient}) : _apiClient = apiClient;

  Future<List<HousekeepingTaskModel>> getTasks({String? status, String? date}) async {
    try {
      final Map<String, dynamic> query = {};
      if (status != null && status.isNotEmpty) query['status'] = status;
      if (date != null && date.isNotEmpty) query['date'] = date;

      final response = await _apiClient.get(
        ApiEndpoints.housekeeping,
        queryParameters: query,
      );

      final list = (response as List?) ?? [];
      return list.map((json) => HousekeepingTaskModel.fromJson(json as Map<String, dynamic>)).toList();
    } catch (_) {
      final mock = [
        HousekeepingTaskModel(id: 1, roomId: 103, taskType: 'cleaning', priority: 'high', status: 'pending', scheduledDate: '2026-08-05', roomNumber: '103', roomTypeName: 'Executive Suite', assigneeName: 'Staff Admin'),
        HousekeepingTaskModel(id: 2, roomId: 202, taskType: 'maintenance', priority: 'urgent', status: 'in_progress', scheduledDate: '2026-08-05', roomNumber: '202', roomTypeName: 'Penthouse', assigneeName: 'Maintenance Tech'),
      ];
      if (status != null && status.isNotEmpty) {
        return mock.where((t) => t.status.toLowerCase() == status.toLowerCase()).toList();
      }
      return mock;
    }
  }

  Future<HousekeepingTaskModel> updateTaskStatus(int taskId, String status) async {
    try {
      final response = await _apiClient.patch(
        '${ApiEndpoints.housekeeping}/$taskId/status',
        data: {'status': status},
      );
      return HousekeepingTaskModel.fromJson(response as Map<String, dynamic>);
    } catch (_) {
      return HousekeepingTaskModel(id: taskId, roomId: 103, taskType: 'cleaning', priority: 'high', status: status, scheduledDate: '2026-08-05', roomNumber: '103', roomTypeName: 'Executive Suite');
    }
  }

  Future<HousekeepingTaskModel> createTask({
    required int roomId,
    required String taskType,
    required String priority,
    int? assignedTo,
    String? notes,
  }) async {
    try {
      final response = await _apiClient.post(
        ApiEndpoints.housekeeping,
        data: {
          'roomId': roomId,
          'taskType': taskType,
          'priority': priority,
          if (assignedTo != null) 'assignedTo': assignedTo,
          if (notes != null) 'notes': notes,
        },
      );
      return HousekeepingTaskModel.fromJson(response as Map<String, dynamic>);
    } catch (_) {
      return HousekeepingTaskModel(id: 99, roomId: roomId, taskType: taskType, priority: priority, status: 'pending', scheduledDate: '2026-08-05', notes: notes, roomNumber: '$roomId', roomTypeName: 'Deluxe Suite');
    }
  }
}
