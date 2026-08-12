import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../models/room_model.dart';
import '../../providers/rooms_provider.dart';
import '../../providers/services_provider.dart';
import '../../providers/auth_provider.dart';
import '../../providers/dashboard_provider.dart';
import '../status/status_badge.dart';
import '../../core/utils/formatters.dart';
import '../../core/theme/app_colors.dart';

class RoomDetailsSheet extends ConsumerStatefulWidget {
  final RoomModel room;

  const RoomDetailsSheet({
    super.key,
    required this.room,
  });

  @override
  ConsumerState<RoomDetailsSheet> createState() => _RoomDetailsSheetState();
}

class _RoomDetailsSheetState extends ConsumerState<RoomDetailsSheet> {
  late String _selectedStatus;
  bool _isSaving = false;

  final Map<String, String> _statusDisplayNames = {
    'available': 'Available',
    'occupied': 'Occupied',
    'dirty': 'Dirty',
    'maintenance': 'Maintenance',
    'out_of_order': 'Out of Order',
  };

  @override
  void initState() {
    super.initState();
    _selectedStatus = widget.room.status.toLowerCase();
  }

  bool _canEditStatus(user) {
    if (user == null) return false;
    final role = user.role.toLowerCase();
    return role == 'administrator' || role == 'admin' || role == 'manager' || role == 'front office';
  }

