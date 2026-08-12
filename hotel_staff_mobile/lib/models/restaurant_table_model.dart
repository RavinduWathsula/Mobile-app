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
      id: json['id'] != null ? (int.tryParse(json['id'].toString()) ?? 0) : (json['_id'] != null ? json['_id'].hashCode : 0),
      code: json['code']?.toString() ?? '',
      name: json['name']?.toString() ?? '',
      area: json['area']?.toString() ?? 'Restaurant',
      capacity: json['capacity'] != null ? (int.tryParse(json['capacity'].toString()) ?? 2) : 2,
      isActive: json['isActive'] != false && json['isActive'] != 'false',
      status: json['status']?.toString() ?? 'available',
      openOrderCount: json['openOrderCount'] != null ? (int.tryParse(json['openOrderCount'].toString()) ?? 0) : 0,
      currentOrderId: json['currentOrderId'] != null ? int.tryParse(json['currentOrderId'].toString()) : null,
      currentOrderNumber: json['currentOrderNumber']?.toString(),
      currentWaiter: json['currentWaiter']?.toString(),
    );
  }
}
