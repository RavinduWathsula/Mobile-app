import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'core/theme/app_theme.dart';
import 'routing/app_router.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(
    const ProviderScope(
      child: HotelStaffApp(),
    ),
  );
}

class HotelStaffApp extends ConsumerWidget {
  const HotelStaffApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(routerProvider);

    return MaterialApp.router(
      title: 'Sawingir Hills Staff',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      routerConfig: router,
      builder: (context, child) {
        return MediaQuery(
          data: MediaQuery.of(context),
          child: LayoutBuilder(
            builder: (context, constraints) {
              if (constraints.maxWidth > 600) {
                return Container(
                  color: const Color(0xFF0F172A), // Dark slate background
                  child: Center(
                    child: Container(
                      width: 412,
                      height: 870,
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(36),
                        boxShadow: const [
                          BoxShadow(
                            color: Colors.black45,
                            blurRadius: 24,
                            spreadRadius: 4,
                            offset: Offset(0, 8),
                          ),
                        ],
                        border: Border.all(color: const Color(0xFF334155), width: 8),
                      ),
                      clipBehavior: Clip.antiAlias,
                      child: child,
                    ),
                  ),
                );
              }
              return child ?? const SizedBox();
            },
          ),
        );
      },
    );
  }
}
