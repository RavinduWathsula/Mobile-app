import 'package:flutter/material.dart';

class DashboardSkeleton extends StatefulWidget {
  const DashboardSkeleton({super.key});

  @override
  State<DashboardSkeleton> createState() => _DashboardSkeletonState();
}

class _DashboardSkeletonState extends State<DashboardSkeleton> with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _animation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1000),
    )..repeat(reverse: true);
    _animation = Tween<double>(begin: 0.3, end: 0.7).animate(_controller);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Widget _buildBox({required double height, double? width, double borderRadius = 8}) {
    return AnimatedBuilder(
      animation: _animation,
      builder: (context, child) {
        return Container(
          height: height,
          width: width,
          decoration: BoxDecoration(
            color: Colors.grey.shade300.withAlpha((_animation.value * 255).round()),
            borderRadius: BorderRadius.circular(borderRadius),
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16.0),
      children: [
        // Header Skeleton
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildBox(height: 14, width: 120),
                const SizedBox(height: 8),
                _buildBox(height: 22, width: 180),
                const SizedBox(height: 6),
                _buildBox(height: 12, width: 140),
              ],
            ),
            Row(
              children: [
                _buildBox(height: 40, width: 40, borderRadius: 20),
                const SizedBox(width: 10),
                _buildBox(height: 40, width: 40, borderRadius: 20),
              ],
            ),
          ],
        ),
        const SizedBox(height: 24),

        // Occupancy Card Skeleton
        _buildBox(height: 160, borderRadius: 16),
        const SizedBox(height: 24),

        // Operations Section Title
        _buildBox(height: 16, width: 150),
        const SizedBox(height: 12),

        // Operations Grid Skeleton (2x2)
        Row(
          children: [
            Expanded(child: _buildBox(height: 90, borderRadius: 12)),
            const SizedBox(width: 12),
            Expanded(child: _buildBox(height: 90, borderRadius: 12)),
          ],
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(child: _buildBox(height: 90, borderRadius: 12)),
            const SizedBox(width: 12),
            Expanded(child: _buildBox(height: 90, borderRadius: 12)),
          ],
        ),
        const SizedBox(height: 24),

        // Quick Actions Title
        _buildBox(height: 16, width: 130),
        const SizedBox(height: 12),

        // Quick Actions Grid (3x2)
        Row(
          children: [
            Expanded(child: _buildBox(height: 70, borderRadius: 12)),
            const SizedBox(width: 8),
            Expanded(child: _buildBox(height: 70, borderRadius: 12)),
            const SizedBox(width: 8),
            Expanded(child: _buildBox(height: 70, borderRadius: 12)),
          ],
        ),
        const SizedBox(height: 24),

        // Recent Activity Skeleton
        _buildBox(height: 16, width: 140),
        const SizedBox(height: 12),
        _buildBox(height: 60, borderRadius: 10),
        const SizedBox(height: 8),
        _buildBox(height: 60, borderRadius: 10),
      ],
    );
  }
}
