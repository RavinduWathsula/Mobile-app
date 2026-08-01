import '../core/network/api_client.dart';
import '../core/constants/api_endpoints.dart';
import '../models/room_model.dart';

class RoomsRepository {
  final ApiClient _apiClient;

  RoomsRepository({required ApiClient apiClient}) : _apiClient = apiClient;

  Future<List<RoomModel>> getRooms({String? status, int? floor}) async {
    final Map<String, dynamic> query = {};
    if (status != null && status.isNotEmpty) query['status'] = status;
    if (floor != null) query['floor'] = floor;

    final response = await _apiClient.get(
      ApiEndpoints.rooms,
      queryParameters: query,
    );

    final list = (response['data'] as List?) ?? [];
    return list.map((json) => RoomModel.fromJson(json as Map<String, dynamic>)).toList();
  }

  Future<RoomModel> updateRoomStatus(int roomId, String status) async {
    final response = await _apiClient.patch(
      '${ApiEndpoints.rooms}/$roomId/status',
      data: {'status': status},
    );
    return RoomModel.fromJson(response as Map<String, dynamic>);
  }
}
