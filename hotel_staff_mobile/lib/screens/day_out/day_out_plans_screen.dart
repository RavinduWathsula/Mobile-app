import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../providers/day_out_provider.dart';
import '../../widgets/loading/loading_indicator.dart';
import '../../widgets/empty_states/empty_state_view.dart';
import '../../core/theme/app_colors.dart';
import '../../core/utils/formatters.dart';

class DayOutPlansScreen extends ConsumerStatefulWidget {
  const DayOutPlansScreen({super.key});

  @override
  ConsumerState<DayOutPlansScreen> createState() => _DayOutPlansScreenState();
}

class _DayOutPlansScreenState extends ConsumerState<DayOutPlansScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey.shade50,
      appBar: AppBar(
        elevation: 0,
        backgroundColor: Colors.white,
        foregroundColor: AppColors.textPrimary,
        title: const Text(
          'Day Out Plans',
          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 22, letterSpacing: -0.5),
        ),
        bottom: TabBar(
          controller: _tabController,
          labelColor: AppColors.primary,
          unselectedLabelColor: Colors.grey.shade600,
          indicatorColor: AppColors.primary,
          indicatorWeight: 3,
          labelStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
          tabs: const [
            Tab(text: 'Explore Plans'),
            Tab(text: 'Guest Bookings'),
          ],
        ),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => context.push('/more/day_out/create'),
        backgroundColor: AppColors.primary,
        elevation: 4,
        icon: const Icon(Icons.add_rounded, color: Colors.white),
        label: const Text('New Booking', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, letterSpacing: 0.5)),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _buildPlansList(),
          _buildBookingsList(),
        ],
      ),
    );
  }

  Widget _buildPlansList() {
    final plansAsync = ref.watch(dayOutPlansProvider);
    return plansAsync.when(
      loading: () => const LoadingIndicator(message: 'Discovering plans...'),
      error: (err, stack) => EmptyStateView(
        title: 'Oops!',
        description: err.toString(),
        onRetry: () => ref.refresh(dayOutPlansProvider),
      ),
      data: (plans) {
        if (plans.isEmpty) {
          return const EmptyStateView(
            icon: Icons.landscape_rounded,
            title: 'No Plans Found',
            description: 'There are no active day out plans at the moment.',
          );
        }
        return ListView.builder(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 24),
          itemCount: plans.length,
          itemBuilder: (context, index) {
            final plan = plans[index];
            final isActive = plan.status == 'active';

            return Container(
              margin: const EdgeInsets.only(bottom: 20),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(24),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withAlpha(12),
                    blurRadius: 15,
                    offset: const Offset(0, 8),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // Header Banner
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: isActive 
                          ? [const Color(0xFF10B981), const Color(0xFF059669)]
                          : [Colors.grey.shade400, Colors.grey.shade600],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Expanded(
                          child: Text(
                            plan.name,
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                              letterSpacing: 0.5,
                            ),
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: Colors.white.withAlpha(50),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Text(
                            plan.status.toUpperCase(),
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 11,
                              fontWeight: FontWeight.bold,
                              letterSpacing: 1,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  
                  // Content
                  Padding(
                    padding: const EdgeInsets.all(20),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          plan.description,
                          style: TextStyle(fontSize: 14, color: Colors.grey.shade700, height: 1.5),
                        ),
                        const SizedBox(height: 20),
                        
                        // Price Info Row
                        Row(
                          children: [
                            Expanded(
                              child: _InfoTile(
                                icon: Icons.person_rounded,
                                title: 'Adult Price',
                                value: Formatters.formatCurrency(plan.adultPrice),
                                color: AppColors.primary,
                              ),
                            ),
                            Container(width: 1, height: 40, color: Colors.grey.shade200),
                            Expanded(
                              child: _InfoTile(
                                icon: Icons.child_care_rounded,
                                title: 'Child Price',
                                value: Formatters.formatCurrency(plan.childPrice),
                                color: const Color(0xFFF59E0B),
                              ),
                            ),
                          ],
                        ),
                        const Padding(
                          padding: EdgeInsets.symmetric(vertical: 16),
                          child: Divider(height: 1),
                        ),
                        
                        // Schedule Row
                        Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(8),
                              decoration: BoxDecoration(color: Colors.blue.shade50, shape: BoxShape.circle),
                              child: Icon(Icons.schedule_rounded, color: Colors.blue.shade600, size: 20),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const Text('Schedule & Timing', style: TextStyle(fontSize: 12, color: Colors.grey, fontWeight: FontWeight.w600)),
                                  Text(
                                    '${plan.schedule} • ${plan.timing}',
                                    style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: Colors.black87),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  Widget _buildBookingsList() {
    final bookingsAsync = ref.watch(dayOutBookingsProvider);
    return bookingsAsync.when(
      loading: () => const LoadingIndicator(message: 'Loading bookings...'),
      error: (err, stack) => EmptyStateView(
        title: 'Error',
        description: err.toString(),
        onRetry: () => ref.refresh(dayOutBookingsProvider),
      ),
      data: (bookings) {
        if (bookings.isEmpty) {
          return const EmptyStateView(
            icon: Icons.confirmation_number_outlined,
            title: 'No Bookings',
            description: 'No day out reservations have been made yet.',
          );
        }
        return ListView.builder(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 24),
          itemCount: bookings.length,
          itemBuilder: (context, index) {
            final booking = bookings[index];
            final isConfirmed = booking.status == 'confirmed';

            return Container(
              margin: const EdgeInsets.only(bottom: 16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: Colors.grey.shade200),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withAlpha(5),
                    blurRadius: 10,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Avatar / Icon
                    Container(
                      width: 50,
                      height: 50,
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(
                          colors: [Color(0xFF8B5CF6), Color(0xFF6366F1)],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                        borderRadius: BorderRadius.circular(14),
                      ),
                      child: Center(
                        child: Text(
                          booking.guestName.isNotEmpty ? booking.guestName[0].toUpperCase() : 'G',
                          style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold),
                        ),
                      ),
                    ),
                    const SizedBox(width: 16),
                    
                    // Booking Details
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Expanded(
                                child: Text(
                                  booking.guestName,
                                  style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                decoration: BoxDecoration(
                                  color: isConfirmed ? Colors.green.shade50 : Colors.orange.shade50,
                                  borderRadius: BorderRadius.circular(8),
                                  border: Border.all(color: isConfirmed ? Colors.green.shade200 : Colors.orange.shade200),
                                ),
                                child: Text(
                                  booking.status.toUpperCase(),
                                  style: TextStyle(
                                    fontSize: 10,
                                    fontWeight: FontWeight.bold,
                                    color: isConfirmed ? Colors.green.shade700 : Colors.orange.shade700,
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 6),
                          Text(
                            booking.planName,
                            style: TextStyle(fontSize: 14, color: AppColors.primary, fontWeight: FontWeight.w600),
                          ),
                          const SizedBox(height: 12),
                          Row(
                            children: [
                              Icon(Icons.calendar_month_rounded, size: 14, color: Colors.grey.shade500),
                              const SizedBox(width: 4),
                              Text(booking.bookingDate, style: TextStyle(fontSize: 12, color: Colors.grey.shade600)),
                              const SizedBox(width: 12),
                              Icon(Icons.groups_rounded, size: 16, color: Colors.grey.shade500),
                              const SizedBox(width: 4),
                              Text('${booking.adults}A, ${booking.children}C', style: TextStyle(fontSize: 12, color: Colors.grey.shade600)),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  }
}

class _InfoTile extends StatelessWidget {
  final IconData icon;
  final String title;
  final String value;
  final Color color;

  const _InfoTile({
    required this.icon,
    required this.title,
    required this.value,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Icon(icon, color: color, size: 24),
        const SizedBox(height: 8),
        Text(title, style: const TextStyle(fontSize: 12, color: Colors.grey, fontWeight: FontWeight.w500)),
        const SizedBox(height: 2),
        Text(value, style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: color)),
      ],
    );
  }
}

