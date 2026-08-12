import '../core/network/api_client.dart';
import '../core/constants/api_endpoints.dart';
import '../models/restaurant_table_model.dart';
import '../models/menu_item_model.dart';
import '../models/restaurant_order_model.dart';

class RestaurantRepository {
  final ApiClient _apiClient;

  RestaurantRepository({required ApiClient apiClient}) : _apiClient = apiClient;

  // Stateful mock data for development
  static final List<RestaurantOrderModel> _mockOrders = [
    RestaurantOrderModel(
      id: 1, 
      orderNumber: 'ORD-101', 
      orderType: 'dine_in', 
      tableNumber: 'T-02', 
      status: 'pending', 
      subtotal: 40.0, 
      taxAmount: 4.0, 
      serviceCharge: 2.5, 
      discount: 0.0, 
      totalAmount: 46.50, 
      paymentStatus: 'unpaid', 
      creatorName: 'John Server',
      items: [
        OrderItemModel(
          id: 1, menuItemId: 1, itemName: 'Sawingir Special Fried Rice', quantity: 2, unitPrice: 18.50, totalPrice: 37.0, status: 'pending', preparationTime: 15, specialInstructions: 'Extra spicy',
        ),
        OrderItemModel(
          id: 2, menuItemId: 11, itemName: 'Fresh Tropical Fruit Juice', quantity: 1, unitPrice: 6.50, totalPrice: 6.50, status: 'pending', preparationTime: 5,
        )
      ],
    ),
  ];

