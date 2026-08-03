import 'package:flutter/material.dart';

class RoomsSkeletonLoader extends StatefulWidget {
  const RoomsSkeletonLoader({super.key});

  @override
  State<RoomsSkeletonLoader> createState() => _RoomsSkeletonLoaderState();
}

class _RoomsSkeletonLoaderState extends State<RoomsSkeletonLoader> with SingleTickerProviderStateMixin {
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
    return ListView.builder(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      itemCount: 6,
      itemBuilder: (context, index) {
        return Container(
          margin: const EdgeInsets.only(bottom: 12),
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: Colors.grey.shade200),
          ),
          child: Row(
            children: [
              _buildBox(height: 52, width: 52, borderRadius: 12),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _buildBox(height: 16, width: 140),
                    const SizedBox(height: 6),
                    _buildBox(height: 12, width: 100),
                    const SizedBox(height: 6),
                    _buildBox(height: 12, width: 80),
                  ],
                ),
              ),
              _buildBox(height: 28, width: 70, borderRadius: 14),
            ],
          ),
        );
      },
    );
  }
}
