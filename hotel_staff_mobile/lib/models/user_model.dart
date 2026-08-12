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
      id: json['id'] != null ? (int.tryParse(json['id'].toString()) ?? 0) : (json['_id'] != null ? json['_id'].hashCode : 0),
      fullName: json['fullName']?.toString() ?? 'Staff User',
      email: json['email']?.toString() ?? '',
      username: json['username']?.toString() ?? '',
      role: json['role'] is String ? json['role'] : (json['role']?['name']?.toString() ?? 'Staff'),
      department: json['department']?.toString() ?? 'Front Office',
      avatarUrl: json['avatarUrl']?.toString(),
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
