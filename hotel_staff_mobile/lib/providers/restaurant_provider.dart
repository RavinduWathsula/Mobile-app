import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/restaurant_table_model.dart';
import '../models/menu_item_model.dart';
import '../models/restaurant_order_model.dart';
import 'services_provider.dart';

final restaurantTablesProvider = FutureProvider.autoDispose<List<RestaurantTableModel>>((ref) async {
  final repo = ref.watch(restaurantRepositoryProvider);
  return await repo.getTables();
});

final selectedCategoryProvider = StateProvider<int?>((ref) => null);

final menuItemsProvider = FutureProvider.autoDispose<List<MenuItemModel>>((ref) async {
  final categoryId = ref.watch(selectedCategoryProvider);
  final repo = ref.watch(restaurantRepositoryProvider);
  return await repo.getMenuItems(categoryId: categoryId);
});

final restaurantOrdersProvider = FutureProvider.autoDispose<List<RestaurantOrderModel>>((ref) async {
  final repo = ref.watch(restaurantRepositoryProvider);
  return await repo.getOrders();
});
