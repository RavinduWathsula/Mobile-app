import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../providers/auth_provider.dart';
import '../../core/auth/app_permissions.dart';
import '../../core/theme/app_colors.dart';

class MainShellScreen extends ConsumerWidget {
  final StatefulNavigationShell navigationShell;

  const MainShellScreen({
    super.key,
    required this.navigationShell,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authProvider);
    final user = authState.user;

    // Define 5 primary bottom navigation tabs
    final tabs = [
      _NavTabItem(
        label: 'Home',
        icon: Icons.home_outlined,
        selectedIcon: Icons.home_rounded,
        route: '/dashboard',
        branchIndex: 0,
      ),
      _NavTabItem(
        label: 'Bookings',
        icon: Icons.calendar_today_outlined,
        selectedIcon: Icons.calendar_today_rounded,
        route: '/bookings',
        branchIndex: 1,
      ),
      _NavTabItem(
        label: 'Rooms',
        icon: Icons.meeting_room_outlined,
        selectedIcon: Icons.meeting_room_rounded,
        route: '/rooms',
        branchIndex: 2,
      ),
      _NavTabItem(
        label: 'Tasks',
        icon: Icons.cleaning_services_outlined,
        selectedIcon: Icons.cleaning_services_rounded,
        route: '/housekeeping',
        branchIndex: 3,
      ),
      _NavTabItem(
        label: 'More',
        icon: Icons.grid_view_outlined,
        selectedIcon: Icons.grid_view_rounded,
        route: '/more',
        branchIndex: 4,
      ),
    ];

    // Filter available tabs based on user permissions
    final visibleTabs = tabs.where((tab) {
      if (tab.route == '/more' || tab.route == '/dashboard') return true;
      return AppPermissions.canAccessRoute(user, tab.route);
    }).toList();

    // Find visible index corresponding to navigationShell.currentIndex
    int currentBranch = navigationShell.currentIndex;

    return LayoutBuilder(
      builder: (context, constraints) {
        final isWideScreen = constraints.maxWidth >= 720;

        if (isWideScreen) {
          // Responsive Tablet / Wide Screen Layout with Navigation Rail
          return Scaffold(
            body: Row(
              children: [
                NavigationRail(
                  selectedIndex: _getSelectedIndexForBranch(visibleTabs, currentBranch),
                  onDestinationSelected: (index) {
                    final selectedTab = visibleTabs[index];
                    navigationShell.goBranch(
                      selectedTab.branchIndex,
                      initialLocation: selectedTab.branchIndex == navigationShell.currentIndex,
                    );
                  },
                  labelType: NavigationRailLabelType.all,
                  leading: const Padding(
                    padding: EdgeInsets.symmetric(vertical: 16.0),
                    child: CircleAvatar(
                      backgroundColor: AppColors.primary,
                      child: Icon(Icons.hotel_rounded, color: Colors.white),
                    ),
                  ),
                  destinations: visibleTabs.map((tab) {
                    return NavigationRailDestination(
                      icon: Icon(tab.icon),
                      selectedIcon: Icon(tab.selectedIcon, color: AppColors.primary),
                      label: Text(tab.label),
                    );
                  }).toList(),
                ),
                const VerticalDivider(thickness: 1, width: 1),
                Expanded(child: navigationShell),
              ],
            ),
          );
        }

        // Mobile Phone Layout with Material 3 Bottom Navigation Bar
        return Scaffold(
          body: AnimatedSwitcher(
            duration: const Duration(milliseconds: 200),
            switchInCurve: Curves.easeIn,
            switchOutCurve: Curves.easeOut,
            child: navigationShell,
          ),
          bottomNavigationBar: Container(
            decoration: BoxDecoration(
              color: Colors.white,
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withAlpha(12),
                  blurRadius: 10,
                  offset: const Offset(0, -2),
                ),
              ],
            ),
            child: SafeArea(
              child: NavigationBarTheme(
                data: NavigationBarThemeData(
                  height: 64,
                  indicatorColor: AppColors.primary.withAlpha(30),
                  labelTextStyle: WidgetStateProperty.resolveWith((states) {
                    if (states.contains(WidgetState.selected)) {
                      return const TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                        color: AppColors.primary,
                      );
                    }
                    return const TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w500,
                      color: AppColors.textSecondary,
                    );
                  }),
                  iconTheme: WidgetStateProperty.resolveWith((states) {
                    if (states.contains(WidgetState.selected)) {
                      return const IconThemeData(
                        color: AppColors.primary,
                        size: 24,
                      );
                    }
                    return const IconThemeData(
                      color: AppColors.textSecondary,
                      size: 22,
                    );
                  }),
                ),
                child: NavigationBar(
                  selectedIndex: _getSelectedIndexForBranch(visibleTabs, currentBranch),
                  onDestinationSelected: (index) {
                    final selectedTab = visibleTabs[index];
                    navigationShell.goBranch(
                      selectedTab.branchIndex,
                      initialLocation: selectedTab.branchIndex == navigationShell.currentIndex,
                    );
                  },
                  labelBehavior: NavigationDestinationLabelBehavior.alwaysShow,
                  destinations: visibleTabs.map((tab) {
                    return NavigationDestination(
                      icon: Icon(tab.icon),
                      selectedIcon: Icon(tab.selectedIcon),
                      label: tab.label,
                    );
                  }).toList(),
                ),
              ),
            ),
          ),
        );
      },
    );
  }

  int _getSelectedIndexForBranch(List<_NavTabItem> visibleTabs, int currentBranch) {
    final idx = visibleTabs.indexWhere((t) => t.branchIndex == currentBranch);
    return idx >= 0 ? idx : 0;
  }
}

class _NavTabItem {
  final String label;
  final IconData icon;
  final IconData selectedIcon;
  final String route;
  final int branchIndex;

  _NavTabItem({
    required this.label,
    required this.icon,
    required this.selectedIcon,
    required this.route,
    required this.branchIndex,
  });
}
