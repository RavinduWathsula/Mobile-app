import 'package:dio/dio.dart';
import '../storage/secure_storage_service.dart';
import '../constants/api_endpoints.dart';

class AuthInterceptor extends Interceptor {
  final SecureStorageService storageService;
  final Dio refreshDio;

  AuthInterceptor({
    required this.storageService,
    required this.refreshDio,
  });

  @override
  void onRequest(
    RequestOptions options,
    RequestInterceptorHandler handler,
  ) async {
    final token = await storageService.getAccessToken();
    if (token != null && token.isNotEmpty) {
      options.headers['Authorization'] = 'Bearer $token';
    }
    return handler.next(options);
  }

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) async {
    if (err.response?.statusCode == 401 &&
        !err.requestOptions.path.contains(ApiEndpoints.refresh) &&
        !err.requestOptions.path.contains(ApiEndpoints.login)) {
      final refreshed = await _tryTokenRefresh();
      if (refreshed) {
        try {
          final accessToken = await storageService.getAccessToken();
          final requestOptions = err.requestOptions;
          requestOptions.headers['Authorization'] = 'Bearer $accessToken';

          final response = await refreshDio.fetch(requestOptions);
          return handler.resolve(response);
        } catch (e) {
          return handler.next(err);
        }
      }
    }
    return handler.next(err);
  }

  Future<bool> _tryTokenRefresh() async {
    try {
      final refreshToken = await storageService.getRefreshToken();
      if (refreshToken == null) return false;

      final response = await refreshDio.post(
        ApiEndpoints.refresh,
        options: Options(
          headers: {'Cookie': 'refreshToken=$refreshToken'},
        ),
      );

      if (response.statusCode == 200 && response.data != null) {
        final newAccessToken = response.data['accessToken'];
        if (newAccessToken != null) {
          await storageService.saveAccessToken(newAccessToken);
          return true;
        }
      }
      return false;
    } catch (_) {
      await storageService.clearAll();
      return false;
    }
  }
}
