import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import {
  CheckSquare,
  Clock,
  AlertCircle,
  Wrench,
  User,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";

const rooms = [
  {
    number: "101",
    type: "Deluxe",
    status: "clean",
    assignedTo: "Maria Garcia",
    lastUpdated: "10:30 AM",
    floor: 1,
  },
  {
    number: "102",
    type: "Deluxe",
    status: "dirty",
    assignedTo: "John Smith",
    lastUpdated: "9:15 AM",
    floor: 1,
  },
  {
    number: "103",
    type: "Suite",
    status: "inspect",
    assignedTo: "Maria Garcia",
    lastUpdated: "11:00 AM",
    floor: 1,
  },
  {
    number: "104",
    type: "Standard",
    status: "clean",
    assignedTo: "Sarah Johnson",
    lastUpdated: "10:00 AM",
    floor: 1,
  },
  {
    number: "201",
    type: "Standard",
    status: "dirty",
    assignedTo: "John Smith",
    lastUpdated: "8:30 AM",
    floor: 2,
  },
  {
    number: "202",
    type: "Family",
    status: "clean",
    assignedTo: "Sarah Johnson",
    lastUpdated: "11:15 AM",
    floor: 2,
  },
  {
    number: "203",
    type: "Deluxe",
    status: "dirty",
    assignedTo: "Maria Garcia",
    lastUpdated: "9:00 AM",
    floor: 2,
  },
  {
    number: "204",
    type: "Suite",
    status: "repair",
    assignedTo: "Maintenance Team",
    lastUpdated: "Yesterday",
    floor: 2,
  },
  {
    number: "301",
    type: "Deluxe",
    status: "clean",
    assignedTo: "John Smith",
    lastUpdated: "10:45 AM",
    floor: 3,
  },
  {
    number: "302",
    type: "Suite",
    status: "inspect",
    assignedTo: "Sarah Johnson",
    lastUpdated: "11:30 AM",
    floor: 3,
  },
  {
    number: "303",
    type: "Standard",
    status: "clean",
    assignedTo: "Maria Garcia",
    lastUpdated: "9:45 AM",
    floor: 3,
  },
  {
    number: "304",
    type: "Family",
    status: "dirty",
    assignedTo: "John Smith",
    lastUpdated: "8:45 AM",
    floor: 3,
  },
];

const statusConfig = {
  clean: {
    label: "Clean",
    color: "bg-green-500",
    textColor: "text-green-700",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
    icon: CheckSquare,
  },
  dirty: {
    label: "Dirty",
    color: "bg-red-500",
    textColor: "text-red-700",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
    icon: AlertCircle,
  },
  inspect: {
    label: "Inspect",
    color: "bg-yellow-500",
    textColor: "text-yellow-700",
    bgColor: "bg-yellow-50",
    borderColor: "border-yellow-200",
    icon: Clock,
  },
  repair: {
    label: "Repair",
    color: "bg-gray-500",
    textColor: "text-gray-700",
    bgColor: "bg-gray-50",
    borderColor: "border-gray-300",
    icon: Wrench,
  },
};

export function Housekeeping() {
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterFloor, setFilterFloor] = useState("all");

  const filteredRooms = rooms.filter((room) => {
    const statusMatch = filterStatus === "all" || room.status === filterStatus;
    const floorMatch =
      filterFloor === "all" || room.floor.toString() === filterFloor;
    return statusMatch && floorMatch;
  });

  const statusCounts = {
    clean: rooms.filter((r) => r.status === "clean").length,
    dirty: rooms.filter((r) => r.status === "dirty").length,
    inspect: rooms.filter((r) => r.status === "inspect").length,
    repair: rooms.filter((r) => r.status === "repair").length,
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Room Status Board
        </h1>
        <p className="text-gray-500 mt-1">
          Manage housekeeping tasks and room status
        </p>
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Object.entries(statusConfig).map(([status, config]) => (
          <Card key={status}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-600 mb-1">
                    {config.label}
                  </div>
                  <div className="text-3xl font-bold">
                    {statusCounts[status as keyof typeof statusCounts]}
                  </div>
                </div>
                <div
                  className={`w-12 h-12 rounded-full ${config.bgColor} flex items-center justify-center`}
                >
                  <config.icon className={`w-6 h-6 ${config.textColor}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="clean">Clean</SelectItem>
                  <SelectItem value="dirty">Dirty</SelectItem>
                  <SelectItem value="inspect">Inspect</SelectItem>
                  <SelectItem value="repair">Repair</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Select value={filterFloor} onValueChange={setFilterFloor}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by floor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Floors</SelectItem>
                  <SelectItem value="1">Floor 1</SelectItem>
                  <SelectItem value="2">Floor 2</SelectItem>
                  <SelectItem value="3">Floor 3</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Room Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredRooms.map((room) => {
          const config = statusConfig[room.status as keyof typeof statusConfig];
          return (
            <Card
              key={room.number}
              className={`hover:shadow-lg transition-all border-2 ${config.borderColor}`}
            >
              <CardHeader className={`${config.bgColor} pb-3`}>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-2xl font-bold">
                      {room.number}
                    </CardTitle>
                    <p className="text-sm text-gray-600 mt-1">{room.type}</p>
                  </div>
                  <Badge
                    className={`${config.color} text-white border-none`}
                  >
                    {config.label}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <User className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-600">Assigned to:</span>
                    <span className="font-medium">{room.assignedTo}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-600">Updated:</span>
                    <span className="font-medium">{room.lastUpdated}</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200 flex gap-2">
                  {room.status === "dirty" && (
                    <Button
                      size="sm"
                      className="flex-1 bg-yellow-500 hover:bg-yellow-600"
                    >
                      Start Cleaning
                    </Button>
                  )}
                  {room.status === "inspect" && (
                    <Button
                      size="sm"
                      className="flex-1 bg-green-500 hover:bg-green-600"
                    >
                      Mark Clean
                    </Button>
                  )}
                  {room.status === "clean" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                    >
                      View Details
                    </Button>
                  )}
                  {room.status === "repair" && (
                    <Button
                      size="sm"
                      className="flex-1 bg-gray-600 hover:bg-gray-700"
                    >
                      Update Status
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