  void _handleStatusUpdate(user) async {
    if (_selectedStatus == widget.room.status.toLowerCase()) {
      Navigator.pop(context);
      return;
    }

    if (!_canEditStatus(user)) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Room status updates require Front Office or Manager permissions.'),
          backgroundColor: AppColors.danger,
        ),
      );
      return;
    }

    setState(() {
      _isSaving = true;
    });

    try {
      final repo = ref.read(roomsRepositoryProvider);
      await repo.updateRoomStatus(widget.room.id, _selectedStatus);

      ref.invalidate(roomsListProvider);
      ref.invalidate(dashboardStatsProvider);

      if (mounted) {
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Room ${widget.room.roomNumber} updated to ${_statusDisplayNames[_selectedStatus]}'),
            backgroundColor: AppColors.success,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isSaving = false;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to update room status: ${e.toString()}'),
            backgroundColor: AppColors.danger,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(authProvider).user;
    final canEdit = _canEditStatus(user);

    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      padding: EdgeInsets.only(
        top: 20,
        left: 20,
        right: 20,
        bottom: MediaQuery.of(context).viewInsets.bottom + 20,
      ),
      child: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Drag Handle Bar
            Center(
              child: Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.grey.shade300,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Header Row: Room Number & Type
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Room ${widget.room.roomNumber}',
                      style: const TextStyle(
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                        color: AppColors.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      '${widget.room.roomTypeName ?? "Standard Room"} • Floor ${widget.room.floor}',
                      style: const TextStyle(
                        fontSize: 14,
                        color: AppColors.textSecondary,
                      ),
                    ),
                  ],
                ),
                StatusBadge(status: widget.room.status),
              ],
            ),
            const SizedBox(height: 16),

            // Room Price & Capacity Card
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: AppColors.primary.withAlpha(15),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppColors.primary.withAlpha(35)),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceAround,
                children: [
                  Column(
                    children: [
                      const Text('Base Price', style: TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                      const SizedBox(height: 2),
                      Text(
                        '${Formatters.formatCurrency(widget.room.basePrice)}/night',
                        style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: AppColors.primary),
                      ),
                    ],
                  ),
                  Container(height: 24, width: 1, color: AppColors.primary.withAlpha(50)),
                  Column(
                    children: [
                      const Text('Max Occupancy', style: TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                      const SizedBox(height: 2),
                      Text(
                        '${widget.room.maxOccupancy ?? 2} Guests',
                        style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Features & Amenities
            if (widget.room.features.isNotEmpty) ...[
              const Text('Features & Amenities', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                runSpacing: 6,
                children: widget.room.features.map((feature) {
                  return Chip(
                    backgroundColor: Colors.grey.shade100,
                    side: BorderSide(color: Colors.grey.shade300),
                    avatar: const Icon(Icons.check_circle, size: 16, color: AppColors.success),
                    label: Text(feature, style: const TextStyle(fontSize: 12)),
                  );
                }).toList(),
              ),
              const SizedBox(height: 16),
            ],

            // Active Guest Info (if occupied)
            if (widget.room.currentGuestName != null) ...[
              const Text('Current Guest Info', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: const Color(0xFF8B5CF6).withAlpha(15),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: const Color(0xFF8B5CF6).withAlpha(40)),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.person, color: Color(0xFF8B5CF6)),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            widget.room.currentGuestName!,
                            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                          ),
                          const Text('Active Checked-in Guest', style: TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
            ],

            // Active Booking Info (if available)
            if (widget.room.currentBookingRef != null) ...[
              const Text('Booking Information', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: const Color(0xFF10B981).withAlpha(15),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: const Color(0xFF10B981).withAlpha(40)),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.calendar_month, color: Color(0xFF10B981)),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Ref: ${widget.room.currentBookingRef!}',
                            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                          ),
                          if (widget.room.currentBookingCheckIn != null && widget.room.currentBookingCheckOut != null)
                            Text(
                              'Stay: ${Formatters.formatDate(widget.room.currentBookingCheckIn!)} - ${Formatters.formatDate(widget.room.currentBookingCheckOut!)}',
                              style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
                            ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
            ],

            // Housekeeping Task Info (if available)
            if (widget.room.assignedHousekeeper != null) ...[
              const Text('Housekeeping Task', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: const Color(0xFFF59E0B).withAlpha(15),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: const Color(0xFFF59E0B).withAlpha(40)),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.cleaning_services, color: Color(0xFFF59E0B)),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Assignee: ${widget.room.assignedHousekeeper}',
                            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                          ),
                          Text('Task Status: ${widget.room.housekeepingTaskStatus ?? "In Queue"}',
                              style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
            ],

            // Room Status Update Selector
            const Text('Update Room Status', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: _statusDisplayNames.entries.map((entry) {
                final isSelected = _selectedStatus == entry.key;
                return ChoiceChip(
                  label: Text(entry.value),
                  selected: isSelected,
                  selectedColor: AppColors.primary,
                  labelStyle: TextStyle(
                    color: isSelected ? Colors.white : AppColors.textPrimary,
                    fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                    fontSize: 13,
                  ),
                  onSelected: canEdit
                      ? (selected) {
                          if (selected) {
                            setState(() {
                              _selectedStatus = entry.key;
                            });
                          }
                        }
                      : null,
                );
              }).toList(),
            ),
            const SizedBox(height: 20),

            // Notice for Read-Only Users
            if (!canEdit) ...[
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: Colors.amber.shade50,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: Colors.amber.shade300),
                ),
                child: const Row(
                  children: [
                    Icon(Icons.info_outline, color: Colors.amber, size: 18),
                    SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        'Room status updates are restricted to Front Office & Management.',
                        style: TextStyle(fontSize: 12, color: Colors.black87),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
            ],

            // Action Buttons
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: () => Navigator.pop(context),
                    child: const Text('Close'),
                  ),
                ),
                if (canEdit) ...[
                  const SizedBox(width: 12),
                  Expanded(
                    child: ElevatedButton(
                      style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary),
                      onPressed: _isSaving ? null : () => _handleStatusUpdate(user),
                      child: _isSaving
                          ? const SizedBox(
                              width: 18,
                              height: 18,
                              child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                            )
                          : const Text('Save Status', style: TextStyle(color: Colors.white)),
                    ),
                  ),
                ],
              ],
            ),
          ],
        ),
      ),
    );
  }
}
