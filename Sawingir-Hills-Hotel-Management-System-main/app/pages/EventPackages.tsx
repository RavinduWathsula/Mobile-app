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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import {
  Plus,
  Edit,
  Trash2,
  Heart,
  Briefcase,
  CheckSquare,
} from "lucide-react";

interface FoodOption {
  id: string;
  label: string;
  description: string;
  price?: number;
  category: "wedding" | "event";
  active: boolean;
}

interface MenuPackage {
  id: string;
  name: string;
  description: string;
  pricePerPerson: number;
  category: "wedding" | "event";
  features: string[];
  active: boolean;
}

const initialFoodOptions: FoodOption[] = [
  // Wedding Options
  {
    id: "1",
    label: "Premium Bar Service",
    description: "Full service bar with premium spirits and cocktails",
    price: 5000,
    category: "wedding",
    active: true,
  },
  {
    id: "2",
    label: "Professional Table Service",
    description: "Dedicated wait staff for personalized table service",
    price: 3000,
    category: "wedding",
    active: true,
  },
  {
    id: "3",
    label: "Soft Drinks & Beverages",
    description: "Unlimited soft drinks and non-alcoholic beverages",
    price: 2000,
    category: "wedding",
    active: true,
  },
  {
    id: "4",
    label: "Welcome Drinks",
    description: "Welcome drinks for all guests on arrival",
    price: 2500,
    category: "wedding",
    active: true,
  },
  {
    id: "5",
    label: "Live Cooking Stations",
    description: "Interactive live cooking stations with chef",
    price: 8000,
    category: "wedding",
    active: true,
  },
  // Event Options
  {
    id: "6",
    label: "Coffee & Tea Service",
    description: "Continuous coffee and tea service throughout event",
    price: 1500,
    category: "event",
    active: true,
  },
  {
    id: "7",
    label: "Soft Drinks & Beverages",
    description: "Unlimited soft drinks and juices",
    price: 1800,
    category: "event",
    active: true,
  },
  {
    id: "8",
    label: "Lunch Buffet",
    description: "Full lunch buffet spread",
    price: 2500,
    category: "event",
    active: true,
  },
  {
    id: "9",
    label: "Dinner Buffet",
    description: "Complete dinner buffet service",
    price: 3000,
    category: "event",
    active: true,
  },
  {
    id: "10",
    label: "Snacks & Refreshments",
    description: "Assorted snacks and light refreshments",
    price: 1200,
    category: "event",
    active: true,
  },
  {
    id: "11",
    label: "Premium Bar Service",
    description: "Full bar service with spirits",
    price: 4000,
    category: "event",
    active: true,
  },
];

const initialMenuPackages: MenuPackage[] = [
  // Wedding Packages
  {
    id: "1",
    name: "Standard Wedding Package",
    description: "Perfect for intimate wedding celebrations",
    pricePerPerson: 2500,
    category: "wedding",
    features: [
      "Basic menu with 3 main courses",
      "Standard decorations",
      "Sound system",
      "Basic lighting",
    ],
    active: true,
  },
  {
    id: "2",
    name: "Premium Wedding Package",
    description: "Enhanced package for memorable celebrations",
    pricePerPerson: 3500,
    category: "wedding",
    features: [
      "Premium menu with 5 main courses",
      "Enhanced decorations",
      "Professional sound system",
      "Stage lighting and effects",
      "Bridal room setup",
    ],
    active: true,
  },
  {
    id: "3",
    name: "Luxury Wedding Package",
    description: "Luxury experience for your special day",
    pricePerPerson: 4500,
    category: "wedding",
    features: [
      "Luxury menu with 7 main courses",
      "Premium decorations with theme",
      "Advanced sound and lighting",
      "Photography assistance",
      "Luxury bridal suite",
      "Welcome drinks included",
    ],
    active: true,
  },
  {
    id: "4",
    name: "Royal Wedding Package",
    description: "Ultimate royal wedding experience",
    pricePerPerson: 6000,
    category: "wedding",
    features: [
      "Royal menu with premium selections",
      "Luxury theme decorations",
      "Premium AV equipment",
      "Red carpet entrance",
      "Royal bridal suite",
      "Welcome drinks and cocktails",
      "Live music coordination",
    ],
    active: true,
  },
];

