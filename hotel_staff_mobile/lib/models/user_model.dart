class UserModel {
  final int id;
  final String fullName;
  final String email;
  final String username;
  final String role;
  final String department;
  final String? avatarUrl;

  UserModel({
    required this.id,
    required this.fullName,
    required this.email,
    required this.username,
    required this.role,
    required this.department,
    this.avatarUrl,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id'] as int,
      fullName: json['fullName'] as String? ?? 'Staff User',
      email: json['email'] as String? ?? '',
      username: json['username'] as String? ?? '',
      role: json['role'] is String ? json['role'] : (json['role']?['name'] ?? 'Staff'),
      department: json['department'] as String? ?? 'Front Office',
      avatarUrl: json['avatarUrl'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'fullName': fullName,
      'email': email,
      'username': username,
      'role': role,
      'department': department,
      'avatarUrl': avatarUrl,
    };
  }
}
