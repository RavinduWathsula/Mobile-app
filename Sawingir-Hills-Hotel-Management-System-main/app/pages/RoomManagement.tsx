import { useState } from "react";
import { RoomTypes } from "./RoomTypes";
import { Rooms } from "./Rooms";
import { RatePlans } from "./RatePlans";
import { MealPlans } from "./MealPlans";

type TabValue = "room-types" | "rooms" | "rate-plans" | "meal-plans";

export function RoomManagement() {
  const [activeTab, setActiveTab] = useState<TabValue>("room-types");

  const tabs = [
    { value: "room-types" as const, label: "Room Types", component: RoomTypes },
    { value: "rooms" as const, label: "Rooms", component: Rooms },
    { value: "rate-plans" as const, label: "Rate Plans", component: RatePlans },
    { value: "meal-plans" as const, label: "Meal Plans", component: MealPlans },
  ];

  const ActiveComponent = tabs.find(tab => tab.value === activeTab)?.component || RoomTypes;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Room Management</h1>
        <p className="text-gray-500 mt-1">
          Manage room types, rooms, rate plans, and meal plans
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

      {/* Main Content Area with Animation */}
      <div key={activeTab} className="animate-in fade-in slide-in-from-bottom-2 duration-300">
        <ActiveComponent />
      </div>
    </div>
  );
}
