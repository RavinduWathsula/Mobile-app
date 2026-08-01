import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Plus, Edit } from "lucide-react";

const ratePlans = [
  // Single Room Rates
  { id: 1, name: "Single - Room Only", description: "Single occupancy, room only", rate: 12000, season: "All Year", active: true },
  { id: 2, name: "Single - Bed & Breakfast", description: "Single occupancy with breakfast", rate: 14000, season: "All Year", active: true },
  { id: 3, name: "Single - Half Board", description: "Single occupancy with breakfast & dinner", rate: 16000, season: "All Year", active: true },
  { id: 4, name: "Single - Full Board", description: "Single occupancy with all meals", rate: 18000, season: "All Year", active: true },

  // Double Room Rates
  { id: 5, name: "Double - Room Only", description: "Double occupancy, room only", rate: 12000, season: "All Year", active: true },
  { id: 6, name: "Double - Bed & Breakfast", description: "Double occupancy with breakfast", rate: 16000, season: "All Year", active: true },
  { id: 7, name: "Double - Half Board", description: "Double occupancy with breakfast & dinner", rate: 20000, season: "All Year", active: true },
  { id: 8, name: "Double - Full Board", description: "Double occupancy with all meals", rate: 24000, season: "All Year", active: true },

  // Triple Room Rates
  { id: 9, name: "Triple - Room Only", description: "Triple occupancy, room only", rate: 15000, season: "All Year", active: true },
  { id: 10, name: "Triple - Bed & Breakfast", description: "Triple occupancy with breakfast", rate: 21000, season: "All Year", active: true },
  { id: 11, name: "Triple - Half Board", description: "Triple occupancy with breakfast & dinner", rate: 27000, season: "All Year", active: true },
  { id: 12, name: "Triple - Full Board", description: "Triple occupancy with all meals", rate: 33000, season: "All Year", active: true },

  // Honeymoon Suite
  { id: 13, name: "Honeymoon - Full Board", description: "Honeymoon suite with all meals included", rate: 27000, season: "All Year", active: true },

  // Family Room
  { id: 14, name: "Family Room - Room Only", description: "Family room, room only", rate: 17000, season: "All Year", active: true },
];

export function RatePlans() {
  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button className="bg-[#2B0A57] hover:bg-[#2B0A57]/90">
          <Plus className="w-4 h-4 mr-2" />
          Create Rate Plan
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Room Rates by Type & Meal Plan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Single Room Rates */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-violet-500" />
              Single Room
            </h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Meal Plan</TableHead>
                  <TableHead>Rate (LKR)</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ratePlans.slice(0, 4).map((plan) => (
                  <TableRow key={plan.id}>
                    <TableCell>
                      <div>
                        <div className="font-semibold">{plan.name.split(' - ')[1]}</div>
                        <div className="text-sm text-gray-500">{plan.description}</div>
                      </div>
                    </TableCell>
                    <TableCell className="font-bold text-[#2B0A57] text-lg">
                      {plan.rate.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-green-500">Active</Badge>
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
          </div>

          {/* Double Room Rates */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              Double Room
            </h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Meal Plan</TableHead>
                  <TableHead>Rate (LKR)</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ratePlans.slice(4, 8).map((plan) => (
                  <TableRow key={plan.id}>
                    <TableCell>
                      <div>
                        <div className="font-semibold">{plan.name.split(' - ')[1]}</div>
                        <div className="text-sm text-gray-500">{plan.description}</div>
                      </div>
                    </TableCell>
                    <TableCell className="font-bold text-[#2B0A57] text-lg">
                      {plan.rate.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-green-500">Active</Badge>
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
          </div>

          {/* Triple Room Rates */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-purple-500" />
              Triple Room
            </h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Meal Plan</TableHead>
                  <TableHead>Rate (LKR)</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ratePlans.slice(8, 12).map((plan) => (
                  <TableRow key={plan.id}>
                    <TableCell>
                      <div>
                        <div className="font-semibold">{plan.name.split(' - ')[1]}</div>
                        <div className="text-sm text-gray-500">{plan.description}</div>
                      </div>
                    </TableCell>
                    <TableCell className="font-bold text-[#2B0A57] text-lg">
                      {plan.rate.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-green-500">Active</Badge>
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
          </div>

          {/* Special Rooms */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-pink-500" />
              Special Rooms
            </h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Room Type & Meal Plan</TableHead>
                  <TableHead>Rate (LKR)</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ratePlans.slice(12).map((plan) => (
                  <TableRow key={plan.id}>
                    <TableCell>
                      <div>
                        <div className="font-semibold">{plan.name}</div>
                        <div className="text-sm text-gray-500">{plan.description}</div>
                      </div>
                    </TableCell>
                    <TableCell className="font-bold text-[#2B0A57] text-lg">
                      {plan.rate.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-green-500">Active</Badge>
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
          </div>

          {/* Note */}
          <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-800">
              <strong>Note:</strong> Please make an advance amount to reserve the room.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

