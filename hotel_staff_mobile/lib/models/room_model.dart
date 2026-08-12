import 'dart:convert';

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
  final String? currentBookingRef;
  final DateTime? currentBookingCheckIn;
  final DateTime? currentBookingCheckOut;

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
    this.currentBookingRef,
    this.currentBookingCheckIn,
    this.currentBookingCheckOut,
  });

  factory RoomModel.fromJson(Map<String, dynamic> json) {
    // Check housekeeping task inclusion if fetched via room-board
    String? housekeeperName;
    String? hkStatus;
    if (json['housekeepingTasks'] is List && (json['housekeepingTasks'] as List).isNotEmpty) {
      final task = (json['housekeepingTasks'] as List).first as Map<String, dynamic>;
      hkStatus = task['status']?.toString();
      housekeeperName = task['assignee']?['fullName']?.toString();
    }

    return RoomModel(
      id: json['id'] != null ? (int.tryParse(json['id'].toString()) ?? 0) : (json['_id'] != null ? json['_id'].hashCode : 0),
      roomNumber: json['roomNumber']?.toString() ?? '',
      roomTypeId: json['roomTypeId'] != null ? (int.tryParse(json['roomTypeId'].toString()) ?? 1) : 1,
      floor: json['floor'] != null ? (int.tryParse(json['floor'].toString()) ?? 1) : 1,
      status: json['status']?.toString() ?? 'available',
      features: _parseFeatures(json['features']),
      notes: json['notes']?.toString(),
      roomTypeName: json['roomType']?['name']?.toString(),
      basePrice: json['roomType']?['basePrice'] != null
          ? double.tryParse(json['roomType']['basePrice'].toString())
          : null,
      maxOccupancy: json['roomType']?['maxOccupancy'] != null ? int.tryParse(json['roomType']['maxOccupancy'].toString()) : null,
      assignedHousekeeper: housekeeperName,
      housekeepingTaskStatus: hkStatus,
      currentGuestName: json['currentGuestName']?.toString(),
      currentBookingRef: json['currentBookingRef']?.toString(),
      currentBookingCheckIn: json['currentBookingCheckIn'] != null ? DateTime.tryParse(json['currentBookingCheckIn'].toString()) : null,
      currentBookingCheckOut: json['currentBookingCheckOut'] != null ? DateTime.tryParse(json['currentBookingCheckOut'].toString()) : null,
    );
  }

  static List<String> _parseFeatures(dynamic featuresData) {
    if (featuresData == null) return [];
    if (featuresData is List) {
      return featuresData.map((e) => e.toString()).toList();
    }
    if (featuresData is String) {
      try {
        // If it's a JSON string array, we could try to decode it.
        // For now just return it as a single feature if it's not empty, or try parsing.
        if (featuresData.startsWith('[')) {
          final List decoded = List.from(jsonDecode(featuresData) as Iterable);
          return decoded.map((e) => e.toString()).toList();
        }
        return [featuresData];
      } catch (_) {
        return [featuresData];
      }
    }
    return [];
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
    String? currentBookingRef,
    DateTime? currentBookingCheckIn,
    DateTime? currentBookingCheckOut,
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
      currentBookingRef: currentBookingRef ?? this.currentBookingRef,
      currentBookingCheckIn: currentBookingCheckIn ?? this.currentBookingCheckIn,
      currentBookingCheckOut: currentBookingCheckOut ?? this.currentBookingCheckOut,
    );
  }
}