export function EventPackages() {
  const [foodOptions, setFoodOptions] = useState<FoodOption[]>(
    initialFoodOptions.filter((f) => f.category === "event")
  );

  const [isFoodDialogOpen, setIsFoodDialogOpen] = useState(false);
  const [editingFood, setEditingFood] = useState<FoodOption | null>(null);

  // Food Option Form State
  const [foodLabel, setFoodLabel] = useState("");
  const [foodDescription, setFoodDescription] = useState("");
  const [foodPrice, setFoodPrice] = useState("");

  const handleOpenFoodDialog = (food?: FoodOption) => {
    if (food) {
      setEditingFood(food);
      setFoodLabel(food.label);
      setFoodDescription(food.description);
      setFoodPrice(food.price?.toString() || "");
    } else {
      setEditingFood(null);
      setFoodLabel("");
      setFoodDescription("");
      setFoodPrice("");
    }
    setIsFoodDialogOpen(true);
  };

  const handleSaveFood = () => {
    const newFood: FoodOption = {
      id: editingFood?.id || Date.now().toString(),
      label: foodLabel,
      description: foodDescription,
      price: foodPrice ? parseInt(foodPrice) : undefined,
      category: "event",
      active: editingFood?.active ?? true,
    };

    if (editingFood) {
      setFoodOptions(foodOptions.map((f) => (f.id === editingFood.id ? newFood : f)));
    } else {
      setFoodOptions([...foodOptions, newFood]);
    }

    setIsFoodDialogOpen(false);
  };

  const handleDeleteFood = (id: string) => {
    if (confirm("Are you sure you want to delete this food option?")) {
      setFoodOptions(foodOptions.filter((f) => f.id !== id));
    }
  };

  const toggleFoodActive = (id: string) => {
    setFoodOptions(
      foodOptions.map((f) => (f.id === id ? { ...f, active: !f.active } : f))
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Event Packages</h1>
        <p className="text-gray-500 mt-1">
          Manage food & beverage options for birthday parties, corporate events, and celebrations
        </p>
      </div>

      <div className="space-y-6">
        <div className="flex justify-end">
          <Dialog open={isFoodDialogOpen} onOpenChange={setIsFoodDialogOpen}>
            <DialogTrigger asChild>
              <Button
                className="bg-[#2B0A57] hover:bg-[#3d1570]"
                onClick={() => handleOpenFoodDialog()}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Food Option
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl">
              <DialogHeader>
                <DialogTitle>
                  {editingFood ? "Edit Food Option" : "Add New Food Option"}
                </DialogTitle>
                <DialogDescription>
                  Configure food and beverage options for events
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                    <Label htmlFor="food-label">Option Name</Label>
                    <Input
                      id="food-label"
                      value={foodLabel}
                      onChange={(e) => setFoodLabel(e.target.value)}
                      placeholder="e.g., Premium Bar Service"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="food-description">Description</Label>
                    <Textarea
                      id="food-description"
                      value={foodDescription}
                      onChange={(e) => setFoodDescription(e.target.value)}
                      placeholder="Brief description of the option"
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="food-price">Additional Cost (LKR) - Optional</Label>
                    <Input
                      id="food-price"
                      type="number"
                      value={foodPrice}
                      onChange={(e) => setFoodPrice(e.target.value)}
                      placeholder="Leave empty if included in package"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsFoodDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    className="bg-[#2B0A57] hover:bg-[#3d1570]"
                    onClick={handleSaveFood}
                  >
                    {editingFood ? "Update" : "Create"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

        {/* Event Food Options */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-[#7C3AED]" />
            Event Food & Beverage Options
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {foodOptions.map((option) => (
              <Card key={option.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-base">{option.label}</CardTitle>
                      <p className="text-sm text-gray-500 mt-1">
                        {option.description}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {option.price && (
                    <div className="text-lg font-bold text-[#2B0A57]">
                      +LKR {option.price.toLocaleString()}
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpenFoodDialog(option)}
                    >
                      <Edit className="w-3 h-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toggleFoodActive(option.id)}
                      className={option.active ? "text-green-600" : "text-gray-600"}
                    >
                      {option.active ? "Active" : "Inactive"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteFood(option.id)}
                      className="text-red-600"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

