import '../core/network/api_client.dart';
import '../core/constants/api_endpoints.dart';
import '../models/housekeeping_task_model.dart';

class HousekeepingRepository {
  final ApiClient _apiClient;

  static final List<HousekeepingTaskModel> _mockTasks = [
    HousekeepingTaskModel(id: 1, roomId: 103, taskType: 'cleaning', priority: 'high', status: 'pending', scheduledDate: '2026-08-12', roomNumber: '103', roomTypeName: 'Executive Suite', assigneeName: 'Staff Admin'),
    HousekeepingTaskModel(id: 2, roomId: 202, taskType: 'maintenance', priority: 'urgent', status: 'in_progress', scheduledDate: '2026-08-12', roomNumber: '202', roomTypeName: 'Penthouse', assigneeName: 'Maintenance Tech', notes: 'AC leaking water'),
    HousekeepingTaskModel(id: 3, roomId: 105, taskType: 'cleaning', priority: 'normal', status: 'pending', scheduledDate: '2026-08-12', roomNumber: '105', roomTypeName: 'Standard Room', assigneeName: 'Jane Doe'),
    HousekeepingTaskModel(id: 4, roomId: 301, taskType: 'inspection', priority: 'normal', status: 'completed', scheduledDate: '2026-08-12', roomNumber: '301', roomTypeName: 'Deluxe Suite', assigneeName: 'Manager'),
    HousekeepingTaskModel(id: 5, roomId: 204, taskType: 'cleaning', priority: 'high', status: 'pending', scheduledDate: '2026-08-12', roomNumber: '204', roomTypeName: 'Standard Room', notes: 'VIP guest arriving at 2 PM'),
  ];

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
      var filteredMock = List<HousekeepingTaskModel>.from(_mockTasks);
      if (status != null && status.isNotEmpty) {
        filteredMock = filteredMock.where((t) => t.status.toLowerCase() == status.toLowerCase()).toList();
      }
      return filteredMock;
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
      final index = _mockTasks.indexWhere((t) => t.id == taskId);
      if (index != -1) {
        final current = _mockTasks[index];
        _mockTasks[index] = HousekeepingTaskModel(
          id: current.id,
          roomId: current.roomId,
          taskType: current.taskType,
          priority: current.priority,
          status: status,
          scheduledDate: current.scheduledDate,
          roomNumber: current.roomNumber,
          roomTypeName: current.roomTypeName,
          assigneeName: current.assigneeName,
          notes: current.notes,
        );
        return _mockTasks[index];
      }
      return _mockTasks.first;
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
      final newTask = HousekeepingTaskModel(
        id: _mockTasks.length + 1,
        roomId: roomId,
        taskType: taskType,
        priority: priority,
        status: 'pending',
        scheduledDate: '2026-08-12',
        notes: notes,
        roomNumber: '$roomId',
        roomTypeName: 'Room',
      );
      _mockTasks.add(newTask);
      return newTask;
    }
  }
}
