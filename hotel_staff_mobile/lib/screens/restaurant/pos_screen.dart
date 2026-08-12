import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../providers/restaurant_provider.dart';
import '../../providers/services_provider.dart';
import '../../providers/rooms_provider.dart';
import '../../widgets/common/drawer_navigation.dart';
import '../../widgets/status/status_badge.dart';
import '../../widgets/loading/loading_indicator.dart';
import '../../widgets/empty_states/empty_state_view.dart';
import '../../core/utils/formatters.dart';
import '../../core/theme/app_colors.dart';
import '../../models/menu_item_model.dart';
import '../../models/restaurant_table_model.dart';

class _CartItem {
  final MenuItemModel menuItem;
  int quantity;
  String? specialInstructions;

  _CartItem({required this.menuItem}) : quantity = 1, specialInstructions = null;

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
  String _paymentMethod = 'cash'; // 'cash', 'card', 'room_charge'
  int? _selectedRoomId;

  void _addToCart(MenuItemModel item) {
    setState(() {
      final existingIndex = _cart.indexWhere((c) => c.menuItem.id == item.id && c.specialInstructions == null);
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

  void _updateQuantity(int index, int delta) {
    setState(() {
      _cart[index].quantity += delta;
      if (_cart[index].quantity <= 0) {
        _cart.removeAt(index);
      }
    });
  }

  Future<void> _addNoteDialog(int index) async {
    final controller = TextEditingController(text: _cart[index].specialInstructions);
    final result = await showDialog<String>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Special Instructions'),
        content: TextField(
          controller: controller,
          decoration: const InputDecoration(
            hintText: 'E.g. No onions, extra spicy...',
            border: OutlineInputBorder(),
          ),
          maxLines: 3,
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, controller.text),
            child: const Text('Save'),
          ),
        ],
      ),
    );

