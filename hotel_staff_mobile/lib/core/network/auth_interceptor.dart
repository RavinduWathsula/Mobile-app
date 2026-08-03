import 'package:flutter/foundation.dart';
import 'package:dio/dio.dart';
import '../storage/secure_storage_service.dart';
import '../constants/api_endpoints.dart';

class AuthInterceptor extends Interceptor {
  final SecureStorageService storageService;
  final Dio refreshDio;
  final VoidCallback? onSessionExpired;

  AuthInterceptor({
    required this.storageService,
    required this.refreshDio,
    this.onSessionExpired,
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
  void onResponse(Response response, ResponseInterceptorHandler handler) async {
    await _extractAndSaveRefreshToken(response.headers['set-cookie']);
    return handler.next(response);
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
          await _extractAndSaveRefreshToken(response.headers['set-cookie']);
          return handler.resolve(response);
        } catch (e) {
          onSessionExpired?.call();
          return handler.next(err);
        }
      } else {
        onSessionExpired?.call();
      }
    }
    return handler.next(err);
  }

  Future<void> _extractAndSaveRefreshToken(List<String>? setCookieHeaders) async {
    if (setCookieHeaders == null) return;
    for (final header in setCookieHeaders) {
      final match = RegExp(r'refreshToken=([^;]+)').firstMatch(header);
      if (match != null) {
        final token = match.group(1);
        if (token != null && token.isNotEmpty) {
          await storageService.saveRefreshToken(token);
        }
      }
    }
  }

  Future<bool> _tryTokenRefresh() async {
    try {
      final refreshToken = await storageService.getRefreshToken();
      if (refreshToken == null || refreshToken.isEmpty) return false;

      final response = await refreshDio.post(
        ApiEndpoints.refresh,
        options: Options(
          headers: {'Cookie': 'refreshToken=$refreshToken'},
        ),
      );

      if (response.statusCode == 200 && response.data != null) {
        await _extractAndSaveRefreshToken(response.headers['set-cookie']);
        final newAccessToken = response.data['accessToken'];
        if (newAccessToken != null && newAccessToken is String) {
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
