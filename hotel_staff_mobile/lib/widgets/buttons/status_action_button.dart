import 'package:flutter/material.dart';

class StatusActionButton extends StatelessWidget {
  final String label;
  final VoidCallback onPressed;
  final Color color;
  final IconData? icon;

  const StatusActionButton({
    super.key,
    required this.label,
    required this.onPressed,
    this.color = Colors.blue,
    this.icon,
  });

  @override
  Widget build(BuildContext context) {
    return ElevatedButton.icon(
      style: ElevatedButton.styleFrom(
        backgroundColor: color,
        foregroundColor: Colors.white,
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      ),
      onPressed: onPressed,
      icon: Icon(icon ?? Icons.check, size: 16),
      label: Text(label, style: const TextStyle(fontSize: 12)),
    );
  }
}
