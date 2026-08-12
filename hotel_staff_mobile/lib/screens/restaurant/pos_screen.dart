import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../providers/restaurant_provider.dart';
import '../../providers/services_provider.dart';
import '../../widgets/common/drawer_navigation.dart';
import '../../widgets/status/status_badge.dart';
import '../../widgets/loading/loading_indicator.dart';
import '../../widgets/empty_states/empty_state_view.dart';
import '../../core/utils/formatters.dart';
import '../../models/menu_item_model.dart';
import '../../models/restaurant_table_model.dart';

class _CartItem {
  final MenuItemModel menuItem;
  int quantity;
  String? specialInstructions;

  _CartItem({required this.menuItem, this.quantity = 1, this.specialInstructions});

  double get totalPrice => menuItem.price * quantity;
}

class POSScreen extends ConsumerStatefulWidget {
  const POSScreen({super.key});

  @override
  ConsumerState<POSScreen> createState() => _POSScreenState();
}

class _POSScreenState extends ConsumerState<POSScreen> {
  final List<_CartItem> _cart = [];
  bool _isSubmitting = false;
  String? _selectedTableCode;

  void _addToCart(MenuItemModel item) {
    setState(() {
      final existingIndex = _cart.indexWhere((c) => c.menuItem.id == item.id);
      if (existingIndex >= 0) {
        _cart[existingIndex].quantity += 1;
      } else {
        _cart.add(_CartItem(menuItem: item));
      }
    });
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('${item.name} added to cart'),
        duration: const Duration(seconds: 1),
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  void _removeFromCart(int index) {
    setState(() {
      _cart.removeAt(index);
    });
  }

  void _updateQuantity(int index, int delta) {
    setState(() {
      _cart[index].quantity += delta;
      if (_cart[index].quantity <= 0) {
        _cart.removeAt(index);
      }
    });
  }

  double get _cartTotal => _cart.fold(0, (sum, item) => sum + item.totalPrice);

  Future<void> _submitOrder() async {
    if (_cart.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Cart is empty')));
      return;
    }
    if (_selectedTableCode == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please select a table')));
      return;
    }

    setState(() => _isSubmitting = true);
    try {
      final repo = ref.read(restaurantRepositoryProvider);
      
      final items = _cart.map((c) => {
        'menuItemId': c.menuItem.id,
        'quantity': c.quantity,
        if (c.specialInstructions != null) 'specialInstructions': c.specialInstructions,
      }).toList();

      await repo.createOrder(
        orderType: 'dine_in',
        tableNumber: _selectedTableCode,
        items: items,
      );

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Order sent to kitchen!')));
        Navigator.pop(context); // Close bottom sheet
        setState(() {
          _cart.clear();
          _selectedTableCode = null;
        });
        ref.invalidate(restaurantTablesProvider);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e'), backgroundColor: Colors.red));
      }
    } finally {
      if (mounted) {
        setState(() => _isSubmitting = false);
      }
    }
  }

