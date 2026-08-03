class RoomModel {
  final int id;
  final String roomNumber;
  final int roomTypeId;
  final int floor;
  final String status;
  final List<String> features;
  final String? notes;
  final String? roomTypeName;
  final double? basePrice;
  final int? maxOccupancy;
  final String? assignedHousekeeper;
  final String? housekeepingTaskStatus;
  final String? currentGuestName;

  RoomModel({
    required this.id,
    required this.roomNumber,
    required this.roomTypeId,
    required this.floor,
    required this.status,
    required this.features,
    this.notes,
    this.roomTypeName,
    this.basePrice,
    this.maxOccupancy,
    this.assignedHousekeeper,
    this.housekeepingTaskStatus,
    this.currentGuestName,
  });

  factory RoomModel.fromJson(Map<String, dynamic> json) {
    // Check housekeeping task inclusion if fetched via room-board
    String? housekeeperName;
    String? hkStatus;
    if (json['housekeepingTasks'] is List && (json['housekeepingTasks'] as List).isNotEmpty) {
      final task = (json['housekeepingTasks'] as List).first as Map<String, dynamic>;
      hkStatus = task['status'] as String?;
      housekeeperName = task['assignee']?['fullName'] as String?;
    }

    return RoomModel(
      id: json['id'] as int,
      roomNumber: json['roomNumber'] as String,
      roomTypeId: json['roomTypeId'] as int? ?? 1,
      floor: json['floor'] as int? ?? 1,
      status: json['status'] as String? ?? 'available',
      features: (json['features'] as List?)?.map((e) => e.toString()).toList() ?? [],
      notes: json['notes'] as String?,
      roomTypeName: json['roomType']?['name'] as String?,
      basePrice: json['roomType']?['basePrice'] != null
          ? double.tryParse(json['roomType']['basePrice'].toString())
          : null,
      maxOccupancy: json['roomType']?['maxOccupancy'] as int?,
      assignedHousekeeper: housekeeperName,
      housekeepingTaskStatus: hkStatus,
      currentGuestName: json['currentGuestName'] as String?,
    );
  }

  RoomModel copyWith({
    int? id,
    String? roomNumber,
    int? roomTypeId,
    int? floor,
    String? status,
    List<String>? features,
    String? notes,
    String? roomTypeName,
    double? basePrice,
    int? maxOccupancy,
    String? assignedHousekeeper,
    String? housekeepingTaskStatus,
    String? currentGuestName,
  }) {
    return RoomModel(
      id: id ?? this.id,
      roomNumber: roomNumber ?? this.roomNumber,
      roomTypeId: roomTypeId ?? this.roomTypeId,
      floor: floor ?? this.floor,
      status: status ?? this.status,
      features: features ?? this.features,
      notes: notes ?? this.notes,
      roomTypeName: roomTypeName ?? this.roomTypeName,
      basePrice: basePrice ?? this.basePrice,
      maxOccupancy: maxOccupancy ?? this.maxOccupancy,
      assignedHousekeeper: assignedHousekeeper ?? this.assignedHousekeeper,
      housekeepingTaskStatus: housekeepingTaskStatus ?? this.housekeepingTaskStatus,
      currentGuestName: currentGuestName ?? this.currentGuestName,
    );
  }
}
