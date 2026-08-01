import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../providers/rooms_provider.dart';
import '../../widgets/common/drawer_navigation.dart';
import '../../widgets/cards/room_card.dart';
import '../../widgets/loading/loading_indicator.dart';
import '../../widgets/empty_states/empty_state_view.dart';
import '../../providers/services_provider.dart';

class RoomsListScreen extends ConsumerWidget {
  const RoomsListScreen({super.key});

  void _showRoomStatusDialog(BuildContext context, WidgetRef ref, int roomId, String currentStatus) {
    showDialog(
      context: context,
      builder: (context) {
        return SimpleDialog(
          title: const Text('Update Room Status'),
          children: [
            'available',
            'occupied',
            'dirty',
            'maintenance',
            'out_of_order',
          ].map((status) {
            return SimpleDialogOption(
              onPressed: () async {
                Navigator.pop(context);
                try {
                  final repo = ref.read(roomsRepositoryProvider);
                  await repo.updateRoomStatus(roomId, status);
                  ref.invalidate(roomsListProvider);
                } catch (e) {
                  if (context.mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text(e.toString())),
                    );
                  }
                }
              },
              child: Text(
                status.replaceAll('_', ' ').toUpperCase(),
                style: TextStyle(
                  color: status == currentStatus ? Colors.blue : Colors.black87,
                  fontWeight: status == currentStatus ? FontWeight.bold : FontWeight.normal,
                ),
              ),
            );
          }).toList(),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final roomsAsync = ref.watch(roomsListProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Rooms Management'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => ref.refresh(roomsListProvider),
          ),
        ],
      ),
      drawer: const DrawerNavigation(),
      body: roomsAsync.when(
        loading: () => const LoadingIndicator(message: 'Loading room status board...'),
        error: (err, stack) => EmptyStateView(
          title: 'Error loading rooms',
          description: err.toString(),
          onRetry: () => ref.refresh(roomsListProvider),
        ),
        data: (rooms) {
          if (rooms.isEmpty) {
            return const EmptyStateView(
              icon: Icons.meeting_room_outlined,
              title: 'No Rooms Found',
              description: 'No rooms match the selected filter.',
            );
          }

          return ListView.builder(
            padding: const EdgeInsets.all(12),
            itemCount: rooms.length,
            itemBuilder: (context, index) {
              final room = rooms[index];
              return RoomCard(
                room: room,
                onTap: () => _showRoomStatusDialog(context, ref, room.id, room.status),
              );
            },
          );
        },
      ),
    );
  }
}
