import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../providers/kitchen_provider.dart';
import '../../providers/services_provider.dart';
import '../../widgets/common/drawer_navigation.dart';
import '../../widgets/loading/loading_indicator.dart';
import '../../widgets/empty_states/empty_state_view.dart';
import '../../models/restaurant_order_model.dart';
import '../../core/theme/app_colors.dart';

class KitchenKDSScreen extends ConsumerStatefulWidget {
  const KitchenKDSScreen({super.key});

  @override
  ConsumerState<KitchenKDSScreen> createState() => _KitchenKDSScreenState();
}

class _KitchenKDSScreenState extends ConsumerState<KitchenKDSScreen> {
  Timer? _refreshTimer;

  @override
  void initState() {
    super.initState();
    // Auto-refresh every 30 seconds
    _refreshTimer = Timer.periodic(const Duration(seconds: 30), (_) {
      ref.invalidate(kitchenOrdersProvider);
    });
  }

  @override
  void dispose() {
    _refreshTimer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final ordersAsync = ref.watch(kitchenOrdersProvider);

    return DefaultTabController(
      length: 3,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Kitchen Display', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 24)),
          backgroundColor: Colors.black87,
          foregroundColor: Colors.white,
          bottom: const TabBar(
            labelColor: Colors.white,
            unselectedLabelColor: Colors.grey,
            indicatorColor: AppColors.primary,
            indicatorWeight: 4,
            tabs: [
              Tab(child: Text('NEW', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold))),
              Tab(child: Text('PREPARING', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold))),
              Tab(child: Text('READY', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold))),
            ],
          ),
          actions: [
            IconButton(
              icon: const Icon(Icons.refresh, size: 28),
              onPressed: () => ref.invalidate(kitchenOrdersProvider),
            ),
          ],
        ),
        drawer: const DrawerNavigation(),
        backgroundColor: Colors.grey.shade300,
        body: ordersAsync.when(
          loading: () => const LoadingIndicator(message: 'Syncing live kitchen feed...'),
          error: (err, stack) => EmptyStateView(
            title: 'Error loading kitchen orders',
            description: err.toString(),
            onRetry: () => ref.invalidate(kitchenOrdersProvider),
          ),
          data: (allOrders) {
            final newOrders = allOrders.where((o) => o.status == 'pending').toList();
            final preparingOrders = allOrders.where((o) => o.status == 'preparing').toList();
            final readyOrders = allOrders.where((o) => o.status == 'ready').toList();

            return TabBarView(
              children: [
                _OrderGrid(orders: newOrders, emptyMessage: 'No New Orders', tabType: 'pending'),
                _OrderGrid(orders: preparingOrders, emptyMessage: 'No Orders Preparing', tabType: 'preparing'),
                _OrderGrid(orders: readyOrders, emptyMessage: 'No Ready Orders', tabType: 'ready'),
              ],
            );
          },
        ),
      ),
    );
  }
}

class _OrderGrid extends StatelessWidget {
  final List<RestaurantOrderModel> orders;
  final String emptyMessage;
  final String tabType;

  const _OrderGrid({
    required this.orders,
    required this.emptyMessage,
    required this.tabType,
  });

  @override
  Widget build(BuildContext context) {
    if (orders.isEmpty) {
      return EmptyStateView(
        icon: Icons.check_circle_outline,
        title: emptyMessage,
        description: 'You are all caught up!',
      );
    }

    return GridView.builder(
      padding: const EdgeInsets.all(12),
      gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: MediaQuery.of(context).size.width > 800 ? 3 : (MediaQuery.of(context).size.width > 500 ? 2 : 1),
        mainAxisExtent: 450,
        crossAxisSpacing: 12,
        mainAxisSpacing: 12,
      ),
      itemCount: orders.length,
      itemBuilder: (context, index) {
        return KdsOrderCard(order: orders[index], tabType: tabType);
      },
    );
  }
}

class KdsOrderCard extends ConsumerWidget {
  final RestaurantOrderModel order;
  final String tabType;

  const KdsOrderCard({super.key, required this.order, required this.tabType});

