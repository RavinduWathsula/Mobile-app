import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/room_model.dart';
import 'services_provider.dart';

final roomSearchQueryProvider = StateProvider<String>((ref) => '');
final roomFilterStatusProvider = StateProvider<String?>((ref) => null);

final roomsListProvider = FutureProvider.autoDispose<List<RoomModel>>((ref) async {
  final status = ref.watch(roomFilterStatusProvider);
  final repo = ref.watch(roomsRepositoryProvider);
  return await repo.getRooms(status: status);
});

final filteredRoomsProvider = Provider.autoDispose<AsyncValue<List<RoomModel>>>((ref) {
  final roomsAsync = ref.watch(roomsListProvider);
  final query = ref.watch(roomSearchQueryProvider).trim().toLowerCase();

  return roomsAsync.whenData((rooms) {
    if (query.isEmpty) return rooms;
    return rooms.where((room) {
      final numberMatch = room.roomNumber.toLowerCase().contains(query);
      final typeMatch = room.roomTypeName?.toLowerCase().contains(query) ?? false;
      final statusMatch = room.status.toLowerCase().contains(query);
      return numberMatch || typeMatch || statusMatch;
    }).toList();
  });
});
