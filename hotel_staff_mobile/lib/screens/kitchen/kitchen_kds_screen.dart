import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../providers/kitchen_provider.dart';
import '../../providers/services_provider.dart';
import '../../widgets/common/drawer_navigation.dart';
import '../../widgets/status/status_badge.dart';
import '../../widgets/loading/loading_indicator.dart';
import '../../widgets/empty_states/empty_state_view.dart';

class KitchenKDSScreen extends ConsumerWidget {
  const KitchenKDSScreen({super.key});

  void _updateItemStatus(
    BuildContext context,
    WidgetRef ref,
    int orderId,
    int itemId,
    String status,
  ) async {
    try {
      final repo = ref.read(restaurantRepositoryProvider);
      await repo.updateOrderItemStatus(orderId, itemId, status);
      ref.invalidate(kitchenOrdersProvider);
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString())),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final ordersAsync = ref.watch(kitchenOrdersProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Kitchen Display (KDS)'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => ref.invalidate(kitchenOrdersProvider),
          ),
        ],
      ),
      drawer: const DrawerNavigation(),
      body: ordersAsync.when(
        loading: () => const LoadingIndicator(message: 'Connecting to live kitchen feed...'),
        error: (err, stack) => EmptyStateView(
          title: 'Error loading kitchen orders',
          description: err.toString(),
          onRetry: () => ref.invalidate(kitchenOrdersProvider),
        ),
        data: (orders) {
          if (orders.isEmpty) {
            return const EmptyStateView(
              icon: Icons.kitchen_outlined,
              title: 'Kitchen Queue Empty',
              description: 'There are no active orders waiting to be prepared.',
            );
          }

          return ListView.builder(
            padding: const EdgeInsets.all(12),
            itemCount: orders.length,
            itemBuilder: (context, index) {
              final order = orders[index];
              return Card(
                color: Colors.orange.withValues(alpha: 0.04),
                child: Padding(
                  padding: const EdgeInsets.all(14),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            'Order ${order.orderNumber} (${order.tableNumber ?? "Takeaway"})',
                            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                          ),
                          StatusBadge(status: order.status),
                        ],
                      ),
                      const SizedBox(height: 6),
                      Text('Staff: ${order.creatorName ?? "Server"}'),
                      const Divider(),
                      ...order.items.map((item) => Padding(
                            padding: const EdgeInsets.symmetric(vertical: 4),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        '${item.quantity}x ${item.itemName}',
                                        style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 15),
                                      ),
                                      if (item.specialInstructions != null)
                                        Text('Note: ${item.specialInstructions}', style: const TextStyle(color: Colors.red, fontSize: 12)),
                                    ],
                                  ),
                                ),
                                DropdownButton<String>(
                                  value: item.status,
                                  items: ['pending', 'preparing', 'ready', 'served', 'cancelled']
                                      .map((s) => DropdownMenuItem(value: s, child: Text(s.toUpperCase(), style: const TextStyle(fontSize: 12))))
                                      .toList(),
                                  onChanged: (val) {
                                    if (val != null) {
                                      _updateItemStatus(context, ref, order.id, item.id, val);
                                    }
                                  },
                                ),
                              ],
                            ),
                          )),
                    ],
                  ),
                ),
              );
            },
          );
        },
      ),
    );
  }
}
