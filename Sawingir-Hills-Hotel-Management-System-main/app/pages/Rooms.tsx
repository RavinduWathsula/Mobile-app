import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Plus, Edit } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";

const rooms = [
  { number: "101", type: "Deluxe", floor: 1, status: "available", features: ["AC", "TV", "WiFi"] },
  { number: "102", type: "Deluxe", floor: 1, status: "occupied", features: ["AC", "TV", "WiFi"] },
  { number: "103", type: "Suite", floor: 1, status: "available", features: ["AC", "TV", "WiFi", "Balcony"] },
  { number: "201", type: "Standard", floor: 2, status: "maintenance", features: ["AC", "TV"] },
  { number: "202", type: "Family", floor: 2, status: "available", features: ["AC", "TV", "WiFi", "Kitchen"] },
];

const statusColors: Record<string, string> = {
  available: "bg-green-100 text-green-700",
  occupied: "bg-violet-100 text-violet-700",
  maintenance: "bg-gray-100 text-gray-700",
};

export function Rooms() {
  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button className="bg-[#2B0A57] hover:bg-[#2B0A57]/90">
          <Plus className="w-4 h-4 mr-2" />
          Add Room
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <CardTitle>Room List</CardTitle>
            <Select defaultValue="all">
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="occupied">Occupied</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Room Number</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Floor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Features</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rooms.map((room) => (
                <TableRow key={room.number}>
                  <TableCell className="font-bold text-lg">{room.number}</TableCell>
                  <TableCell>{room.type}</TableCell>
                  <TableCell>Floor {room.floor}</TableCell>
                  <TableCell>
                    <Badge className={statusColors[room.status]}>{room.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {room.features.map((feature) => (
                        <Badge key={feature} variant="outline" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button size="sm" variant="outline">
                      <Edit className="w-3 h-3 mr-1" />
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

