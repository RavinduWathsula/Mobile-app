import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "../components/ui/dialog";
import {
  Plus,
  Edit,
  Trash2,
  Coffee,
  UtensilsCrossed,
  Soup,
  IceCream,
  PartyPopper,
} from "lucide-react";
import { eventMenuDefinitions } from "../lib/event-menus";

interface MealPlan {
  id: string;
  name: string;
  mealType: "breakfast" | "lunch" | "dinner" | "dessert" | "event-package";
  price: number;
  minimumGuests?: number;
  maximumGuests?: number;
  description: string;
  items: string[];
  active: boolean;
}

const initialMealPlans: MealPlan[] = [
  // Breakfast
  {
    id: "1",
    name: "Sri Lankan Southern Style",
    mealType: "breakfast",
    price: 1900,
    description: "Traditional Sri Lankan breakfast with hoppers and string hoppers",
    items: [
      "Fresh Fruit juice",
      "Ceylon black tea and Drinking Chocolate",
      "Fresh fruit salad or whole fruit of the day",
      "Hoppers with coconut sambol, lunu miris & seeni sambol or",
      "String hoppers with dhal curry, coconut sambol",
      "Tea, Coffee, Drinking Chocolate",
    ],
    active: true,
  },
  {
    id: "2",
    name: "English Breakfast",
    mealType: "breakfast",
    price: 1900,
    description: "Classic English breakfast with eggs, sausage, and bacon",
    items: [
      "Fresh Fruit juice",
      "Fresh fruit salad or whole fruit of the day",
      "Eggs (any style), Sausage, Bacon, grilled tomatoes & mushroom",
      "Toast or croissant with butter and preserves",
      "Tea, Coffee, Drinking Chocolate",
    ],
    active: true,
  },
  // Lunch
  {
    id: "3",
    name: "Sri Lankan Traditional Rice & Curry",
    mealType: "lunch",
    price: 1800,
    description: "Authentic Sri Lankan rice and curry spread",
    items: [
      "Fresh Fruit juice",
      "Welcome drink 'Tel Pani'",
      "Pol Sambol, Lunu Miris",
      "Fried Papadam",
      "Main Rice - White, Yellow, Red & Samba Rice",
      "Vegetable Curry (3 varieties)",
      "Fish Curry",
      "Chicken",
      "Main Meat",
      "Dessert of the day",
      "Ice Cream",
      "Tea or coffee",
    ],
    active: true,
  },
  {
    id: "4",
    name: "Chinese & Western Selection - Lunch",
    mealType: "lunch",
    price: 1800,
    description: "Fusion of Chinese and Western cuisines",
    items: [
      "Fresh Fruit juice",
      "Sri Lankan Rice & Curry",
      "Chinese & Western Soups",
      "Fried Rice",
      "Noodles or pasta with sauce",
      "Steamed/Fried Chicken or Duck",
      "Main Meat Dish (Beef, Pork, Chicken, Mutton)",
      "Fried/Steamed Seafood",
      "Stir fried Mix Vegetables",
      "Dessert of the day",
      "Ice Cream",
      "Tea or coffee",
    ],
    active: true,
  },
  {
    id: "5",
    name: "Desserts - Lunch",
    mealType: "dessert",
    price: 1000,
    description: "Selection of traditional desserts",
    items: [
      "Watalappan",
      "Caramel Pudding",
      "Fruit Salad",
      "Curd & Honey",
      "Ice Cream",
    ],
    active: true,
  },
  // Dinner
  {
    id: "6",
    name: "Flame & Feast",
    mealType: "dinner",
    price: 2400,
    description: "BBQ station with grilled specialties",
    items: [
      "Soup of the day",
      "Mix Vegetable salad or caesar salad",
      "Fried Rice",
      "Fried noodles or Pasta with sauce",
      "BBQ Station - Barbecued Chicken, Pork, Fish or Squid",
      "Stir fried Mix Vegetables",
      "Dessert of the day",
      "Ice Cream",
      "Tea or coffee",
    ],
    active: true,
  },
  {
    id: "7",
    name: "Chinese & Western Menu - Dinner",
    mealType: "dinner",
    price: 2400,
    description: "Evening fusion menu with meat and seafood",
    items: [
      "Soup of the day",
      "Mix Vegetable salad or caesar salad",
      "Fried Rice",
      "Fried noodles or Pasta with sauce",
      "Steamed/Fried Chicken or Duck",
      "Main Meat Dish (Beef, Pork, Chicken, Mutton)",
      "Fried/Steamed Seafood",
      "Stir fried Mix Vegetables",
      "Dessert of the day",
      "Ice Cream",
      "Tea or coffee",
    ],
    active: true,
  },
  {
    id: "8",
    name: "Asian Fusion",
    mealType: "dinner",
    price: 2400,
    description: "Contemporary Asian fusion cuisine",
    items: [
      "Soup of the day",
      "Asian style salad",
      "Fried Rice",
      "Noodles with Asian sauce",
      "Pan-seared Duck or Chicken",
      "Asian style meat dish",
      "Wok-fried Seafood",
      "Stir fried Mix Vegetables",
      "Asian dessert selection",
      "Ice Cream",
      "Tea or coffee",
    ],
    active: true,
  },
  {
    id: "9",
    name: "Desserts - Dinner",
    mealType: "dessert",
    price: 1000,
    description: "Evening dessert selection",
    items: [
      "Watalappan",
      "Caramel Pudding",
      "Fruit Salad",
      "Curd & Honey",
      "Ice Cream",
    ],
    active: true,
  },
  // Event Packages
  ...eventMenuDefinitions.map((menu, index) => ({
    id: String(index + 10),
    name: menu.name,
    mealType: "event-package" as const,
    price: menu.pricePerPerson,
    minimumGuests: menu.minimumGuests,
    maximumGuests: menu.maximumGuests,
    description: menu.description,
    items: menu.sections.map(
      (section) => `${section.title}: ${section.items.join(", ")}`,
    ),
    active: true,
  })),
];

