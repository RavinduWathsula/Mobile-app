import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../providers/restaurant_provider.dart';
import '../../providers/services_provider.dart';
import '../../providers/rooms_provider.dart';
import '../../providers/dashboard_provider.dart';
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
        backgroundColor: AppColors.success,
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
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        content: TextField(
          controller: controller,
          decoration: InputDecoration(
            hintText: 'E.g. No onions, extra spicy...',
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
            filled: true,
            fillColor: Colors.grey.shade50,
          ),
          maxLines: 3,
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
            ),
            onPressed: () => Navigator.pop(context, controller.text),
            child: const Text('Save Note'),
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
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Cart is empty'), backgroundColor: Colors.orange));
      return;
    }
    if (_selectedTableCode == null && _paymentMethod != 'room_charge') {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please select a table'), backgroundColor: Colors.orange));
      return;
    }
    if (_paymentMethod == 'room_charge' && _selectedRoomId == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please select a room for charge'), backgroundColor: Colors.orange));
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
          content: Text('Order submitted to kitchen successfully!'),
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
        ref.invalidate(activeOrdersCountProvider);
        ref.invalidate(dashboardStatsProvider);
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
      backgroundColor: Colors.transparent,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            final roomsAsync = ref.watch(roomsListProvider);

            return Padding(
              padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
              child: Container(
                padding: const EdgeInsets.all(24),
                decoration: const BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
                ),
                height: MediaQuery.of(context).size.height * 0.9,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Order Cart', style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold)),
                        IconButton(icon: const Icon(Icons.close), onPressed: () => Navigator.pop(context)),
                      ],
                    ),
                    const Divider(height: 24),
                    if (_cart.isEmpty)
                      Expanded(
                        child: Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(Icons.shopping_bag_outlined, size: 80, color: Colors.grey.shade300),
                              const SizedBox(height: 16),
                              Text('Your cart is empty', style: TextStyle(fontSize: 18, color: Colors.grey.shade500)),
                            ],
                          ),
                        ),
                      )
                    else
                      Expanded(
                        child: ListView.builder(
                          itemCount: _cart.length,
                          itemBuilder: (context, index) {
                            final item = _cart[index];
                            return Container(
                              margin: const EdgeInsets.only(bottom: 12),
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(color: Colors.grey.shade200),
                                boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 4, offset: const Offset(0, 2))],
                              ),
                              child: Row(
                                children: [
                                  // Thumbnail
                                  if (item.menuItem.imageUrl != null)
                                    ClipRRect(
                                      borderRadius: BorderRadius.circular(8),
                                      child: Image.network(
                                        item.menuItem.imageUrl!,
                                        width: 60, height: 60, fit: BoxFit.cover,
                                      ),
                                    )
                                  else
                                    Container(
                                      width: 60, height: 60,
                                      decoration: BoxDecoration(color: Colors.grey.shade200, borderRadius: BorderRadius.circular(8)),
                                      child: const Icon(Icons.fastfood, color: Colors.grey),
                                    ),
                                  const SizedBox(width: 12),
                                  
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(item.menuItem.name, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                                        const SizedBox(height: 4),
                                        Text(Formatters.formatCurrency(item.totalPrice), style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.bold)),
                                        if (item.specialInstructions != null)
                                          Padding(
                                            padding: const EdgeInsets.only(top: 4.0),
                                            child: Text(
                                              'Note: ${item.specialInstructions}', 
                                              style: TextStyle(color: Colors.orange.shade700, fontSize: 12, fontWeight: FontWeight.w600),
                                            ),
                                          ),
                                        TextButton.icon(
                                          onPressed: () async {
                                            await _addNoteDialog(index);
                                            setModalState((){});
                                          },
                                          icon: const Icon(Icons.edit_note, size: 14),
                                          label: const Text('Add Note', style: TextStyle(fontSize: 12)),
                                          style: TextButton.styleFrom(padding: EdgeInsets.zero, minimumSize: const Size(50, 30), tapTargetSize: MaterialTapTargetSize.shrinkWrap),
                                        )
                                      ],
                                    ),
                                  ),
                                  
                                  // Quantity Controls
                                  Container(
                                    decoration: BoxDecoration(
                                      color: Colors.grey.shade100,
                                      borderRadius: BorderRadius.circular(30),
                                    ),
                                    child: Row(
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        IconButton(
                                          icon: const Icon(Icons.remove, size: 18),
                                          onPressed: () {
                                            setModalState(() {});
                                            _updateQuantity(index, -1);
                                          },
                                        ),
                                        Text('${item.quantity}', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                                        IconButton(
                                          icon: const Icon(Icons.add, size: 18),
                                          onPressed: () {
                                            setModalState(() {});
                                            _updateQuantity(index, 1);
                                          },
                                        ),
                                      ],
                                    ),
                                  ),
                                ],
                              ),
                            );
                          },
                        ),
                      ),
                    const Divider(height: 24),
                    
                    // Order Settings
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Colors.grey.shade50,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: Colors.grey.shade200),
                      ),
                      child: Column(
                        children: [
                          DropdownButtonFormField<String>(
                            decoration: InputDecoration(
                              labelText: 'Select Table (Dine-in)',
                              prefixIcon: const Icon(Icons.table_restaurant),
                              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                              filled: true, fillColor: Colors.white,
                            ),
                            initialValue: _selectedTableCode,
                            items: availableTables.map((t) => DropdownMenuItem(
                              value: t.code,
                              child: Text('${t.code} - ${t.name} (${t.status})'),
                            )).toList(),
                            onChanged: (val) {
                              setModalState(() => _selectedTableCode = val);
                              setState(() => _selectedTableCode = val);
                            },
                          ),
                          const SizedBox(height: 12),
                          DropdownButtonFormField<String>(
                            decoration: InputDecoration(
                              labelText: 'Payment Method',
                              prefixIcon: const Icon(Icons.payment),
                              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                              filled: true, fillColor: Colors.white,
                            ),
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
                          if (_paymentMethod == 'room_charge') ...[
                            const SizedBox(height: 12),
                            roomsAsync.when(
                              loading: () => const LinearProgressIndicator(),
                              error: (e, s) => Text('Error: $e', style: const TextStyle(color: Colors.red)),
                              data: (rooms) {
                                final occupied = rooms.where((r) => r.status == 'occupied').toList();
                                return DropdownButtonFormField<int>(
                                  decoration: InputDecoration(
                                    labelText: 'Select Room to Charge',
                                    prefixIcon: const Icon(Icons.bed),
                                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                                    filled: true, fillColor: Colors.white,
                                  ),
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
                          ],
                        ],
                      ),
                    ),
                    
                    const SizedBox(height: 24),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Total Amount:', style: TextStyle(fontSize: 20, color: Colors.grey)),
                        Text(Formatters.formatCurrency(_cartTotal), style: const TextStyle(fontSize: 32, fontWeight: FontWeight.bold, color: AppColors.primary)),
                      ],
                    ),
                    const SizedBox(height: 16),
                    ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 20),
                        backgroundColor: AppColors.primary,
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        elevation: 4,
                      ),
                      onPressed: _isSubmitting || _cart.isEmpty ? null : () {
                        setModalState(() {}); 
                        _submitOrder();
                      },
                      child: _isSubmitting 
                          ? const SizedBox(height: 24, width: 24, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2)) 
                          : const Text('SUBMIT ORDER TO KITCHEN', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, letterSpacing: 1)),
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

    final categories = ['All', 'Mains', 'Beverages', 'Desserts', 'Starters'];
    final currentCategory = ref.watch(posCategoryFilterProvider);

    return DefaultTabController(
      length: 3,
      child: Scaffold(
        backgroundColor: Colors.grey.shade100,
        appBar: AppBar(
          title: const Text('Restaurant POS', style: TextStyle(fontWeight: FontWeight.bold)),
          backgroundColor: Colors.white,
          foregroundColor: Colors.black87,
          elevation: 1,
          bottom: const TabBar(
            labelColor: AppColors.primary,
            unselectedLabelColor: Colors.grey,
            indicatorColor: AppColors.primary,
            indicatorWeight: 3,
            labelStyle: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
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
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 4, offset: const Offset(0, 2))],
                  ),
                  child: Column(
                    children: [
                      TextField(
                        onChanged: (val) => ref.read(posSearchQueryProvider.notifier).state = val,
                        decoration: InputDecoration(
                          hintText: 'Search delicious meals...',
                          prefixIcon: const Icon(Icons.search, color: AppColors.primary),
                          filled: true,
                          fillColor: Colors.grey.shade100,
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(30),
                            borderSide: BorderSide.none,
                          ),
                          contentPadding: const EdgeInsets.symmetric(vertical: 0),
                        ),
                      ),
                      const SizedBox(height: 16),
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
                              label: Text(cat, style: const TextStyle(fontWeight: FontWeight.bold)),
                              selected: isSelected,
                              selectedColor: AppColors.primary,
                              backgroundColor: Colors.grey.shade200,
                              labelStyle: TextStyle(color: isSelected ? Colors.white : Colors.black87),
                              padding: const EdgeInsets.symmetric(horizontal: 12),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
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
                        padding: const EdgeInsets.all(16),
                        gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                          crossAxisCount: MediaQuery.of(context).size.width > 800 ? 4 : 2,
                          childAspectRatio: 0.55, // Changed to 0.55 to prevent overflow
                          crossAxisSpacing: 16,
                          mainAxisSpacing: 16,
                        ),
                        itemCount: items.length,
                        itemBuilder: (context, index) {
                          final item = items[index];
                          return Card(
                            elevation: 4,
                            shadowColor: Colors.black.withValues(alpha: 0.2),
                            clipBehavior: Clip.antiAlias,
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                            child: InkWell(
                              onTap: () => _addToCart(item),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.stretch,
                                children: [
                                  // Image Header
                                  Expanded(
                                    flex: 4,
                                    child: Stack(
                                      fit: StackFit.expand,
                                      children: [
                                        if (item.imageUrl != null)
                                          Image.network(item.imageUrl!, fit: BoxFit.cover)
                                        else
                                          Container(
                                            color: Colors.grey.shade200,
                                            child: const Icon(Icons.fastfood, size: 40, color: Colors.grey),
                                          ),
                                        // Category Badge
                                        if (item.categoryName != null)
                                          Positioned(
                                            top: 8, left: 8,
                                            child: Container(
                                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                              decoration: BoxDecoration(
                                                color: Colors.black87,
                                                borderRadius: BorderRadius.circular(12),
                                              ),
                                              child: Text(item.categoryName!, style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold)),
                                            ),
                                          ),
                                        // Add Button Overlay
                                        Positioned(
                                          bottom: 8, right: 8,
                                          child: Container(
                                            padding: const EdgeInsets.all(8),
                                            decoration: BoxDecoration(
                                              color: AppColors.primary,
                                              shape: BoxShape.circle,
                                              boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.2), blurRadius: 4, offset: const Offset(0, 2))],
                                            ),
                                            child: const Icon(Icons.add, color: Colors.white, size: 20),
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                  // Details Footer
                                  Expanded(
                                    flex: 3,
                                    child: Padding(
                                      padding: const EdgeInsets.all(10.0),
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                        children: [
                                          Text(
                                            item.name, 
                                            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14, height: 1.2),
                                            maxLines: 2,
                                            overflow: TextOverflow.ellipsis,
                                          ),
                                          Column(
                                            crossAxisAlignment: CrossAxisAlignment.start,
                                            children: [
                                              Row(
                                                children: [
                                                  if (item.isVegetarian) const Padding(padding: EdgeInsets.only(right: 4), child: Icon(Icons.eco, color: Colors.green, size: 14)),
                                                  if (item.isSpicy) const Padding(padding: EdgeInsets.only(right: 4), child: Icon(Icons.local_fire_department, color: Colors.red, size: 14)),
                                                  if (item.preparationTime > 0) ...[
                                                    Icon(Icons.timer_outlined, color: Colors.grey.shade600, size: 12),
                                                    const SizedBox(width: 2),
                                                    Text('${item.preparationTime}m', style: TextStyle(color: Colors.grey.shade600, fontSize: 11, fontWeight: FontWeight.bold)),
                                                  ]
                                                ],
                                              ),
                                              const SizedBox(height: 4),
                                              Text(
                                                Formatters.formatCurrency(item.price),
                                                style: const TextStyle(fontWeight: FontWeight.w900, color: AppColors.primary, fontSize: 16),
                                              ),
                                            ],
                                          )
                                        ],
                                      ),
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
                  padding: const EdgeInsets.all(16),
                  gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: MediaQuery.of(context).size.width > 800 ? 4 : (MediaQuery.of(context).size.width > 500 ? 3 : 2),
                    childAspectRatio: 1.1,
                    crossAxisSpacing: 16,
                    mainAxisSpacing: 16,
                  ),
                  itemCount: tables.length,
                  itemBuilder: (context, index) {
                    final table = tables[index];
                    final isOccupied = table.status == 'occupied';
                    return Card(
                      elevation: isOccupied ? 6 : 2,
                      shadowColor: isOccupied ? AppColors.primary.withValues(alpha: 0.4) : Colors.black12,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(16),
                        side: BorderSide(color: isOccupied ? AppColors.primary : Colors.transparent, width: 2),
                      ),
                      child: InkWell(
                        onTap: () {
                          setState(() => _selectedTableCode = table.code);
                          _showCartBottomSheet(tablesList);
                        },
                        borderRadius: BorderRadius.circular(16),
                        child: Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(16),
                            gradient: isOccupied ? LinearGradient(
                              colors: [Colors.white, AppColors.primary.withValues(alpha: 0.05)],
                              begin: Alignment.topLeft, end: Alignment.bottomRight,
                            ) : null,
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                                    decoration: BoxDecoration(
                                      color: Colors.black87,
                                      borderRadius: BorderRadius.circular(8),
                                    ),
                                    child: Text(
                                      table.code,
                                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: Colors.white),
                                    ),
                                  ),
                                  StatusBadge(status: table.status),
                                ],
                              ),
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    children: [
                                      const Icon(Icons.people, size: 16, color: Colors.grey),
                                      const SizedBox(width: 6),
                                      Text('${table.capacity} Seats', style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.black87)),
                                    ],
                                  ),
                                  const SizedBox(height: 4),
                                  Row(
                                    children: [
                                      const Icon(Icons.place, size: 16, color: Colors.grey),
                                      const SizedBox(width: 6),
                                      Text(table.area ?? 'Main', style: const TextStyle(color: Colors.grey)),
                                    ],
                                  ),
                                ],
                              ),
                              if (table.currentOrderNumber != null)
                                Container(
                                  padding: const EdgeInsets.symmetric(vertical: 4, horizontal: 8),
                                  decoration: BoxDecoration(color: Colors.orange.shade50, borderRadius: BorderRadius.circular(6)),
                                  child: Text('Active: ${table.currentOrderNumber}', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.orange.shade800)),
                                ),
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
                  padding: const EdgeInsets.all(16),
                  itemCount: orders.length,
                  itemBuilder: (context, index) {
                    final order = orders[index];
                    return Card(
                      elevation: 3,
                      margin: const EdgeInsets.only(bottom: 16),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                      child: Padding(
                        padding: const EdgeInsets.all(20),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Row(
                                  children: [
                                    Container(
                                      padding: const EdgeInsets.all(8),
                                      decoration: BoxDecoration(color: AppColors.primary.withValues(alpha: 0.1), shape: BoxShape.circle),
                                      child: const Icon(Icons.receipt, color: AppColors.primary),
                                    ),
                                    const SizedBox(width: 12),
                                    Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          order.orderNumber,
                                          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
                                        ),
                                        Text(
                                          order.tableNumber != null ? 'Table: ${order.tableNumber}' : (order.roomNumber != null ? 'Room: ${order.roomNumber}' : 'Takeaway'),
                                          style: TextStyle(color: Colors.grey.shade600, fontWeight: FontWeight.w600),
                                        ),
                                      ],
                                    ),
                                  ],
                                ),
                                StatusBadge(status: order.status),
                              ],
                            ),
                            const SizedBox(height: 16),
                            Container(
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: Colors.grey.shade50,
                                borderRadius: BorderRadius.circular(8),
                                border: Border.all(color: Colors.grey.shade200),
                              ),
                              child: Text(
                                '${order.items.length} items: ${order.items.map((i) => "${i.quantity}x ${i.itemName}").join(", ")}',
                                style: const TextStyle(color: Colors.black87),
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                            const SizedBox(height: 16),
                            const Divider(height: 1),
                            const SizedBox(height: 16),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                StatusBadge(status: order.paymentStatus),
                                Text(
                                  'Total: ${Formatters.formatCurrency(order.totalAmount)}',
                                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 20, color: AppColors.primary),
                                ),
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
          icon: const Icon(Icons.shopping_cart, size: 24),
          label: Text(
            '${_cart.fold(0, (sum, i) => sum + i.quantity)} Items • ${Formatters.formatCurrency(_cartTotal)}',
            style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
          ),
          backgroundColor: AppColors.primary,
          foregroundColor: Colors.white,
          elevation: 6,
        ) : null,
      ),
    );
  }
}
