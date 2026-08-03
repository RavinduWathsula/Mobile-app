import 'package:flutter/material.dart';

class RoomDistributionBar extends StatelessWidget {
  final int total;
  final int occupied;
  final int available;
  final int dirty;
  final int maintenance;

  const RoomDistributionBar({
    super.key,
    required this.total,
    required this.occupied,
    required this.available,
    required this.dirty,
    required this.maintenance,
  });

  @override
  Widget build(BuildContext context) {
    final validTotal = total > 0 ? total : 1;

    final occupiedFlex = (occupied / validTotal * 100).round();
    final availableFlex = (available / validTotal * 100).round();
    final dirtyFlex = (dirty / validTotal * 100).round();
    final maintenanceFlex = (maintenance / validTotal * 100).round();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        ClipRRect(
          borderRadius: BorderRadius.circular(8),
          child: Container(
            height: 10,
            decoration: BoxDecoration(
              color: Colors.white.withAlpha(40),
            ),
            child: Row(
              children: [
                if (occupiedFlex > 0)
                  Expanded(
                    flex: occupiedFlex,
                    child: Container(color: const Color(0xFFA855F7)), // Purple
                  ),
                if (availableFlex > 0)
                  Expanded(
                    flex: availableFlex,
                    child: Container(color: const Color(0xFF10B981)), // Emerald
                  ),
                if (dirtyFlex > 0)
                  Expanded(
                    flex: dirtyFlex,
                    child: Container(color: const Color(0xFFF59E0B)), // Amber
                  ),
                if (maintenanceFlex > 0)
                  Expanded(
                    flex: maintenanceFlex,
                    child: Container(color: const Color(0xFFEF4444)), // Red
                  ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 10),
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            _LegendItem(color: const Color(0xFFA855F7), label: 'Occupied', count: occupied),
            _LegendItem(color: const Color(0xFF10B981), label: 'Available', count: available),
            _LegendItem(color: const Color(0xFFF59E0B), label: 'Dirty', count: dirty),
            _LegendItem(color: const Color(0xFFEF4444), label: 'Maint.', count: maintenance),
          ],
        ),
      ],
    );
  }
}

class _LegendItem extends StatelessWidget {
  final Color color;
  final String label;
  final int count;

  const _LegendItem({
    required this.color,
    required this.label,
    required this.count,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(
          width: 8,
          height: 8,
          decoration: BoxDecoration(
            color: color,
            shape: BoxShape.circle,
          ),
        ),
        const SizedBox(width: 4),
        Text(
          '$label: $count',
          style: TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.w500,
            color: Colors.white.withAlpha(220),
          ),
        ),
      ],
    );
  }
}
