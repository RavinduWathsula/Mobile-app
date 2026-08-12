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
      id: json['id'] != null ? (int.tryParse(json['id'].toString()) ?? 0) : (json['_id'] != null ? json['_id'].hashCode : 0),
      categoryId: json['categoryId'] != null ? (int.tryParse(json['categoryId'].toString()) ?? 0) : 0,
      name: json['name']?.toString() ?? 'Unknown',
      description: json['description']?.toString(),
      price: double.tryParse(json['price']?.toString() ?? '0') ?? 0.0,
      preparationTime: json['preparationTime'] != null ? (int.tryParse(json['preparationTime'].toString()) ?? 15) : 15,
      isVegetarian: json['isVegetarian'] == true || json['isVegetarian'] == 'true',
      isSpicy: json['isSpicy'] == true || json['isSpicy'] == 'true',
      isAvailable: json['isAvailable'] != false && json['isAvailable'] != 'false',
      imageUrl: json['imageUrl']?.toString(),
      categoryName: json['category']?['name']?.toString(),
    );
  }
}
