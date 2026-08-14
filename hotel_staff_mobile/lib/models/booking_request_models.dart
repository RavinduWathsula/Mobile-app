class GuestRequest {
  final String firstName ;
  final String lastName;
  final String? email;
  final String? phone;
  final String? nationality;
  final String? idNumber;
  final int? id;

  GuestRequest({
    required this.firstName,
    required this.lastName,
    this.email,
    this.phone,
    this.nationality,
    this.idNumber,
    this.id,
  });

  Map<String, dynamic> toJson() {
    return {
      'firstName': firstName,
      'lastName': lastName,
      if (email != null && email!.isNotEmpty) 'email': email,
      if (phone != null && phone!.isNotEmpty) 'phone': phone,
      if (nationality != null && nationality!.isNotEmpty) 'nationality': nationality,
      if (idNumber != null && idNumber!.isNotEmpty) 'idNumber': idNumber,
      if (id != null) 'id': id,
    };
  }
}

class CreateBookingRequest {
  final GuestRequest guest;
  final String checkIn;
  final String checkOut;
  final int? roomTypeId;
  final int? roomId;
  final int adults;
  final int children;
  final String mealPlan;
  final String source;
  final String? specialRequests;
  final double? totalAmount;

  CreateBookingRequest({
    required this.guest,
    required this.checkIn,
    required this.checkOut,
    this.roomTypeId,
    this.roomId,
    this.adults = 1,
    this.children = 0,
    this.mealPlan = 'room-only',
    this.source = 'direct',
    this.specialRequests,
    this.totalAmount,
  });

  Map<String, dynamic> toJson() {
    return {
      'guest': guest.toJson(),
      'checkIn': checkIn,
      'checkOut': checkOut,
      if (roomTypeId != null) 'roomTypeId': roomTypeId,
      if (roomId != null) 'roomId': roomId,
      'adults': adults,
      'children': children,
      'mealPlan': mealPlan,
      'source': source,
      if (specialRequests != null && specialRequests!.isNotEmpty) 'specialRequests': specialRequests,
      if (totalAmount != null) 'totalAmount': totalAmount,
    };
  }
}

class UpdateBookingRequest extends CreateBookingRequest {
  UpdateBookingRequest({
    required super.guest,
    required super.checkIn,
    required super.checkOut,
    super.roomTypeId,
    super.roomId,
    super.adults = 1,
    super.children = 0,
    super.mealPlan = 'room-only',
    super.source = 'direct',
    super.specialRequests,
  });
}

class PaymentRequest {
  final double amount;
  final String paymentMethod;
  final String? referenceNo;
  final String? notes;

  PaymentRequest({
    required this.amount,
    required this.paymentMethod,
    this.referenceNo,
    this.notes,
  });

  Map<String, dynamic> toJson() {
    return {
      'amount': amount,
      'paymentMethod': paymentMethod,
      if (referenceNo != null && referenceNo!.isNotEmpty) 'referenceNo': referenceNo,
      if (notes != null && notes!.isNotEmpty) 'notes': notes,
    };
  }
}
