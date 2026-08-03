import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../providers/auth_provider.dart';
import '../core/auth/app_permissions.dart';
import '../widgets/navigation/main_shell_screen.dart';
import '../screens/splash/splash_screen.dart';
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
import '../screens/more/more_screen.dart';
import '../screens/settings/settings_screen.dart';

final _rootNavigatorKey = GlobalKey<NavigatorState>();

final routerProvider = Provider<GoRouter>((ref) {
  final authState = ref.watch(authProvider);

  return GoRouter(
    navigatorKey: _rootNavigatorKey,
    initialLocation: '/splash',
    redirect: (BuildContext context, GoRouterState state) {
      final loc = state.matchedLocation;
      final isSplash = loc == '/splash';
      final isLogin = loc == '/login';

      if (authState.isCheckingInitialAuth) {
        return isSplash ? null : '/splash';
      }

      if (!authState.isAuthenticated) {
        return isLogin ? null : '/login';
      }

      if (authState.isAuthenticated && (isLogin || isSplash)) {
        return '/dashboard';
      }

      // Check role permission for requested path
      if (authState.isAuthenticated) {
        if (!AppPermissions.canAccessRoute(authState.user, loc)) {
          return '/dashboard';
        }
      }

      return null;
    },
    routes: [
      GoRoute(
        path: '/splash',
        builder: (context, state) => const SplashScreen(),
      ),
      GoRoute(
        path: '/login',
        builder: (context, state) => const LoginScreen(),
      ),

      // Stateful Shell Route for Bottom Navigation Bar
      StatefulShellRoute.indexedStack(
        builder: (context, state, navigationShell) {
          return MainShellScreen(navigationShell: navigationShell);
        },
        branches: [
          // Branch 0: Home / Dashboard
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/dashboard',
                builder: (context, state) => const DashboardScreen(),
              ),
            ],
          ),

          // Branch 1: Bookings
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/bookings',
                builder: (context, state) => const BookingsListScreen(),
              ),
            ],
          ),

          // Branch 2: Rooms Board
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/rooms',
                builder: (context, state) => const RoomsListScreen(),
              ),
            ],
          ),

          // Branch 3: Tasks / Housekeeping
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/housekeeping',
                builder: (context, state) => const HousekeepingScreen(),
              ),
            ],
          ),

          // Branch 4: More & Secondary Modules
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/more',
                builder: (context, state) => const MoreScreen(),
                routes: [
                  GoRoute(
                    path: 'arrivals',
                    builder: (context, state) => const ArrivalsScreen(),
                  ),
                  GoRoute(
                    path: 'checkouts',
                    builder: (context, state) => const CheckoutsScreen(),
                  ),
                  GoRoute(
                    path: 'restaurant',
                    builder: (context, state) => const POSScreen(),
                  ),
                  GoRoute(
                    path: 'kitchen',
                    builder: (context, state) => const KitchenKDSScreen(),
                  ),
                  GoRoute(
                    path: 'reports',
                    builder: (context, state) => const ReportsScreen(),
                  ),
                  GoRoute(
                    path: 'profile',
                    builder: (context, state) => const ProfileScreen(),
                  ),
                  GoRoute(
                    path: 'settings',
                    builder: (context, state) => const SettingsScreen(),
                  ),
                ],
              ),
              // Top-level aliases for direct navigation links
              GoRoute(
                path: '/arrivals',
                builder: (context, state) => const ArrivalsScreen(),
              ),
              GoRoute(
                path: '/checkouts',
                builder: (context, state) => const CheckoutsScreen(),
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
              GoRoute(
                path: '/settings',
                builder: (context, state) => const SettingsScreen(),
              ),
            ],
          ),
        ],
      ),
    ],
  );
});
