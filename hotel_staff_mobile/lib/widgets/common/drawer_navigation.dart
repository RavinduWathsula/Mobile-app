import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../providers/auth_provider.dart';
import '../../core/auth/app_permissions.dart';
import '../../core/theme/app_colors.dart';

class DrawerNavigation extends ConsumerWidget {
  const DrawerNavigation({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authProvider);
    final user = authState.user;

    return Drawer(
      child: ListView(
        padding: EdgeInsets.zero,
        children: [
          UserAccountsDrawerHeader(
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                colors: [Color(0xFF4C1D95), Color(0xFF6B21A8)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
            ),
            accountName: Text(
              user?.fullName ?? 'Staff Member',
              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
            ),
            accountEmail: Text('${user?.department ?? "Front Office"} • ${user?.role ?? "Staff"}'),
            currentAccountPicture: CircleAvatar(
              backgroundColor: Colors.white,
              child: Text(
                (user?.fullName.isNotEmpty == true) ? user!.fullName[0].toUpperCase() : 'S',
                style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: AppColors.primary),
              ),
            ),
          ),

          // Home / Dashboard
          ListTile(
            leading: const Icon(Icons.dashboard_outlined),
            title: const Text('Dashboard'),
            onTap: () {
              Navigator.pop(context);
              context.go('/dashboard');
            },
          ),

          // Bookings
          if (AppPermissions.canAccessRoute(user, '/bookings'))
            ListTile(
              leading: const Icon(Icons.bookmark_border),
              title: const Text('Bookings'),
              onTap: () {
                Navigator.pop(context);
                context.go('/bookings');
              },
            ),

          // Arrivals
          if (AppPermissions.canAccessRoute(user, '/arrivals'))
            ListTile(
              leading: const Icon(Icons.login),
              title: const Text('Today Arrivals'),
              onTap: () {
                Navigator.pop(context);
                context.go('/arrivals');
              },
            ),

          // Checkouts
          if (AppPermissions.canAccessRoute(user, '/checkouts'))
            ListTile(
              leading: const Icon(Icons.logout),
              title: const Text('Today Checkouts'),
              onTap: () {
                Navigator.pop(context);
                context.go('/checkouts');
              },
            ),

          // Rooms
          if (AppPermissions.canAccessRoute(user, '/rooms'))
            ListTile(
              leading: const Icon(Icons.meeting_room_outlined),
              title: const Text('Rooms Board'),
              onTap: () {
                Navigator.pop(context);
                context.go('/rooms');
              },
            ),

          // Housekeeping / Tasks
          if (AppPermissions.canAccessRoute(user, '/housekeeping'))
            ListTile(
              leading: const Icon(Icons.cleaning_services_outlined),
              title: const Text('Housekeeping Tasks'),
              onTap: () {
                Navigator.pop(context);
                context.go('/housekeeping');
              },
            ),

          const Divider(),

          // Restaurant POS
          if (AppPermissions.canAccessRoute(user, '/restaurant'))
            ListTile(
              leading: const Icon(Icons.point_of_sale),
              title: const Text('Restaurant POS'),
              onTap: () {
                Navigator.pop(context);
                context.go('/restaurant');
              },
            ),

          // Kitchen KDS
          if (AppPermissions.canAccessRoute(user, '/kitchen'))
            ListTile(
              leading: const Icon(Icons.kitchen_outlined),
              title: const Text('Kitchen KDS'),
              onTap: () {
                Navigator.pop(context);
                context.go('/kitchen');
              },
            ),

          // Reports & Analytics
          if (AppPermissions.canAccessRoute(user, '/reports'))
            ListTile(
              leading: const Icon(Icons.bar_chart_outlined),
              title: const Text('Reports & Analytics'),
              onTap: () {
                Navigator.pop(context);
                context.go('/reports');
              },
            ),

          const Divider(),

          // Profile
          ListTile(
            leading: const Icon(Icons.person_outline),
            title: const Text('My Profile'),
            onTap: () {
              Navigator.pop(context);
              context.go('/profile');
            },
          ),

          // Settings
          ListTile(
            leading: const Icon(Icons.tune_outlined),
            title: const Text('App Settings'),
            onTap: () {
              Navigator.pop(context);
              context.go('/settings');
            },
          ),

          // Logout
          ListTile(
            leading: const Icon(Icons.exit_to_app, color: Colors.red),
            title: const Text('Logout', style: TextStyle(color: Colors.red)),
            onTap: () async {
              final confirm = await showDialog<bool>(
                context: context,
                builder: (context) => AlertDialog(
                  title: const Text('Confirm Logout'),
                  content: const Text('Are you sure you want to log out of the staff portal?'),
                  actions: [
                    TextButton(
                      onPressed: () => Navigator.pop(context, false),
                      child: const Text('Cancel'),
                    ),
                    ElevatedButton(
                      style: ElevatedButton.styleFrom(backgroundColor: AppColors.danger),
                      onPressed: () => Navigator.pop(context, true),
                      child: const Text('Logout', style: TextStyle(color: Colors.white)),
                    ),
                  ],
                ),
              );

              if (confirm == true) {
                if (context.mounted) {
                  Navigator.pop(context);
                  await ref.read(authProvider.notifier).logout();
                  if (context.mounted) {
                    context.go('/login');
                  }
                }
              }
            },
          ),
        ],
      ),
    );
  }
}
