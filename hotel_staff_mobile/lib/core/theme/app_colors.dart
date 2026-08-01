import 'package:flutter/material.dart';

class AppColors {
  // Deep Purple / Indigo Brand Palette
  static const Color primary = Color(0xFF2D1B69); // Deep Purple
  static const Color primaryLight = Color(0xFF4338CA); // Indigo
  static const Color primaryDark = Color(0xFF1E1B4B); // Dark Indigo
  
  static const Color secondary = Color(0xFF6366F1); // Soft Indigo Accent
  static const Color accent = Color(0xFFD97706); // Warm Amber Gold

  // Soft Neutral Backgrounds & Surfaces
  static const Color background = Color(0xFFF8FAFC); // Soft Slate Light
  static const Color surface = Color(0xFFFFFFFF); // Pure White Card Surface
  static const Color surfaceVariant = Color(0xFFF1F5F9); // Muted Slate Fill
  static const Color border = Color(0xFFE2E8F0); // Subtle Border

  // High-Readability Dark Typography
  static const Color textPrimary = Color(0xFF0F172A); // Dark Slate Primary Text
  static const Color textSecondary = Color(0xFF64748B); // Slate Secondary Text
  static const Color textMuted = Color(0xFF94A3B8); // Muted Text

  // Status & Badge Palette (Subtle & Professional)
  static const Color success = Color(0xFF059669);
  static const Color successBackground = Color(0xFFECFDF5);
  
  static const Color warning = Color(0xFFD97706);
  static const Color warningBackground = Color(0xFFFFFBEB);
  
  static const Color danger = Color(0xFFDC2626);
  static const Color dangerBackground = Color(0xFFFEF2F2);

  static const Color info = Color(0xFF4F46E5);
  static const Color infoBackground = Color(0xFFEEF2FF);

  // Room & Housekeeping Status
  static const Color roomAvailable = Color(0xFF059669);
  static const Color roomOccupied = Color(0xFF4F46E5);
  static const Color roomDirty = Color(0xFFD97706);
  static const Color roomMaintenance = Color(0xFFDC2626);
  static const Color roomOutOfOrder = Color(0xFF64748B);
}
