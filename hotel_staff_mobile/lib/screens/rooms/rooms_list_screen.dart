import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../models/room_model.dart';
import '../../providers/rooms_provider.dart';
import '../../widgets/common/drawer_navigation.dart';
import '../../widgets/cards/room_card.dart';
import '../../widgets/rooms/room_details_sheet.dart';
import '../../widgets/loading/rooms_skeleton.dart';
import '../../widgets/empty_states/empty_state_view.dart';
import '../../core/theme/app_colors.dart';

class RoomsListScreen extends ConsumerStatefulWidget {
  const RoomsListScreen({super.key});

  @override
  ConsumerState<RoomsListScreen> createState() => _RoomsListScreenState();
}

class _RoomsListScreenState extends ConsumerState<RoomsListScreen> {
  final TextEditingController _searchController = TextEditingController();

  final List<Map<String, String?>> _filterChips = [
    {'label': 'All', 'status': null},
    {'label': 'Available', 'status': 'available'},
    {'label': 'Occupied', 'status': 'occupied'},
    {'label': 'Dirty', 'status': 'dirty'},
    {'label': 'Maintenance', 'status': 'maintenance'},
    {'label': 'Out of Order', 'status': 'out_of_order'},
  ];

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  void _openRoomDetails(RoomModel room) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => RoomDetailsSheet(room: room),
    );
  }

  @override
  Widget build(BuildContext context) {
    final filteredRoomsAsync = ref.watch(filteredRoomsProvider);
    final selectedFilterStatus = ref.watch(roomFilterStatusProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text(
          'Rooms Management',
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => ref.invalidate(roomsListProvider),
          ),
        ],
      ),
      drawer: const DrawerNavigation(),
      body: SafeArea(
        child: Column(
          children: [
            // Search Bar & Filter Chips Header
            Container(
              color: Colors.white,
              padding: const EdgeInsets.only(left: 16, right: 16, top: 12, bottom: 8),
              child: Column(
                children: [
                  // Search Input Field
                  TextField(
                    controller: _searchController,
                    onChanged: (val) {
                      ref.read(roomSearchQueryProvider.notifier).state = val;
                    },
                    decoration: InputDecoration(
                      hintText: 'Search room number or type...',
                      prefixIcon: const Icon(Icons.search, color: AppColors.textSecondary),
                      suffixIcon: _searchController.text.isNotEmpty
                          ? IconButton(
                              icon: const Icon(Icons.clear, size: 18),
                              onPressed: () {
                                _searchController.clear();
                                ref.read(roomSearchQueryProvider.notifier).state = '';
                              },
                            )
                          : null,
                      filled: true,
                      fillColor: Colors.grey.shade100,
                      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: BorderSide.none,
                      ),
                    ),
                  ),
                  const SizedBox(height: 10),

                  // Horizontal Filter Chips List
                  SizedBox(
                    height: 38,
                    child: ListView.separated(
                      scrollDirection: Axis.horizontal,
                      itemCount: _filterChips.length,
                      separatorBuilder: (context, index) => const SizedBox(width: 8),
                      itemBuilder: (context, index) {
                        final chip = _filterChips[index];
                        final isSelected = selectedFilterStatus == chip['status'];

                        return FilterChip(
                          label: Text(chip['label']!),
                          selected: isSelected,
                          selectedColor: AppColors.primary,
                          checkmarkColor: Colors.white,
                          labelStyle: TextStyle(
                            color: isSelected ? Colors.white : AppColors.textPrimary,
                            fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                            fontSize: 12,
                          ),
                          backgroundColor: Colors.grey.shade100,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(16),
                            side: BorderSide(
                              color: isSelected ? AppColors.primary : Colors.grey.shade300,
                            ),
                          ),
                          onSelected: (selected) {
                            ref.read(roomFilterStatusProvider.notifier).state =
                                isSelected ? null : chip['status'];
                          },
                        );
                      },
                    ),
                  ),
                ],
              ),
            ),
            const Divider(height: 1),

            // Main Rooms List Body
            Expanded(
              child: RefreshIndicator(
                onRefresh: () async {
                  ref.invalidate(roomsListProvider);
                },
                child: filteredRoomsAsync.when(
                  loading: () => const RoomsSkeletonLoader(),
                  error: (err, stack) => SingleChildScrollView(
                    physics: const AlwaysScrollableScrollPhysics(),
                    child: SizedBox(
                      height: MediaQuery.of(context).size.height * 0.6,
                      child: EmptyStateView(
                        title: 'Failed to Load Rooms',
                        description: 'Unable to fetch room list from backend API.',
                        onRetry: () => ref.invalidate(roomsListProvider),
                      ),
                    ),
                  ),
                  data: (rooms) {
                    if (rooms.isEmpty) {
                      return SingleChildScrollView(
                        physics: const AlwaysScrollableScrollPhysics(),
                        child: SizedBox(
                          height: MediaQuery.of(context).size.height * 0.6,
                          child: const EmptyStateView(
                            icon: Icons.meeting_room_outlined,
                            title: 'No Rooms Found',
                            description: 'No hotel rooms match the search query or filter.',
                          ),
                        ),
                      );
                    }

                    return ListView.builder(
                      padding: const EdgeInsets.all(16),
                      itemCount: rooms.length,
                      itemBuilder: (context, index) {
                        final room = rooms[index];
                        return RoomCard(
                          room: room,
                          onTap: () => _openRoomDetails(room),
                        );
                      },
                    );
                  },
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