const mealTypeIcons = {
  breakfast: Coffee,
  lunch: UtensilsCrossed,
  dinner: Soup,
  dessert: IceCream,
  "event-package": PartyPopper,
};

const mealTypeColors = {
  breakfast: { bg: "bg-orange-100", text: "text-orange-700", border: "border-orange-300" },
  lunch: { bg: "bg-green-100", text: "text-green-700", border: "border-green-300" },
  dinner: { bg: "bg-violet-100", text: "text-violet-700", border: "border-violet-300" },
  dessert: { bg: "bg-pink-100", text: "text-pink-700", border: "border-pink-300" },
  "event-package": { bg: "bg-purple-100", text: "text-purple-700", border: "border-purple-300" },
};

export function MealPlans() {
  const [mealPlans, setMealPlans] = useState<MealPlan[]>(initialMealPlans);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<MealPlan | null>(null);
  const [filterType, setFilterType] = useState<string>("all");

  // Form state
  const [formName, setFormName] = useState("");
  const [formMealType, setFormMealType] = useState<"breakfast" | "lunch" | "dinner" | "dessert" | "event-package">("breakfast");
  const [formPrice, setFormPrice] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formItems, setFormItems] = useState("");

  const filteredPlans = filterType === "all"
    ? mealPlans
    : mealPlans.filter((plan) => plan.mealType === filterType);

  const handleOpenDialog = (plan?: MealPlan) => {
    if (plan) {
      setEditingPlan(plan);
      setFormName(plan.name);
      setFormMealType(plan.mealType);
      setFormPrice(plan.price.toString());
      setFormDescription(plan.description);
      setFormItems(plan.items.join("\n"));
    } else {
      setEditingPlan(null);
      setFormName("");
      setFormMealType("breakfast");
      setFormPrice("");
      setFormDescription("");
      setFormItems("");
    }
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    const newPlan: MealPlan = {
      id: editingPlan?.id || Date.now().toString(),
      name: formName,
      mealType: formMealType,
      price: parseInt(formPrice) || 0,
      minimumGuests: editingPlan?.minimumGuests,
      maximumGuests: editingPlan?.maximumGuests,
      description: formDescription,
      items: formItems.split("\n").filter((item) => item.trim()),
      active: editingPlan?.active ?? true,
    };

    if (editingPlan) {
      setMealPlans(mealPlans.map((p) => (p.id === editingPlan.id ? newPlan : p)));
    } else {
      setMealPlans([...mealPlans, newPlan]);
    }

    setIsDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this meal plan?")) {
      setMealPlans(mealPlans.filter((p) => p.id !== id));
    }
  };

  const toggleActive = (id: string) => {
    setMealPlans(
      mealPlans.map((p) => (p.id === id ? { ...p, active: !p.active } : p))
    );
  };

  const groupedPlans = {
    breakfast: filteredPlans.filter((p) => p.mealType === "breakfast"),
    lunch: filteredPlans.filter((p) => p.mealType === "lunch"),
    dinner: filteredPlans.filter((p) => p.mealType === "dinner"),
    dessert: filteredPlans.filter((p) => p.mealType === "dessert"),
    "event-package": filteredPlans.filter((p) => p.mealType === "event-package"),
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              className="bg-[#2B0A57] hover:bg-[#3d1570]"
              onClick={() => handleOpenDialog()}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Meal Plan
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingPlan ? "Edit Meal Plan" : "Add New Meal Plan"}
              </DialogTitle>
              <DialogDescription>
                Create or update meal plan details and menu items
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="plan-name">Meal Plan Name</Label>
                  <Input
                    id="plan-name"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g., English Breakfast"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="meal-type">Meal Type</Label>
                  <Select
                    value={formMealType}
                    onValueChange={(value: any) => setFormMealType(value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="breakfast">Breakfast</SelectItem>
                      <SelectItem value="lunch">Lunch</SelectItem>
                      <SelectItem value="dinner">Dinner</SelectItem>
                      <SelectItem value="dessert">Dessert</SelectItem>
                      <SelectItem value="event-package">Event Package</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">Price (LKR)</Label>
                <Input
                  id="price"
                  type="number"
                  value={formPrice}
                  onChange={(e) => setFormPrice(e.target.value)}
                  placeholder="1900"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Brief description of the meal plan"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="items">Menu Items (one per line)</Label>
                <Textarea
                  id="items"
                  value={formItems}
                  onChange={(e) => setFormItems(e.target.value)}
                  placeholder="Fresh Fruit juice&#10;Ceylon black tea&#10;Toast with butter"
                  rows={10}
                  className="font-mono text-sm"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                className="bg-[#2B0A57] hover:bg-[#3d1570]"
                onClick={handleSave}
              >
                {editingPlan ? "Update" : "Create"} Meal Plan
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Label>Filter by Meal Type:</Label>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Meal Types</SelectItem>
                <SelectItem value="breakfast">Breakfast</SelectItem>
                <SelectItem value="lunch">Lunch</SelectItem>
                <SelectItem value="dinner">Dinner</SelectItem>
                <SelectItem value="dessert">Desserts</SelectItem>
                <SelectItem value="event-package">Event Packages</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Meal Plans by Type */}
      {Object.entries(groupedPlans).map(([type, plans]) => {
        if (plans.length === 0) return null;
        const Icon = mealTypeIcons[type as keyof typeof mealTypeIcons];
        const colors = mealTypeColors[type as keyof typeof mealTypeColors];

        return (
          <div key={type}>
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2 capitalize">
              <Icon className="w-5 h-5" />
              {type === "event-package" ? "Event Packages" : type} Options
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {plans.map((plan) => (
                <Card key={plan.id} className="relative">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{plan.name}</CardTitle>
                        <p className="text-sm text-gray-500 mt-1">
                          {plan.description}
                        </p>
                      </div>
                      <Badge
                        className={`${colors.bg} ${colors.text} border ${colors.border} ml-2`}
                      >
                        {plan.mealType}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-2xl font-bold text-[#2B0A57]">
                      LKR {plan.price.toLocaleString()}
                    </div>
                    {plan.minimumGuests && (
                      <p className="text-sm text-gray-500">
                        {plan.maximumGuests
                          ? `${plan.minimumGuests}-${plan.maximumGuests} guests`
                          : `Minimum ${plan.minimumGuests} guests`}
                      </p>
                    )}

                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">
                        Menu Items:
                      </h4>
                      <ul className="space-y-1 text-sm text-gray-600 max-h-40 overflow-y-auto">
                        {plan.items.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-[#7C3AED] mt-1">•</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="flex items-center gap-2 pt-4 border-t">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenDialog(plan)}
                      >
                        <Edit className="w-3 h-3 mr-1" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleActive(plan.id)}
                        className={
                          plan.active ? "text-green-600" : "text-gray-600"
                        }
                      >
                        {plan.active ? "Active" : "Inactive"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(plan.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

