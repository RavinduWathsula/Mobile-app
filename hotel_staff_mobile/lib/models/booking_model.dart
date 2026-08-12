class BookingModel {
  final int id;
  final String bookingRef;
  final int guestId;
  final int? roomId;
  final int roomTypeId;
  final String checkIn;
  final String checkOut;
  final int nights;
  final int adults;
  final int children;
  final String mealPlan;
  final double totalAmount;
  final double advancePaid;
  final double balanceDue;
  final String status;
  final String source;
  final String? specialRequests;
  final String? notes;
  final String? guestFirstName;
  final String? guestLastName;
  final String? guestPhone;
  final String? guestEmail;
  final String? guestNationality;
  final String? guestIdNumber;
  final String? roomNumber;
  final String? roomTypeName;

  BookingModel({
    required this.id,
    required this.bookingRef,
    required this.guestId,
    this.roomId,
    required this.roomTypeId,
    required this.checkIn,
    required this.checkOut,
    required this.nights,
    required this.adults,
    required this.children,
    required this.mealPlan,
    required this.totalAmount,
    required this.advancePaid,
    required this.balanceDue,
    required this.status,
    required this.source,
    this.specialRequests,
    this.notes,
    this.guestFirstName,
    this.guestLastName,
    this.guestPhone,
    this.guestEmail,
    this.guestNationality,
    this.guestIdNumber,
    this.roomNumber,
    this.roomTypeName,
  });

  String get guestFullName => '${guestFirstName ?? ''} ${guestLastName ?? ''}'.trim();

  BookingModel copyWith({
    int? id,
    String? bookingRef,
    int? guestId,
    int? roomId,
    int? roomTypeId,
    String? checkIn,
    String? checkOut,
    int? nights,
    int? adults,
    int? children,
    String? mealPlan,
    double? totalAmount,
    double? advancePaid,
    double? balanceDue,
    String? status,
    String? source,
    String? specialRequests,
    String? notes,
    String? guestFirstName,
    String? guestLastName,
    String? guestPhone,
    String? guestEmail,
    String? guestNationality,
    String? guestIdNumber,
    String? roomNumber,
    String? roomTypeName,
  }) {
    return BookingModel(
      id: id ?? this.id,
      bookingRef: bookingRef ?? this.bookingRef,
      guestId: guestId ?? this.guestId,
      roomId: roomId ?? this.roomId,
      roomTypeId: roomTypeId ?? this.roomTypeId,
      checkIn: checkIn ?? this.checkIn,
      checkOut: checkOut ?? this.checkOut,
      nights: nights ?? this.nights,
      adults: adults ?? this.adults,
      children: children ?? this.children,
      mealPlan: mealPlan ?? this.mealPlan,
      totalAmount: totalAmount ?? this.totalAmount,
      advancePaid: advancePaid ?? this.advancePaid,
      balanceDue: balanceDue ?? this.balanceDue,
      status: status ?? this.status,
      source: source ?? this.source,
      specialRequests: specialRequests ?? this.specialRequests,
      notes: notes ?? this.notes,
      guestFirstName: guestFirstName ?? this.guestFirstName,
      guestLastName: guestLastName ?? this.guestLastName,
      guestPhone: guestPhone ?? this.guestPhone,
      guestEmail: guestEmail ?? this.guestEmail,
      guestNationality: guestNationality ?? this.guestNationality,
      guestIdNumber: guestIdNumber ?? this.guestIdNumber,
      roomNumber: roomNumber ?? this.roomNumber,
      roomTypeName: roomTypeName ?? this.roomTypeName,
    );
  }

  factory BookingModel.fromJson(Map<String, dynamic> json) {
    return BookingModel(
      id: json['id'] != null ? (int.tryParse(json['id'].toString()) ?? 0) : (json['_id'] != null ? json['_id'].hashCode : 0),
      bookingRef: json['bookingRef']?.toString() ?? '',
      guestId: json['guestId'] != null ? (int.tryParse(json['guestId'].toString()) ?? 0) : 0,
      roomId: json['roomId'] != null ? int.tryParse(json['roomId'].toString()) : null,
      roomTypeId: json['roomTypeId'] != null ? (int.tryParse(json['roomTypeId'].toString()) ?? 1) : 1,
      checkIn: json['checkIn']?.toString() ?? '',
      checkOut: json['checkOut']?.toString() ?? '',
      nights: json['nights'] != null ? (int.tryParse(json['nights'].toString()) ?? 1) : 1,
      adults: json['adults'] != null ? (int.tryParse(json['adults'].toString()) ?? 1) : 1,
      children: json['children'] != null ? (int.tryParse(json['children'].toString()) ?? 0) : 0,
      mealPlan: json['mealPlan']?.toString() ?? 'room_only',
      totalAmount: double.tryParse(json['totalAmount']?.toString() ?? '0') ?? 0.0,
      advancePaid: double.tryParse(json['advancePaid']?.toString() ?? '0') ?? 0.0,
      balanceDue: double.tryParse(json['balanceDue']?.toString() ?? '0') ?? 0.0,
      status: json['status']?.toString() ?? 'confirmed',
      source: json['source']?.toString() ?? 'direct',
      specialRequests: json['specialRequests']?.toString(),
      notes: json['notes']?.toString(),
      guestFirstName: json['guest']?['firstName']?.toString(),
      guestLastName: json['guest']?['lastName']?.toString(),
      guestPhone: json['guest']?['phone']?.toString(),
      guestEmail: json['guest']?['email']?.toString(),
      guestNationality: json['guest']?['nationality']?.toString(),
      guestIdNumber: json['guest']?['idNumber']?.toString(),
      roomNumber: json['room']?['roomNumber']?.toString(),
      roomTypeName: json['roomType']?['name']?.toString(),
    );
  }
}
