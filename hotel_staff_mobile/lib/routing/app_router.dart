import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../providers/auth_provider.dart';
import '../screens/auth/login_screen.dart';
import '../screens/dashboard/dashboard_screen.dart';
import '../screens/bookings/bookings_list_screen.dart';
import '../screens/arrivals/arrivals_screen.dart';
import '../screens/checkouts/checkouts_screen.dart';
import '../screens/rooms/rooms_list_screen.dart';
import '../screens/housekeeping/housekeeping_screen.dart';
import '../screens/restaurant/pos_screen.dart';
import '../screens/kitchen/kitchen_kds_screen.dart';
import '../screens/reports/reports_screen.dart';
import '../screens/profile/profile_screen.dart';

final routerProvider = Provider<GoRouter>((ref) {
  final authState = ref.watch(authProvider);

  return GoRouter(
    initialLocation: '/login',
    redirect: (BuildContext context, GoRouterState state) {
      final isLoggingIn = state.matchedLocation == '/login';

      if (!authState.isAuthenticated && !isLoggingIn) {
        return '/login';
      }

      if (authState.isAuthenticated && isLoggingIn) {
        return '/dashboard';
      }

      return null;
    },
    routes: [
      GoRoute(
        path: '/login',
        builder: (context, state) => const LoginScreen(),
      ),
      GoRoute(
        path: '/dashboard',
        builder: (context, state) => const DashboardScreen(),
      ),
      GoRoute(
        path: '/bookings',
        builder: (context, state) => const BookingsListScreen(),
      ),
      GoRoute(
        path: '/arrivals',
        builder: (context, state) => const ArrivalsScreen(),
      ),
      GoRoute(
        path: '/checkouts',
        builder: (context, state) => const CheckoutsScreen(),
      ),
      GoRoute(
        path: '/rooms',
        builder: (context, state) => const RoomsListScreen(),
      ),
      GoRoute(
        path: '/housekeeping',
        builder: (context, state) => const HousekeepingScreen(),
      ),
      GoRoute(
        path: '/restaurant',
        builder: (context, state) => const POSScreen(),
      ),
      GoRoute(
        path: '/kitchen',
        builder: (context, state) => const KitchenKDSScreen(),
      ),
      GoRoute(
        path: '/reports',
        builder: (context, state) => const ReportsScreen(),
      ),
      GoRoute(
        path: '/profile',
        builder: (context, state) => const ProfileScreen(),
      ),
    ],
  );
});
