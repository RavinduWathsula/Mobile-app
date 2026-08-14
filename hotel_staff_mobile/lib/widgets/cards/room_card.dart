import 'package:flutter/material.dart';
import '../../models/room_model.dart';
import '../status/status_badge.dart';
import '../../core/utils/formatters.dart';
import '../../core/theme/app_colors.dart';

class RoomCard extends StatelessWidget {
  final RoomModel room;
  final VoidCallback? onTap;

  const RoomCard({
    super.key,
    required this.room,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final statusColor = _getStatusColor(room.status);

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      child: Material(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(16),
          child: Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: Colors.grey.shade200),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    // Room Number Badge
                    Container(
                      width: 54,
                      height: 54,
                      decoration: BoxDecoration(
                        color: statusColor.withAlpha(25),
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(color: statusColor.withAlpha(60)),
                      ),
                      child: Center(
                        child: Text(
                          room.roomNumber,
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                            color: statusColor,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 14),

                    // Room Type & Floor Details
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            room.roomTypeName ?? 'Standard Room',
                            style: const TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.bold,
                              color: AppColors.textPrimary,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            'Floor ${room.floor}${room.maxOccupancy != null ? " • Max ${room.maxOccupancy} Guests" : ""}',
                            style: const TextStyle(
                              fontSize: 12,
                              color: AppColors.textSecondary,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            '${Formatters.formatCurrency(room.basePrice)} / night',
                            style: const TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.bold,
                              color: AppColors.primary,
                            ),
                          ),
                        ],
                      ),
                    ),

                    // Status Badge
                    StatusBadge(status: room.status),
                  ],
                ),

                // Active Guest or Housekeeping Preview Tags
                if (room.currentGuestName != null || room.assignedHousekeeper != null || room.currentBookingTotalAmount != null) ...[
                  const SizedBox(height: 12),
                  const Divider(height: 1),
                  const SizedBox(height: 8),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          if (room.currentGuestName != null) ...[
                            const Icon(Icons.person_outline, size: 14, color: AppColors.primary),
                            const SizedBox(width: 4),
                            Expanded(
                              child: Text(
                                'Guest: ${room.currentGuestName}',
                                style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500, color: AppColors.textPrimary),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                          ],
                          if (room.assignedHousekeeper != null) ...[
                            const Icon(Icons.cleaning_services_outlined, size: 14, color: Color(0xFFF59E0B)),
                            const SizedBox(width: 4),
                            Expanded(
                              child: Text(
                                'Cleaner: ${room.assignedHousekeeper}',
                                style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500, color: AppColors.textPrimary),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                          ],
                        ],
                      ),
                      if (room.currentBookingTotalAmount != null) ...[
                        const SizedBox(height: 6),
                        Row(
                          children: [
                            const Icon(Icons.payments_outlined, size: 14, color: Colors.green),
                            const SizedBox(width: 4),
                            Expanded(
                              child: Text(
                                'Booking Total: ${Formatters.formatCurrency(room.currentBookingTotalAmount!)}',
                                style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.green),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ],
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }

  Color _getStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'available':
        return const Color(0xFF10B981); // Emerald
      case 'occupied':
        return const Color(0xFF8B5CF6); // Purple
      case 'dirty':
        return const Color(0xFFF59E0B); // Amber
      case 'maintenance':
        return const Color(0xFFEF4444); // Red
      case 'out_of_order':
        return const Color(0xFF64748B); // Slate
      default:
        return AppColors.primary;
    }
  }
}
