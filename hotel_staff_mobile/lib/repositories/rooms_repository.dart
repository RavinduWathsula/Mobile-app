import '../core/network/api_client.dart';
import '../core/constants/api_endpoints.dart';
import '../models/room_model.dart';

class RoomsRepository {
  final ApiClient _apiClient;

  static final List<RoomModel> _mockRooms = [
    RoomModel(id: 1, roomNumber: '101', roomTypeId: 1, floor: 1, status: 'available', features: ['WiFi', 'AC', 'TV'], roomTypeName: 'Deluxe Suite', basePrice: 15000.0, maxOccupancy: 2),
    RoomModel(id: 2, roomNumber: '102', roomTypeId: 1, floor: 1, status: 'occupied', features: ['WiFi', 'AC', 'TV'], roomTypeName: 'Deluxe Suite', basePrice: 15000.0, maxOccupancy: 2, currentGuestName: 'Sarah Smith', currentBookingRef: 'BK-2026-002'),
    RoomModel(id: 3, roomNumber: '201', roomTypeId: 2, floor: 2, status: 'dirty', features: ['WiFi', 'AC', 'TV', 'Mini Bar'], roomTypeName: 'Executive Suite', basePrice: 25000.0, maxOccupancy: 3, assignedHousekeeper: 'Jane Doe', housekeepingTaskStatus: 'pending'),
    RoomModel(id: 4, roomNumber: '103', roomTypeId: 1, floor: 1, status: 'maintenance', features: ['WiFi', 'AC'], roomTypeName: 'Deluxe Suite', basePrice: 15000.0, maxOccupancy: 2, notes: 'AC not working'),
    RoomModel(id: 5, roomNumber: '301', roomTypeId: 3, floor: 3, status: 'available', features: ['WiFi'], roomTypeName: 'Standard Room', basePrice: 10000.0, maxOccupancy: 2),
    RoomModel(id: 6, roomNumber: '302', roomTypeId: 3, floor: 3, status: 'available', features: ['WiFi', 'TV'], roomTypeName: 'Standard Room', basePrice: 10000.0, maxOccupancy: 2),
    RoomModel(id: 7, roomNumber: '202', roomTypeId: 2, floor: 2, status: 'available', features: ['WiFi', 'AC', 'TV', 'Mini Bar'], roomTypeName: 'Executive Suite', basePrice: 25000.0, maxOccupancy: 3),
    RoomModel(id: 8, roomNumber: '104', roomTypeId: 1, floor: 1, status: 'available', features: ['WiFi', 'AC', 'TV'], roomTypeName: 'Deluxe Suite', basePrice: 15000.0, maxOccupancy: 2),
    RoomModel(id: 9, roomNumber: '303', roomTypeId: 3, floor: 3, status: 'available', features: ['WiFi'], roomTypeName: 'Standard Room', basePrice: 10000.0, maxOccupancy: 2),
    RoomModel(id: 10, roomNumber: '203', roomTypeId: 2, floor: 2, status: 'available', features: ['WiFi', 'AC', 'TV'], roomTypeName: 'Executive Suite', basePrice: 25000.0, maxOccupancy: 3),
  ];
  static RoomModel? assignAvailableRoom(int roomTypeId, String guestName, String bookingRef, double totalAmount) {
    int index = _mockRooms.indexWhere((r) => r.roomTypeId == roomTypeId && r.status == 'available');
    if (index == -1) {
      index = _mockRooms.indexWhere((r) => r.status == 'available');
    }
    
    if (index != -1) {
      _mockRooms[index] = _mockRooms[index].copyWith(
        status: 'occupied',
        currentGuestName: guestName,
        currentBookingRef: bookingRef,
        currentBookingTotalAmount: totalAmount,
      );
      return _mockRooms[index];
    }
    return null;
  }

  RoomsRepository({required ApiClient apiClient}) : _apiClient = apiClient;

  Future<List<Map<String, dynamic>>> getRoomTypes() async {
    try {
      final response = await _apiClient.get('${ApiEndpoints.rooms}/types');
      final list = (response['data'] as List?) ?? [];
      return list.map((e) => e as Map<String, dynamic>).toList();
    } catch (_) {
      return [
        {'id': 1, 'name': 'Deluxe Suite', 'basePrice': 15000.0, 'availableRooms': 5},
        {'id': 2, 'name': 'Executive Suite', 'basePrice': 25000.0, 'availableRooms': 2},
        {'id': 3, 'name': 'Standard Room', 'basePrice': 10000.0, 'availableRooms': 10},
      ];
    }
  }

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
      } else if (response is Map && response.containsKey('data') && response['data'] is List) {
        rawList = response['data'] as List;
      } else if (response is List) {
        rawList = response;
      }

      return rawList.map((json) => RoomModel.fromJson(json as Map<String, dynamic>)).toList();
    } catch (_) {
      var filteredMock = List<RoomModel>.from(_mockRooms);
      if (status != null && status.isNotEmpty) {
        filteredMock = filteredMock.where((r) => r.status.toLowerCase() == status.toLowerCase()).toList();
      }
      if (floor != null) {
        filteredMock = filteredMock.where((r) => r.floor == floor).toList();
      }
      return filteredMock;
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
      final index = _mockRooms.indexWhere((r) => r.id == roomId);
      if (index != -1) {
        _mockRooms[index] = _mockRooms[index].copyWith(status: status);
        return _mockRooms[index];
      }
      return _mockRooms.first;
    }
  }
}
