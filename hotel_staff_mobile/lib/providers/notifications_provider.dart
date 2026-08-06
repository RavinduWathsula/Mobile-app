import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/notification_model.dart';

// State definition for notifications (Loading, Error, Success)
class NotificationsState {
  final bool isLoading;
  final String? error;
  final List<HotelNotification> notifications;

  NotificationsState({
    this.isLoading = false,
    this.error,
    this.notifications = const [],
  });

  NotificationsState copyWith({
    bool? isLoading,
    String? error,
    List<HotelNotification>? notifications,
  }) {
    return NotificationsState(
      isLoading: isLoading ?? this.isLoading,
      error: error ?? this.error,
      notifications: notifications ?? this.notifications,
    );
  }
}

class NotificationsNotifier extends StateNotifier<NotificationsState> {
  NotificationsNotifier() : super(NotificationsState(isLoading: true)) {
    fetchNotifications();
  }

  Future<void> fetchNotifications() async {
    state = state.copyWith(isLoading: true, error: null);

    try {
      // Mock network delay
      await Future.delayed(const Duration(seconds: 1));
      
      // Mock data representing a professional backend response
      final mockData = [
        HotelNotification(
          id: '1',
          title: 'New VIP Arrival',
          message: 'Mr. John Doe has checked in to Suite 204. Please arrange a welcome basket.',
          type: NotificationType.arrival,
          createdAt: DateTime.now().subtract(const Duration(minutes: 5)),
        ),
        HotelNotification(
          id: '2',
          title: 'Housekeeping Priority',
          message: 'Room 305 requires urgent cleaning. Guest requested early check-in at 1:00 PM.',
          type: NotificationType.housekeeping,
          createdAt: DateTime.now().subtract(const Duration(minutes: 25)),
        ),
        HotelNotification(
          id: '3',
          title: 'New Booking',
          message: 'Booking confirmed for 3 nights (Deluxe Room). Ref: #BK-8472.',
          type: NotificationType.booking,
          createdAt: DateTime.now().subtract(const Duration(hours: 1)),
          isRead: true,
        ),
        HotelNotification(
          id: '4',
          title: 'Restaurant Order',
          message: 'New room service order for Room 112: 2x Club Sandwich, 1x Orange Juice.',
          type: NotificationType.restaurant,
          createdAt: DateTime.now().subtract(const Duration(hours: 2)),
          isRead: true,
        ),
      ];

      state = state.copyWith(
        isLoading: false,
        notifications: mockData,
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: 'Failed to load notifications. Please try again.',
      );
    }
  }

  void markAsRead(String id) {
    final updatedList = state.notifications.map((n) {
      if (n.id == id && !n.isRead) {
        return n.copyWith(isRead: true);
      }
      return n;
    }).toList();

    state = state.copyWith(notifications: updatedList);
  }

  void markAllAsRead() {
    final updatedList = state.notifications.map((n) {
      return n.isRead ? n : n.copyWith(isRead: true);
    }).toList();

    state = state.copyWith(notifications: updatedList);
  }
}

// Global provider for the notifier
final notificationsProvider = StateNotifierProvider<NotificationsNotifier, NotificationsState>((ref) {
  return NotificationsNotifier();
});

// Derived provider specifically for unread count (useful for badges)
final unreadNotificationsCountProvider = Provider<int>((ref) {
  final state = ref.watch(notificationsProvider);
  return state.notifications.where((n) => !n.isRead).length;
});
