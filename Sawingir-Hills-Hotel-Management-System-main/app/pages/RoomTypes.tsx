import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Plus, Edit, Trash2, Hotel, Users, DollarSign } from "lucide-react";

const roomTypes = [
  { id: 1, name: "Single Room", description: "Comfortable single occupancy room", basePrice: 12000, maxOccupancy: 1, totalRooms: 15 },
  { id: 2, name: "Double Room", description: "Standard double occupancy room", basePrice: 12000, maxOccupancy: 2, totalRooms: 25 },
  { id: 3, name: "Triple Room", description: "Spacious room for three guests", basePrice: 15000, maxOccupancy: 3, totalRooms: 10 },
  { id: 4, name: "Honeymoon Suite", description: "Romantic suite for couples with premium amenities", basePrice: 27000, maxOccupancy: 2, totalRooms: 5 },
  { id: 5, name: "Family Room", description: "Large room perfect for families", basePrice: 17000, maxOccupancy: 5, totalRooms: 8 },
];

export function RoomTypes() {
  const totalRooms = roomTypes.reduce((sum, type) => sum + type.totalRooms, 0);
  const totalTypes = roomTypes.length;
  const avgBasePrice = Math.round(roomTypes.reduce((sum, type) => sum + type.basePrice, 0) / totalTypes);

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button className="bg-[#2B0A57] hover:bg-[#2B0A57]/90">
          <Plus className="w-4 h-4 mr-2" />
          Add Room Type
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Room Types</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{totalTypes}</p>
              </div>
              <div className="w-12 h-12 bg-violet-100 rounded-lg flex items-center justify-center">
                <Hotel className="w-6 h-6 text-violet-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Rooms</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{totalRooms}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg. Base Price</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{avgBasePrice.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-1">LKR per night</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Room Type</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Base Price (Room Only)</TableHead>
                <TableHead>Max Occupancy</TableHead>
                <TableHead>Available Meal Plans</TableHead>
                <TableHead>Total Rooms</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roomTypes.map((type) => (
                <TableRow key={type.id}>
                  <TableCell className="font-semibold">{type.name}</TableCell>
                  <TableCell>{type.description}</TableCell>
                  <TableCell className="font-bold text-[#2B0A57]">LKR {type.basePrice.toLocaleString()}</TableCell>
                  <TableCell>{type.maxOccupancy} {type.maxOccupancy === 1 ? 'guest' : 'guests'}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {(type.name === "Honeymoon Suite") ? (
                        <Badge variant="outline" className="text-xs">Full Board Only</Badge>
                      ) : (type.name === "Family Room") ? (
                        <Badge variant="outline" className="text-xs">Room Only</Badge>
                      ) : (
                        <>
                          <Badge variant="outline" className="text-xs">Room Only</Badge>
                          <Badge variant="outline" className="text-xs">B&B</Badge>
                          <Badge variant="outline" className="text-xs">Half Board</Badge>
                          <Badge variant="outline" className="text-xs">Full Board</Badge>
                        </>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-violet-50">{type.totalRooms} rooms</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="mt-6 p-4 bg-violet-50 border border-violet-200 rounded-lg">
            <h4 className="font-semibold text-violet-900 mb-2">Meal Plan Options:</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm text-violet-800">
              <div>
                <strong>Room Only:</strong> Accommodation only, no meals
              </div>
              <div>
                <strong>Bed & Breakfast:</strong> Room + Breakfast
              </div>
              <div>
                <strong>Half Board:</strong> Room + Breakfast + Dinner
              </div>
              <div>
                <strong>Full Board:</strong> Room + All Meals (Breakfast, Lunch, Dinner)
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


