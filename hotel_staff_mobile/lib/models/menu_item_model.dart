class MenuItemModel {
  final int id;
  final int categoryId;
  final String name;
  final String? description;
  final double price;
  final int preparationTime;
  final bool isVegetarian;
  final bool isSpicy;
  final bool isAvailable;
  final String? imageUrl;
  final String? categoryName;

  MenuItemModel({
    required this.id,
    required this.categoryId,
    required this.name,
    this.description,
    required this.price,
    required this.preparationTime,
    required this.isVegetarian,
    required this.isSpicy,
    required this.isAvailable,
    this.imageUrl,
    this.categoryName,
  });

  factory MenuItemModel.fromJson(Map<String, dynamic> json) {
    return MenuItemModel(
      id: json['id'] as int,
      categoryId: json['categoryId'] as int,
      name: json['name'] as String,
      description: json['description'] as String?,
      price: double.tryParse(json['price']?.toString() ?? '0') ?? 0.0,
      preparationTime: json['preparationTime'] as int? ?? 15,
      isVegetarian: json['isVegetarian'] as bool? ?? false,
      isSpicy: json['isSpicy'] as bool? ?? false,
      isAvailable: json['isAvailable'] as bool? ?? true,
      imageUrl: json['imageUrl'] as String?,
      categoryName: json['category']?['name'] as String?,
    );
  }
}