    if (result != null) {
      setState(() {
        _cart[index].specialInstructions = result.isEmpty ? null : result;
      });
    }
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
    if (_paymentMethod == 'room_charge' && _selectedRoomId == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please select a room for charge')));
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
        bookingId: _paymentMethod == 'room_charge' ? _selectedRoomId : null,
        notes: 'Payment: $_paymentMethod',
        items: items,
      );

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
          content: Text('Order submitted successfully!'),
          backgroundColor: AppColors.success,
        ));
        Navigator.pop(context); // Close bottom sheet
        setState(() {
          _cart.clear();
          _selectedTableCode = null;
          _paymentMethod = 'cash';
          _selectedRoomId = null;
        });
        ref.invalidate(restaurantTablesProvider);
        ref.invalidate(restaurantOrdersProvider);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text('Error: $e'), 
          backgroundColor: AppColors.danger,
        ));
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
            final roomsAsync = ref.watch(roomsListProvider);

            return Padding(
              padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
              child: Container(
                padding: const EdgeInsets.all(20),
                height: MediaQuery.of(context).size.height * 0.9,
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
                            return Card(
                              margin: const EdgeInsets.only(bottom: 8),
                              child: Padding(
                                padding: const EdgeInsets.all(8.0),
                                child: Row(
                                  children: [
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Text(item.menuItem.name, style: const TextStyle(fontWeight: FontWeight.bold)),
                                          Text(Formatters.formatCurrency(item.totalPrice)),
                                          if (item.specialInstructions != null)
                                            Text(
                                              'Notes: ${item.specialInstructions}', 
                                              style: const TextStyle(color: Colors.orange, fontSize: 12),
                                            ),
                                          TextButton.icon(
                                            onPressed: () async {
                                              await _addNoteDialog(index);
                                              setModalState((){});
                                            },
                                            icon: const Icon(Icons.edit_note, size: 16),
                                            label: const Text('Add Note', style: TextStyle(fontSize: 12)),
                                            style: TextButton.styleFrom(padding: EdgeInsets.zero, minimumSize: const Size(50, 30)),
                                          )
                                        ],
                                      ),
                                    ),
                                    Row(
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        IconButton(
                                          icon: const Icon(Icons.remove_circle_outline),
                                          onPressed: () {
                                            setModalState(() {});
                                            _updateQuantity(index, -1);
                                          },
                                        ),
                                        Text('${item.quantity}', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                                        IconButton(
                                          icon: const Icon(Icons.add_circle_outline),
                                          onPressed: () {
                                            setModalState(() {});
                                            _updateQuantity(index, 1);
                                          },
                                        ),
                                      ],
                                    ),
                                  ],
                                ),
                              ),
                            );
                          },
                        ),
                      ),
                    const Divider(),
                    // Table Selection
                    DropdownButtonFormField<String>(
                      decoration: const InputDecoration(labelText: 'Select Table', border: OutlineInputBorder()),
                      initialValue: _selectedTableCode,
                      items: availableTables.map((t) => DropdownMenuItem(
                        value: t.code,
                        child: Text('${t.code} - ${t.name}'),
                      )).toList(),
                      onChanged: (val) {
                        setModalState(() => _selectedTableCode = val);
                        setState(() => _selectedTableCode = val);
                      },
                    ),
                    const SizedBox(height: 12),
                    // Payment Method
                    DropdownButtonFormField<String>(
                      decoration: const InputDecoration(labelText: 'Payment Method', border: OutlineInputBorder()),
                      initialValue: _paymentMethod,
                      items: const [
                        DropdownMenuItem(value: 'cash', child: Text('Cash')),
                        DropdownMenuItem(value: 'card', child: Text('Card')),
                        DropdownMenuItem(value: 'room_charge', child: Text('Room Charge')),
                      ],
                      onChanged: (val) {
                        setModalState(() {
                          _paymentMethod = val!;
                          if (_paymentMethod != 'room_charge') _selectedRoomId = null;
                        });
                        setState(() {});
                      },
                    ),
                    const SizedBox(height: 12),
                    // Room Selection (only if room charge)
                    if (_paymentMethod == 'room_charge')
                      roomsAsync.when(
                        loading: () => const LinearProgressIndicator(),
                        error: (e, s) => Text('Error loading rooms: $e', style: const TextStyle(color: Colors.red)),
                        data: (rooms) {
                          // Only allow occupied rooms
                          final occupied = rooms.where((r) => r.status == 'occupied').toList();
                          return DropdownButtonFormField<int>(
                            decoration: const InputDecoration(labelText: 'Select Room to Charge', border: OutlineInputBorder()),
                            initialValue: _selectedRoomId,
                            items: occupied.map((r) => DropdownMenuItem(
                              value: r.id,
                              child: Text('Room ${r.roomNumber} - ${r.currentGuestName ?? "Guest"}'),
                            )).toList(),
                            onChanged: (val) {
                              setModalState(() => _selectedRoomId = val);
                              setState(() => _selectedRoomId = val);
                            },
                          );
                        },
                      ),
                    
                    const SizedBox(height: 16),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Total:', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
                        Text(Formatters.formatCurrency(_cartTotal), style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: AppColors.primary)),
                      ],
                    ),
                    const SizedBox(height: 16),
                    ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        backgroundColor: AppColors.primary,
                        foregroundColor: Colors.white,
                      ),
                      onPressed: _isSubmitting ? null : () {
                        setModalState(() {}); 
                        _submitOrder();
                      },
                      child: _isSubmitting 
                          ? const SizedBox(height: 24, width: 24, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2)) 
                          : const Text('Checkout & Submit Order', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
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
    final ordersAsync = ref.watch(restaurantOrdersProvider);
    
    // Extract available tables for the dropdown
    List<RestaurantTableModel> tablesList = [];
    if (tablesAsync.hasValue) {
      tablesList = tablesAsync.value!;
    }

    final categories = ['All', 'Mains', 'Beverages', 'Desserts', 'Starters']; // Dynamic later if API provides, but static chips work best for UI if known.
    final currentCategory = ref.watch(posCategoryFilterProvider);

    return DefaultTabController(
      length: 3,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Restaurant POS'),
          bottom: const TabBar(
            tabs: [
              Tab(icon: Icon(Icons.restaurant_menu), text: 'Menu'),
              Tab(icon: Icon(Icons.table_restaurant), text: 'Tables'),
              Tab(icon: Icon(Icons.receipt_long), text: 'Orders'),
            ],
          ),
          actions: [
            IconButton(
              icon: const Icon(Icons.refresh),
              onPressed: () {
                ref.invalidate(restaurantTablesProvider);
                ref.invalidate(menuItemsProvider);
                ref.invalidate(restaurantOrdersProvider);
              },
            ),
          ],
        ),
        drawer: const DrawerNavigation(),
        body: TabBarView(
          children: [
            // Tab 1: Menu Items
            Column(
              children: [
                Container(
                  padding: const EdgeInsets.all(12),
                  color: Colors.white,
                  child: Column(
                    children: [
                      TextField(
                        onChanged: (val) => ref.read(posSearchQueryProvider.notifier).state = val,
                        decoration: InputDecoration(
                          hintText: 'Search menu items...',
                          prefixIcon: const Icon(Icons.search),
                          filled: true,
                          fillColor: Colors.grey.shade100,
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: BorderSide.none,
                          ),
                          contentPadding: const EdgeInsets.symmetric(vertical: 0),
                        ),
                      ),
                      const SizedBox(height: 12),
                      SizedBox(
                        height: 40,
                        child: ListView.separated(
                          scrollDirection: Axis.horizontal,
                          itemCount: categories.length,
                          separatorBuilder: (c, i) => const SizedBox(width: 8),
                          itemBuilder: (context, index) {
                            final cat = categories[index];
                            final isSelected = cat == currentCategory;
                            return ChoiceChip(
                              label: Text(cat),
                              selected: isSelected,
                              selectedColor: AppColors.primary,
                              labelStyle: TextStyle(color: isSelected ? Colors.white : Colors.black),
                              onSelected: (selected) {
                                if (selected) ref.read(posCategoryFilterProvider.notifier).state = cat;
                              },
                            );
                          },
                        ),
                      ),
                    ],
                  ),
                ),
                Expanded(
                  child: menuAsync.when(
                    loading: () => const LoadingIndicator(message: 'Loading menu...'),
                    error: (err, stack) => EmptyStateView(
                      title: 'Error loading menu',
                      description: err.toString(),
                      onRetry: () => ref.refresh(menuItemsProvider),
                    ),
                    data: (items) {
                      if (items.isEmpty) {
                        return const EmptyStateView(
                          icon: Icons.fastfood_outlined,
                          title: 'No Menu Items',
                          description: 'No items match your search or category.',
                        );
                      }
                      return GridView.builder(
                        padding: const EdgeInsets.all(12),
                        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                          crossAxisCount: 2,
                          childAspectRatio: 0.85,
                          crossAxisSpacing: 10,
                          mainAxisSpacing: 10,
                        ),
                        itemCount: items.length,
                        itemBuilder: (context, index) {
                          final item = items[index];
                          return Card(
                            clipBehavior: Clip.antiAlias,
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                            child: InkWell(
                              onTap: () => _addToCart(item),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.stretch,
                                children: [
                                  Expanded(
                                    child: Container(
                                      color: Colors.grey.shade200,
                                      child: const Icon(Icons.fastfood, size: 40, color: Colors.grey), // Placeholder for image
                                    ),
                                  ),
                                  Padding(
                                    padding: const EdgeInsets.all(12.0),
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          item.name, 
                                          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                                          maxLines: 2,
                                          overflow: TextOverflow.ellipsis,
                                        ),
                                        const SizedBox(height: 4),
                                        Text(
                                          Formatters.formatCurrency(item.price),
                                          style: const TextStyle(fontWeight: FontWeight.bold, color: AppColors.primary, fontSize: 16),
                                        ),
                                      ],
                                    ),
                                  )
                                ],
                              ),
                            ),
                          );
                        },
                      );
                    },
                  ),
                ),
              ],
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

            // Tab 3: Active Orders
            ordersAsync.when(
              loading: () => const LoadingIndicator(message: 'Loading active orders...'),
              error: (err, stack) => EmptyStateView(
                title: 'Error loading orders',
                description: err.toString(),
                onRetry: () => ref.refresh(restaurantOrdersProvider),
              ),
              data: (orders) {
                if (orders.isEmpty) {
                  return const EmptyStateView(
                    icon: Icons.receipt_long,
                    title: 'No Active Orders',
                    description: 'There are currently no active orders in the restaurant.',
                  );
                }
                return ListView.builder(
                  padding: const EdgeInsets.all(12),
                  itemCount: orders.length,
                  itemBuilder: (context, index) {
                    final order = orders[index];
                    return Card(
                      margin: const EdgeInsets.only(bottom: 12),
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(
                                  order.orderNumber,
                                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                                ),
                                StatusBadge(status: order.status),
                              ],
                            ),
                            const SizedBox(height: 8),
                            Text('Table: ${order.tableNumber ?? "N/A"} | Items: ${order.items.length}'),
                            const SizedBox(height: 8),
                            const Divider(),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(
                                  'Total: ${Formatters.formatCurrency(order.totalAmount)}',
                                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: AppColors.primary),
                                ),
                                StatusBadge(status: order.paymentStatus),
                              ],
                            ),
                          ],
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
          backgroundColor: AppColors.primary,
          foregroundColor: Colors.white,
        ) : null,
      ),
    );
  }
}
