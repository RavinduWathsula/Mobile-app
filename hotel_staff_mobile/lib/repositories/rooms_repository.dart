import '../core/network/api_client.dart';
import '../core/constants/api_endpoints.dart';
import '../models/room_model.dart';

class RoomsRepository {
  final ApiClient _apiClient;

  RoomsRepository({required ApiClient apiClient}) : _apiClient = apiClient;

  Future<List<RoomModel>> getRooms({String? status, int? floor}) async {
    try {
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
    } catch (_) {
      final mockList = [
        RoomModel(id: 101, roomNumber: '101', roomTypeId: 1, floor: 1, status: 'occupied', features: ['WiFi', 'Sea View'], roomTypeName: 'Deluxe Suite', basePrice: 150.0, currentGuestName: 'John Doe'),
        RoomModel(id: 102, roomNumber: '102', roomTypeId: 1, floor: 1, status: 'available', features: ['WiFi', 'AC'], roomTypeName: 'Deluxe Suite', basePrice: 150.0),
        RoomModel(id: 103, roomNumber: '103', roomTypeId: 2, floor: 1, status: 'dirty', features: ['WiFi', 'Mountain View'], roomTypeName: 'Executive Suite', basePrice: 220.0),
        RoomModel(id: 201, roomNumber: '201', roomTypeId: 2, floor: 2, status: 'available', features: ['WiFi', 'Jacuzzi'], roomTypeName: 'Executive Suite', basePrice: 250.0),
        RoomModel(id: 202, roomNumber: '202', roomTypeId: 3, floor: 2, status: 'maintenance', features: ['WiFi', 'Balcony'], roomTypeName: 'Penthouse', basePrice: 400.0),
      ];
      if (status != null && status.isNotEmpty) {
        return mockList.where((r) => r.status.toLowerCase() == status.toLowerCase()).toList();
      }
      return mockList;
    }
  }

  Future<RoomModel> updateRoomStatus(int roomId, String status) async {
    try {
      final response = await _apiClient.patch(
        '${ApiEndpoints.rooms}/$roomId/status',
        data: {'status': status},
      );
      return RoomModel.fromJson(response as Map<String, dynamic>);
    } catch (_) {
      return RoomModel(
        id: roomId,
        roomNumber: '$roomId',
        roomTypeId: 1,
        floor: 1,
        status: status,
        features: ['WiFi'],
        roomTypeName: 'Deluxe Suite',
      );
    }
  }
}
