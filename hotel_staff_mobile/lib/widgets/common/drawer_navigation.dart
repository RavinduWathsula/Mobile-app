import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../providers/auth_provider.dart';
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
            decoration: const BoxDecoration(color: AppColors.primary),
            accountName: Text(
              user?.fullName ?? 'Staff Member',
              style: const TextStyle(fontWeight: FontWeight.bold),
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
          ListTile(
            leading: const Icon(Icons.dashboard_outlined),
            title: const Text('Dashboard'),
            onTap: () {
              Navigator.pop(context);
              context.go('/dashboard');
            },
          ),
          ListTile(
            leading: const Icon(Icons.bookmark_border),
            title: const Text('Bookings'),
            onTap: () {
              Navigator.pop(context);
              context.go('/bookings');
            },
          ),
          ListTile(
            leading: const Icon(Icons.login),
            title: const Text('Today Arrivals'),
            onTap: () {
              Navigator.pop(context);
              context.go('/arrivals');
            },
          ),
          ListTile(
            leading: const Icon(Icons.logout),
            title: const Text('Today Checkouts'),
            onTap: () {
              Navigator.pop(context);
              context.go('/checkouts');
            },
          ),
          ListTile(
            leading: const Icon(Icons.meeting_room_outlined),
            title: const Text('Rooms Board'),
            onTap: () {
              Navigator.pop(context);
              context.go('/rooms');
            },
          ),
          ListTile(
            leading: const Icon(Icons.cleaning_services_outlined),
            title: const Text('Housekeeping'),
            onTap: () {
              Navigator.pop(context);
              context.go('/housekeeping');
            },
          ),
          const Divider(),
          ListTile(
            leading: const Icon(Icons.point_of_sale),
            title: const Text('Restaurant POS'),
            onTap: () {
              Navigator.pop(context);
              context.go('/restaurant');
            },
          ),
          ListTile(
            leading: const Icon(Icons.kitchen_outlined),
            title: const Text('Kitchen KDS'),
            onTap: () {
              Navigator.pop(context);
              context.go('/kitchen');
            },
          ),
          ListTile(
            leading: const Icon(Icons.bar_chart_outlined),
            title: const Text('Reports & Analytics'),
            onTap: () {
              Navigator.pop(context);
              context.go('/reports');
            },
          ),
          const Divider(),
          ListTile(
            leading: const Icon(Icons.person_outline),
            title: const Text('My Profile'),
            onTap: () {
              Navigator.pop(context);
              context.go('/profile');
            },
          ),
          ListTile(
            leading: const Icon(Icons.exit_to_app, color: Colors.red),
            title: const Text('Logout', style: TextStyle(color: Colors.red)),
            onTap: () async {
              Navigator.pop(context);
              await ref.read(authProvider.notifier).logout();
              if (context.mounted) {
                context.go('/login');
              }
            },
          ),
        ],
      ),
    );
  }
}
