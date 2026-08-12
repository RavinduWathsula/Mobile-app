class HousekeepingTaskModel {
  final int id;
  final int roomId;
  final String taskType;
  final String priority;
  final String status;
  final int? assignedTo;
  final String? notes;
  final String scheduledDate;
  final String? roomNumber;
  final String? roomTypeName;
  final String? assigneeName;

  HousekeepingTaskModel({
    required this.id,
    required this.roomId,
    required this.taskType,
    required this.priority,
    required this.status,
    this.assignedTo,
    this.notes,
    required this.scheduledDate,
    this.roomNumber,
    this.roomTypeName,
    this.assigneeName,
  });

  factory HousekeepingTaskModel.fromJson(Map<String, dynamic> json) {
    return HousekeepingTaskModel(
      id: json['id'] != null ? (int.tryParse(json['id'].toString()) ?? 0) : (json['_id'] != null ? json['_id'].hashCode : 0),
      roomId: json['roomId'] != null ? (int.tryParse(json['roomId'].toString()) ?? 0) : 0,
      taskType: json['taskType']?.toString() ?? 'cleaning',
      priority: json['priority']?.toString() ?? 'medium',
      status: json['status']?.toString() ?? 'pending',
      assignedTo: json['assignedTo'] != null ? int.tryParse(json['assignedTo'].toString()) : null,
      notes: json['notes']?.toString(),
      scheduledDate: json['scheduledDate']?.toString() ?? '',
      roomNumber: json['room']?['roomNumber']?.toString(),
      roomTypeName: json['room']?['roomType']?['name']?.toString(),
      assigneeName: json['assignee']?['fullName']?.toString(),
    );
  }
}
