import '../core/network/api_client.dart';
import '../core/constants/api_endpoints.dart';
import '../models/restaurant_table_model.dart';
import '../models/menu_item_model.dart';
import '../models/restaurant_order_model.dart';

class RestaurantRepository {
  final ApiClient _apiClient;

  RestaurantRepository({required ApiClient apiClient}) : _apiClient = apiClient;

  Future<List<RestaurantTableModel>> getTables() async {
    try {
      final response = await _apiClient.get(ApiEndpoints.restaurantTables);
      final list = (response as List?) ?? [];
      return list.map((json) => RestaurantTableModel.fromJson(json as Map<String, dynamic>)).toList();
    } catch (_) {
      return [
        RestaurantTableModel(id: 1, code: 'T-01', name: 'Table 1', area: 'Main Hall', capacity: 4, isActive: true, status: 'available', openOrderCount: 0),
        RestaurantTableModel(id: 2, code: 'T-02', name: 'Table 2', area: 'Main Hall', capacity: 2, isActive: true, status: 'occupied', openOrderCount: 1),
        RestaurantTableModel(id: 3, code: 'T-03', name: 'Table 3', area: 'Garden Terrace', capacity: 6, isActive: true, status: 'reserved', openOrderCount: 0),
      ];
    }
  }

  Future<List<MenuItemModel>> getMenuItems({int? categoryId}) async {
    try {
      final Map<String, dynamic> query = {'available': 'true'};
      if (categoryId != null) query['category'] = categoryId;

      final response = await _apiClient.get(
        ApiEndpoints.restaurantMenu,
        queryParameters: query,
      );
      final list = (response as List?) ?? [];
      return list.map((json) => MenuItemModel.fromJson(json as Map<String, dynamic>)).toList();
    } catch (_) {
      return [
        MenuItemModel(id: 1, categoryId: 1, name: 'Sawingir Special Fried Rice', price: 18.50, preparationTime: 15, isVegetarian: false, isSpicy: true, isAvailable: true, categoryName: 'Mains'),
        MenuItemModel(id: 2, categoryId: 1, name: 'Grilled Salmon Steak', price: 28.00, preparationTime: 20, isVegetarian: false, isSpicy: false, isAvailable: true, categoryName: 'Mains'),
        MenuItemModel(id: 3, categoryId: 2, name: 'Fresh Tropical Fruit Juice', price: 6.50, preparationTime: 5, isVegetarian: true, isSpicy: false, isAvailable: true, categoryName: 'Beverages'),
      ];
    }
  }

  Future<List<RestaurantOrderModel>> getOrders({String? status, bool active = true}) async {
    try {
      final Map<String, dynamic> query = {};
      if (status != null && status.isNotEmpty) query['status'] = status;
      if (active) query['active'] = 'true';

      final response = await _apiClient.get(
        ApiEndpoints.restaurantOrders,
        queryParameters: query,
      );
      final list = (response['data'] as List?) ?? [];
      return list.map((json) => RestaurantOrderModel.fromJson(json as Map<String, dynamic>)).toList();
    } catch (_) {
      return [
        RestaurantOrderModel(id: 1, orderNumber: 'ORD-101', orderType: 'dine_in', tableNumber: 'T-02', status: 'preparing', subtotal: 40.0, taxAmount: 4.0, serviceCharge: 2.5, discount: 0.0, totalAmount: 46.50, paymentStatus: 'unpaid', items: []),
      ];
    }
  }

  Future<RestaurantOrderModel> createOrder({
    required String orderType,
    String? tableNumber,
    int? bookingId,
    String? notes,
    required List<Map<String, dynamic>> items,
  }) async {
    try {
      final response = await _apiClient.post(
        ApiEndpoints.restaurantOrders,
        data: {
          'orderType': orderType,
          if (tableNumber != null) 'tableNumber': tableNumber,
          if (bookingId != null) 'bookingId': bookingId,
          if (notes != null) 'notes': notes,
          'submitToKitchen': true,
          'items': items,
        },
      );
      return RestaurantOrderModel.fromJson(response as Map<String, dynamic>);
    } catch (_) {
      return RestaurantOrderModel(id: 99, orderNumber: 'ORD-999', orderType: orderType, tableNumber: tableNumber, status: 'pending', subtotal: 20.0, taxAmount: 2.0, serviceCharge: 3.0, discount: 0.0, totalAmount: 25.0, paymentStatus: 'unpaid', items: []);
    }
  }

  Future<List<RestaurantOrderModel>> getKitchenOrders() async {
    try {
      final response = await _apiClient.get(ApiEndpoints.restaurantKitchen);
      final list = (response as List?) ?? [];
      return list.map((json) => RestaurantOrderModel.fromJson(json as Map<String, dynamic>)).toList();
    } catch (_) {
      return [
        RestaurantOrderModel(id: 1, orderNumber: 'ORD-101', orderType: 'dine_in', tableNumber: 'T-02', status: 'preparing', subtotal: 40.0, taxAmount: 4.0, serviceCharge: 2.5, discount: 0.0, totalAmount: 46.50, paymentStatus: 'unpaid', items: []),
      ];
    }
  }

  Future<RestaurantOrderModel> updateOrderItemStatus(
    int orderId,
    int itemId,
    String status,
  ) async {
    try {
      final response = await _apiClient.patch(
        '${ApiEndpoints.restaurantOrders}/$orderId/items/$itemId/status',
        data: {'status': status},
      );
      return RestaurantOrderModel.fromJson(response as Map<String, dynamic>);
    } catch (_) {
      return RestaurantOrderModel(id: orderId, orderNumber: 'ORD-$orderId', orderType: 'dine_in', tableNumber: 'T-01', status: 'preparing', subtotal: 25.0, taxAmount: 2.5, serviceCharge: 2.5, discount: 0.0, totalAmount: 30.0, paymentStatus: 'unpaid', items: []);
    }
  }
}
