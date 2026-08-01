class AppConstants {
  static const String appName = 'Sawingir Hills Staff';
  static const String appVersion = '1.0.0';

  // Secure Storage Keys
  static const String keyAccessToken = 'access_token';
  static const String keyRefreshToken = 'refresh_token';
  static const String keyUserData = 'user_data';

  // Departments
  static const List<String> departments = [
    'Front Office',
    'Restaurant POS',
    'Housekeeping',
    'Back Office',
    'Manager',
    'Admin',
  ];

  // Room Statuses
  static const String roomAvailable = 'available';
  static const String roomOccupied = 'occupied';
  static const String roomDirty = 'dirty';
  static const String roomMaintenance = 'maintenance';
  static const String roomOutOfOrder = 'out_of_order';

  // Booking Statuses
  static const String bookingConfirmed = 'confirmed';
  static const String bookingCheckedIn = 'checked_in';
  static const String bookingCheckedOut = 'checked_out';
  static const String bookingCancelled = 'cancelled';
  static const String bookingNoShow = 'no_show';

  // Housekeeping Task Statuses
  static const String hkPending = 'pending';
  static const String hkInProgress = 'in_progress';
  static const String hkCompleted = 'completed';
  static const String hkSkipped = 'skipped';
}