  void _showCartBottomSheet(List<RestaurantTableModel> availableTables) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            return Padding(
              padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
              child: Container(
                padding: const EdgeInsets.all(20),
                height: MediaQuery.of(context).size.height * 0.8,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    const Text('Order Cart', style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
                    const Divider(),
                    if (_cart.isEmpty)
                      const Expanded(child: Center(child: Text('Your cart is empty')))
                    else
                      Expanded(
                        child: ListView.builder(
                          itemCount: _cart.length,
                          itemBuilder: (context, index) {
                            final item = _cart[index];
                            return ListTile(
                              title: Text(item.menuItem.name, style: const TextStyle(fontWeight: FontWeight.bold)),
                              subtitle: Text(Formatters.formatCurrency(item.totalPrice)),
                              trailing: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  IconButton(
                                    icon: const Icon(Icons.remove_circle_outline),
                                    onPressed: () {
                                      setModalState(() {});
                                      _updateQuantity(index, -1);
                                    },
                                  ),
                                  Text('${item.quantity}', style: const TextStyle(fontSize: 16)),
                                  IconButton(
                                    icon: const Icon(Icons.add_circle_outline),
                                    onPressed: () {
                                      setModalState(() {});
                                      _updateQuantity(index, 1);
                                    },
                                  ),
                                ],
                              ),
                            );
                          },
                        ),
                      ),
                    const Divider(),
                    DropdownButtonFormField<String>(
                      decoration: const InputDecoration(labelText: 'Select Table', border: OutlineInputBorder()),
                      initialValue: _selectedTableCode,
                      items: availableTables.map((t) => DropdownMenuItem(
                        value: t.code,
                        child: Text('${t.code} - ${t.name} (Cap: ${t.capacity})'),
                      )).toList(),
                      onChanged: (val) {
                        setModalState(() => _selectedTableCode = val);
                        setState(() => _selectedTableCode = val);
                      },
                    ),
                    const SizedBox(height: 20),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Total:', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
                        Text(Formatters.formatCurrency(_cartTotal), style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.blue)),
                      ],
                    ),
                    const SizedBox(height: 20),
                    ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        backgroundColor: Colors.blue,
                        foregroundColor: Colors.white,
                      ),
                      onPressed: _isSubmitting ? null : () {
                        setModalState(() {}); // Trigger rebuild for loading state
                        _submitOrder();
                      },
                      child: _isSubmitting 
                          ? const CircularProgressIndicator(color: Colors.white) 
                          : const Text('Send Order to Kitchen', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                    ),
                  ],
                ),
              ),
            );
          }
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final tablesAsync = ref.watch(restaurantTablesProvider);
    final menuAsync = ref.watch(menuItemsProvider);
    
    // Extract available tables for the dropdown
    List<RestaurantTableModel> tablesList = [];
    if (tablesAsync.hasValue) {
      tablesList = tablesAsync.value!;
    }

    return DefaultTabController(
      length: 2,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Restaurant POS'),
          bottom: const TabBar(
            tabs: [
              Tab(icon: Icon(Icons.restaurant_menu), text: 'Menu Items'),
              Tab(icon: Icon(Icons.table_restaurant), text: 'Tables Board'),
            ],
          ),
          actions: [
            IconButton(
              icon: const Icon(Icons.refresh),
              onPressed: () {
                ref.invalidate(restaurantTablesProvider);
                ref.invalidate(menuItemsProvider);
              },
            ),
          ],
        ),
        drawer: const DrawerNavigation(),
        body: TabBarView(
          children: [
            // Tab 1: Menu Items
            menuAsync.when(
              loading: () => const LoadingIndicator(message: 'Loading menu...'),
              error: (err, stack) => EmptyStateView(
                title: 'Error loading menu',
                description: err.toString(),
                onRetry: () => ref.refresh(menuItemsProvider),
              ),
              data: (items) {
                return ListView.builder(
                  padding: const EdgeInsets.all(12),
                  itemCount: items.length,
                  itemBuilder: (context, index) {
                    final item = items[index];
                    return Card(
                      child: ListTile(
                        title: Text(item.name, style: const TextStyle(fontWeight: FontWeight.bold)),
                        subtitle: Text('${item.categoryName ?? ""} • Prep: ${item.preparationTime}m'),
                        trailing: Text(
                          Formatters.formatCurrency(item.price),
                          style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.blue),
                        ),
                        onTap: () => _addToCart(item),
                      ),
                    );
                  },
                );
              },
            ),

            // Tab 2: Tables Board
            tablesAsync.when(
              loading: () => const LoadingIndicator(message: 'Loading tables board...'),
              error: (err, stack) => EmptyStateView(
                title: 'Error loading tables',
                description: err.toString(),
                onRetry: () => ref.refresh(restaurantTablesProvider),
              ),
              data: (tables) {
                return GridView.builder(
                  padding: const EdgeInsets.all(12),
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 2,
                    childAspectRatio: 1.3,
                    crossAxisSpacing: 10,
                    mainAxisSpacing: 10,
                  ),
                  itemCount: tables.length,
                  itemBuilder: (context, index) {
                    final table = tables[index];
                    return Card(
                      child: InkWell(
                        onTap: () {
                          setState(() => _selectedTableCode = table.code);
                          _showCartBottomSheet(tablesList);
                        },
                        child: Padding(
                          padding: const EdgeInsets.all(12),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Text(
                                    table.code,
                                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
                                  ),
                                  StatusBadge(status: table.status),
                                ],
                              ),
                              Text('${table.name} • Cap: ${table.capacity}', style: const TextStyle(fontSize: 12, color: Colors.grey)),
                              if (table.currentOrderNumber != null)
                                Text('Order: ${table.currentOrderNumber}', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
                            ],
                          ),
                        ),
                      ),
                    );
                  },
                );
              },
            ),
          ],
        ),
        floatingActionButton: _cart.isNotEmpty ? FloatingActionButton.extended(
          onPressed: () => _showCartBottomSheet(tablesList),
          icon: const Icon(Icons.shopping_cart),
          label: Text('${_cart.fold(0, (sum, i) => sum + i.quantity)} Items • ${Formatters.formatCurrency(_cartTotal)}'),
          backgroundColor: Colors.blue,
          foregroundColor: Colors.white,
        ) : null,
      ),
    );
  }
}