  static final List<MenuItemModel> _mockMenu = [
    // Mains
    MenuItemModel(id: 1, categoryId: 1, name: 'Sawingir Special Fried Rice', price: 18.50, preparationTime: 15, isVegetarian: false, isSpicy: true, isAvailable: true, categoryName: 'Mains', imageUrl: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&q=80&w=300'),
    MenuItemModel(id: 2, categoryId: 1, name: 'Grilled Salmon Steak', price: 28.00, preparationTime: 25, isVegetarian: false, isSpicy: false, isAvailable: true, categoryName: 'Mains', imageUrl: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&q=80&w=300'),
    MenuItemModel(id: 3, categoryId: 1, name: 'Spaghetti Carbonara', price: 22.00, preparationTime: 20, isVegetarian: false, isSpicy: false, isAvailable: true, categoryName: 'Mains', imageUrl: 'https://images.unsplash.com/photo-1612874742237-6526221588e3?auto=format&fit=crop&q=80&w=300'),
    MenuItemModel(id: 4, categoryId: 1, name: 'Vegan Buddha Bowl', price: 19.50, preparationTime: 12, isVegetarian: true, isSpicy: false, isAvailable: true, categoryName: 'Mains', imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80&w=300'),
    MenuItemModel(id: 5, categoryId: 1, name: 'Spicy Chicken Curry', price: 24.00, preparationTime: 30, isVegetarian: false, isSpicy: true, isAvailable: true, categoryName: 'Mains', imageUrl: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&q=80&w=300'),
    MenuItemModel(id: 6, categoryId: 1, name: 'Beef Burger & Fries', price: 21.00, preparationTime: 18, isVegetarian: false, isSpicy: false, isAvailable: true, categoryName: 'Mains', imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=300'),
    
    // Starters
    MenuItemModel(id: 7, categoryId: 4, name: 'Crispy Calamari Rings', price: 14.00, preparationTime: 10, isVegetarian: false, isSpicy: false, isAvailable: true, categoryName: 'Starters', imageUrl: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?auto=format&fit=crop&q=80&w=300'),
    MenuItemModel(id: 8, categoryId: 4, name: 'Garlic Bread with Cheese', price: 8.50, preparationTime: 8, isVegetarian: true, isSpicy: false, isAvailable: true, categoryName: 'Starters', imageUrl: 'https://images.unsplash.com/photo-1573140247632-f8fd74997d5c?auto=format&fit=crop&q=80&w=300'),
    MenuItemModel(id: 9, categoryId: 4, name: 'Spicy Chicken Wings', price: 12.00, preparationTime: 15, isVegetarian: false, isSpicy: true, isAvailable: true, categoryName: 'Starters', imageUrl: 'https://images.unsplash.com/photo-1524114664604-cd8133cd67ad?auto=format&fit=crop&q=80&w=300'),
    MenuItemModel(id: 10, categoryId: 4, name: 'Tomato Bruschetta', price: 9.00, preparationTime: 10, isVegetarian: true, isSpicy: false, isAvailable: true, categoryName: 'Starters', imageUrl: 'https://images.unsplash.com/photo-1572695157366-5e585ab2b69f?auto=format&fit=crop&q=80&w=300'),
    
    // Beverages
    MenuItemModel(id: 11, categoryId: 2, name: 'Fresh Tropical Fruit Juice', price: 6.50, preparationTime: 5, isVegetarian: true, isSpicy: false, isAvailable: true, categoryName: 'Beverages', imageUrl: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&q=80&w=300'),
    MenuItemModel(id: 12, categoryId: 2, name: 'Iced Caramel Macchiato', price: 5.50, preparationTime: 5, isVegetarian: true, isSpicy: false, isAvailable: true, categoryName: 'Beverages', imageUrl: 'https://images.unsplash.com/photo-1582216503927-4a0b36873919?auto=format&fit=crop&q=80&w=300'),
    MenuItemModel(id: 13, categoryId: 2, name: 'Classic Mojito', price: 10.00, preparationTime: 5, isVegetarian: true, isSpicy: false, isAvailable: true, categoryName: 'Beverages', imageUrl: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&q=80&w=300'),
    MenuItemModel(id: 14, categoryId: 2, name: 'Mango Lassi', price: 7.00, preparationTime: 5, isVegetarian: true, isSpicy: false, isAvailable: true, categoryName: 'Beverages', imageUrl: 'https://images.unsplash.com/photo-1546171753-97d7676e4602?auto=format&fit=crop&q=80&w=300'),
    
    // Desserts
    MenuItemModel(id: 15, categoryId: 3, name: 'Chocolate Lava Cake', price: 12.00, preparationTime: 12, isVegetarian: true, isSpicy: false, isAvailable: true, categoryName: 'Desserts', imageUrl: 'https://images.unsplash.com/photo-1624353365286-3f8d62daad51?auto=format&fit=crop&q=80&w=300'),
    MenuItemModel(id: 16, categoryId: 3, name: 'New York Cheesecake', price: 11.00, preparationTime: 5, isVegetarian: true, isSpicy: false, isAvailable: true, categoryName: 'Desserts', imageUrl: 'https://images.unsplash.com/photo-1524351199678-941a58a3df50?auto=format&fit=crop&q=80&w=300'),
    MenuItemModel(id: 17, categoryId: 3, name: 'Tiramisu', price: 14.00, preparationTime: 5, isVegetarian: true, isSpicy: false, isAvailable: true, categoryName: 'Desserts', imageUrl: 'https://images.unsplash.com/photo-1571115177098-24edf523e440?auto=format&fit=crop&q=80&w=300'),
  ];

  static final List<RestaurantTableModel> _mockTables = [
    RestaurantTableModel(id: 1, code: 'T-01', name: 'Table 1', area: 'Main Hall', capacity: 2, isActive: true, status: 'available', openOrderCount: 0),
    RestaurantTableModel(id: 2, code: 'T-02', name: 'Table 2', area: 'Main Hall', capacity: 4, isActive: true, status: 'occupied', openOrderCount: 1, currentOrderNumber: 'ORD-101'),
    RestaurantTableModel(id: 3, code: 'T-03', name: 'Table 3', area: 'Main Hall', capacity: 4, isActive: true, status: 'available', openOrderCount: 0),
    RestaurantTableModel(id: 4, code: 'T-04', name: 'Table 4', area: 'Main Hall', capacity: 6, isActive: true, status: 'reserved', openOrderCount: 0),
    RestaurantTableModel(id: 5, code: 'T-05', name: 'Table 5', area: 'Garden', capacity: 2, isActive: true, status: 'available', openOrderCount: 0),
    RestaurantTableModel(id: 6, code: 'T-06', name: 'Table 6', area: 'Garden', capacity: 2, isActive: true, status: 'available', openOrderCount: 0),
    RestaurantTableModel(id: 7, code: 'T-07', name: 'Table 7', area: 'Garden', capacity: 8, isActive: true, status: 'available', openOrderCount: 0),
    RestaurantTableModel(id: 8, code: 'T-08', name: 'Table 8', area: 'Balcony', capacity: 4, isActive: true, status: 'available', openOrderCount: 0),
    RestaurantTableModel(id: 9, code: 'T-09', name: 'Table 9', area: 'Balcony', capacity: 4, isActive: true, status: 'maintenance', openOrderCount: 0),
    RestaurantTableModel(id: 10, code: 'T-10', name: 'Table 10', area: 'Private VIP', capacity: 12, isActive: true, status: 'available', openOrderCount: 0),
  ];

  Future<List<RestaurantTableModel>> getTables() async {
    try {
      final response = await _apiClient.get(ApiEndpoints.restaurantTables);
      final list = (response as List?) ?? [];
      return list.map((json) => RestaurantTableModel.fromJson(json as Map<String, dynamic>)).toList();
    } catch (_) {
      // Update tables with latest order info
      for (var i = 0; i < _mockTables.length; i++) {
        final table = _mockTables[i];
        final activeOrder = _mockOrders.where((o) => o.tableNumber == table.code && o.status != 'completed').firstOrNull;
        if (activeOrder != null) {
          _mockTables[i] = RestaurantTableModel(
            id: table.id, code: table.code, name: table.name, area: table.area, capacity: table.capacity, 
            isActive: table.isActive, status: 'occupied', openOrderCount: 1, currentOrderNumber: activeOrder.orderNumber
          );
        } else if (table.status == 'occupied') {
          // If occupied but no order, make it available
          _mockTables[i] = RestaurantTableModel(
            id: table.id, code: table.code, name: table.name, area: table.area, capacity: table.capacity, 
            isActive: table.isActive, status: 'available', openOrderCount: 0
          );
        }
      }
      return _mockTables;
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
      return _mockMenu;
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
      var filtered = _mockOrders;
      if (status != null && status.isNotEmpty) {
        filtered = filtered.where((o) => o.status == status).toList();
      }
      if (active) {
        filtered = filtered.where((o) => o.status != 'completed').toList();
      }
      return filtered;
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
      final newId = _mockOrders.length + 1;
      
      final parsedItems = items.map((i) {
        final menuItemId = i['menuItemId'] as int;
        final qty = i['quantity'] as int;
        final menuItem = _mockMenu.firstWhere((m) => m.id == menuItemId, orElse: () => _mockMenu.first);
        return OrderItemModel(
          id: DateTime.now().millisecondsSinceEpoch,
          menuItemId: menuItem.id,
          itemName: menuItem.name,
          quantity: qty,
          unitPrice: menuItem.price,
          totalPrice: menuItem.price * qty,
          status: 'pending',
          preparationTime: menuItem.preparationTime,
          specialInstructions: i['specialInstructions'],
        );
      }).toList();

      final subtotal = parsedItems.fold(0.0, (sum, i) => sum + i.totalPrice);
      final order = RestaurantOrderModel(
        id: newId, 
        orderNumber: 'ORD-${100 + newId}', 
        orderType: orderType, 
        tableNumber: tableNumber, 
        status: 'pending', 
        subtotal: subtotal, 
        taxAmount: subtotal * 0.1, 
        serviceCharge: subtotal * 0.05, 
        discount: 0.0, 
        totalAmount: subtotal * 1.15, 
        paymentStatus: 'unpaid', 
        notes: notes,
        creatorName: 'Mobile User',
        items: parsedItems,
      );
      
      _mockOrders.insert(0, order); // add to top
      return order;
    }
  }

  Future<List<RestaurantOrderModel>> getKitchenOrders() async {
    try {
      final response = await _apiClient.get(ApiEndpoints.restaurantKitchen);
      final list = (response as List?) ?? [];
      return list.map((json) => RestaurantOrderModel.fromJson(json as Map<String, dynamic>)).toList();
    } catch (_) {
      return _mockOrders.where((o) => ['pending', 'preparing', 'ready'].contains(o.status)).toList();
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
      throw UnimplementedError('Mock updateOrderItemStatus not implemented completely');
    }
  }

  Future<RestaurantOrderModel> updateOrderStatus(
    int orderId,
    String status,
  ) async {
    try {
      final response = await _apiClient.patch(
        '${ApiEndpoints.restaurantOrders}/$orderId/status',
        data: {'status': status},
      );
      return RestaurantOrderModel.fromJson(response as Map<String, dynamic>);
    } catch (_) {
      final index = _mockOrders.indexWhere((o) => o.id == orderId);
      if (index != -1) {
        final o = _mockOrders[index];
        _mockOrders[index] = RestaurantOrderModel(
          id: o.id, orderNumber: o.orderNumber, orderType: o.orderType, tableNumber: o.tableNumber, 
          roomId: o.roomId, guestId: o.guestId, status: status, subtotal: o.subtotal, taxAmount: o.taxAmount, 
          serviceCharge: o.serviceCharge, discount: o.discount, totalAmount: o.totalAmount, paymentStatus: o.paymentStatus, 
          notes: o.notes, creatorName: o.creatorName, roomNumber: o.roomNumber, items: o.items
        );
        return _mockOrders[index];
      }
      throw Exception('Order not found in mock state');
    }
  }
}
