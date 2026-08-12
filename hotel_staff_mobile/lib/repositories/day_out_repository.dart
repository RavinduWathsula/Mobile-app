import '../models/day_out_model.dart';
import 'package:flutter/foundation.dart';

class DayOutRepository {
  final List<DayOutPlan> _plans = [
    DayOutPlan(
      id: 1,
      name: "Sunday Buffet & Pool",
      description: "Enjoy a mouth-watering international buffet, refreshing iced coffee with cake, and free pool access",
      adultPrice: 3400,
      childPrice: 2550,
      includes: ["International Buffet", "Iced Coffee & Cake", "Free Pool Access"],
      schedule: "Every Sunday",
      timing: "9:00 AM - 4:00 PM",
      recurring: "weekly",
      recurringDay: "Sunday",
      status: "active",
      createdAt: "2026-01-01T00:00:00Z",
    ),
    DayOutPlan(
      id: 2,
      name: "Sawingir Awurudu Wasanthaya",
      description: "Celebrate Sinhala & Tamil New Year with family, friends, or office team",
      adultPrice: 3550,
      childPrice: 3000,
      includes: [
        "Welcome Drink",
        "Awurudu Kreeda (Traditional Games)",
        "Special Lunch Buffet",
        "Evening Iced Coffee & Cake",
        "Full Day Pool Access",
      ],
      schedule: "Every Sunday in April",
      timing: "9:00 AM - 4:00 PM",
      recurring: "custom",
      status: "active",
      createdAt: "2026-03-01T00:00:00Z",
    ),
  ];

  final List<DayOutBooking> _bookings = [];

  Future<List<DayOutPlan>> getPlans() async {
    await Future.delayed(const Duration(milliseconds: 500));
    return List.from(_plans);
  }

  Future<List<DayOutBooking>> getBookings() async {
    await Future.delayed(const Duration(milliseconds: 500));
    return List.from(_bookings);
  }

  Future<DayOutBooking> createBooking(DayOutBooking booking) async {
    await Future.delayed(const Duration(milliseconds: 500));
    final newBooking = DayOutBooking(
      id: DateTime.now().millisecondsSinceEpoch,
      planId: booking.planId,
      planName: booking.planName,
      guestName: booking.guestName,
      guestEmail: booking.guestEmail,
      guestPhone: booking.guestPhone,
      adults: booking.adults,
      children: booking.children,
      totalAmount: booking.totalAmount,
      bookingDate: booking.bookingDate,
      status: booking.status,
      paymentStatus: booking.paymentStatus,
      specialRequests: booking.specialRequests,
      createdAt: DateTime.now().toIso8601String(),
    );
    _bookings.add(newBooking);
    return newBooking;
  }

  Future<void> updateBookingStatus(int id, String status) async {
    await Future.delayed(const Duration(milliseconds: 300));
    final index = _bookings.indexWhere((b) => b.id == id);
    if (index != -1) {
      final old = _bookings[index];
      _bookings[index] = DayOutBooking(
        id: old.id,
        planId: old.planId,
        planName: old.planName,
        guestName: old.guestName,
        guestEmail: old.guestEmail,
        guestPhone: old.guestPhone,
        adults: old.adults,
        children: old.children,
        totalAmount: old.totalAmount,
        bookingDate: old.bookingDate,
        status: status,
        paymentStatus: old.paymentStatus,
        specialRequests: old.specialRequests,
        createdAt: old.createdAt,
      );
    }
  }

  Future<void> updatePaymentStatus(int id, String paymentStatus) async {
    await Future.delayed(const Duration(milliseconds: 300));
    final index = _bookings.indexWhere((b) => b.id == id);
    if (index != -1) {
      final old = _bookings[index];
      _bookings[index] = DayOutBooking(
        id: old.id,
        planId: old.planId,
        planName: old.planName,
        guestName: old.guestName,
        guestEmail: old.guestEmail,
        guestPhone: old.guestPhone,
        adults: old.adults,
        children: old.children,
        totalAmount: old.totalAmount,
        bookingDate: old.bookingDate,
        status: old.status,
        paymentStatus: paymentStatus,
        specialRequests: old.specialRequests,
        createdAt: old.createdAt,
      );
    }
  }
}
