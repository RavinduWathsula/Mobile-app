class DayOutPlan {
  final int id;
  final String name;
  final String description;
  final double adultPrice;
  final double childPrice;
  final String status;
  final List<String>? includes;
  final String? schedule;
  final String? timing;
  final String? recurring;
  final String? recurringDay;
  final String? createdAt;

  DayOutPlan({
    required this.id,
    required this.name,
    required this.description,
    required this.adultPrice,
    required this.childPrice,
    required this.status,
    this.includes,
    this.schedule,
    this.timing,
    this.recurring,
    this.recurringDay,
    this.createdAt,
  });

  factory DayOutPlan.fromJson(Map<String, dynamic> json) {
    return DayOutPlan(
      id: json['id'] != null 
          ? (int.tryParse(json['id'].toString()) ?? 0) 
          : (json['_id'] != null ? json['_id'].hashCode : 0),
      name: json['name']?.toString() ?? '',
      description: json['description']?.toString() ?? '',
      adultPrice: double.tryParse(json['pricePerPerson']?.toString() ?? json['adultPrice']?.toString() ?? '0') ?? 0.0,
      childPrice: double.tryParse(json['pricePerPerson']?.toString() ?? json['childPrice']?.toString() ?? '0') ?? 0.0,
      status: json['status']?.toString() ?? 'active',
      includes: (json['includes'] as List<dynamic>?)?.map((e) => e.toString()).toList(),
      schedule: json['schedule']?.toString(),
      timing: json['timing']?.toString(),
      recurring: json['recurring']?.toString(),
      recurringDay: json['recurringDay']?.toString(),
      createdAt: json['createdAt']?.toString(),
    );
  }
}

class DayOutBooking {
  final int id;
  final int planId;
  final String planName;
  final String guestName;
  final String guestEmail;
  final String guestPhone;
  final int adults;
  final int children;
  final double totalAmount;
  final String bookingDate;
  final String status;
  final String paymentStatus;
  final String? specialRequests;
  final String createdAt;

  DayOutBooking({
    required this.id,
    required this.planId,
    required this.planName,
    required this.guestName,
    required this.guestEmail,
    required this.guestPhone,
    required this.adults,
    required this.children,
    required this.totalAmount,
    required this.bookingDate,
    required this.status,
    required this.paymentStatus,
    this.specialRequests,
    required this.createdAt,
  });

  factory DayOutBooking.fromJson(Map<String, dynamic> json) {
    return DayOutBooking(
      id: json['id'] != null 
          ? (int.tryParse(json['id'].toString()) ?? 0) 
          : (json['_id'] != null ? json['_id'].hashCode : 0),
      planId: json['planId'] != null 
          ? (int.tryParse(json['planId'].toString()) ?? 0) 
          : 0,
      planName: json['plan']?['name']?.toString() ?? json['planName']?.toString() ?? '',
      guestName: json['clientName']?.toString() ?? json['guestName']?.toString() ?? '',
      guestEmail: json['guestEmail']?.toString() ?? '',
      guestPhone: json['clientPhone']?.toString() ?? json['guestPhone']?.toString() ?? '',
      adults: json['participants'] != null ? (int.tryParse(json['participants'].toString()) ?? 1) : (json['adults'] != null ? (int.tryParse(json['adults'].toString()) ?? 1) : 1),
      children: json['children'] != null ? (int.tryParse(json['children'].toString()) ?? 0) : 0,
      totalAmount: double.tryParse(json['totalAmount']?.toString() ?? '0') ?? 0.0,
      bookingDate: json['tripDate']?.toString() ?? json['bookingDate']?.toString() ?? '',
      status: json['status']?.toString() ?? 'confirmed',
      paymentStatus: json['paymentStatus']?.toString() ?? 'pending',
      specialRequests: json['notes']?.toString() ?? json['specialRequests']?.toString(),
      createdAt: json['createdAt']?.toString() ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'planId': planId,
      'clientName': guestName,
      'clientPhone': guestPhone,
      'tripDate': bookingDate,
      'participants': adults + children,
      'totalAmount': totalAmount,
      'status': status,
      'notes': specialRequests,
    };
  }
}
