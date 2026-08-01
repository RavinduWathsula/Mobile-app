import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/room_model.dart';
import 'services_provider.dart';

final roomFilterStatusProvider = StateProvider<String?>((ref) => null);

final roomsListProvider = FutureProvider.autoDispose<List<RoomModel>>((ref) async {
  final status = ref.watch(roomFilterStatusProvider);
  final repo = ref.watch(roomsRepositoryProvider);
  return await repo.getRooms(status: status);
});
