import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../providers/bookings_provider.dart';
import '../../widgets/common/drawer_navigation.dart';
import '../../widgets/cards/booking_card.dart';
import '../../widgets/loading/loading_indicator.dart';
import '../../widgets/empty_states/empty_state_view.dart';
import '../bookings/booking_detail_screen.dart';

final checkoutsSearchQueryProvider = StateProvider.autoDispose<String>((ref) => '');

class CheckoutsScreen extends ConsumerWidget {
  const CheckoutsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final checkoutsAsync = ref.watch(todayCheckoutsProvider);
    final searchQuery = ref.watch(checkoutsSearchQueryProvider).toLowerCase();

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
            padding: const EdgeInsets.all(12.0),
            child: TextField(
              decoration: const InputDecoration(
                hintText: 'Search guest name or ref...',
                prefixIcon: Icon(Icons.search),
              ),
              onChanged: (val) {
                ref.read(checkoutsSearchQueryProvider.notifier).state = val;
              },
            ),
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
                    return matchesRef || matchesName;
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
