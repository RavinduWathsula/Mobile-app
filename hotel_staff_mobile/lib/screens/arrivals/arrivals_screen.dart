import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../providers/bookings_provider.dart';
import '../../widgets/common/drawer_navigation.dart';
import '../../widgets/cards/booking_card.dart';
import '../../widgets/loading/loading_indicator.dart';
import '../../widgets/empty_states/empty_state_view.dart';
import '../bookings/booking_detail_screen.dart';
import '../../models/booking_model.dart';

final arrivalsSearchQueryProvider = StateProvider.autoDispose<String>((ref) => '');

class ArrivalsScreen extends ConsumerWidget {
  const ArrivalsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return DefaultTabController(
      length: 2,
      child: Scaffold(
        appBar: AppBar(
          title: const Text("Arrivals"),
          bottom: const TabBar(
            tabs: [
              Tab(text: "Today's Arrivals"),
              Tab(text: "Upcoming"),
            ],
          ),
          actions: [
            IconButton(
              icon: const Icon(Icons.refresh),
              onPressed: () {
                ref.invalidate(todayArrivalsProvider);
                ref.invalidate(upcomingArrivalsProvider);
              },
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
                  ref.read(arrivalsSearchQueryProvider.notifier).state = val;
                },
              ),
            ),
            Expanded(
              child: TabBarView(
                children: [
                  _ArrivalsListView(provider: todayArrivalsProvider),
                  _ArrivalsListView(provider: upcomingArrivalsProvider),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ArrivalsListView extends ConsumerWidget {
  final AutoDisposeFutureProvider<List<BookingModel>> provider;

  const _ArrivalsListView({required this.provider});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final arrivalsAsync = ref.watch(provider);
    final searchQuery = ref.watch(arrivalsSearchQueryProvider).toLowerCase();

    return RefreshIndicator(
      onRefresh: () async => ref.refresh(provider.future),
      child: arrivalsAsync.when(
        loading: () => const LoadingIndicator(message: "Loading arrivals..."),
        error: (err, stack) => ListView(
          children: [
            EmptyStateView(
              title: 'Error loading arrivals',
              description: err.toString(),
              onRetry: () => ref.refresh(provider),
            ),
          ],
        ),
        data: (arrivals) {
          final filteredList = arrivals.where((b) {
            final matchesRef = b.bookingRef.toLowerCase().contains(searchQuery);
            final matchesName = b.guestFullName.toLowerCase().contains(searchQuery);
            return matchesRef || matchesName;
          }).toList();

          if (filteredList.isEmpty) {
            return ListView(
              children: const [
                EmptyStateView(
                  icon: Icons.flight_land,
                  title: 'No Arrivals Found',
                  description: 'There are no pending arrivals matching your criteria.',
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
    );
  }
}
