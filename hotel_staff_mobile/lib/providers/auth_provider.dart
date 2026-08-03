import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/user_model.dart';
import 'services_provider.dart';

class AuthState {
  final bool isCheckingInitialAuth;
  final bool isLoading;
  final bool isAuthenticated;
  final UserModel? user;
  final String? errorMessage;

  AuthState({
    this.isCheckingInitialAuth = true,
    this.isLoading = false,
    this.isAuthenticated = false,
    this.user,
    this.errorMessage,
  });

  AuthState copyWith({
    bool? isCheckingInitialAuth,
    bool? isLoading,
    bool? isAuthenticated,
    UserModel? user,
    String? errorMessage,
  }) {
    return AuthState(
      isCheckingInitialAuth: isCheckingInitialAuth ?? this.isCheckingInitialAuth,
      isLoading: isLoading ?? this.isLoading,
      isAuthenticated: isAuthenticated ?? this.isAuthenticated,
      user: user ?? this.user,
      errorMessage: errorMessage,
    );
  }
}

class AuthNotifier extends StateNotifier<AuthState> {
  final Ref _ref;

  AuthNotifier(this._ref) : super(AuthState()) {
    checkInitialAuth();
  }

  Future<void> checkInitialAuth() async {
    state = state.copyWith(isCheckingInitialAuth: true, isLoading: true);
    final repo = _ref.read(authRepositoryProvider);
    final hasToken = await repo.hasStoredToken();
    final cachedUser = await repo.getCachedUser();

    if (hasToken && cachedUser != null) {
      state = state.copyWith(
        isCheckingInitialAuth: false,
        isLoading: false,
        isAuthenticated: true,
        user: cachedUser,
      );
      try {
        final freshUser = await repo.getMe();
        if (freshUser != null) {
          state = state.copyWith(user: freshUser);
        }
      } catch (_) {
        final hasTokenStill = await repo.hasStoredToken();
        if (!hasTokenStill) {
          state = AuthState(
            isCheckingInitialAuth: false,
            isLoading: false,
            isAuthenticated: false,
            errorMessage: 'Session expired. Please log in again.',
          );
        }
      }
    } else {
      state = AuthState(
        isCheckingInitialAuth: false,
        isLoading: false,
        isAuthenticated: false,
      );
    }
  }

  Future<bool> login(String username, String password) async {
    state = state.copyWith(isLoading: true, errorMessage: null);
    try {
      final user = await _ref.read(authRepositoryProvider).login(username, password);
      state = state.copyWith(
        isCheckingInitialAuth: false,
        isLoading: false,
        isAuthenticated: true,
        user: user,
        errorMessage: null,
      );
      return true;
    } catch (e) {
      String cleanMsg = e.toString()
          .replaceAll('UnauthorizedException: ', '')
          .replaceAll('ForbiddenException: ', '')
          .replaceAll('ApiException: ', '')
          .replaceAll('NetworkException: ', '')
          .replaceAll('Exception: ', '');
      if (cleanMsg.isEmpty) {
        cleanMsg = 'Failed to sign in. Please check your credentials.';
      }
      state = state.copyWith(
        isCheckingInitialAuth: false,
        isLoading: false,
        isAuthenticated: false,
        errorMessage: cleanMsg,
      );
      return false;
    }
  }

  Future<void> logout() async {
    state = state.copyWith(isLoading: true);
    await _ref.read(authRepositoryProvider).logout();
    state = AuthState(
      isCheckingInitialAuth: false,
      isLoading: false,
      isAuthenticated: false,
    );
  }

  void handleSessionExpired() {
    state = AuthState(
      isCheckingInitialAuth: false,
      isLoading: false,
      isAuthenticated: false,
      user: null,
      errorMessage: 'Your session has expired. Please sign in again.',
    );
  }

  void clearError() {
    if (state.errorMessage != null) {
      state = state.copyWith(errorMessage: null);
    }
  }
}

final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  return AuthNotifier(ref);
});
