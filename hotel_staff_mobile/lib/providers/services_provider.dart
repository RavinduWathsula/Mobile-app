import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../core/storage/secure_storage_service.dart';
import '../core/network/api_client.dart';
import '../repositories/auth_repository.dart';
import '../repositories/rooms_repository.dart';
import '../repositories/bookings_repository.dart';
import '../repositories/housekeeping_repository.dart';
import '../repositories/restaurant_repository.dart';
import '../repositories/reports_repository.dart';
import 'auth_provider.dart';

final secureStorageProvider = Provider<SecureStorageService>((ref) {
  return SecureStorageService();
});

final apiClientProvider = Provider<ApiClient>((ref) {
  final storage = ref.watch(secureStorageProvider);
  return ApiClient(
    storageService: storage,
    onSessionExpired: () {
      ref.read(authProvider.notifier).handleSessionExpired();
    },
  );
});

final authRepositoryProvider = Provider<AuthRepository>((ref) {
  return AuthRepository(
    apiClient: ref.watch(apiClientProvider),
    storageService: ref.watch(secureStorageProvider),
  );
});

final roomsRepositoryProvider = Provider<RoomsRepository>((ref) {
  return RoomsRepository(apiClient: ref.watch(apiClientProvider));
});

final bookingsRepositoryProvider = Provider<BookingsRepository>((ref) {
  return BookingsRepository(apiClient: ref.watch(apiClientProvider));
});

final housekeepingRepositoryProvider = Provider<HousekeepingRepository>((ref) {
  return HousekeepingRepository(apiClient: ref.watch(apiClientProvider));
});

final restaurantRepositoryProvider = Provider<RestaurantRepository>((ref) {
  return RestaurantRepository(apiClient: ref.watch(apiClientProvider));
});

final reportsRepositoryProvider = Provider<ReportsRepository>((ref) {
  return ReportsRepository(apiClient: ref.watch(apiClientProvider));
});
