import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import { Plus, Edit, Trash2, Shield, Users as UsersIcon, Save } from "lucide-react";
import { Checkbox } from "../components/ui/checkbox";

interface Role {
  id: number;
  name: string;
  description: string;
  color: string;
  permissions: RolePermissions;
  createdAt: string;
}

interface RolePermissions {
  [module: string]: string[];
}

const permissionModules = {
  "Dashboard": ["View"],
  "Front Office": ["View", "Create", "Edit", "Delete"],
  "Booking Management": ["View", "Create", "Edit", "Delete", "Check-in", "Check-out"],
  "Back Office": ["View", "Edit", "Manage Rates", "Manage Rooms"],
  "Housekeeping": ["View", "Update Status", "Assign Tasks"],
  "Wedding & Events": ["View", "Create", "Edit", "Delete", "Manage Payments"],
  "Restaurant POS": ["View", "Process Orders", "Manage Menu", "View Reports"],
  "Reports": ["View", "Export", "Delete"],
  "Admin": ["View", "Manage Users", "Manage Roles", "System Settings"],
};

const defaultRoles: Role[] = [
  {
    id: 1,
    name: "Administrator",
    description: "Full system access with all permissions",
    color: "bg-red-500",
    permissions: {
      "Dashboard": ["View"],
      "Front Office": ["View", "Create", "Edit", "Delete"],
      "Booking Management": ["View", "Create", "Edit", "Delete", "Check-in", "Check-out"],
      "Back Office": ["View", "Edit", "Manage Rates", "Manage Rooms"],
      "Housekeeping": ["View", "Update Status", "Assign Tasks"],
      "Wedding & Events": ["View", "Create", "Edit", "Delete", "Manage Payments"],
      "Restaurant POS": ["View", "Process Orders", "Manage Menu", "View Reports"],
      "Reports": ["View", "Export", "Delete"],
      "Admin": ["View", "Manage Users", "Manage Roles", "System Settings"],
    },
    createdAt: new Date().toISOString(),
  },
  {
    id: 2,
    name: "Manager",
    description: "Management level access with elevated permissions",
    color: "bg-violet-500",
    permissions: {
      "Dashboard": ["View"],
      "Front Office": ["View", "Create", "Edit", "Delete"],
      "Booking Management": ["View", "Create", "Edit", "Delete", "Check-in", "Check-out"],
      "Back Office": ["View", "Edit"],
      "Housekeeping": ["View", "Update Status", "Assign Tasks"],
      "Wedding & Events": ["View", "Create", "Edit", "Manage Payments"],
      "Restaurant POS": ["View", "Process Orders", "View Reports"],
      "Reports": ["View", "Export"],
      "Admin": ["View"],
    },
    createdAt: new Date().toISOString(),
  },
  {
    id: 3,
    name: "Receptionist",
    description: "Front desk operations and booking management",
    color: "bg-green-500",
    permissions: {
      "Dashboard": ["View"],
      "Front Office": ["View", "Create", "Edit"],
      "Booking Management": ["View", "Create", "Edit", "Check-in", "Check-out"],
      "Housekeeping": ["View"],
      "Wedding & Events": ["View", "Create"],
      "Reports": ["View"],
      "Admin": [],
    },
    createdAt: new Date().toISOString(),
  },
  {
    id: 4,
    name: "Supervisor",
    description: "Department supervision and team management",
    color: "bg-orange-500",
    permissions: {
      "Dashboard": ["View"],
      "Front Office": ["View", "Edit"],
      "Booking Management": ["View", "Edit"],
      "Housekeeping": ["View", "Update Status", "Assign Tasks"],
      "Reports": ["View"],
      "Admin": [],
    },
    createdAt: new Date().toISOString(),
  },
  {
    id: 5,
    name: "User",
    description: "Basic user with limited access",
    color: "bg-gray-500",
    permissions: {
      "Dashboard": ["View"],
      "Front Office": ["View"],
      "Booking Management": ["View"],
      "Housekeeping": ["View"],
      "Reports": ["View"],
      "Admin": [],
    },
    createdAt: new Date().toISOString(),
  },
];