  void _updateStatus(BuildContext context, WidgetRef ref, String newStatus) async {
    try {
      final repo = ref.read(restaurantRepositoryProvider);
      await repo.updateOrderStatus(order.id, newStatus);
      ref.invalidate(kitchenOrdersProvider);
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e'), backgroundColor: Colors.red));
      }
    }
  }

  Widget _buildActionButton(BuildContext context, WidgetRef ref) {
    if (tabType == 'pending') {
      return ElevatedButton(
        style: ElevatedButton.styleFrom(
          backgroundColor: Colors.orange.shade700,
          foregroundColor: Colors.white,
          minimumSize: const Size.fromHeight(60),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
        ),
        onPressed: () => _updateStatus(context, ref, 'preparing'),
        child: const Text('START PREPARING', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, letterSpacing: 1.5)),
      );
    } else if (tabType == 'preparing') {
      return ElevatedButton(
        style: ElevatedButton.styleFrom(
          backgroundColor: Colors.green.shade700,
          foregroundColor: Colors.white,
          minimumSize: const Size.fromHeight(60),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
        ),
        onPressed: () => _updateStatus(context, ref, 'ready'),
        child: const Text('MARK READY', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, letterSpacing: 1.5)),
      );
    } else if (tabType == 'ready') {
      return ElevatedButton(
        style: ElevatedButton.styleFrom(
          backgroundColor: Colors.blue.shade700,
          foregroundColor: Colors.white,
          minimumSize: const Size.fromHeight(60),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
        ),
        onPressed: () => _updateStatus(context, ref, 'served'),
        child: const Text('MARK SERVED', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, letterSpacing: 1.5)),
      );
    }
    return const SizedBox();
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // Assuming createdAt is known, but model might not have it.
    // If not, we can simulate an elapsed time or hardcode if not available in model.
    // For now, let's just make it look like a ticket.
    final bool isDelayed = tabType == 'pending'; // Highlight pending orders as urgent if needed.

    return Card(
      elevation: 6,
      clipBehavior: Clip.antiAlias,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(color: isDelayed ? Colors.red : Colors.transparent, width: isDelayed ? 3 : 0),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Header (Ticket Title)
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            color: Colors.black,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Text(
                    'Order ${order.orderNumber}',
                    style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 22),
                  ),
                ),
                if (order.tableNumber != null)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(color: Colors.white24, borderRadius: BorderRadius.circular(8)),
                    child: Text('Table ${order.tableNumber}', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 18)),
                  ),
              ],
            ),
          ),
          
          // Subheader Info
          Container(
            color: Colors.yellow.shade100,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  order.roomNumber != null ? 'Room: ${order.roomNumber}' : 'Dine-In/Takeaway',
                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Colors.black87),
                ),
                Text(
                  'Server: ${order.creatorName ?? "N/A"}',
                  style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14, color: Colors.black54),
                ),
              ],
            ),
          ),

          // Items List
          Expanded(
            child: Container(
              color: Colors.white,
              child: ListView.separated(
                padding: const EdgeInsets.all(12),
                itemCount: order.items.length,
                separatorBuilder: (context, index) => const Divider(height: 16, thickness: 1),
                itemBuilder: (context, index) {
                  final item = order.items[index];
                  return Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: Colors.grey.shade200,
                          borderRadius: BorderRadius.circular(4),
                          border: Border.all(color: Colors.grey.shade400),
                        ),
                        child: Text(
                          '${item.quantity}',
                          style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              item.itemName,
                              style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w600),
                            ),
                            if (item.specialInstructions != null && item.specialInstructions!.isNotEmpty)
                              Container(
                                margin: const EdgeInsets.only(top: 4),
                                padding: const EdgeInsets.all(6),
                                decoration: BoxDecoration(
                                  color: Colors.red.shade50,
                                  borderRadius: BorderRadius.circular(4),
                                  border: Border.all(color: Colors.red.shade200),
                                ),
                                child: Row(
                                  children: [
                                    const Icon(Icons.warning_amber_rounded, color: Colors.red, size: 16),
                                    const SizedBox(width: 4),
                                    Expanded(
                                      child: Text(
                                        item.specialInstructions!.toUpperCase(),
                                        style: const TextStyle(color: Colors.red, fontWeight: FontWeight.bold, fontSize: 14),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                          ],
                        ),
                      ),
                    ],
                  );
                },
              ),
            ),
          ),
          
          // Action Button Footer
          Container(
            color: Colors.white,
            padding: const EdgeInsets.all(12),
            child: _buildActionButton(context, ref),
          ),
        ],
      ),
    );
  }
}
