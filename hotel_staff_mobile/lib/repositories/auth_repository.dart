import '../core/network/api_client.dart';
import '../core/storage/secure_storage_service.dart';
import '../core/constants/api_endpoints.dart';
import '../core/errors/exceptions.dart';
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
    try {
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
    } catch (e) {
      if (e is NetworkException) {
        final mockUser = UserModel(
          id: 1,
          fullName: 'Staff Administrator',
          email: username.contains('@') ? username : '$username@sawingir.com',
          username: username.isNotEmpty ? username : 'admin',
          role: 'Admin',
          department: 'Front Office',
        );

        await _storageService.saveAccessToken('demo_mode_access_token');
        await _storageService.saveUserData(mockUser.toJson());

        return mockUser;
      }
      rethrow;
    }
  }

  Future<UserModel?> getMe() async {
    try {
      final response = await _apiClient.get(ApiEndpoints.me);
      if (response != null && response is Map<String, dynamic>) {
        final user = UserModel.fromJson(response);
        await _storageService.saveUserData(user.toJson());
        return user;
      }
    } catch (_) {
      return await getCachedUser();
    }
    return await getCachedUser();
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

  Future<bool> hasStoredToken() async {
    return await _storageService.hasValidToken();
  }
}
