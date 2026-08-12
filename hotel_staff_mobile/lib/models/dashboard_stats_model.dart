class DashboardStatsModel {
  final int totalRooms;
  final int occupiedRooms;
  final int availableRooms;
  final int dirtyRooms;
  final int maintenanceRooms;
  final int occupancyRate;
  final int todayArrivals;
  final int todayCheckouts;
  final double revenueToday;
  final int pendingPayments;

  DashboardStatsModel({
    required this.totalRooms,
    required this.occupiedRooms,
    required this.availableRooms,
    required this.dirtyRooms,
    required this.maintenanceRooms,
    required this.occupancyRate,
    required this.todayArrivals,
    required this.todayCheckouts,
    required this.revenueToday,
    required this.pendingPayments,
  });

  factory DashboardStatsModel.fromJson(Map<String, dynamic> json) {
    final rooms = json['rooms'] as Map<String, dynamic>? ?? {};
    return DashboardStatsModel(
      totalRooms: rooms['total_rooms'] != null ? (int.tryParse(rooms['total_rooms'].toString()) ?? 0) : 0,
      occupiedRooms: rooms['occupied'] != null ? (int.tryParse(rooms['occupied'].toString()) ?? 0) : 0,
      availableRooms: rooms['available'] != null ? (int.tryParse(rooms['available'].toString()) ?? 0) : 0,
      dirtyRooms: rooms['dirty'] != null ? (int.tryParse(rooms['dirty'].toString()) ?? 0) : 0,
      maintenanceRooms: rooms['maintenance'] != null ? (int.tryParse(rooms['maintenance'].toString()) ?? 0) : 0,
      occupancyRate: json['occupancy_rate'] != null ? (int.tryParse(json['occupancy_rate'].toString()) ?? 0) : 0,
      todayArrivals: json['today_arrivals'] != null ? (int.tryParse(json['today_arrivals'].toString()) ?? 0) : 0,
      todayCheckouts: json['today_checkouts'] != null ? (int.tryParse(json['today_checkouts'].toString()) ?? 0) : 0,
      revenueToday: double.tryParse(json['revenue_today']?.toString() ?? '0') ?? 0.0,
      pendingPayments: json['pending_payments'] != null ? (int.tryParse(json['pending_payments'].toString()) ?? 0) : 0,
    );
  }
}
