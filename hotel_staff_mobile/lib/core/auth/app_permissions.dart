import '../../models/user_model.dart';

class AppPermissions {
  // Roles defined in Sawingir Hills HMS
  static const String admin = 'Administrator';
  static const String manager = 'Manager';
  static const String frontOffice = 'Front Office';
  static const String housekeeping = 'Housekeeping';
  static const String restaurantStaff = 'Restaurant Staff';

  /// Permission matrix mapping routes to allowed roles.
  /// If a route is not in this map, all authenticated users can access it.
  static final Map<String, List<String>> _routeAccessMap = {
    '/dashboard': [admin, manager, frontOffice, housekeeping, restaurantStaff],
    '/bookings': [admin, manager, frontOffice],
    '/rooms': [admin, manager, frontOffice, housekeeping],
    '/housekeeping': [admin, manager, housekeeping],
    '/arrivals': [admin, manager, frontOffice],
    '/checkouts': [admin, manager, frontOffice],
    '/restaurant': [admin, manager, restaurantStaff],
    '/kitchen': [admin, manager, restaurantStaff],
    '/reports': [admin, manager],
    '/profile': [admin, manager, frontOffice, housekeeping, restaurantStaff],
    '/settings': [admin, manager, frontOffice, housekeeping, restaurantStaff],
    '/more': [admin, manager, frontOffice, housekeeping, restaurantStaff],
  };

  /// Check if a user has permission to access a specific route path
  static bool canAccessRoute(UserModel? user, String route) {
    if (user == null) return false;
    final normalizedRole = user.role.trim();

    // Administrator always has access to all features
    if (normalizedRole.toLowerCase() == 'administrator' || normalizedRole.toLowerCase() == 'admin') {
      return true;
    }

    final allowedRoles = _routeAccessMap[route];
    if (allowedRoles == null) return true;

    return allowedRoles.any(
      (role) => role.toLowerCase() == normalizedRole.toLowerCase(),
    );
  }

  /// Helper to check if a user is an admin or manager
  static bool isManagement(UserModel? user) {
    if (user == null) return false;
    final r = user.role.toLowerCase();
    return r == 'administrator' || r == 'admin' || r == 'manager';
  }
}
