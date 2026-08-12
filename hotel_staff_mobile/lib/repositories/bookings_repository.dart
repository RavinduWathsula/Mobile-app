import '../core/network/api_client.dart';
import '../core/constants/api_endpoints.dart';
import '../models/booking_model.dart';
import '../models/booking_request_models.dart';

class BookingsRepository {
  final ApiClient _apiClient;

  static final List<BookingModel> _mockBookings = [
    BookingModel(id: 1, bookingRef: 'BK-2026-001', guestId: 1, roomId: 101, roomTypeId: 1, checkIn: '2026-08-04', checkOut: '2026-08-07', nights: 3, adults: 2, children: 0, mealPlan: 'room_only', totalAmount: 450.0, advancePaid: 150.0, balanceDue: 300.0, status: 'confirmed', source: 'direct', guestFirstName: 'John', guestLastName: 'Doe', roomNumber: '101', roomTypeName: 'Deluxe Suite'),
    BookingModel(id: 2, bookingRef: 'BK-2026-002', guestId: 2, roomId: 102, roomTypeId: 1, checkIn: '2026-08-05', checkOut: '2026-08-08', nights: 3, adults: 1, children: 1, mealPlan: 'half_board', totalAmount: 520.0, advancePaid: 200.0, balanceDue: 320.0, status: 'checked_in', source: 'direct', guestFirstName: 'Sarah', guestLastName: 'Smith', roomNumber: '102', roomTypeName: 'Deluxe Suite'),
    BookingModel(id: 3, bookingRef: 'BK-2026-003', guestId: 3, roomId: 201, roomTypeId: 2, checkIn: DateTime.now().toIso8601String().split('T')[0], checkOut: DateTime.now().add(const Duration(days: 4)).toIso8601String().split('T')[0], nights: 4, adults: 2, children: 1, mealPlan: 'full_board', totalAmount: 900.0, advancePaid: 300.0, balanceDue: 600.0, status: 'confirmed', source: 'direct', guestFirstName: 'Michael', guestLastName: 'Brown', roomNumber: '201', roomTypeName: 'Executive Suite'),
    BookingModel(id: 4, bookingRef: 'BK-2026-004', guestId: 4, roomId: 103, roomTypeId: 1, checkIn: DateTime.now().subtract(const Duration(days: 3)).toIso8601String().split('T')[0], checkOut: DateTime.now().toIso8601String().split('T')[0], nights: 3, adults: 1, children: 0, mealPlan: 'room_only', totalAmount: 350.0, advancePaid: 350.0, balanceDue: 0.0, status: 'checked_in', source: 'direct', guestFirstName: 'Emma', guestLastName: 'Wilson', roomNumber: '103', roomTypeName: 'Deluxe Suite'),
  ];

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
      var filteredMock = List<BookingModel>.from(_mockBookings);
      if (status != null && status.isNotEmpty) {
        filteredMock = filteredMock.where((b) => b.status.toLowerCase() == status.toLowerCase()).toList();
      }
      if (search != null && search.isNotEmpty) {
        final query = search.toLowerCase();
        filteredMock = filteredMock.where((b) => 
            b.bookingRef.toLowerCase().contains(query) || 
            (b.guestFirstName?.toLowerCase().contains(query) ?? false) || 
            (b.guestLastName?.toLowerCase().contains(query) ?? false)
        ).toList();
      }
      return filteredMock;
    }
  }

  Future<BookingModel> getBookingById(int id) async {
    try {
      final response = await _apiClient.get('${ApiEndpoints.bookings}/$id');
      return BookingModel.fromJson(response as Map<String, dynamic>);
    } catch (_) {
      return _mockBookings.firstWhere((b) => b.id == id, orElse: () => _mockBookings.first);
    }
  }

  Future<BookingModel> createBooking(CreateBookingRequest data) async {
    try {
      final response = await _apiClient.post(
        ApiEndpoints.bookings,
        data: data.toJson(),
      );
      return BookingModel.fromJson(response as Map<String, dynamic>);
    } catch (_) {
      final newBooking = BookingModel(
        id: _mockBookings.length + 1, 
        bookingRef: 'BK-2026-${_mockBookings.length + 1}', 
        guestId: 999, 
        roomId: data.roomId ?? 0, 
        roomTypeId: data.roomTypeId ?? 1, 
        checkIn: data.checkIn, 
        checkOut: data.checkOut, 
        nights: 1, 
        adults: data.adults, 
        children: data.children, 
        mealPlan: data.mealPlan, 
        totalAmount: 1000.0, 
        advancePaid: 0.0, 
        balanceDue: 1000.0, 
        status: 'confirmed', 
        source: 'walk_in', 
        guestFirstName: data.guest.firstName, 
        guestLastName: data.guest.lastName, 
        roomNumber: 'TBD', 
        roomTypeName: 'Unknown',
      );
      _mockBookings.add(newBooking);
      return newBooking;
    }
  }

  Future<BookingModel> updateBooking(int id, UpdateBookingRequest data) async {
    try {
      final response = await _apiClient.put(
        '${ApiEndpoints.bookings}/$id',
        data: data.toJson(),
      );
      return BookingModel.fromJson(response as Map<String, dynamic>);
    } catch (_) {
      final index = _mockBookings.indexWhere((b) => b.id == id);
      if (index != -1) {
        _mockBookings[index] = _mockBookings[index].copyWith(
          roomId: data.roomId,
          roomTypeId: data.roomTypeId,
          checkIn: data.checkIn,
          checkOut: data.checkOut,
          adults: data.adults,
          children: data.children,
          mealPlan: data.mealPlan,
          guestFirstName: data.guest.firstName,
          guestLastName: data.guest.lastName,
        );
        return _mockBookings[index];
      }
      return _mockBookings.first;
    }
  }

  Future<BookingModel> recordPayment(int id, PaymentRequest data) async {
    try {
      final response = await _apiClient.patch(
        '${ApiEndpoints.bookings}/$id/payment',
        data: data.toJson(),
      );
      return BookingModel.fromJson(response as Map<String, dynamic>);
    } catch (_) {
      final index = _mockBookings.indexWhere((b) => b.id == id);
      if (index != -1) {
        final existing = _mockBookings[index];
        _mockBookings[index] = existing.copyWith(
          advancePaid: existing.advancePaid + data.amount,
          balanceDue: (existing.balanceDue - data.amount).clamp(0.0, double.infinity),
        );
        return _mockBookings[index];
      }
      return _mockBookings.first;
    }
  }

  Future<List<BookingModel>> getTodayArrivals() async {
    try {
      final response = await _apiClient.get(ApiEndpoints.arrivalsToday);
      final list = (response as List?) ?? [];
      return list.map((json) => BookingModel.fromJson(json as Map<String, dynamic>)).toList();
    } catch (_) {
      final todayStr = DateTime.now().toIso8601String().split('T')[0];
      return _mockBookings.where((b) => b.checkIn == todayStr && b.status == 'confirmed').toList();
    }
  }

  Future<List<BookingModel>> getTodayCheckouts() async {
    try {
      final response = await _apiClient.get(ApiEndpoints.checkoutsToday);
      final list = (response as List?) ?? [];
      return list.map((json) => BookingModel.fromJson(json as Map<String, dynamic>)).toList();
    } catch (_) {
      final todayStr = DateTime.now().toIso8601String().split('T')[0];
      return _mockBookings.where((b) => b.checkOut == todayStr && b.status == 'checked_in').toList();
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
      final index = _mockBookings.indexWhere((b) => b.id == id);
      if (index != -1) {
        _mockBookings[index] = _mockBookings[index].copyWith(
          status: status,
          roomId: roomId ?? _mockBookings[index].roomId,
          notes: notes ?? _mockBookings[index].notes,
        );
        return _mockBookings[index];
      }
      return _mockBookings.first;
    }
  }
}
