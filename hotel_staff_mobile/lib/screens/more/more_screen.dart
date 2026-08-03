import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../providers/auth_provider.dart';
import '../../core/auth/app_permissions.dart';
import '../../core/theme/app_colors.dart';

class MoreScreen extends ConsumerWidget {
  const MoreScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authProvider);
    final user = authState.user;

    // Define all secondary modules
    final operationsModules = [
      _ModuleItem(
        title: 'Today Arrivals',
        subtitle: 'Check-in management & arrivals',
        icon: Icons.login_rounded,
        color: const Color(0xFF10B981), // Emerald
        route: '/arrivals',
      ),
      _ModuleItem(
        title: 'Today Checkouts',
        subtitle: 'Departures & billing clearance',
        icon: Icons.logout_rounded,
        color: const Color(0xFFF59E0B), // Amber
        route: '/checkouts',
      ),
      _ModuleItem(
        title: 'Restaurant POS',
        subtitle: 'Table orders & dining service',
        icon: Icons.point_of_sale_rounded,
        color: const Color(0xFF6366F1), // Indigo
        route: '/restaurant',
      ),
      _ModuleItem(
        title: 'Kitchen KDS',
        subtitle: 'Live kitchen display system',
        icon: Icons.soup_kitchen_rounded,
        color: const Color(0xFFEC4899), // Pink
        route: '/kitchen',
      ),
    ];

    final analyticsModules = [
      _ModuleItem(
        title: 'Reports & Analytics',
        subtitle: 'Occupancy & revenue performance',
        icon: Icons.insights_rounded,
        color: const Color(0xFF8B5CF6), // Purple
        route: '/reports',
      ),
    ];

    final accountModules = [
      _ModuleItem(
        title: 'My Profile',
        subtitle: 'Personal details & role credentials',
        icon: Icons.account_circle_outlined,
        color: const Color(0xFF3B82F6), // Blue
        route: '/profile',
      ),
      _ModuleItem(
        title: 'App Settings',
        subtitle: 'Server configuration & preferences',
        icon: Icons.tune_rounded,
        color: const Color(0xFF64748B), // Slate
        route: '/settings',
      ),
    ];

    // Filter modules according to logged in user permissions
    final filteredOps = operationsModules.where((m) => AppPermissions.canAccessRoute(user, m.route)).toList();
    final filteredAnalytics = analyticsModules.where((m) => AppPermissions.canAccessRoute(user, m.route)).toList();
    final filteredAccount = accountModules.where((m) => AppPermissions.canAccessRoute(user, m.route)).toList();

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text(
          'More Modules',
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
        elevation: 0,
      ),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 12.0),
          children: [
            // User Header Profile Card
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFF4C1D95), Color(0xFF6B21A8)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(16),
                boxShadow: const [
                  BoxShadow(
                    color: Color(0x224C1D95),
                    blurRadius: 10,
                    offset: Offset(0, 4),
                  ),
                ],
              ),
              child: Row(
                children: [
                  CircleAvatar(
                    radius: 28,
                    backgroundColor: Colors.white,
                    child: Text(
                      (user?.fullName.isNotEmpty == true) ? user!.fullName[0].toUpperCase() : 'S',
                      style: const TextStyle(
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                        color: AppColors.primary,
                      ),
                    ),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          user?.fullName ?? 'Staff Member',
                          style: const TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 4),
                        Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                              decoration: BoxDecoration(
                                color: Colors.white.withAlpha(50),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Text(
                                user?.role ?? 'Staff',
                                style: const TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.w600,
                                  color: Colors.white,
                                ),
                              ),
                            ),
                            const SizedBox(width: 8),
                            Text(
                              user?.department ?? 'Front Office',
                              style: TextStyle(
                                fontSize: 12,
                                color: Colors.white.withAlpha(200),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // Operations Section
            if (filteredOps.isNotEmpty) ...[
              const _CategoryLabel(title: 'Live Hotel Operations'),
              ...filteredOps.map((m) => _ModuleTile(item: m)),
              const SizedBox(height: 16),
            ],

            // Analytics Section
            if (filteredAnalytics.isNotEmpty) ...[
              const _CategoryLabel(title: 'Management & Analytics'),
              ...filteredAnalytics.map((m) => _ModuleTile(item: m)),
              const SizedBox(height: 16),
            ],

            // Account & Preferences Section
            if (filteredAccount.isNotEmpty) ...[
              const _CategoryLabel(title: 'Account & Preferences'),
              ...filteredAccount.map((m) => _ModuleTile(item: m)),
              const SizedBox(height: 16),
            ],

            // Logout Danger Zone
            const _CategoryLabel(title: 'Session Management'),
            Card(
              elevation: 0,
              color: Colors.red.shade50,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
                side: BorderSide(color: Colors.red.shade200),
              ),
              child: ListTile(
                leading: Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: Colors.red.shade100,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: const Icon(Icons.exit_to_app_rounded, color: Colors.red),
                ),
                title: const Text(
                  'Sign Out of System',
                  style: TextStyle(fontWeight: FontWeight.bold, color: Colors.red),
                ),
                subtitle: const Text(
                  'Clear session and return to login',
                  style: TextStyle(fontSize: 12, color: Colors.redAccent),
                ),
                trailing: const Icon(Icons.chevron_right, color: Colors.red),
                onTap: () => _handleLogout(context, ref),
              ),
            ),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  void _handleLogout(BuildContext context, WidgetRef ref) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Confirm Logout'),
        content: const Text('Are you sure you want to log out of the Sawingir Hills staff portal?'),
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
      await ref.read(authProvider.notifier).logout();
      if (context.mounted) {
        context.go('/login');
      }
    }
  }
}

class _ModuleItem {
  final String title;
  final String subtitle;
  final IconData icon;
  final Color color;
  final String route;

  _ModuleItem({
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.color,
    required this.route,
  });
}

class _CategoryLabel extends StatelessWidget {
  final String title;
  const _CategoryLabel({required this.title});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(left: 4, bottom: 8),
      child: Text(
        title.toUpperCase(),
        style: const TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.bold,
          color: AppColors.textSecondary,
          letterSpacing: 0.8,
        ),
      ),
    );
  }
}

class _ModuleTile extends StatelessWidget {
  final _ModuleItem item;
  const _ModuleTile({required this.item});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      child: Material(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        child: InkWell(
          borderRadius: BorderRadius.circular(12),
          onTap: () => context.go(item.route),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Colors.grey.shade200),
            ),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: item.color.withAlpha(25),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Icon(item.icon, color: item.color, size: 24),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        item.title,
                        style: const TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.bold,
                          color: AppColors.textPrimary,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        item.subtitle,
                        style: const TextStyle(
                          fontSize: 12,
                          color: AppColors.textSecondary,
                        ),
                      ),
                    ],
                  ),
                ),
                Icon(
                  Icons.chevron_right_rounded,
                  color: Colors.grey.shade400,
                  size: 22,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
