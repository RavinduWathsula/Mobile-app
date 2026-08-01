class RestaurantTableModel {
  final int id;
  final String code;
  final String name;
  final String area;
  final int capacity;
  final bool isActive;
  final String status;
  final int openOrderCount;
  final int? currentOrderId;
  final String? currentOrderNumber;
  final String? currentWaiter;

  RestaurantTableModel({
    required this.id,
    required this.code,
    required this.name,
    required this.area,
    required this.capacity,
    required this.isActive,
    required this.status,
    required this.openOrderCount,
    this.currentOrderId,
    this.currentOrderNumber,
    this.currentWaiter,
  });

  factory RestaurantTableModel.fromJson(Map<String, dynamic> json) {
    return RestaurantTableModel(
      id: json['id'] as int,
      code: json['code'] as String,
      name: json['name'] as String,
      area: json['area'] as String? ?? 'Restaurant',
      capacity: json['capacity'] as int? ?? 2,
      isActive: json['isActive'] as bool? ?? true,
      status: json['status'] as String? ?? 'available',
      openOrderCount: json['openOrderCount'] as int? ?? 0,
      currentOrderId: json['currentOrderId'] as int?,
      currentOrderNumber: json['currentOrderNumber'] as String?,
      currentWaiter: json['currentWaiter'] as String?,
    );
  }
}
