import '../core/network/api_client.dart';
import '../core/constants/api_endpoints.dart';
import '../models/room_model.dart';

class RoomsRepository {
  final ApiClient _apiClient;

  RoomsRepository({required ApiClient apiClient}) : _apiClient = apiClient;

  Future<List<Map<String, dynamic>>> getRoomTypes() async {
    final response = await _apiClient.get('${ApiEndpoints.rooms}/types');
    final list = (response['data'] as List?) ?? [];
    return list.map((e) => e as Map<String, dynamic>).toList();
  }

  Future<List<RoomModel>> getRooms({String? status, int? floor}) async {
    final Map<String, dynamic> query = {'limit': 100};
    if (status != null && status.isNotEmpty) query['status'] = status;
    if (floor != null) query['floor'] = floor;

    final response = await _apiClient.get(
      ApiEndpoints.rooms,
      queryParameters: query,
    );

    List rawList = [];
    if (response is Map<String, dynamic> && response['data'] is List) {
      rawList = response['data'] as List;
    } else if (response is List) {
      rawList = response;
    }

    return rawList.map((json) => RoomModel.fromJson(json as Map<String, dynamic>)).toList();
  }

  Future<RoomModel> updateRoomStatus(int roomId, String status) async {
    final response = await _apiClient.patch(
      '${ApiEndpoints.rooms}/$roomId/status',
      data: {'status': status},
    );
    return RoomModel.fromJson(response as Map<String, dynamic>);
  }
}
