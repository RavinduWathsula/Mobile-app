class OrderItemModel {
  final int id;
  final int menuItemId;
  final String itemName;
  final int quantity;
  final double unitPrice;
  final double totalPrice;
  final String status;
  final String? specialInstructions;
  final int? preparationTime;

  OrderItemModel({
    required this.id,
    required this.menuItemId,
    required this.itemName,
    required this.quantity,
    required this.unitPrice,
    required this.totalPrice,
    required this.status,
    this.specialInstructions,
    this.preparationTime,
  });

  factory OrderItemModel.fromJson(Map<String, dynamic> json) {
    return OrderItemModel(
      id: json['id'] as int,
      menuItemId: json['menuItemId'] as int,
      itemName: json['menuItem']?['name'] as String? ?? 'Item',
      quantity: json['quantity'] as int? ?? 1,
      unitPrice: double.tryParse(json['unitPrice']?.toString() ?? '0') ?? 0.0,
      totalPrice: double.tryParse(json['totalPrice']?.toString() ?? '0') ?? 0.0,
      status: json['status'] as String? ?? 'pending',
      specialInstructions: json['specialInstructions'] as String?,
      preparationTime: json['menuItem']?['preparationTime'] as int?,
    );
  }
}

class RestaurantOrderModel {
  final int id;
  final String orderNumber;
  final String orderType;
  final String? tableNumber;
  final int? roomId;
  final int? guestId;
  final String status;
  final double subtotal;
  final double taxAmount;
  final double serviceCharge;
  final double discount;
  final double totalAmount;
  final String paymentStatus;
  final String? notes;
  final String? creatorName;
  final String? roomNumber;
  final List<OrderItemModel> items;

  RestaurantOrderModel({
    required this.id,
    required this.orderNumber,
    required this.orderType,
    this.tableNumber,
    this.roomId,
    this.guestId,
    required this.status,
    required this.subtotal,
    required this.taxAmount,
    required this.serviceCharge,
    required this.discount,
    required this.totalAmount,
    required this.paymentStatus,
    this.notes,
    this.creatorName,
    this.roomNumber,
    required this.items,
  });

  factory RestaurantOrderModel.fromJson(Map<String, dynamic> json) {
    return RestaurantOrderModel(
      id: json['id'] as int,
      orderNumber: json['orderNumber'] as String,
      orderType: json['orderType'] as String? ?? 'dine_in',
      tableNumber: json['tableNumber'] as String?,
      roomId: json['roomId'] as int?,
      guestId: json['guestId'] as int?,
      status: json['status'] as String? ?? 'pending',
      subtotal: double.tryParse(json['subtotal']?.toString() ?? '0') ?? 0.0,
      taxAmount: double.tryParse(json['taxAmount']?.toString() ?? '0') ?? 0.0,
      serviceCharge: double.tryParse(json['serviceCharge']?.toString() ?? '0') ?? 0.0,
      discount: double.tryParse(json['discount']?.toString() ?? '0') ?? 0.0,
      totalAmount: double.tryParse(json['totalAmount']?.toString() ?? '0') ?? 0.0,
      paymentStatus: json['paymentStatus'] as String? ?? 'unpaid',
      notes: json['notes'] as String?,
      creatorName: json['creator']?['fullName'] as String?,
      roomNumber: json['room']?['roomNumber'] as String?,
      items: (json['items'] as List?)
              ?.map((e) => OrderItemModel.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
    );
  }
}
