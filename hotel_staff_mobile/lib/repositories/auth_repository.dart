import '../core/network/api_client.dart';
import '../core/storage/secure_storage_service.dart';
import '../core/constants/api_endpoints.dart';
import '../models/user_model.dart';

class AuthRepository {
  final ApiClient _apiClient;
  final SecureStorageService _storageService;

  AuthRepository({
    required ApiClient apiClient,
    required SecureStorageService storageService,
  })  : _apiClient = apiClient,
        _storageService = storageService;

  Future<UserModel> login(String username, String password) async {
    final response = await _apiClient.post(
      ApiEndpoints.login,
      data: {'username': username, 'password': password},
    );

    final accessToken = response['accessToken'] as String;
    final userJson = response['user'] as Map<String, dynamic>;
    final user = UserModel.fromJson(userJson);

    await _storageService.saveAccessToken(accessToken);
    await _storageService.saveUserData(user.toJson());

    return user;
  }

  Future<UserModel?> getMe() async {
    final response = await _apiClient.get(ApiEndpoints.me);
    if (response != null && response is Map<String, dynamic>) {
      final user = UserModel.fromJson(response);
      await _storageService.saveUserData(user.toJson());
      return user;
    }
    return null;
  }

  Future<void> logout() async {
    try {
      await _apiClient.post(ApiEndpoints.logout);
    } catch (_) {}
    await _storageService.clearAll();
  }

  Future<UserModel?> getCachedUser() async {
    final map = await _storageService.getUserData();
    if (map != null) {
      return UserModel.fromJson(map);
    }
    return null;
  }
}
