import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/restaurant_table_model.dart';
import '../models/menu_item_model.dart';
import '../models/restaurant_order_model.dart';
import 'services_provider.dart';

final restaurantTablesProvider = FutureProvider.autoDispose<List<RestaurantTableModel>>((ref) async {
  final repo = ref.watch(restaurantRepositoryProvider);
  return await repo.getTables();
});

final posCategoryFilterProvider = StateProvider<String>((ref) => 'All');
final posSearchQueryProvider = StateProvider<String>((ref) => '');

final menuItemsProvider = FutureProvider.autoDispose<List<MenuItemModel>>((ref) async {
  final repo = ref.watch(restaurantRepositoryProvider);
  // Fetch all available menu items
  final allItems = await repo.getMenuItems();
  
  final categoryFilter = ref.watch(posCategoryFilterProvider);
  final searchQuery = ref.watch(posSearchQueryProvider).toLowerCase();

  return allItems.where((item) {
    // 1. Category Filter
    bool matchesCategory = true;
    if (categoryFilter != 'All') {
      matchesCategory = item.categoryName?.toLowerCase() == categoryFilter.toLowerCase();
    }

    // 2. Search Query Filter
    bool matchesSearch = true;
    if (searchQuery.isNotEmpty) {
      matchesSearch = item.name.toLowerCase().contains(searchQuery);
    }

    return matchesCategory && matchesSearch;
  }).toList();
});

final restaurantOrdersProvider = FutureProvider.autoDispose<List<RestaurantOrderModel>>((ref) async {
  final repo = ref.watch(restaurantRepositoryProvider);
  return await repo.getOrders();
});
