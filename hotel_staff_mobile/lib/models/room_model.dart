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
  });

  factory RoomModel.fromJson(Map<String, dynamic> json) {
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
    );
  }
}
