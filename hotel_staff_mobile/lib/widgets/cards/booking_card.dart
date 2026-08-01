import 'package:flutter/material.dart';
import '../../models/booking_model.dart';
import '../status/status_badge.dart';
import '../../core/utils/formatters.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_typography.dart';

class BookingCard extends StatelessWidget {
  final BookingModel booking;
  final VoidCallback? onTap;

  const BookingCard({
    super.key,
    required this.booking,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    booking.bookingRef,
                    style: AppTypography.titleMedium.copyWith(
                      color: AppColors.primary,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  StatusBadge(status: booking.status),
                ],
              ),
              const SizedBox(height: 10),
              Row(
                children: [
                  const Icon(Icons.person_outline, size: 18, color: AppColors.textSecondary),
                  const SizedBox(width: 8),
                  Text(
                    booking.guestFullName,
                    style: AppTypography.bodyMedium.copyWith(fontWeight: FontWeight.w600),
                  ),
                ],
              ),
              const SizedBox(height: 6),
              Row(
                children: [
                  const Icon(Icons.king_bed_outlined, size: 18, color: AppColors.textSecondary),
                  const SizedBox(width: 8),
                  Text(
                    'Room ${booking.roomNumber ?? "Unassigned"} (${booking.roomTypeName ?? ""})',
                    style: AppTypography.bodySmall,
                  ),
                ],
              ),
              const SizedBox(height: 6),
              Row(
                children: [
                  const Icon(Icons.calendar_today_outlined, size: 18, color: AppColors.textSecondary),
                  const SizedBox(width: 8),
                  Text(
                    '${Formatters.formatDate(booking.checkIn)} → ${Formatters.formatDate(booking.checkOut)}',
                    style: AppTypography.bodySmall,
                  ),
                ],
              ),
              const Divider(height: 20),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Total: ${Formatters.formatCurrency(booking.totalAmount)}',
                    style: AppTypography.bodyMedium.copyWith(fontWeight: FontWeight.bold),
                  ),
                  if (booking.balanceDue > 0)
                    Text(
                      'Due: ${Formatters.formatCurrency(booking.balanceDue)}',
                      style: AppTypography.bodySmall.copyWith(
                        color: AppColors.danger,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
