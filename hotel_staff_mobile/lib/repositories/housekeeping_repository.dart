import '../core/network/api_client.dart';
import '../core/constants/api_endpoints.dart';
import '../models/housekeeping_task_model.dart';

class HousekeepingRepository {
  final ApiClient _apiClient;

  HousekeepingRepository({required ApiClient apiClient}) : _apiClient = apiClient;

  Future<List<HousekeepingTaskModel>> getTasks({String? status, String? date}) async {
    final Map<String, dynamic> query = {};
    if (status != null && status.isNotEmpty) query['status'] = status;
    if (date != null && date.isNotEmpty) query['date'] = date;

    final response = await _apiClient.get(
      ApiEndpoints.housekeeping,
      queryParameters: query,
    );

    final list = (response as List?) ?? [];
    return list.map((json) => HousekeepingTaskModel.fromJson(json as Map<String, dynamic>)).toList();
  }

  Future<HousekeepingTaskModel> updateTaskStatus(int taskId, String status) async {
    final response = await _apiClient.patch(
      '${ApiEndpoints.housekeeping}/$taskId/status',
      data: {'status': status},
    );
    return HousekeepingTaskModel.fromJson(response as Map<String, dynamic>);
  }

  Future<HousekeepingTaskModel> createTask({
    required int roomId,
    required String taskType,
    required String priority,
    int? assignedTo,
    String? notes,
  }) async {
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
  }
}
