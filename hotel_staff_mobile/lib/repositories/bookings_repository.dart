import '../core/network/api_client.dart';
import '../core/constants/api_endpoints.dart';
import '../models/booking_model.dart';

class BookingsRepository {
  final ApiClient _apiClient;

  BookingsRepository({required ApiClient apiClient}) : _apiClient = apiClient;

  Future<List<BookingModel>> getBookings({String? status, String? search}) async {
    final Map<String, dynamic> query = {};
    if (status != null && status.isNotEmpty) query['status'] = status;
    if (search != null && search.isNotEmpty) query['search'] = search;

    final response = await _apiClient.get(
      ApiEndpoints.bookings,
      queryParameters: query,
    );

    final list = (response['data'] as List?) ?? [];
    return list.map((json) => BookingModel.fromJson(json as Map<String, dynamic>)).toList();
  }

  Future<BookingModel> getBookingById(int id) async {
    final response = await _apiClient.get('${ApiEndpoints.bookings}/$id');
    return BookingModel.fromJson(response as Map<String, dynamic>);
  }

  Future<List<BookingModel>> getTodayArrivals() async {
    final response = await _apiClient.get(ApiEndpoints.arrivalsToday);
    final list = (response as List?) ?? [];
    return list.map((json) => BookingModel.fromJson(json as Map<String, dynamic>)).toList();
  }

  Future<List<BookingModel>> getTodayCheckouts() async {
    final response = await _apiClient.get(ApiEndpoints.checkoutsToday);
    final list = (response as List?) ?? [];
    return list.map((json) => BookingModel.fromJson(json as Map<String, dynamic>)).toList();
  }

  Future<BookingModel> updateBookingStatus(
    int id,
    String status, {
    int? roomId,
    String? notes,
  }) async {
    final response = await _apiClient.patch(
      '${ApiEndpoints.bookings}/$id/status',
      data: {
        'status': status,
        if (roomId != null) 'roomId': roomId,
        if (notes != null) 'notes': notes,
      },
    );
    return BookingModel.fromJson(response as Map<String, dynamic>);
  }
}
