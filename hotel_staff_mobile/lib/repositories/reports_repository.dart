import '../core/network/api_client.dart';
import '../core/constants/api_endpoints.dart';
import '../models/dashboard_stats_model.dart';

class ReportsRepository {
  final ApiClient _apiClient;

  ReportsRepository({required ApiClient apiClient}) : _apiClient = apiClient;

  Future<DashboardStatsModel> getDashboardStats() async {
    final response = await _apiClient.get(ApiEndpoints.dashboard);
    return DashboardStatsModel.fromJson(response as Map<String, dynamic>);
  }

  Future<List<Map<String, dynamic>>> getOccupancyReport({int days = 7}) async {
    final response = await _apiClient.get(
      ApiEndpoints.occupancyReport,
      queryParameters: {'days': days},
    );
    final list = (response as List?) ?? [];
    return list.cast<Map<String, dynamic>>();
  }

  Future<List<Map<String, dynamic>>> getRevenueReport() async {
    final response = await _apiClient.get(ApiEndpoints.revenueReport);
    final list = (response as List?) ?? [];
    return list.cast<Map<String, dynamic>>();
  }
}
