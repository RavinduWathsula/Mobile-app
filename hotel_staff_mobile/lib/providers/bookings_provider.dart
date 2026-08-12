import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/booking_model.dart';
import '../models/booking_request_models.dart';
import 'services_provider.dart';

final bookingFilterStatusProvider = StateProvider<String?>((ref) => null);
final bookingSearchQueryProvider = StateProvider<String>((ref) => '');

final bookingsListProvider = FutureProvider.autoDispose<List<BookingModel>>((ref) async {
  final status = ref.watch(bookingFilterStatusProvider);
  final search = ref.watch(bookingSearchQueryProvider);
  final repo = ref.watch(bookingsRepositoryProvider);
  return await repo.getBookings(status: status, search: search);
});

final bookingDetailProvider = FutureProvider.family.autoDispose<BookingModel, int>((ref, id) async {
  final repo = ref.watch(bookingsRepositoryProvider);
  return await repo.getBookingById(id);
});

final todayArrivalsProvider = FutureProvider.autoDispose<List<BookingModel>>((ref) async {
  final repo = ref.watch(bookingsRepositoryProvider);
  return await repo.getTodayArrivals();
});

final upcomingArrivalsProvider = FutureProvider.autoDispose<List<BookingModel>>((ref) async {
  final repo = ref.watch(bookingsRepositoryProvider);
  final allBookings = await repo.getBookings(status: 'confirmed');
  
  // Filter for check-in dates strictly greater than today
  final now = DateTime.now();
  final today = DateTime(now.year, now.month, now.day);
  
  return allBookings.where((b) {
    if (b.checkIn.isEmpty) return false;
    try {
      final checkInDate = DateTime.parse(b.checkIn);
      final checkInDay = DateTime(checkInDate.year, checkInDate.month, checkInDate.day);
      return checkInDay.isAfter(today);
    } catch (_) {
      return false;
    }
  }).toList();
});

final todayCheckoutsProvider = FutureProvider.autoDispose<List<BookingModel>>((ref) async {
  final repo = ref.watch(bookingsRepositoryProvider);
  return await repo.getTodayCheckouts();
});

final roomTypesProvider = FutureProvider.autoDispose<List<Map<String, dynamic>>>((ref) async {
  final repo = ref.watch(roomsRepositoryProvider);
  return await repo.getRoomTypes();
});

class BookingFormState {
  final GuestRequest? guest;
  final String? checkIn;
  final String? checkOut;
  final int? roomTypeId;
  final int? roomId;
  final int adults;
  final int children;
  final String mealPlan;
  final double? advancePayment;
  final String? paymentMethod;

  BookingFormState({
    this.guest,
    this.checkIn,
    this.checkOut,
    this.roomTypeId,
    this.roomId,
    this.adults = 1,
    this.children = 0,
    this.mealPlan = 'room_only',
    this.advancePayment,
    this.paymentMethod,
  });

  BookingFormState copyWith({
    GuestRequest? guest,
    String? checkIn,
    String? checkOut,
    int? roomTypeId,
    int? roomId,
    int? adults,
    int? children,
    String? mealPlan,
    double? advancePayment,
    String? paymentMethod,
  }) {
    return BookingFormState(
      guest: guest ?? this.guest,
      checkIn: checkIn ?? this.checkIn,
      checkOut: checkOut ?? this.checkOut,
      roomTypeId: roomTypeId ?? this.roomTypeId,
      roomId: roomId ?? this.roomId,
      adults: adults ?? this.adults,
      children: children ?? this.children,
      mealPlan: mealPlan ?? this.mealPlan,
      advancePayment: advancePayment ?? this.advancePayment,
      paymentMethod: paymentMethod ?? this.paymentMethod,
    );
  }
}

class BookingFormNotifier extends StateNotifier<BookingFormState> {
  BookingFormNotifier() : super(BookingFormState());

  void updateGuest(GuestRequest guest) => state = state.copyWith(guest: guest);
  void updateDates(String checkIn, String checkOut) => state = state.copyWith(checkIn: checkIn, checkOut: checkOut);
  void updateRoomType(int roomTypeId, {int? roomId}) => state = state.copyWith(roomTypeId: roomTypeId, roomId: roomId);
  void updateMealPlan(String mealPlan) => state = state.copyWith(mealPlan: mealPlan);
  void updateGuestsCount(int adults, int children) => state = state.copyWith(adults: adults, children: children);
  void updatePayment(double advance, String method) => state = state.copyWith(advancePayment: advance, paymentMethod: method);

  CreateBookingRequest toRequest() {
    return CreateBookingRequest(
      guest: state.guest!,
      checkIn: state.checkIn!,
      checkOut: state.checkOut!,
      roomTypeId: state.roomTypeId!,
      roomId: state.roomId,
      adults: state.adults,
      children: state.children,
      mealPlan: state.mealPlan,
    );
  }

  void reset() => state = BookingFormState();
}

final bookingFormProvider = StateNotifierProvider.autoDispose<BookingFormNotifier, BookingFormState>((ref) {
  return BookingFormNotifier();
});
