import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Plus, Edit, Check, X, UserCheck, UserX, Search, Loader2 } from 'lucide-react';
import { api } from '../lib/api';

type UserStatus = 'pending' | 'active' | 'inactive';

interface RoleRecord {
  id: number;
  name: string;
}

interface UserRecord {
  id: number;
  fullName: string;
  email: string;
  username: string;
  department: string;
  roleId: number;
  role: { name: string };
  status: UserStatus;
  createdAt: string;
  lastLogin?: string | null;
}

interface UserFormState {
  fullName: string;
  email: string;
  username: string;
  roleId: string;
  department: string;
  password: string;
}

const initialForm: UserFormState = {
  fullName: '',
  email: '',
  username: '',
  roleId: '',
  department: 'Front Office',
  password: '',
};

export function Users() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [roles, setRoles] = useState<RoleRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserRecord | null>(null);
  const [formData, setFormData] = useState<UserFormState>(initialForm);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const [usersResponse, rolesResponse] = await Promise.all([
        api.getUsers({ limit: '100' }),
        api.getRoles(),
      ]);
      setUsers(usersResponse.data || []);
      setRoles(rolesResponse.map((role: any) => ({ id: role.id, name: role.name })));
    } catch (loadError: any) {
      setError(loadError.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
      const matchesSearch = !searchQuery || [user.fullName, user.email, user.username, user.department, user.role.name]
        .join(' ')
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [searchQuery, statusFilter, users]);

  const pendingCount = users.filter((user) => user.status === 'pending').length;

  const resetForm = () => {
    setFormData({
      ...initialForm,
      roleId: roles[0] ? String(roles[0].id) : '',
    });
    setEditingUser(null);
  };

  const handleOpenAddDialog = () => {
    resetForm();
    setIsAddDialogOpen(true);
  };

  const handleOpenEditDialog = (user: UserRecord) => {
    setEditingUser(user);
    setFormData({
      fullName: user.fullName,
      email: user.email,
      username: user.username,
      roleId: String(user.roleId),
      department: user.department,
      password: '',
    });
    setIsEditDialogOpen(true);
  };

  const handleCreateUser = async () => {
    try {
      setSaving(true);
      await api.createUser({
        fullName: formData.fullName,
        email: formData.email,
        username: formData.username,
        password: formData.password,
        department: formData.department,
        roleId: Number(formData.roleId),
        status: 'active',
      });
      setIsAddDialogOpen(false);
      await loadUsers();
    } catch (saveError: any) {
      setError(saveError.message || 'Failed to create user');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingUser) return;

    try {
      setSaving(true);
      await api.updateUser(editingUser.id, {
        fullName: formData.fullName,
        email: formData.email,
        department: formData.department,
        roleId: Number(formData.roleId),
        password: formData.password,
      });
      setIsEditDialogOpen(false);
      await loadUsers();
    } catch (saveError: any) {
      setError(saveError.message || 'Failed to update user');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateStatus = async (user: UserRecord, status: UserStatus) => {
    try {
      await api.updateUserStatus(user.id, { status, roleId: user.roleId });
      await loadUsers();
    } catch (statusError: any) {
      setError(statusError.message || 'Failed to update user status');
    }
  };

  const getStatusBadge = (status: UserStatus) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500">Active</Badge>;
      case 'inactive':
        return <Badge className="bg-gray-500">Inactive</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500">Pending Approval</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-500 mt-1">Manage staff accounts, approvals, and system access from live backend data.</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#2B0A57] hover:bg-[#3d1570]" onClick={handleOpenAddDialog}>
              <Plus className="w-4 h-4 mr-2" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New User</DialogTitle>
              <DialogDescription>Create a live staff account in the PMS.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="add-fullName">Full Name</Label>
                  <Input id="add-fullName" value={formData.fullName} onChange={(event) => setFormData({ ...formData, fullName: event.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="add-email">Email</Label>
                  <Input id="add-email" type="email" value={formData.email} onChange={(event) => setFormData({ ...formData, email: event.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="add-username">Username</Label>
                  <Input id="add-username" value={formData.username} onChange={(event) => setFormData({ ...formData, username: event.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="add-password">Password</Label>
                  <Input id="add-password" type="password" value={formData.password} onChange={(event) => setFormData({ ...formData, password: event.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="add-role">Role</Label>
                  <Select value={formData.roleId} onValueChange={(value) => setFormData({ ...formData, roleId: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((role) => (
                        <SelectItem key={role.id} value={String(role.id)}>{role.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="add-department">Department</Label>
                  <Select value={formData.department} onValueChange={(value) => setFormData({ ...formData, department: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Front Office">Front Office</SelectItem>
                      <SelectItem value="Restaurant POS">Restaurant POS</SelectItem>
                      <SelectItem value="Housekeeping">Housekeeping</SelectItem>
                      <SelectItem value="Back Office">Back Office</SelectItem>
                      <SelectItem value="Manager">Manager</SelectItem>
                      <SelectItem value="Admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
              <Button className="bg-[#2B0A57] hover:bg-[#3d1570]" onClick={() => void handleCreateUser()} disabled={saving}>
                {saving ? 'Creating...' : 'Create User'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {error && <div className="p-4 rounded-xl border border-red-200 bg-red-50 text-sm text-red-700">{error}</div>}

      {pendingCount > 0 && (
        <Card className="border-yellow-500 bg-yellow-50">
          <CardContent className="pt-6 flex items-center justify-between gap-4">
            <div>
              <h3 className="font-semibold text-yellow-900">{pendingCount} account{pendingCount > 1 ? 's are' : ' is'} waiting for approval</h3>
              <p className="text-sm text-yellow-700">Approve pending registrations from the live user list.</p>
            </div>
            <Button variant="outline" className="border-yellow-600 text-yellow-700 hover:bg-yellow-100" onClick={() => setStatusFilter('pending')}>
              View Pending
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input placeholder="Search users by name, email, username, role, or department..." value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} className="pl-10" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                <SelectItem value="pending">Pending Approval</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>System Users ({filteredUsers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-10 flex items-center justify-center text-gray-500">
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Loading users...
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-gray-500 py-8">No users found</TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-semibold">{user.fullName}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.username}</TableCell>
                      <TableCell><Badge variant="outline">{user.role.name}</Badge></TableCell>
                      <TableCell>{user.department}</TableCell>
                      <TableCell>{getStatusBadge(user.status)}</TableCell>
                      <TableCell>{user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {user.status === 'pending' ? (
                            <>
                              <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => void handleUpdateStatus(user, 'active')}>
                                <Check className="w-3 h-3" />
                              </Button>
                              <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white" onClick={() => void handleUpdateStatus(user, 'inactive')}>
                                <X className="w-3 h-3" />
                              </Button>
                            </>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => void handleUpdateStatus(user, user.status === 'active' ? 'inactive' : 'active')}
                              className={user.status === 'active' ? 'text-orange-600 border-orange-600' : 'text-green-600 border-green-600'}
                            >
                              {user.status === 'active' ? <UserX className="w-3 h-3" /> : <UserCheck className="w-3 h-3" />}
                            </Button>
                          )}
                          <Button size="sm" variant="outline" onClick={() => handleOpenEditDialog(user)}>
                            <Edit className="w-3 h-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Update the user's role, department, or profile details.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-fullName">Full Name</Label>
                <Input id="edit-fullName" value={formData.fullName} onChange={(event) => setFormData({ ...formData, fullName: event.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input id="edit-email" type="email" value={formData.email} onChange={(event) => setFormData({ ...formData, email: event.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-role">Role</Label>
                <Select value={formData.roleId} onValueChange={(value) => setFormData({ ...formData, roleId: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role.id} value={String(role.id)}>{role.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-department">Department</Label>
                <Select value={formData.department} onValueChange={(value) => setFormData({ ...formData, department: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Front Office">Front Office</SelectItem>
                    <SelectItem value="Restaurant POS">Restaurant POS</SelectItem>
                    <SelectItem value="Housekeeping">Housekeeping</SelectItem>
                    <SelectItem value="Back Office">Back Office</SelectItem>
                    <SelectItem value="Manager">Manager</SelectItem>
                    <SelectItem value="Admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-password">New Password (optional)</Label>
              <Input id="edit-password" type="password" value={formData.password} onChange={(event) => setFormData({ ...formData, password: event.target.value })} placeholder="Leave blank to keep the current password" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
            <Button className="bg-[#2B0A57] hover:bg-[#3d1570]" onClick={() => void handleSaveEdit()} disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
