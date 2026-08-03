import 'package:flutter/foundation.dart';

class ApiEndpoints {
  // Base URLs
  // 10.0.2.2 for Android Emulator, localhost for Windows Desktop / Web / iOS
  static String get defaultBaseUrl {
    if (!kIsWeb && defaultTargetPlatform == TargetPlatform.android) {
      return 'http://10.0.2.2:3010/api';
    }
    return 'http://localhost:3010/api';
  }
  
  // Auth
  static const String login = '/auth/login';
  static const String register = '/auth/register';
  static const String refresh = '/auth/refresh';
  static const String logout = '/auth/logout';
  static const String me = '/auth/me';

  // Rooms
  static const String rooms = '/rooms';
  static const String roomTypes = '/rooms/types';
  static const String ratePlans = '/rooms/rate-plans';

  // Bookings
  static const String bookings = '/bookings';
  static const String arrivalsToday = '/bookings/arrivals/today';
  static const String checkoutsToday = '/bookings/checkouts/today';

  // Housekeeping
  static const String housekeeping = '/housekeeping';
  static const String housekeepingRoomBoard = '/housekeeping/room-board';

  // Restaurant POS
  static const String restaurantTables = '/restaurant/tables';
  static const String restaurantCategories = '/restaurant/categories';
  static const String restaurantMenu = '/restaurant/menu';
  static const String restaurantOrders = '/restaurant/orders';
  static const String restaurantKitchen = '/restaurant/kitchen';
  static const String restaurantSettings = '/restaurant/settings';

  // Reports
  static const String dashboard = '/reports/dashboard';
  static const String occupancyReport = '/reports/occupancy';
  static const String revenueReport = '/reports/revenue';
  static const String bookingSourcesReport = '/reports/booking-sources';
  static const String guestsReport = '/reports/guests';

  // Admin
  static const String adminUsers = '/admin/users';
  static const String adminRoles = '/admin/roles';
  static const String auditLog = '/admin/audit-log';
}
