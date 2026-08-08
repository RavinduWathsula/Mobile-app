import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../providers/bookings_provider.dart';
import '../../widgets/common/drawer_navigation.dart';
import '../../widgets/cards/booking_card.dart';
import '../../widgets/loading/loading_indicator.dart';
import '../../widgets/empty_states/empty_state_view.dart';
import 'booking_detail_screen.dart';
import 'create_booking_screen.dart';

class BookingsListScreen extends ConsumerWidget {
  const BookingsListScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final bookingsAsync = ref.watch(bookingsListProvider);
    final currentStatus = ref.watch(bookingFilterStatusProvider);
    final theme = Theme.of(context);

    final statuses = [
      {'label': 'All', 'value': null},
      {'label': 'Confirmed', 'value': 'confirmed'},
      {'label': 'Checked In', 'value': 'checked_in'},
      {'label': 'Checked Out', 'value': 'checked_out'},
      {'label': 'Cancelled', 'value': 'cancelled'},
    ];

    return Scaffold(
      drawer: const DrawerNavigation(),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () {
          // Use rootNavigator to ensure it pushes above any bottom navigation bars
          Navigator.of(context, rootNavigator: true).push(
            MaterialPageRoute(
              builder: (_) => const CreateBookingScreen(),
            ),
          );
        },
        icon: const Icon(Icons.add),
        label: const Text('New Booking'),
        elevation: 4,
      ),
      body: RefreshIndicator(
        onRefresh: () async => ref.refresh(bookingsListProvider.future),
        child: CustomScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          slivers: [
            SliverAppBar(
              expandedHeight: 120.0,
              floating: true,
              pinned: true,
              elevation: 0,
              flexibleSpace: FlexibleSpaceBar(
                titlePadding: const EdgeInsets.only(left: 48, bottom: 16), // Adjusted for drawer icon
                title: Text(
                  'Bookings',
                  style: theme.textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
              actions: [
                IconButton(
                  icon: const Icon(Icons.refresh),
                  onPressed: () => ref.refresh(bookingsListProvider),
                ),
              ],
            ),
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
                child: TextField(
                  decoration: InputDecoration(
                    hintText: 'Search by booking ref or guest name...',
                    prefixIcon: const Icon(Icons.search),
                    filled: true,
                    fillColor: theme.colorScheme.surfaceContainerHighest.withValues(alpha: 0.3),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(16),
                      borderSide: BorderSide.none,
                    ),
                    contentPadding: const EdgeInsets.symmetric(vertical: 0),
                  ),
                  onChanged: (val) {
                    ref.read(bookingSearchQueryProvider.notifier).state = val;
                  },
                ),
              ),
            ),
            SliverToBoxAdapter(
              child: SizedBox(
                height: 40,
                child: ListView.builder(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  itemCount: statuses.length,
                  itemBuilder: (context, index) {
                    final status = statuses[index];
                    final isSelected = currentStatus == status['value'];
                    return Padding(
                      padding: const EdgeInsets.only(right: 8),
                      child: FilterChip(
                        label: Text(status['label'] as String),
                        selected: isSelected,
                        showCheckmark: false,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(20),
                        ),
                        onSelected: (selected) {
                          ref.read(bookingFilterStatusProvider.notifier).state =
                              selected ? status['value'] : null;
                        },
                      ),
                    );
                  },
                ),
              ),
            ),
            const SliverPadding(padding: EdgeInsets.only(bottom: 16)),
            bookingsAsync.when(
              loading: () => const SliverFillRemaining(
                child: LoadingIndicator(message: 'Fetching reservations...'),
              ),
              error: (err, stack) => SliverFillRemaining(
                child: EmptyStateView(
                  title: 'Error loading bookings',
                  description: err.toString(),
                  onRetry: () => ref.refresh(bookingsListProvider),
                ),
              ),
              data: (bookings) {
                if (bookings.isEmpty) {
                  return const SliverFillRemaining(
                    child: EmptyStateView(
                      icon: Icons.bookmark_border,
                      title: 'No Bookings Found',
                      description: 'No active or upcoming reservations match your query.',
                    ),
                  );
                }

                return SliverList(
                  delegate: SliverChildBuilderDelegate(
                    (context, index) {
                      final booking = bookings[index];
                      return Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                        child: BookingCard(
                          booking: booking,
                          onTap: () {
                            Navigator.of(context, rootNavigator: true).push(
                              MaterialPageRoute(
                                builder: (_) => BookingDetailScreen(bookingId: booking.id),
                              ),
                            );
                          },
                        ),
                      );
                    },
                    childCount: bookings.length,
                  ),
                );
              },
            ),
            const SliverPadding(padding: EdgeInsets.only(bottom: 80)),
          ],
        ),
      ),
    );
  }
}
