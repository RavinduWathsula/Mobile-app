export type EventMenuId = "bronze-menu" | "silver-menu" | "gold-menu" | "mangolian-menu";

export interface EventMenuDefinition {
  id: EventMenuId;
  name: string;
  description: string;
  pricePerPerson: number;
  minimumGuests?: number;
  maximumGuests?: number;
  sections: Array<{
    title: string;
    items: string[];
  }>;
}

export const eventMenuDefinitions: EventMenuDefinition[] = [
  {
    id: "bronze-menu",
    name: "Bronze Menu",
    description: "Entry event package with buffet-style favourites for large gatherings.",
    pricePerPerson: 4600,
    minimumGuests: 100,
    sections: [
      { title: "Welcome Drink", items: ["Mixed Fresh Fruit Juice"] },
      { title: "Salads", items: ["Mexican Salad", "Chicken Salad with Pineapple", "Green Salad with Condiments"] },
      { title: "Main Courses", items: ["Wok Fried Rice", "Steamed Rice", "Thai Noodles or Spaghetti Carbonara"] },
      { title: "Meat Dishes", items: ["Chilli Chicken", "Fish Stew", "Cuttlefish Red Curry"] },
      { title: "Vegetarian Specials", items: ["Hot Butter Mushroom", "Vegetable Au Gratin or Stir-Fried Seasonal Vegetables"] },
      { title: "Accompaniments", items: ["Mango Chutney", "Papadam", "Chilli Paste"] },
      { title: "Desserts", items: ["Ice Cream (3 Varieties)", "Bread & Butter Pudding", "Fresh Cut Fruits"] },
    ],
  },
  {
    id: "silver-menu",
    name: "Silver Menu",
    description: "Balanced corporate and celebration menu with soup, salads, and upgraded mains.",
    pricePerPerson: 4700,
    minimumGuests: 100,
    sections: [
      { title: "Welcome Drink", items: ["Mixed Fresh Fruit Juice"] },
      { title: "Soups & Starters", items: ["Cream of Chicken or Mushroom Soup with Bread & Butter"] },
      { title: "Salads", items: ["Sawingir-style Tuna Salad", "Coleslaw with Sultana Salad"] },
      { title: "Main Dishes", items: ["Mix Fried Rice", "Steamed Rice", "Wok-Fried Vegetable Noodles"] },
      { title: "Meat Dishes", items: ["Fried Chicken Curry / Chilli Chicken / Devilled Chicken", "Fish Stew / Thai Style Fish Green Curry", "Hot Butter Garlic Cuttlefish"] },
      { title: "Vegetarian Specials", items: ["Devilled Mushroom", "Stir-Fried Seasonal Vegetables", "Brinjal Moju"] },
      { title: "Accompaniments", items: ["Mango Chutney", "Papadam", "Chilli Paste"] },
      { title: "Desserts", items: ["Ice Cream (3 Varieties)", "Passion Fruit Mousse", "Fresh Cut Fruits"] },
    ],
  },
  {
    id: "gold-menu",
    name: "Gold Menu",
    description: "Premium celebration menu with richer mains and upgraded dessert selection.",
    pricePerPerson: 5200,
    minimumGuests: 100,
    sections: [
      { title: "Welcome Drink", items: ["Mixed Fresh Fruit Juice"] },
      { title: "Soups & Starters", items: ["Sweet Corn & Egg Drop Soup with Bread & Butter"] },
      { title: "Salads", items: ["Mixed Vegetable Salad", "Oriental Egg Salad"] },
      { title: "Main Courses", items: ["Mongolian-Style Fried Rice", "Steamed Rice", "Wok Fried Noodles"] },
      { title: "Meat Dishes", items: ["Coriander-Flavoured Chicken Curry", "Devilled Seafood", "Grilled Pork"] },
      { title: "Vegetarian Specials", items: ["Slow Tempered Mushroom", "Thai-Style Vegetable Green Curry", "Potato Croquettes", "Brinjal Moju"] },
      { title: "Accompaniments", items: ["Prawn Crackers", "Papadam", "Chilli Paste"] },
      { title: "Desserts", items: ["Ice Cream (3 Varieties)", "Chocolate Chip Mousse", "Fresh Cut Fruits"] },
    ],
  },
  {
    id: "mangolian-menu",
    name: "Mongolian Menu",
    description: "Flexible selection menu with guest choice counts and a lower minimum guest threshold.",
    pricePerPerson: 4500,
    minimumGuests: 50,
    maximumGuests: 100,
    sections: [
      { title: "Welcome Drink", items: ["Mixed Fresh Fruit Juice"] },
      { title: "Salads (Select Any 3)", items: ["Coleslaw Salad", "Green Salad", "Tossed Salad", "Mixed Vegetable Salad", "Tomato, Onion & Cucumber Salad"] },
      { title: "Main Dishes (Select Any 4)", items: ["Steamed Rice", "Noodles", "Spaghetti", "Fettuccine", "Macaroni"] },
      { title: "Meat Dishes (Select Any 3)", items: ["Chicken", "Fish", "Prawns", "Cuttlefish", "Pork", "Beef", "Sausages"] },
      { title: "Vegetarian Specials (Select Any 4)", items: ["Carrots", "Leeks", "Cabbage", "Spring Onion", "Kankun", "Chinese Cabbage", "Onion Rings"] },
      { title: "Desserts (Select Any 3)", items: ["Ice Cream (3 Varieties)", "Watalappan", "Fresh Fruit Cut", "Cream Caramel", "Bread & Butter Pudding (Hot)"] },
    ],
  },
];

export const eventMenuById = Object.fromEntries(
  eventMenuDefinitions.map((menu) => [menu.id, menu]),
) as Record<EventMenuId, EventMenuDefinition>;
