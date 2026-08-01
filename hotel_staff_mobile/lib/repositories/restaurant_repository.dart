import '../core/network/api_client.dart';
import '../core/constants/api_endpoints.dart';
import '../models/restaurant_table_model.dart';
import '../models/menu_item_model.dart';
import '../models/restaurant_order_model.dart';

class RestaurantRepository {
  final ApiClient _apiClient;

  RestaurantRepository({required ApiClient apiClient}) : _apiClient = apiClient;

  Future<List<RestaurantTableModel>> getTables() async {
    final response = await _apiClient.get(ApiEndpoints.restaurantTables);
    final list = (response as List?) ?? [];
    return list.map((json) => RestaurantTableModel.fromJson(json as Map<String, dynamic>)).toList();
  }

  Future<List<MenuItemModel>> getMenuItems({int? categoryId}) async {
    final Map<String, dynamic> query = {'available': 'true'};
    if (categoryId != null) query['category'] = categoryId;

    final response = await _apiClient.get(
      ApiEndpoints.restaurantMenu,
      queryParameters: query,
    );
    final list = (response as List?) ?? [];
    return list.map((json) => MenuItemModel.fromJson(json as Map<String, dynamic>)).toList();
  }

  Future<List<RestaurantOrderModel>> getOrders({String? status, bool active = true}) async {
    final Map<String, dynamic> query = {};
    if (status != null && status.isNotEmpty) query['status'] = status;
    if (active) query['active'] = 'true';

    final response = await _apiClient.get(
      ApiEndpoints.restaurantOrders,
      queryParameters: query,
    );
    final list = (response['data'] as List?) ?? [];
    return list.map((json) => RestaurantOrderModel.fromJson(json as Map<String, dynamic>)).toList();
  }

  Future<RestaurantOrderModel> createOrder({
    required String orderType,
    String? tableNumber,
    int? bookingId,
    String? notes,
    required List<Map<String, dynamic>> items,
  }) async {
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
  }

  Future<List<RestaurantOrderModel>> getKitchenOrders() async {
    final response = await _apiClient.get(ApiEndpoints.restaurantKitchen);
    final list = (response as List?) ?? [];
    return list.map((json) => RestaurantOrderModel.fromJson(json as Map<String, dynamic>)).toList();
  }

  Future<RestaurantOrderModel> updateOrderItemStatus(
    int orderId,
    int itemId,
    String status,
  ) async {
    final response = await _apiClient.patch(
      '${ApiEndpoints.restaurantOrders}/$orderId/items/$itemId/status',
      data: {'status': status},
    );
    return RestaurantOrderModel.fromJson(response as Map<String, dynamic>);
  }
}
