import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../providers/restaurant_provider.dart';
import '../../widgets/common/drawer_navigation.dart';
import '../../widgets/status/status_badge.dart';
import '../../widgets/loading/loading_indicator.dart';
import '../../widgets/empty_states/empty_state_view.dart';
import '../../core/utils/formatters.dart';

class POSScreen extends ConsumerWidget {
  const POSScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tablesAsync = ref.watch(restaurantTablesProvider);
    final menuAsync = ref.watch(menuItemsProvider);

    return DefaultTabController(
      length: 2,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Restaurant POS'),
          bottom: const TabBar(
            tabs: [
              Tab(icon: Icon(Icons.table_restaurant), text: 'Tables Board'),
              Tab(icon: Icon(Icons.restaurant_menu), text: 'Menu Items'),
            ],
          ),
          actions: [
            IconButton(
              icon: const Icon(Icons.refresh),
              onPressed: () {
                ref.invalidate(restaurantTablesProvider);
                ref.invalidate(menuItemsProvider);
              },
            ),
          ],
        ),
        drawer: const DrawerNavigation(),
        body: TabBarView(
          children: [
            // Tab 1: Tables Board
            tablesAsync.when(
              loading: () => const LoadingIndicator(message: 'Loading tables board...'),
              error: (err, stack) => EmptyStateView(
                title: 'Error loading tables',
                description: err.toString(),
                onRetry: () => ref.refresh(restaurantTablesProvider),
              ),
              data: (tables) {
                return GridView.builder(
                  padding: const EdgeInsets.all(12),
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 2,
                    childAspectRatio: 1.3,
                    crossAxisSpacing: 10,
                    mainAxisSpacing: 10,
                  ),
                  itemCount: tables.length,
                  itemBuilder: (context, index) {
                    final table = tables[index];
                    return Card(
                      child: Padding(
                        padding: const EdgeInsets.all(12),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(
                                  table.code,
                                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
                                ),
                                StatusBadge(status: table.status),
                              ],
                            ),
                            Text('${table.name} • Cap: ${table.capacity}', style: const TextStyle(fontSize: 12, color: Colors.grey)),
                            if (table.currentOrderNumber != null)
                              Text('Order: ${table.currentOrderNumber}', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
                          ],
                        ),
                      ),
                    );
                  },
                );
              },
            ),

            // Tab 2: Menu Items
            menuAsync.when(
              loading: () => const LoadingIndicator(message: 'Loading menu...'),
              error: (err, stack) => EmptyStateView(
                title: 'Error loading menu',
                description: err.toString(),
                onRetry: () => ref.refresh(menuItemsProvider),
              ),
              data: (items) {
                return ListView.builder(
                  padding: const EdgeInsets.all(12),
                  itemCount: items.length,
                  itemBuilder: (context, index) {
                    final item = items[index];
                    return Card(
                      child: ListTile(
                        title: Text(item.name, style: const TextStyle(fontWeight: FontWeight.bold)),
                        subtitle: Text('${item.categoryName ?? ""} • Prep: ${item.preparationTime}m'),
                        trailing: Text(
                          Formatters.formatCurrency(item.price),
                          style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.blue),
                        ),
                      ),
                    );
                  },
                );
              },
            ),
          ],
        ),
      ),
    );
  }
}
