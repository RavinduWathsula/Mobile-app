import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/restaurant_order_model.dart';
import 'services_provider.dart';

final kitchenOrdersProvider = FutureProvider.autoDispose<List<RestaurantOrderModel>>((ref) async {
  final repo = ref.watch(restaurantRepositoryProvider);
  return await repo.getKitchenOrders();
});
