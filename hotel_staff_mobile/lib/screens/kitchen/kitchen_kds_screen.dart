import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../providers/kitchen_provider.dart';
import '../../providers/services_provider.dart';
import '../../widgets/common/drawer_navigation.dart';
import '../../widgets/status/status_badge.dart';
import '../../widgets/loading/loading_indicator.dart';
import '../../widgets/empty_states/empty_state_view.dart';
import '../../models/restaurant_order_model.dart';

class KitchenKDSScreen extends ConsumerStatefulWidget {
  const KitchenKDSScreen({super.key});

  @override
  ConsumerState<KitchenKDSScreen> createState() => _KitchenKDSScreenState();
}

class _KitchenKDSScreenState extends ConsumerState<KitchenKDSScreen> {
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

  Color _getOrderColor(String status) {
    switch (status.toLowerCase()) {
      case 'pending': return Colors.red.shade100;
      case 'preparing': return Colors.orange.shade100;
      case 'ready': return Colors.green.shade100;
      default: return Colors.grey.shade100;
    }
  }

  Color _getOrderBorderColor(String status) {
    switch (status.toLowerCase()) {
      case 'pending': return Colors.red;
      case 'preparing': return Colors.orange;
      case 'ready': return Colors.green;
      default: return Colors.grey;
    }
  }

  @override
  Widget build(BuildContext context) {
    final ordersAsync = ref.watch(kitchenOrdersProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Kitchen Display (KDS)', style: TextStyle(fontWeight: FontWeight.bold)),
        backgroundColor: Colors.grey.shade900,
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => ref.invalidate(kitchenOrdersProvider),
          ),
        ],
      ),
      drawer: const DrawerNavigation(),
      backgroundColor: Colors.grey.shade200,
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

          return GridView.builder(
            padding: const EdgeInsets.all(12),
            gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: MediaQuery.of(context).size.width > 600 ? 2 : 1,
              mainAxisExtent: 350,
              crossAxisSpacing: 12,
              mainAxisSpacing: 12,
            ),
            itemCount: orders.length,
            itemBuilder: (context, index) {
              final order = orders[index];
              return Card(
                elevation: 4,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                  side: BorderSide(color: _getOrderBorderColor(order.status), width: 2),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // Header
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: _getOrderColor(order.status),
                        borderRadius: const BorderRadius.vertical(top: Radius.circular(10)),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Expanded(
                            child: Text(
                              'Order ${order.orderNumber} • ${order.tableNumber ?? "Takeaway"}',
                              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          StatusBadge(status: order.status),
                        ],
                      ),
                    ),
                    
                    // Order Info
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      child: Text('Server: ${order.creatorName ?? "Server"}', style: const TextStyle(color: Colors.grey, fontWeight: FontWeight.bold)),
                    ),
                    const Divider(height: 1),

                    // Items
                    Expanded(
                      child: ListView.separated(
                        padding: const EdgeInsets.all(8),
                        itemCount: order.items.length,
                        separatorBuilder: (_, __) => const Divider(),
                        itemBuilder: (context, itemIndex) {
                          final item = order.items[itemIndex];
                          return Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.all(8),
                                decoration: BoxDecoration(
                                  color: Colors.blue.shade50,
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: Text('${item.quantity}x', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      item.itemName,
                                      style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 16),
                                    ),
                                    if (item.specialInstructions != null && item.specialInstructions!.isNotEmpty)
                                      Text(
                                        'NOTE: ${item.specialInstructions}',
                                        style: const TextStyle(color: Colors.red, fontWeight: FontWeight.bold, fontSize: 12),
                                      ),
                                  ],
                                ),
                              ),
                              // Status Toggles
                              SegmentedButton<String>(
                                segments: const [
                                  ButtonSegment(value: 'pending', label: Text('Wait'), icon: Icon(Icons.hourglass_empty, size: 16)),
                                  ButtonSegment(value: 'preparing', label: Text('Prep'), icon: Icon(Icons.soup_kitchen, size: 16)),
                                  ButtonSegment(value: 'ready', label: Text('Ready'), icon: Icon(Icons.check, size: 16)),
                                ],
                                selected: {
                                  if (['pending', 'preparing', 'ready'].contains(item.status)) item.status else 'pending'
                                },
                                onSelectionChanged: (Set<String> newSelection) {
                                  _updateItemStatus(context, ref, order.id, item.id, newSelection.first);
                                },
                                style: const ButtonStyle(
                                  visualDensity: VisualDensity.compact,
                                ),
                              ),
                            ],
                          );
                        },
                      ),
                    ),
                  ],
                ),
              );
            },
          );
        },
      ),
    );
  }
}
