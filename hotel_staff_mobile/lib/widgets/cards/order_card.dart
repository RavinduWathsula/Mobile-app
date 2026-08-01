import 'package:flutter/material.dart';
import '../../models/restaurant_order_model.dart';
import '../status/status_badge.dart';
import '../../core/utils/formatters.dart';

class OrderCard extends StatelessWidget {
  final RestaurantOrderModel order;
  final VoidCallback? onTap;

  const OrderCard({
    super.key,
    required this.order,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    order.orderNumber,
                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                  ),
                  StatusBadge(status: order.status),
                ],
              ),
              const SizedBox(height: 6),
              Text(
                '${order.orderType.toUpperCase()} • Table: ${order.tableNumber ?? "Takeaway"}',
                style: const TextStyle(fontSize: 13, color: Colors.grey),
              ),
              const SizedBox(height: 4),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('${order.items.length} items', style: const TextStyle(fontSize: 12, color: Colors.grey)),
                  Text(
                    Formatters.formatCurrency(order.totalAmount),
                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: Colors.blue),
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
