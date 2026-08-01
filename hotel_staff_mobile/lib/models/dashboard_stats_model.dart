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
      totalRooms: rooms['total_rooms'] as int? ?? 0,
      occupiedRooms: rooms['occupied'] as int? ?? 0,
      availableRooms: rooms['available'] as int? ?? 0,
      dirtyRooms: rooms['dirty'] as int? ?? 0,
      maintenanceRooms: rooms['maintenance'] as int? ?? 0,
      occupancyRate: json['occupancy_rate'] as int? ?? 0,
      todayArrivals: json['today_arrivals'] as int? ?? 0,
      todayCheckouts: json['today_checkouts'] as int? ?? 0,
      revenueToday: double.tryParse(json['revenue_today']?.toString() ?? '0') ?? 0.0,
      pendingPayments: json['pending_payments'] as int? ?? 0,
    );
  }
}
