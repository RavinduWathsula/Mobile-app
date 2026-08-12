import 'dart:async';
import 'dart:math';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../providers/kitchen_provider.dart';
import '../../providers/services_provider.dart';
import '../../providers/restaurant_provider.dart';
import '../../providers/dashboard_provider.dart';
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
        backgroundColor: const Color(0xFF121212), // Dark theme for kitchen
        appBar: AppBar(
          title: const Text('Kitchen Display System (KDS)', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 24, letterSpacing: 1.2)),
          backgroundColor: const Color(0xFF1E1E1E),
          foregroundColor: Colors.white,
          elevation: 4,
          bottom: const TabBar(
            labelColor: AppColors.primary,
            unselectedLabelColor: Colors.grey,
            indicatorColor: AppColors.primary,
            indicatorWeight: 4,
            labelStyle: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, letterSpacing: 1),
            tabs: [
              Tab(text: 'NEW ORDERS'),
              Tab(text: 'PREPARING'),
              Tab(text: 'READY FOR PICKUP'),
            ],
          ),
          actions: [
            IconButton(
              icon: const Icon(Icons.refresh, size: 28),
              onPressed: () => ref.invalidate(kitchenOrdersProvider),
            ),
            const SizedBox(width: 16),
          ],
        ),
        drawer: const DrawerNavigation(),
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
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.check_circle_outline, size: 80, color: Colors.grey.shade700),
            const SizedBox(height: 16),
            Text(
              emptyMessage,
              style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.grey.shade600),
            ),
            const SizedBox(height: 8),
            Text(
              'Kitchen is all caught up!',
              style: TextStyle(fontSize: 16, color: Colors.grey.shade500),
            ),
          ],
        ),
      );
    }

    return GridView.builder(
      padding: const EdgeInsets.all(16),
      gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: MediaQuery.of(context).size.width > 1200 ? 4 : (MediaQuery.of(context).size.width > 800 ? 3 : (MediaQuery.of(context).size.width > 550 ? 2 : 1)),
        mainAxisExtent: 580,
        crossAxisSpacing: 16,
        mainAxisSpacing: 16,
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
      ref.invalidate(restaurantOrdersProvider);
      ref.invalidate(activeOrdersCountProvider);
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e'), backgroundColor: Colors.red));
      }
    }
  }

  // Helper for mock images since model doesn't store them in items
  String _getImageForMenuItem(int id) {
    final images = [
      'https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&q=80&w=200',
      'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&q=80&w=200',
      'https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&q=80&w=200',
      'https://images.unsplash.com/photo-1624353365286-3f8d62daad51?auto=format&fit=crop&q=80&w=200',
      'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?auto=format&fit=crop&q=80&w=200',
    ];
    return images[id % images.length];
  }

  Widget _buildActionButton(BuildContext context, WidgetRef ref) {
    if (tabType == 'pending') {
      return ElevatedButton(
        style: ElevatedButton.styleFrom(
          backgroundColor: Colors.orange.shade700,
          foregroundColor: Colors.white,
          minimumSize: const Size.fromHeight(60),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          elevation: 0,
        ),
        onPressed: () => _updateStatus(context, ref, 'preparing'),
        child: const Text('START PREPARING', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, letterSpacing: 1.2)),
      );
    } else if (tabType == 'preparing') {
      return ElevatedButton(
        style: ElevatedButton.styleFrom(
          backgroundColor: Colors.green.shade600,
          foregroundColor: Colors.white,
          minimumSize: const Size.fromHeight(60),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          elevation: 0,
        ),
        onPressed: () => _updateStatus(context, ref, 'ready'),
        child: const Text('MARK READY', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, letterSpacing: 1.2)),
      );
    } else if (tabType == 'ready') {
      return ElevatedButton(
        style: ElevatedButton.styleFrom(
          backgroundColor: Colors.blue.shade600,
          foregroundColor: Colors.white,
          minimumSize: const Size.fromHeight(60),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          elevation: 0,
        ),
        onPressed: () => _updateStatus(context, ref, 'served'),
        child: const Text('MARK SERVED', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, letterSpacing: 1.2)),
      );
    }
    return const SizedBox();
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isDelayed = tabType == 'pending';
    
    // Data Analysis Mock Calculations
    final totalPrepTime = order.items.fold<int>(0, (sum, item) => sum + (item.preparationTime ?? 15));
    final uniqueItems = order.items.length;
    final maxPrepTime = order.items.isEmpty ? 0 : order.items.map((i) => i.preparationTime ?? 15).reduce(max);
    
    // Complexity analysis
    String complexity = 'Low';
    Color complexityColor = Colors.green;
    if (uniqueItems > 4 || maxPrepTime > 20) {
      complexity = 'High';
      complexityColor = Colors.red;
    } else if (uniqueItems > 2 || maxPrepTime > 15) {
      complexity = 'Medium';
      complexityColor = Colors.orange;
    }

    return Container(
      decoration: BoxDecoration(
        color: const Color(0xFF1E1E1E),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: isDelayed ? Colors.orange.withOpacity(0.5) : Colors.white10, width: 2),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.3),
            blurRadius: 10,
            offset: const Offset(0, 4),
          )
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Header
          Container(
            padding: const EdgeInsets.all(16),
            decoration: const BoxDecoration(
              color: Color(0xFF2C2C2C),
              borderRadius: BorderRadius.only(topLeft: Radius.circular(14), topRight: Radius.circular(14)),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        order.orderNumber,
                        style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 22, letterSpacing: 1),
                      ),
                      const SizedBox(height: 4),
                      Row(
                        children: [
                          Icon(Icons.restaurant_menu, size: 14, color: Colors.grey.shade400),
                          const SizedBox(width: 4),
                          Text(
                            order.orderType.toUpperCase().replaceAll('_', ' '),
                            style: TextStyle(color: Colors.grey.shade400, fontSize: 12, fontWeight: FontWeight.w600),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  decoration: BoxDecoration(
                    color: AppColors.primary.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: AppColors.primary.withOpacity(0.5)),
                  ),
                  child: Column(
                    children: [
                      Text(
                        order.tableNumber != null ? 'TABLE' : (order.roomNumber != null ? 'ROOM' : 'ORDER'),
                        style: TextStyle(color: AppColors.primary, fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 1),
                      ),
                      Text(
                        order.tableNumber ?? order.roomNumber ?? '-',
                        style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          
          // Data Analysis Bar
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              border: Border(bottom: BorderSide(color: Colors.grey.shade800)),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                _buildAnalyticChip(Icons.timer_outlined, 'Est. Prep', '$maxPrepTime min', Colors.blue.shade300),
                _buildAnalyticChip(Icons.analytics_outlined, 'Complexity', complexity, complexityColor),
                _buildAnalyticChip(Icons.receipt_long, 'Items', '$uniqueItems', Colors.purple.shade300),
              ],
            ),
          ),

          // Items List
          Expanded(
            child: ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: order.items.length,
              separatorBuilder: (context, index) => const Divider(height: 24, color: Colors.white10),
              itemBuilder: (context, index) {
                final item = order.items[index];
                final hasInstructions = item.specialInstructions != null && item.specialInstructions!.isNotEmpty;
                
                return Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Quantity Badge
                    Container(
                      width: 40,
                      height: 40,
                      alignment: Alignment.center,
                      decoration: BoxDecoration(
                        color: Colors.grey.shade800,
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: Colors.grey.shade600),
                      ),
                      child: Text(
                        '${item.quantity}',
                        style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold),
                      ),
                    ),
                    const SizedBox(width: 12),
                    
                    // Food Photo
                    ClipRRect(
                      borderRadius: BorderRadius.circular(8),
                      child: Image.network(
                        _getImageForMenuItem(item.menuItemId),
                        width: 60,
                        height: 60,
                        fit: BoxFit.cover,
                        errorBuilder: (context, error, stackTrace) => Container(
                          width: 60, height: 60, color: Colors.grey.shade800,
                          child: const Icon(Icons.fastfood, color: Colors.white54),
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    
                    // Item Details
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            item.itemName,
                            style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w600),
                          ),
                          if (item.preparationTime != null)
                            Padding(
                              padding: const EdgeInsets.only(top: 4.0),
                              child: Text(
                                '${item.preparationTime} min prep',
                                style: TextStyle(color: Colors.grey.shade500, fontSize: 12),
                              ),
                            ),
                          if (hasInstructions)
                            Container(
                              margin: const EdgeInsets.only(top: 8),
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                              decoration: BoxDecoration(
                                color: Colors.red.withOpacity(0.15),
                                borderRadius: BorderRadius.circular(6),
                                border: Border.all(color: Colors.red.withOpacity(0.3)),
                              ),
                              child: Row(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const Icon(Icons.warning_amber_rounded, color: Colors.redAccent, size: 16),
                                  const SizedBox(width: 6),
                                  Expanded(
                                    child: Text(
                                      item.specialInstructions!.toUpperCase(),
                                      style: const TextStyle(color: Colors.redAccent, fontWeight: FontWeight.bold, fontSize: 12, letterSpacing: 0.5),
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
          
          // Action Button Footer
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: const Color(0xFF2C2C2C),
              borderRadius: const BorderRadius.only(bottomLeft: Radius.circular(14), bottomRight: Radius.circular(14)),
              border: Border(top: BorderSide(color: Colors.grey.shade800)),
            ),
            child: Column(
              children: [
                if (tabType == 'preparing')
                  Padding(
                    padding: const EdgeInsets.only(bottom: 12.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text('Preparation Progress', style: TextStyle(color: Colors.grey.shade400, fontSize: 12)),
                            Text('Est. $maxPrepTime min', style: TextStyle(color: Colors.grey.shade400, fontSize: 12)),
                          ],
                        ),
                        const SizedBox(height: 6),
                        LinearProgressIndicator(
                          value: 0.6, // Mock progress
                          backgroundColor: Colors.grey.shade800,
                          color: AppColors.primary,
                          minHeight: 6,
                          borderRadius: BorderRadius.circular(3),
                        ),
                      ],
                    ),
                  ),
                _buildActionButton(context, ref),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAnalyticChip(IconData icon, String label, String value, Color color) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(icon, size: 14, color: Colors.grey.shade500),
            const SizedBox(width: 4),
            Text(label, style: TextStyle(color: Colors.grey.shade500, fontSize: 11)),
          ],
        ),
        const SizedBox(height: 2),
        Text(value, style: TextStyle(color: color, fontSize: 15, fontWeight: FontWeight.bold)),
      ],
    );
  }
}