export function Roles() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [userCounts, setUserCounts] = useState<{ [key: string]: number }>({});

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    color: "bg-violet-500",
  });

  const [editPermissions, setEditPermissions] = useState<RolePermissions>({});

  // Load roles and calculate user counts
  useEffect(() => {
    const loadedRoles = JSON.parse(localStorage.getItem("systemRoles") || "[]");

    if (loadedRoles.length === 0) {
      localStorage.setItem("systemRoles", JSON.stringify(defaultRoles));
      setRoles(defaultRoles);
      setSelectedRole(defaultRoles[0]);
      setEditPermissions(defaultRoles[0].permissions);
    } else {
      setRoles(loadedRoles);
      setSelectedRole(loadedRoles[0]);
      setEditPermissions(loadedRoles[0].permissions);
    }

    calculateUserCounts();

    // Listen for storage changes from Users page
    const handleStorageChange = () => {
      calculateUserCounts();
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const calculateUserCounts = () => {
    const approvedUsers = JSON.parse(localStorage.getItem("approvedUsers") || "[]");
    const pendingUsers = JSON.parse(localStorage.getItem("pendingUsers") || "[]");
    const allUsers = [...approvedUsers, ...pendingUsers];

    const counts: { [key: string]: number } = {};
    allUsers.forEach((user: any) => {
      counts[user.role] = (counts[user.role] || 0) + 1;
    });

    setUserCounts(counts);
  };

  const handleSelectRole = (role: Role) => {
    setSelectedRole(role);
    setEditPermissions(role.permissions);
  };

  const handleTogglePermission = (module: string, permission: string) => {
    setEditPermissions((prev) => {
      const modulePerms = prev[module] || [];
      const hasPermission = modulePerms.includes(permission);

      return {
        ...prev,
        [module]: hasPermission
          ? modulePerms.filter((p) => p !== permission)
          : [...modulePerms, permission],
      };
    });
  };

  const handleSavePermissions = () => {
    if (!selectedRole) return;

    const updatedRoles = roles.map((role) =>
      role.id === selectedRole.id
        ? { ...role, permissions: editPermissions }
        : role
    );

    setRoles(updatedRoles);
    localStorage.setItem("systemRoles", JSON.stringify(updatedRoles));
    setSelectedRole({ ...selectedRole, permissions: editPermissions });
    alert("Permissions saved successfully!");
  };

  const handleCreateRole = () => {
    const newRole: Role = {
      id: Date.now(),
      name: formData.name,
      description: formData.description,
      color: formData.color,
      permissions: {},
      createdAt: new Date().toISOString(),
    };

    const updatedRoles = [...roles, newRole];
    setRoles(updatedRoles);
    localStorage.setItem("systemRoles", JSON.stringify(updatedRoles));

    setIsCreateDialogOpen(false);
    setFormData({ name: "", description: "", color: "bg-violet-500" });
    alert("Role created successfully!");
  };

  const handleOpenEditDialog = (role: Role) => {
    setFormData({
      name: role.name,
      description: role.description,
      color: role.color,
    });
    setSelectedRole(role);
    setIsEditDialogOpen(true);
  };

  const handleUpdateRole = () => {
    if (!selectedRole) return;

    const updatedRoles = roles.map((role) =>
      role.id === selectedRole.id
        ? {
            ...role,
            name: formData.name,
            description: formData.description,
            color: formData.color,
          }
        : role
    );

    setRoles(updatedRoles);
    localStorage.setItem("systemRoles", JSON.stringify(updatedRoles));
    setSelectedRole({
      ...selectedRole,
      name: formData.name,
      description: formData.description,
      color: formData.color,
    });

    setIsEditDialogOpen(false);
    alert("Role updated successfully!");
  };

  const handleDeleteRole = (roleId: number, roleName: string) => {
    // Check if any users have this role
    const count = userCounts[roleName] || 0;
    if (count > 0) {
      alert(`Cannot delete role "${roleName}" because ${count} user(s) are assigned to it. Please reassign those users first.`);
      return;
    }

    if (!confirm(`Are you sure you want to delete the role "${roleName}"?`)) return;

    const updatedRoles = roles.filter((role) => role.id !== roleId);
    setRoles(updatedRoles);
    localStorage.setItem("systemRoles", JSON.stringify(updatedRoles));

    if (selectedRole?.id === roleId) {
      setSelectedRole(updatedRoles[0] || null);
      setEditPermissions(updatedRoles[0]?.permissions || {});
    }

    alert("Role deleted successfully!");
  };

  const colorOptions = [
    { value: "bg-red-500", label: "Red" },
    { value: "bg-violet-500", label: "Blue" },
    { value: "bg-green-500", label: "Green" },
    { value: "bg-yellow-500", label: "Yellow" },
    { value: "bg-purple-500", label: "Purple" },
    { value: "bg-orange-500", label: "Orange" },
    { value: "bg-pink-500", label: "Pink" },
    { value: "bg-indigo-500", label: "Indigo" },
    { value: "bg-gray-500", label: "Gray" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Roles & Permissions</h1>
          <p className="text-gray-500 mt-1">Manage user roles and access control permissions</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button
              className="bg-[#2B0A57] hover:bg-[#3d1570]"
              onClick={() => setFormData({ name: "", description: "", color: "bg-violet-500" })}
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Role
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Role</DialogTitle>
              <DialogDescription>
                Define a new role with specific permissions
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="role-name">Role Name</Label>
                <Input
                  id="role-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Sales Manager"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role-description">Description</Label>
                <Textarea
                  id="role-description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of this role"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role-color">Color Badge</Label>
                <select
                  id="role-color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="w-full h-10 px-3 border border-gray-300 rounded-lg focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED] focus:outline-none"
                >
                  {colorOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button className="bg-[#2B0A57] hover:bg-[#3d1570]" onClick={handleCreateRole}>
                Create Role
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Roles List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              System Roles ({roles.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {roles.map((role) => (
                <div
                  key={role.id}
                  className={`p-4 border rounded-lg transition-all cursor-pointer ${
                    selectedRole?.id === role.id
                      ? "border-[#2B0A57] bg-[#2B0A57]/5 shadow-md"
                      : "border-gray-200 hover:shadow-md"
                  }`}
                  onClick={() => handleSelectRole(role)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Shield className={`w-5 h-5 text-white p-1 rounded ${role.color}`} />
                      <h3 className="font-semibold">{role.name}</h3>
                    </div>
                    <Badge variant="outline" className="flex items-center gap-1">
                      <UsersIcon className="w-3 h-3" />
                      {userCounts[role.name] || 0}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{role.description}</p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenEditDialog(role);
                      }}
                    >
                      <Edit className="w-3 h-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 border-red-600"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteRole(role.id, role.name);
                      }}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Permissions Matrix */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                Permission Matrix - {selectedRole?.name || "Select a Role"}
              </CardTitle>
              <Button
                className="bg-[#2B0A57] hover:bg-[#3d1570]"
                onClick={handleSavePermissions}
                disabled={!selectedRole}
              >
                <Save className="w-4 h-4 mr-2" />
                Save Permissions
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {selectedRole ? (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-1/3">Module</TableHead>
                      <TableHead>Permissions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(permissionModules).map(([module, availablePerms]) => (
                      <TableRow key={module}>
                        <TableCell className="font-semibold">{module}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-3">
                            {availablePerms.map((perm) => {
                              const isChecked = editPermissions[module]?.includes(perm) || false;
                              return (
                                <label
                                  key={perm}
                                  className="flex items-center gap-2 cursor-pointer"
                                >
                                  <Checkbox
                                    checked={isChecked}
                                    onCheckedChange={() => handleTogglePermission(module, perm)}
                                  />
                                  <span className="text-sm">{perm}</span>
                                </label>
                              );
                            })}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Shield className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p>Select a role to view and edit permissions</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Role Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Role</DialogTitle>
            <DialogDescription>
              Update role details and appearance
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-role-name">Role Name</Label>
              <Input
                id="edit-role-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-role-description">Description</Label>
              <Textarea
                id="edit-role-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-role-color">Color Badge</Label>
              <select
                id="edit-role-color"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="w-full h-10 px-3 border border-gray-300 rounded-lg focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED] focus:outline-none"
              >
                {colorOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button className="bg-[#2B0A57] hover:bg-[#3d1570]" onClick={handleUpdateRole}>
              Update Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

