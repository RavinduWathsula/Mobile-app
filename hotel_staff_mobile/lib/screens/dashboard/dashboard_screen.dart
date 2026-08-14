import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../providers/dashboard_provider.dart';
import '../../providers/auth_provider.dart';
import '../../widgets/dashboard/occupancy_gauge_painter.dart';
import '../../widgets/dashboard/room_distribution_bar.dart';
import '../../widgets/dashboard/shift_announcement_card.dart';
import '../../widgets/dashboard/notification_badge.dart';
import '../../widgets/loading/dashboard_skeleton.dart';
import '../../widgets/empty_states/empty_state_view.dart';
import '../../widgets/common/drawer_navigation.dart';
import '../../core/utils/formatters.dart';
import '../../core/theme/app_colors.dart';

class DashboardScreen extends ConsumerWidget {
  const DashboardScreen({super.key});

  Map<String, String> _getShiftInfo() {
    final hour = DateTime.now().hour;
    if (hour >= 6 && hour < 14) {
      return {'greeting': 'Good Morning', 'shift': '🌅 Morning Shift'};
    } else if (hour >= 14 && hour < 22) {
      return {'greeting': 'Good Afternoon', 'shift': '☀️ Afternoon Shift'};
    } else {
      return {'greeting': 'Good Evening', 'shift': '🌙 Night Shift'};
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final statsAsync = ref.watch(dashboardStatsProvider);
    final activeOrdersAsync = ref.watch(activeOrdersCountProvider);
    final activitiesAsync = ref.watch(recentActivityProvider);
    final user = ref.watch(authProvider).user;

    final shiftInfo = _getShiftInfo();
    final formattedDate = DateFormat('EEEE, MMM d, yyyy').format(DateTime.now());

    return Scaffold(
      backgroundColor: AppColors.background,
      drawer: const DrawerNavigation(),
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: () async {
            ref.invalidate(dashboardStatsProvider);
            ref.invalidate(activeOrdersCountProvider);
            ref.invalidate(recentActivityProvider);
          },
          child: statsAsync.when(
            loading: () => const DashboardSkeleton(),
            error: (err, stack) => SingleChildScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              child: SizedBox(
                height: MediaQuery.of(context).size.height * 0.8,
                child: Center(
                  child: Padding(
                    padding: const EdgeInsets.all(24.0),
                    child: EmptyStateView(
                      title: 'Connection Issue',
                      description: 'Unable to sync live hotel statistics from server.',
                      onRetry: () {
                        ref.invalidate(dashboardStatsProvider);
                        ref.invalidate(activeOrdersCountProvider);
                        ref.invalidate(recentActivityProvider);
                      },
                    ),
                  ),
                ),
              ),
            ),
            data: (stats) {
              final activeOrdersCount = activeOrdersAsync.value ?? 0;

              return ListView(
                padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 16.0),
                children: [
                  // 1. CREATIVE HERO HEADER
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    crossAxisAlignment: CrossAxisAlignment.center,
                    children: [
                      Builder(
                        builder: (ctx) => IconButton(
                          padding: const EdgeInsets.only(right: 12),
                          constraints: const BoxConstraints(),
                          icon: const Icon(Icons.menu, color: AppColors.textPrimary, size: 28),
                          onPressed: () => Scaffold.of(ctx).openDrawer(),
                        ),
                      ),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
                              decoration: BoxDecoration(
                                color: AppColors.primary.withAlpha(25),
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(color: AppColors.primary.withAlpha(50)),
                              ),
                              child: Text(
                                shiftInfo['shift']!,
                                style: const TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.bold,
                                  color: AppColors.primary,
                                ),
                              ),
                            ),
                            const SizedBox(height: 6),
                            Text(
                              '${shiftInfo['greeting']!}, ${user?.fullName.split(' ').first ?? 'Staff'}',
                              style: const TextStyle(
                                fontSize: 22,
                                fontWeight: FontWeight.bold,
                                color: AppColors.textPrimary,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                            const SizedBox(height: 2),
                            Text(
                              formattedDate,
                              style: const TextStyle(
                                fontSize: 12,
                                color: AppColors.textSecondary,
                              ),
                            ),
                          ],
                        ),
                      ),
                      Row(
                        children: [
                          // Notifications Button with Pulse Indicator
                          const NotificationBadge(
                            iconColor: AppColors.textPrimary,
                          ),
                          const SizedBox(width: 4),

                          // Staff Profile Avatar with Status Ring
                          GestureDetector(
                            onTap: () => context.go('/profile'),
                            child: Container(
                              padding: const EdgeInsets.all(2),
                              decoration: const BoxDecoration(
                                color: Color(0xFF10B981), // Emerald Active Status Ring
                                shape: BoxShape.circle,
                              ),
                              child: CircleAvatar(
                                radius: 20,
                                backgroundColor: AppColors.primary,
                                child: Text(
                                  (user?.fullName.isNotEmpty == true) ? user!.fullName[0].toUpperCase() : 'S',
                                  style: const TextStyle(
                                    fontSize: 16,
                                    fontWeight: FontWeight.bold,
                                    color: Colors.white,
                                  ),
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                  const SizedBox(height: 20),

                  // 2. CREATIVE OCCUPANCY HERO CARD
                  Container(
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [Color(0xFF3B0764), Color(0xFF5B21B6), Color(0xFF4C1D95)],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      borderRadius: BorderRadius.circular(24),
                      boxShadow: const [
                        BoxShadow(
                          color: Color(0x334C1D95),
                          blurRadius: 20,
                          offset: Offset(0, 8),
                        ),
                      ],
                    ),
                    child: Column(
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'LIVE OCCUPANCY',
                                  style: TextStyle(
                                    fontSize: 11,
                                    fontWeight: FontWeight.bold,
                                    letterSpacing: 1.2,
                                    color: Colors.white.withAlpha(180),
                                  ),
                                ),
                                const SizedBox(height: 4),
                                Row(
                                  crossAxisAlignment: CrossAxisAlignment.baseline,
                                  textBaseline: TextBaseline.alphabetic,
                                  children: [
                                    Text(
                                      '${stats.occupiedRooms}',
                                      style: const TextStyle(
                                        fontSize: 36,
                                        fontWeight: FontWeight.bold,
                                        color: Colors.white,
                                      ),
                                    ),
                                    Text(
                                      ' / ${stats.totalRooms} Rooms',
                                      style: TextStyle(
                                        fontSize: 14,
                                        fontWeight: FontWeight.w500,
                                        color: Colors.white.withAlpha(200),
                                      ),
                                    ),
                                  ],
                                ),
                              ],
                            ),

                            // Custom Radial Gauge Painter
                            SizedBox(
                              width: 72,
                              height: 72,
                              child: Stack(
                                alignment: Alignment.center,
                                children: [
                                  CustomPaint(
                                    size: const Size(72, 72),
                                    painter: OccupancyGaugePainter(
                                      percentage: stats.occupancyRate.toDouble(),
                                      trackColor: Colors.white.withAlpha(40),
                                      progressColor: const Color(0xFFA855F7),
                                      strokeWidth: 8.0,
                                    ),
                                  ),
                                  Text(
                                    '${stats.occupancyRate}%',
                                    style: const TextStyle(
                                      fontSize: 14,
                                      fontWeight: FontWeight.bold,
                                      color: Colors.white,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 16),

                        // Revenue Highlight Chip
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                          decoration: BoxDecoration(
                            color: Colors.white.withAlpha(25),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: Colors.white.withAlpha(40)),
                          ),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Row(
                                children: [
                                  const Icon(Icons.payments_outlined, color: Color(0xFF34D399), size: 18),
                                  const SizedBox(width: 8),
                                  Text(
                                    'Today\'s Revenue',
                                    style: TextStyle(
                                      fontSize: 12,
                                      color: Colors.white.withAlpha(220),
                                    ),
                                  ),
                                ],
                              ),
                              Text(
                                Formatters.formatCurrency(stats.revenueToday),
                                style: const TextStyle(
                                  fontSize: 14,
                                  fontWeight: FontWeight.bold,
                                  color: Colors.white,
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 16),

                        // Room Status Distribution Bar
                        RoomDistributionBar(
                          total: stats.totalRooms,
                          occupied: stats.occupiedRooms,
                          available: stats.availableRooms,
                          dirty: stats.dirtyRooms,
                          maintenance: stats.maintenanceRooms,
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 24),

                  // 3. SHIFT ANNOUNCEMENT CARD
                  ShiftAnnouncementCard(
                    title: 'VIP Arrival Notice',
                    message: 'Suite 204 prepared for arrival. Check-in expected at 2:30 PM.',
                    time: '12m ago',
                    onTap: () => context.go('/arrivals'),
                  ),
                  const SizedBox(height: 24),

                  // 4. TODAY'S OPERATIONS COMMAND CARDS
                  const _SectionHeader(title: "Today's Operations"),
                  const SizedBox(height: 12),
                  GridView.count(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    crossAxisCount: 2,
                    childAspectRatio: 1.55,
                    crossAxisSpacing: 12,
                    mainAxisSpacing: 12,
                    children: [
                      _CreativeOpCard(
                        title: 'Today Arrivals',
                        value: '${stats.todayArrivals}',
                        subtitle: 'Expected check-ins',
                        icon: Icons.login_rounded,
                        gradientColors: const [Color(0xFF059669), Color(0xFF10B981)],
                        onTap: () => context.go('/arrivals'),
                      ),
                      _CreativeOpCard(
                        title: 'Today Checkouts',
                        value: '${stats.todayCheckouts}',
                        subtitle: 'Expected check-outs',
                        icon: Icons.logout_rounded,
                        gradientColors: const [Color(0xDDF59E0B), Color(0xFFF59E0B)],
                        onTap: () => context.go('/checkouts'),
                      ),
                      _CreativeOpCard(
                        title: 'Housekeeping Queue',
                        value: '${stats.dirtyRooms}',
                        subtitle: 'Rooms to clean',
                        icon: Icons.cleaning_services_rounded,
                        gradientColors: const [Color(0xFF0891B2), Color(0xFF06B6D4)],
                        onTap: () => context.go('/housekeeping'),
                      ),
                      _CreativeOpCard(
                        title: 'Restaurant Orders',
                        value: '$activeOrdersCount',
                        subtitle: 'Active dining orders',
                        icon: Icons.point_of_sale_rounded,
                        gradientColors: const [Color(0xFF4F46E5), Color(0xFF6366F1)],
                        onTap: () => context.go('/restaurant'),
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),

                  // 5. CREATIVE QUICK ACTION PALETTE (6 Actions)
                  const _SectionHeader(title: 'Quick Actions'),
                  const SizedBox(height: 12),
                  GridView.count(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    crossAxisCount: 3,
                    childAspectRatio: 1.05,
                    crossAxisSpacing: 10,
                    mainAxisSpacing: 10,
                    children: [
                      _CreativeActionButton(
                        label: 'New Booking',
                        icon: Icons.add_circle_outline_rounded,
                        color: const Color(0xFF8B5CF6),
                        onTap: () => context.go('/bookings'),
                      ),
                      _CreativeActionButton(
                        label: 'Check-in',
                        icon: Icons.login_rounded,
                        color: const Color(0xFF10B981),
                        onTap: () => context.go('/arrivals'),
                      ),
                      _CreativeActionButton(
                        label: 'Check-out',
                        icon: Icons.logout_rounded,
                        color: const Color(0xFFF59E0B),
                        onTap: () => context.go('/checkouts'),
                      ),
                      _CreativeActionButton(
                        label: 'Rooms Board',
                        icon: Icons.meeting_room_outlined,
                        color: const Color(0xFF3B82F6),
                        onTap: () => context.go('/rooms'),
                      ),
                      _CreativeActionButton(
                        label: 'Housekeeping',
                        icon: Icons.cleaning_services_outlined,
                        color: const Color(0xFF06B6D4),
                        onTap: () => context.go('/housekeeping'),
                      ),
                      _CreativeActionButton(
                        label: 'Restaurant',
                        icon: Icons.restaurant_rounded,
                        color: const Color(0xFF6366F1),
                        onTap: () => context.go('/restaurant'),
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),

                  // 6. LIVE RECENT ACTIVITY STREAM
                  const _SectionHeader(title: 'Live Activity Feed'),
                  const SizedBox(height: 12),
                  activitiesAsync.when(
                    loading: () => const SizedBox(
                      height: 60,
                      child: Center(child: CircularProgressIndicator()),
                    ),
                    error: (_, __) => const SizedBox(),
                    data: (activities) {
                      return Card(
                        elevation: 0,
                        color: Colors.white,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(16),
                          side: BorderSide(color: Colors.grey.shade200),
                        ),
                        child: ListView.separated(
                          shrinkWrap: true,
                          physics: const NeverScrollableScrollPhysics(),
                          itemCount: activities.length,
                          separatorBuilder: (context, index) => const Divider(height: 1),
                          itemBuilder: (context, index) {
                            final item = activities[index];
                            return ListTile(
                              leading: Container(
                                padding: const EdgeInsets.all(10),
                                decoration: BoxDecoration(
                                  color: AppColors.primary.withAlpha(20),
                                  shape: BoxShape.circle,
                                ),
                                child: Icon(
                                  _getActivityIcon(item.type),
                                  color: AppColors.primary,
                                  size: 18,
                                ),
                              ),
                              title: Text(
                                item.title,
                                style: const TextStyle(
                                  fontSize: 14,
                                  fontWeight: FontWeight.bold,
                                  color: AppColors.textPrimary,
                                ),
                              ),
                              subtitle: Text(
                                item.description,
                                style: const TextStyle(
                                  fontSize: 12,
                                  color: AppColors.textSecondary,
                                ),
                              ),
                              trailing: Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                decoration: BoxDecoration(
                                  color: Colors.grey.shade100,
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: Text(
                                  item.time,
                                  style: const TextStyle(
                                    fontSize: 11,
                                    fontWeight: FontWeight.w500,
                                    color: AppColors.textSecondary,
                                  ),
                                ),
                              ),
                            );
                          },
                        ),
                      );
                    },
                  ),
                  const SizedBox(height: 24),
                ],
              );
            },
          ),
        ),
      ),
    );
  }

  IconData _getActivityIcon(String type) {
    switch (type) {
      case 'checkin':
        return Icons.login_rounded;
      case 'checkout':
        return Icons.logout_rounded;
      case 'housekeeping':
        return Icons.cleaning_services_rounded;
      case 'restaurant':
        return Icons.restaurant_rounded;
      default:
        return Icons.hotel_rounded;
    }
  }
}

class _SectionHeader extends StatelessWidget {
  final String title;
  const _SectionHeader({required this.title});

  @override
  Widget build(BuildContext context) {
    return Text(
      title,
      style: const TextStyle(
        fontSize: 18,
        fontWeight: FontWeight.bold,
        color: AppColors.textPrimary,
      ),
    );
  }
}

class _CreativeOpCard extends StatelessWidget {
  final String title;
  final String value;
  final String subtitle;
  final IconData icon;
  final List<Color> gradientColors;
  final VoidCallback onTap;

  const _CreativeOpCard({
    required this.title,
    required this.value,
    required this.subtitle,
    required this.icon,
    required this.gradientColors,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.white,
      borderRadius: BorderRadius.circular(16),
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: Colors.grey.shade200),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    value,
                    style: TextStyle(
                      fontSize: 26,
                      fontWeight: FontWeight.bold,
                      color: gradientColors.last,
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: gradientColors,
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      borderRadius: BorderRadius.circular(10),
                      boxShadow: [
                        BoxShadow(
                          color: gradientColors.last.withAlpha(80),
                          blurRadius: 8,
                          offset: const Offset(0, 3),
                        ),
                      ],
                    ),
                    child: Icon(icon, color: Colors.white, size: 18),
                  ),
                ],
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: const TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.bold,
                      color: AppColors.textPrimary,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  Text(
                    subtitle,
                    style: const TextStyle(
                      fontSize: 11,
                      color: AppColors.textSecondary,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _CreativeActionButton extends StatelessWidget {
  final String label;
  final IconData icon;
  final Color color;
  final VoidCallback onTap;

  const _CreativeActionButton({
    required this.label,
    required this.icon,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.white,
      borderRadius: BorderRadius.circular(16),
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 12),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: Colors.grey.shade200),
          ),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: color.withAlpha(25),
                  shape: BoxShape.circle,
                  boxShadow: [
                    BoxShadow(
                      color: color.withAlpha(30),
                      blurRadius: 6,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
                child: Icon(icon, color: color, size: 22),
              ),
              const SizedBox(height: 6),
              Text(
                label,
                textAlign: TextAlign.center,
                style: const TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: AppColors.textPrimary,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

