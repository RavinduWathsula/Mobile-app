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
      id: json['id'] as int,
      roomId: json['roomId'] as int,
      taskType: json['taskType'] as String? ?? 'cleaning',
      priority: json['priority'] as String? ?? 'medium',
      status: json['status'] as String? ?? 'pending',
      assignedTo: json['assignedTo'] as int?,
      notes: json['notes'] as String?,
      scheduledDate: json['scheduledDate'] as String? ?? '',
      roomNumber: json['room']?['roomNumber'] as String?,
      roomTypeName: json['room']?['roomType']?['name'] as String?,
      assigneeName: json['assignee']?['fullName'] as String?,
    );
  }
}
