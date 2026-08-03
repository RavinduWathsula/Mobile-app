import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/constants/api_endpoints.dart';
import '../../core/theme/app_colors.dart';

class SettingsScreen extends ConsumerStatefulWidget {
  const SettingsScreen({super.key});

  @override
  ConsumerState<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends ConsumerState<SettingsScreen> {
  bool _enableNotifications = true;
  bool _compactMode = false;
  String _currentServerUrl = ApiEndpoints.defaultBaseUrl;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text(
          'App Settings',
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16.0),
        children: [
          // Section: Server Configuration
          const _SectionHeader(title: 'Network & Server'),
          Card(
            elevation: 0,
            color: Colors.grey.shade50,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
              side: BorderSide(color: Colors.grey.shade200),
            ),
            child: ListTile(
              leading: Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: AppColors.primary.withAlpha(25),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Icon(Icons.dns_outlined, color: AppColors.primary),
              ),
              title: const Text('API Base URL', style: TextStyle(fontWeight: FontWeight.w600)),
              subtitle: Text(_currentServerUrl, style: const TextStyle(fontSize: 12)),
              trailing: const Icon(Icons.chevron_right, size: 20),
              onTap: _showServerUrlDialog,
            ),
          ),
          const SizedBox(height: 20),

          // Section: Preferences
          const _SectionHeader(title: 'Preferences'),
          Card(
            elevation: 0,
            color: Colors.grey.shade50,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
              side: BorderSide(color: Colors.grey.shade200),
            ),
            child: Column(
              children: [
                SwitchListTile(
                  secondary: Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: AppColors.info.withAlpha(25),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Icon(Icons.notifications_outlined, color: AppColors.info),
                  ),
                  title: const Text('Real-time Notifications', style: TextStyle(fontWeight: FontWeight.w600)),
                  subtitle: const Text('Alerts for arrivals, orders & tasks', style: TextStyle(fontSize: 12)),
                  value: _enableNotifications,
                  activeTrackColor: AppColors.primary,
                  onChanged: (val) {
                    setState(() {
                      _enableNotifications = val;
                    });
                  },
                ),
                const Divider(height: 1),
                SwitchListTile(
                  secondary: Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: AppColors.success.withAlpha(25),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Icon(Icons.view_compact_outlined, color: AppColors.success),
                  ),
                  title: const Text('Compact Density Mode', style: TextStyle(fontWeight: FontWeight.w600)),
                  subtitle: const Text('Show more rows on screen', style: TextStyle(fontSize: 12)),
                  value: _compactMode,
                  activeTrackColor: AppColors.primary,
                  onChanged: (val) {
                    setState(() {
                      _compactMode = val;
                    });
                  },
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),

          // Section: System Info
          const _SectionHeader(title: 'System Information'),
          Card(
            elevation: 0,
            color: Colors.grey.shade50,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
              side: BorderSide(color: Colors.grey.shade200),
            ),
            child: const Column(
              children: [
                ListTile(
                  leading: Icon(Icons.info_outline, color: AppColors.textSecondary),
                  title: Text('Application Version', style: TextStyle(fontWeight: FontWeight.w500)),
                  trailing: Text('1.0.0+1', style: TextStyle(fontWeight: FontWeight.bold, color: AppColors.primary)),
                ),
                Divider(height: 1),
                ListTile(
                  leading: Icon(Icons.hotel_outlined, color: AppColors.textSecondary),
                  title: Text('System', style: TextStyle(fontWeight: FontWeight.w500)),
                  trailing: Text('Sawingir Hills HMS Staff', style: TextStyle(color: AppColors.textSecondary)),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  void _showServerUrlDialog() {
    final controller = TextEditingController(text: _currentServerUrl);
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Configure API Server URL'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Specify the backend endpoint for mobile synchronization:',
              style: TextStyle(fontSize: 13, color: AppColors.textSecondary),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: controller,
              decoration: const InputDecoration(
                labelText: 'Server URL',
                hintText: 'http://localhost:3010/api',
                border: OutlineInputBorder(),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              if (controller.text.trim().isNotEmpty) {
                setState(() {
                  _currentServerUrl = controller.text.trim();
                });
              }
              Navigator.pop(context);
            },
            child: const Text('Save'),
          ),
        ],
      ),
    );
  }
}

class _SectionHeader extends StatelessWidget {
  final String title;
  const _SectionHeader({required this.title});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(left: 4, bottom: 8),
      child: Text(
        title.toUpperCase(),
        style: const TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.bold,
          color: AppColors.textSecondary,
          letterSpacing: 0.8,
        ),
      ),
    );
  }
}
