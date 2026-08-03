import 'dart:math';
import 'package:flutter/material.dart';

class OccupancyGaugePainter extends CustomPainter {
  final double percentage;
  final Color trackColor;
  final Color progressColor;
  final double strokeWidth;

  OccupancyGaugePainter({
    required this.percentage,
    required this.trackColor,
    required this.progressColor,
    this.strokeWidth = 10.0,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = (min(size.width, size.height) - strokeWidth) / 2;

    // Track Paint
    final trackPaint = Paint()
      ..color = trackColor
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth
      ..strokeCap = StrokeCap.round;

    // Background track arc (240 degrees angle)
    const startAngle = 135 * (pi / 180);
    const sweepAngle = 270 * (pi / 180);

    canvas.drawArc(
      Rect.fromCircle(center: center, radius: radius),
      startAngle,
      sweepAngle,
      false,
      trackPaint,
    );

    // Progress Paint
    final progressPaint = Paint()
      ..shader = SweepGradient(
        colors: [
          progressColor.withAlpha(180),
          progressColor,
          Colors.white,
        ],
        stops: const [0.0, 0.7, 1.0],
        transform: const GradientRotation(startAngle),
      ).createShader(Rect.fromCircle(center: center, radius: radius))
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth
      ..strokeCap = StrokeCap.round;

    final progressSweep = (percentage.clamp(0, 100) / 100) * sweepAngle;

    if (progressSweep > 0) {
      canvas.drawArc(
        Rect.fromCircle(center: center, radius: radius),
        startAngle,
        progressSweep,
        false,
        progressPaint,
      );
    }
  }

  @override
  bool shouldRepaint(covariant OccupancyGaugePainter oldDelegate) {
    return oldDelegate.percentage != percentage ||
        oldDelegate.progressColor != progressColor ||
        oldDelegate.trackColor != trackColor;
  }
}
