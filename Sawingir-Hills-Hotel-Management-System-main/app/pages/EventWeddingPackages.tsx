import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
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
  Heart,
  Briefcase,
  CheckSquare,
} from "lucide-react";
import { eventMenuDefinitions } from "../lib/event-menus";

type TabValue = "food-options" | "packages";

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
  minimumGuests?: number;
  maximumGuests?: number;
  category: "wedding" | "event";
  features: string[];
  active: boolean;
}

const initialFoodOptions: FoodOption[] = [
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
  ...eventMenuDefinitions.map((menu) => ({
    id: menu.id,
    name: menu.name,
    description: menu.description,
    pricePerPerson: menu.pricePerPerson,
    minimumGuests: menu.minimumGuests,
    maximumGuests: menu.maximumGuests,
    category: "event" as const,
    features: menu.sections.map(
      (section) => `${section.title}: ${section.items.join(", ")}`,
    ),
    active: true,
  })),
  // Wedding Packages
  {
    id: "w1",
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
    id: "w2",
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
    id: "w3",
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
    id: "w4",
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

export function EventWeddingPackages() {
  const [activeTab, setActiveTab] = useState<TabValue>("food-options");
  const [foodOptions, setFoodOptions] = useState<FoodOption[]>(initialFoodOptions);
  const [menuPackages, setMenuPackages] = useState<MenuPackage[]>(initialMenuPackages);

  const [isFoodDialogOpen, setIsFoodDialogOpen] = useState(false);
  const [isPackageDialogOpen, setIsPackageDialogOpen] = useState(false);
  const [editingFood, setEditingFood] = useState<FoodOption | null>(null);
  const [editingPackage, setEditingPackage] = useState<MenuPackage | null>(null);

  // Food Option Form State
  const [foodLabel, setFoodLabel] = useState("");
  const [foodDescription, setFoodDescription] = useState("");
  const [foodPrice, setFoodPrice] = useState("");

  // Package Form State
  const [packageName, setPackageName] = useState("");
  const [packageDescription, setPackageDescription] = useState("");
  const [packagePrice, setPackagePrice] = useState("");
  const [packageFeatures, setPackageFeatures] = useState("");
  const [packageCategory, setPackageCategory] = useState<"wedding" | "event">("event");

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

  const handleOpenPackageDialog = (pkg?: MenuPackage) => {
    if (pkg) {
      setEditingPackage(pkg);
      setPackageName(pkg.name);
      setPackageDescription(pkg.description);
      setPackagePrice(pkg.pricePerPerson.toString());
      setPackageFeatures(pkg.features.join("\n"));
      setPackageCategory(pkg.category);
    } else {
      setEditingPackage(null);
      setPackageName("");
      setPackageDescription("");
      setPackagePrice("");
      setPackageFeatures("");
      setPackageCategory("event");
    }
    setIsPackageDialogOpen(true);
  };

  const handleSavePackage = () => {
    const newPackage: MenuPackage = {
      id: editingPackage?.id || Date.now().toString(),
      name: packageName,
      description: packageDescription,
      pricePerPerson: parseInt(packagePrice),
      minimumGuests: editingPackage?.minimumGuests,
      maximumGuests: editingPackage?.maximumGuests,
      category: packageCategory,
      features: packageFeatures.split("\n").filter((f) => f.trim() !== ""),
      active: editingPackage?.active ?? true,
    };

    if (editingPackage) {
      setMenuPackages(
        menuPackages.map((p) => (p.id === editingPackage.id ? newPackage : p))
      );
    } else {
      setMenuPackages([...menuPackages, newPackage]);
    }

    setIsPackageDialogOpen(false);
  };

  const handleDeletePackage = (id: string) => {
    if (confirm("Are you sure you want to delete this package?")) {
      setMenuPackages(menuPackages.filter((p) => p.id !== id));
    }
  };

  const togglePackageActive = (id: string) => {
    setMenuPackages(
      menuPackages.map((p) => (p.id === id ? { ...p, active: !p.active } : p))
    );
  };

  const eventPackages = menuPackages.filter((p) => p.category === "event");
  const weddingPackages = menuPackages.filter((p) => p.category === "wedding");

  const tabs = [
    { value: "food-options" as const, label: "Event Food Options" },
    { value: "packages" as const, label: "Wedding & Event Packages" },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Event & Wedding Packages</h1>
        <p className="text-gray-500 mt-1">
          Manage packages and food options for events and weddings
        </p>
      </div>

      {/* Horizontal Tab Navigation */}
      <div className="border-b border-gray-200">
        <div className="flex gap-8">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.value;
            return (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={`pb-3 px-1 text-sm font-medium border-b-2 transition-all duration-200 ${
                  isActive
                    ? "border-[#2B0A57] text-[#2B0A57]"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content with Animation */}
      <div key={activeTab} className="animate-in fade-in slide-in-from-bottom-2 duration-300">
        {activeTab === "food-options" && (
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
        )}

        {activeTab === "packages" && (
          <div className="space-y-6">
          <div className="flex justify-end">
            <Dialog open={isPackageDialogOpen} onOpenChange={setIsPackageDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  className="bg-[#2B0A57] hover:bg-[#3d1570]"
                  onClick={() => handleOpenPackageDialog()}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Package
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingPackage ? "Edit Package" : "Add New Package"}
                  </DialogTitle>
                  <DialogDescription>
                    Create comprehensive event or wedding packages with pricing and features
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="package-category">Package Type</Label>
                    <Select value={packageCategory} onValueChange={(value: "wedding" | "event") => setPackageCategory(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="event">Event Package</SelectItem>
                        <SelectItem value="wedding">Wedding Package</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="package-name">Package Name</Label>
                    <Input
                      id="package-name"
                      value={packageName}
                      onChange={(e) => setPackageName(e.target.value)}
                      placeholder="e.g., Premium Wedding Package"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="package-description">Description</Label>
                    <Textarea
                      id="package-description"
                      value={packageDescription}
                      onChange={(e) => setPackageDescription(e.target.value)}
                      placeholder="Brief description of the package"
                      rows={2}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="package-price">Price Per Person (LKR)</Label>
                    <Input
                      id="package-price"
                      type="number"
                      value={packagePrice}
                      onChange={(e) => setPackagePrice(e.target.value)}
                      placeholder="e.g., 3500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="package-features">
                      Features (one per line)
                    </Label>
                    <Textarea
                      id="package-features"
                      value={packageFeatures}
                      onChange={(e) => setPackageFeatures(e.target.value)}
                      placeholder="Premium menu with 5 main courses&#10;Enhanced decorations&#10;Professional sound system"
                      rows={6}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsPackageDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    className="bg-[#2B0A57] hover:bg-[#3d1570]"
                    onClick={handleSavePackage}
                  >
                    {editingPackage ? "Update" : "Create"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Event Packages Section */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-[#7C3AED]" />
              Event Menu Packages
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {eventPackages.map((pkg) => (
                <Card key={pkg.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{pkg.name}</CardTitle>
                        <p className="text-sm text-gray-500 mt-1">
                          {pkg.description}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-2xl font-bold text-[#2B0A57]">
                      LKR {pkg.pricePerPerson.toLocaleString()} / person
                    </div>
                    {pkg.minimumGuests && (
                      <p className="text-sm text-gray-500">
                        {pkg.maximumGuests
                          ? `${pkg.minimumGuests}-${pkg.maximumGuests} guests`
                          : `Minimum ${pkg.minimumGuests} guests`}
                      </p>
                    )}
                    <div className="space-y-2">
                      <div className="font-medium text-sm text-gray-700">Features:</div>
                      <ul className="space-y-1">
                        {pkg.features.map((feature, index) => (
                          <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                            <CheckSquare className="w-4 h-4 text-[#7C3AED] flex-shrink-0 mt-0.5" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="flex items-center gap-2 pt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenPackageDialog(pkg)}
                      >
                        <Edit className="w-3 h-3 mr-1" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => togglePackageActive(pkg.id)}
                        className={pkg.active ? "text-green-600" : "text-gray-600"}
                      >
                        {pkg.active ? "Active" : "Inactive"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeletePackage(pkg.id)}
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

          {/* Wedding Packages Section */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Heart className="w-5 h-5 text-[#E91E63]" />
              Wedding Menu Packages
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {weddingPackages.map((pkg) => (
                <Card key={pkg.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{pkg.name}</CardTitle>
                        <p className="text-sm text-gray-500 mt-1">
                          {pkg.description}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-2xl font-bold text-[#2B0A57]">
                      LKR {pkg.pricePerPerson.toLocaleString()} / person
                    </div>
                    {pkg.minimumGuests && (
                      <p className="text-sm text-gray-500">
                        {pkg.maximumGuests
                          ? `${pkg.minimumGuests}-${pkg.maximumGuests} guests`
                          : `Minimum ${pkg.minimumGuests} guests`}
                      </p>
                    )}
                    <div className="space-y-2">
                      <div className="font-medium text-sm text-gray-700">Features:</div>
                      <ul className="space-y-1">
                        {pkg.features.map((feature, index) => (
                          <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                            <CheckSquare className="w-4 h-4 text-[#7C3AED] flex-shrink-0 mt-0.5" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="flex items-center gap-2 pt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenPackageDialog(pkg)}
                      >
                        <Edit className="w-3 h-3 mr-1" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => togglePackageActive(pkg.id)}
                        className={pkg.active ? "text-green-600" : "text-gray-600"}
                      >
                        {pkg.active ? "Active" : "Inactive"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeletePackage(pkg.id)}
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
        )}
      </div>
    </div>
  );
}

