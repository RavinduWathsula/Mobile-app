class ApiException implements Exception {
  final String message;
  final int? statusCode;

  ApiException({required this.message, this.statusCode});

  @override
  String toString() => 'ApiException: $message (status: $statusCode)';
}

class UnauthorizedException implements Exception {
  final String message;
  UnauthorizedException([this.message = 'Authentication required']);

  @override
  String toString() => 'UnauthorizedException: $message';
}

class ForbiddenException implements Exception {
  final String message;
  ForbiddenException([this.message = 'Access forbidden']);

  @override
  String toString() => 'ForbiddenException: $message';
}

class NetworkException implements Exception {
  final String message;
  NetworkException([this.message = 'Unable to connect to hotel backend API']);

  @override
  String toString() => 'NetworkException: $message';
}
