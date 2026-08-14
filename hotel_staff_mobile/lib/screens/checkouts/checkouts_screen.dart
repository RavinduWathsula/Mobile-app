import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../providers/services_provider.dart';
import '../../providers/bookings_provider.dart';
import '../../widgets/common/drawer_navigation.dart';
import '../../widgets/cards/booking_card.dart';
import '../../widgets/loading/loading_indicator.dart';
import '../../widgets/empty_states/empty_state_view.dart';
import '../bookings/booking_detail_screen.dart';
import '../../core/theme/app_colors.dart';

final checkoutsSearchQueryProvider = StateProvider.autoDispose<String>((ref) => '');
final checkoutsPaymentFilterProvider = StateProvider.autoDispose<String>((ref) => 'All');

class CheckoutsScreen extends ConsumerWidget {
  const CheckoutsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final checkoutsAsync = ref.watch(todayCheckoutsProvider);
    final searchQuery = ref.watch(checkoutsSearchQueryProvider).toLowerCase();
    final paymentFilter = ref.watch(checkoutsPaymentFilterProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text("Today's Checkouts"),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => ref.refresh(todayCheckoutsProvider),
          ),
        ],
      ),
      drawer: const DrawerNavigation(),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12.0),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    decoration: const InputDecoration(
                      hintText: 'Search guest name or ref...',
                      prefixIcon: Icon(Icons.search),
                      isDense: true,
                      contentPadding: EdgeInsets.all(8),
                    ),
                    onChanged: (val) {
                      ref.read(checkoutsSearchQueryProvider.notifier).state = val;
                    },
                  ),
                ),
              ],
            ),
          ),
          Consumer(
            builder: (context, ref, child) {
              final currentFilter = ref.watch(checkoutsPaymentFilterProvider);
              return Padding(
                padding: const EdgeInsets.symmetric(horizontal: 12.0, vertical: 8.0),
                child: SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    children: [
                      const Text('Payment: ', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13, color: AppColors.textSecondary)),
                      const SizedBox(width: 8),
                      Builder(
                        builder: (itemContext) => Padding(
                          padding: const EdgeInsets.only(right: 8),
                          child: FilterChip(
                            label: const Text('All'),
                            selected: currentFilter == 'All',
                            selectedColor: AppColors.primary,
                            checkmarkColor: Colors.white,
                            labelStyle: TextStyle(
                              color: currentFilter == 'All' ? Colors.white : AppColors.textPrimary,
                              fontWeight: currentFilter == 'All' ? FontWeight.bold : FontWeight.normal,
                              fontSize: 12,
                            ),
                            backgroundColor: Colors.grey.shade100,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(16),
                              side: BorderSide(
                                color: currentFilter == 'All' ? AppColors.primary : Colors.grey.shade300,
                              ),
                            ),
                            onSelected: (_) {
                              ref.read(checkoutsPaymentFilterProvider.notifier).state = 'All';
                              Scrollable.ensureVisible(
                                itemContext,
                                duration: const Duration(milliseconds: 300),
                                curve: Curves.easeInOut,
                              );
                            },
                          ),
                        ),
                      ),
                      Builder(
                        builder: (itemContext) => Padding(
                          padding: const EdgeInsets.only(right: 8),
                          child: FilterChip(
                            label: const Text('Unpaid Only'),
                            selected: currentFilter == 'Unpaid',
                            selectedColor: AppColors.primary,
                            checkmarkColor: Colors.white,
                            labelStyle: TextStyle(
                              color: currentFilter == 'Unpaid' ? Colors.white : AppColors.textPrimary,
                              fontWeight: currentFilter == 'Unpaid' ? FontWeight.bold : FontWeight.normal,
                              fontSize: 12,
                            ),
                            backgroundColor: Colors.grey.shade100,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(16),
                              side: BorderSide(
                                color: currentFilter == 'Unpaid' ? AppColors.primary : Colors.grey.shade300,
                              ),
                            ),
                            onSelected: (_) {
                              ref.read(checkoutsPaymentFilterProvider.notifier).state = 'Unpaid';
                              Scrollable.ensureVisible(
                                itemContext,
                                duration: const Duration(milliseconds: 300),
                                curve: Curves.easeInOut,
                              );
                            },
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              );
            }
          ),
          Expanded(
            child: RefreshIndicator(
              onRefresh: () async => ref.refresh(todayCheckoutsProvider.future),
              child: checkoutsAsync.when(
                loading: () => const LoadingIndicator(message: "Loading checkouts..."),
                error: (err, stack) => ListView(
                  children: [
                    EmptyStateView(
                      title: 'Error loading checkouts',
                      description: err.toString(),
                      onRetry: () => ref.refresh(todayCheckoutsProvider),
                    ),
                  ],
                ),
                data: (checkouts) {
                  final filteredList = checkouts.where((b) {
                    final matchesRef = b.bookingRef.toLowerCase().contains(searchQuery);
                    final matchesName = b.guestFullName.toLowerCase().contains(searchQuery);
                    final matchesSearch = matchesRef || matchesName;

                    final matchesPayment = paymentFilter == 'All' || (paymentFilter == 'Unpaid' && b.balanceDue > 0);

                    return matchesSearch && matchesPayment;
                  }).toList();

                  if (filteredList.isEmpty) {
                    return ListView(
                      children: const [
                        EmptyStateView(
                          icon: Icons.logout,
                          title: 'No Checkouts Found',
                          description: 'There are no pending checkouts matching your criteria.',
                        ),
                      ],
                    );
                  }

                  return ListView.builder(
                    padding: const EdgeInsets.all(12),
                    itemCount: filteredList.length,
                    itemBuilder: (context, index) {
                      final booking = filteredList[index];
                      return BookingCard(
                        booking: booking,
                        actionLabel: 'Check-Out Guest',
                        onAction: () async {
                          final confirm = await showDialog<bool>(
                            context: context,
                            builder: (ctx) => AlertDialog(
                              title: const Text('Confirm Check-out'),
                              content: Text('Are you sure you want to check out ${booking.guestFullName}?\n\nEnsure all payments are settled (Balance: ${booking.balanceDue}).'),
                              actions: [
                                TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
                                ElevatedButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Check Out')),
                              ],
                            ),
                          );

                          if (confirm == true) {
                            try {
                              await ref.read(bookingsRepositoryProvider).updateBookingStatus(booking.id, 'completed');
                              ref.invalidate(todayCheckoutsProvider);
                              if (context.mounted) {
                                ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Checked out successfully')));
                              }
                            } catch (e) {
                              if (context.mounted) {
                                ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed to check out: $e')));
                              }
                            }
                          }
                        },
                        onTap: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (_) => BookingDetailScreen(bookingId: booking.id),
                            ),
                          );
                        },
                      );
                    },
                  );
                },
              ),
            ),
          ),
        ],
      ),
    );
  }
}
