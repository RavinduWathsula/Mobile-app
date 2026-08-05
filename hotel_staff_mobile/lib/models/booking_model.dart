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

  factory BookingModel.fromJson(Map<String, dynamic> json) {
    return BookingModel(
      id: json['id'] as int,
      bookingRef: json['bookingRef'] as String? ?? '',
      guestId: json['guestId'] as int? ?? 0,
      roomId: json['roomId'] as int?,
      roomTypeId: json['roomTypeId'] as int? ?? 1,
      checkIn: json['checkIn'] as String? ?? '',
      checkOut: json['checkOut'] as String? ?? '',
      nights: json['nights'] as int? ?? 1,
      adults: json['adults'] as int? ?? 1,
      children: json['children'] as int? ?? 0,
      mealPlan: json['mealPlan'] as String? ?? 'room_only',
      totalAmount: double.tryParse(json['totalAmount']?.toString() ?? '0') ?? 0.0,
      advancePaid: double.tryParse(json['advancePaid']?.toString() ?? '0') ?? 0.0,
      balanceDue: double.tryParse(json['balanceDue']?.toString() ?? '0') ?? 0.0,
      status: json['status'] as String? ?? 'confirmed',
      source: json['source'] as String? ?? 'direct',
      specialRequests: json['specialRequests'] as String?,
      notes: json['notes'] as String?,
      guestFirstName: json['guest']?['firstName'] as String?,
      guestLastName: json['guest']?['lastName'] as String?,
      guestPhone: json['guest']?['phone'] as String?,
      guestEmail: json['guest']?['email'] as String?,
      guestNationality: json['guest']?['nationality'] as String?,
      guestIdNumber: json['guest']?['idNumber'] as String?,
      roomNumber: json['room']?['roomNumber'] as String?,
      roomTypeName: json['roomType']?['name'] as String?,
    );
  }
}
