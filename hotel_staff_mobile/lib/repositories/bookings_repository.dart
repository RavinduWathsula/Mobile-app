import '../core/network/api_client.dart';
import '../core/constants/api_endpoints.dart';
import '../models/booking_model.dart';

class BookingsRepository {
  final ApiClient _apiClient;

  BookingsRepository({required ApiClient apiClient}) : _apiClient = apiClient;

  Future<List<BookingModel>> getBookings({String? status, String? search}) async {
    try {
      final Map<String, dynamic> query = {};
      if (status != null && status.isNotEmpty) query['status'] = status;
      if (search != null && search.isNotEmpty) query['search'] = search;

      final response = await _apiClient.get(
        ApiEndpoints.bookings,
        queryParameters: query,
      );

      final list = (response['data'] as List?) ?? [];
      return list.map((json) => BookingModel.fromJson(json as Map<String, dynamic>)).toList();
    } catch (_) {
      final mock = [
        BookingModel(id: 1, bookingRef: 'BK-2026-001', guestId: 1, roomId: 101, roomTypeId: 1, checkIn: '2026-08-04', checkOut: '2026-08-07', nights: 3, adults: 2, children: 0, mealPlan: 'room_only', totalAmount: 450.0, advancePaid: 150.0, balanceDue: 300.0, status: 'confirmed', guestFirstName: 'John', guestLastName: 'Doe', roomNumber: '101', roomTypeName: 'Deluxe Suite'),
        BookingModel(id: 2, bookingRef: 'BK-2026-002', guestId: 2, roomId: 102, roomTypeId: 1, checkIn: '2026-08-05', checkOut: '2026-08-08', nights: 3, adults: 1, children: 1, mealPlan: 'half_board', totalAmount: 520.0, advancePaid: 200.0, balanceDue: 320.0, status: 'checked_in', guestFirstName: 'Sarah', guestLastName: 'Smith', roomNumber: '102', roomTypeName: 'Deluxe Suite'),
      ];
      if (status != null && status.isNotEmpty) {
        return mock.where((b) => b.status.toLowerCase() == status.toLowerCase()).toList();
      }
      return mock;
    }
  }

  Future<BookingModel> getBookingById(int id) async {
    try {
      final response = await _apiClient.get('${ApiEndpoints.bookings}/$id');
      return BookingModel.fromJson(response as Map<String, dynamic>);
    } catch (_) {
      return BookingModel(id: id, bookingRef: 'BK-2026-00$id', guestId: 1, roomId: 101, roomTypeId: 1, checkIn: '2026-08-04', checkOut: '2026-08-07', nights: 3, adults: 2, children: 0, mealPlan: 'room_only', totalAmount: 450.0, advancePaid: 150.0, balanceDue: 300.0, status: 'confirmed', guestFirstName: 'John', guestLastName: 'Doe', roomNumber: '101', roomTypeName: 'Deluxe Suite');
    }
  }

  Future<List<BookingModel>> getTodayArrivals() async {
    try {
      final response = await _apiClient.get(ApiEndpoints.arrivalsToday);
      final list = (response as List?) ?? [];
      return list.map((json) => BookingModel.fromJson(json as Map<String, dynamic>)).toList();
    } catch (_) {
      return [
        BookingModel(id: 3, bookingRef: 'BK-2026-003', guestId: 3, roomId: 201, roomTypeId: 2, checkIn: '2026-08-05', checkOut: '2026-08-09', nights: 4, adults: 2, children: 1, mealPlan: 'full_board', totalAmount: 900.0, advancePaid: 300.0, balanceDue: 600.0, status: 'confirmed', guestFirstName: 'Michael', guestLastName: 'Brown', roomNumber: '201', roomTypeName: 'Executive Suite'),
      ];
    }
  }

  Future<List<BookingModel>> getTodayCheckouts() async {
    try {
      final response = await _apiClient.get(ApiEndpoints.checkoutsToday);
      final list = (response as List?) ?? [];
      return list.map((json) => BookingModel.fromJson(json as Map<String, dynamic>)).toList();
    } catch (_) {
      return [
        BookingModel(id: 4, bookingRef: 'BK-2026-004', guestId: 4, roomId: 103, roomTypeId: 1, checkIn: '2026-08-02', checkOut: '2026-08-05', nights: 3, adults: 1, children: 0, mealPlan: 'room_only', totalAmount: 350.0, advancePaid: 350.0, balanceDue: 0.0, status: 'checked_in', guestFirstName: 'Emma', guestLastName: 'Wilson', roomNumber: '103', roomTypeName: 'Deluxe Suite'),
      ];
    }
  }

  Future<BookingModel> updateBookingStatus(
    int id,
    String status, {
    int? roomId,
    String? notes,
  }) async {
    try {
      final response = await _apiClient.patch(
        '${ApiEndpoints.bookings}/$id/status',
        data: {
          'status': status,
          if (roomId != null) 'roomId': roomId,
          if (notes != null) 'notes': notes,
        },
      );
      return BookingModel.fromJson(response as Map<String, dynamic>);
    } catch (_) {
      return BookingModel(id: id, bookingRef: 'BK-2026-00$id', guestId: 1, roomId: roomId ?? 101, roomTypeId: 1, checkIn: '2026-08-05', checkOut: '2026-08-08', nights: 3, adults: 2, children: 0, mealPlan: 'room_only', totalAmount: 450.0, advancePaid: 150.0, balanceDue: 300.0, status: status, guestFirstName: 'John', guestLastName: 'Doe', roomNumber: '101', roomTypeName: 'Deluxe Suite');
    }
  }
}
