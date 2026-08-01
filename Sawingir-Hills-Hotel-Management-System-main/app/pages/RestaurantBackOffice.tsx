import { useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Switch } from '../components/ui/switch';
import { Textarea } from '../components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { ScrollArea } from '../components/ui/scroll-area';
import { AspectRatio } from '../components/ui/aspect-ratio';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import {
  ChefHat,
  Copy,
  ExternalLink,
  ImagePlus,
  Loader2,
  PencilLine,
  Plus,
  QrCode,
  Search,
  Settings2,
  TableProperties,
  Tags,
  Trash2,
  UtensilsCrossed,
  Wallet,
} from 'lucide-react';
import { toast } from 'sonner';

interface CategoryRecord {
  id: number;
  name: string;
  description?: string | null;
  sortOrder: number;
  isActive: boolean;
  _count?: { items: number };
}

interface MenuItemRecord {
  id: number;
  name: string;
  description?: string | null;
  price: number | string;
  preparationTime: number;
  isVegetarian: boolean;
  isSpicy: boolean;
  isAvailable: boolean;
  sortOrder: number;
  imageUrl?: string | null;
  categoryId: number;
  category?: { name: string };
}

interface TableRecord {
  id: number;
  code: string;
  name: string;
  area?: string | null;
  capacity: number;
  isActive: boolean;
  sortOrder: number;
  status?: string;
  openOrderCount?: number;
  currentOrderNumber?: string | null;
}

interface ItemFormState {
  id?: number;
  name: string;
  description: string;
  categoryId: string;
  price: string;
  preparationTime: string;
  sortOrder: string;
  imageUrl: string;
  isVegetarian: boolean;
  isSpicy: boolean;
  isAvailable: boolean;
}

interface CategoryFormState {
  id?: number;
  name: string;
  description: string;
  sortOrder: string;
  isActive: boolean;
}

interface TableFormState {
  id?: number;
  code: string;
  name: string;
  area: string;
  capacity: string;
  sortOrder: string;
  isActive: boolean;
}

interface RestaurantSettingsRecord {
  taxRate: number;
  serviceChargeRate: number;
  supportedPaymentMethods: string[];
  supportedLabels: string[];
  qrAssetMode: string;
  specialInstructionsEnabled: boolean;
  roomChargePolicy: string;
  modifierPresets: string[];
  publicMenuPath: string;
  publicMenuTitle: string;
  publicMenuDescription: string;
  assetCollectionNotes: string;
}

const defaultRestaurantSettings: RestaurantSettingsRecord = {
  taxRate: 0.1,
  serviceChargeRate: 0.1,
  supportedPaymentMethods: ['cash', 'card', 'bank_transfer', 'online', 'room_charge'],
  supportedLabels: ['vegetarian', 'spicy'],
  qrAssetMode: 'image_url_only',
  specialInstructionsEnabled: true,
  roomChargePolicy: 'Room charge orders stay unpaid until they are settled on the guest folio.',
  modifierPresets: ['No onion', 'Less spicy', 'Extra spicy', 'No ice', 'Urgent'],
  publicMenuPath: '/qr-menu',
  publicMenuTitle: 'Sawingir Hills Restaurant',
  publicMenuDescription: 'Live menu with current dishes, pricing, and dietary labels.',
  assetCollectionNotes: 'Use public image URLs so dishes stay visible in POS, back office, and QR menu screens.',
};

const emptyItemForm: ItemFormState = {
  name: '',
  description: '',
  categoryId: '',
  price: '',
  preparationTime: '15',
  sortOrder: '0',
  imageUrl: '',
  isVegetarian: false,
  isSpicy: false,
  isAvailable: true,
};

const emptyCategoryForm: CategoryFormState = {
  name: '',
  description: '',
  sortOrder: '0',
  isActive: true,
};

const emptyTableForm: TableFormState = {
  code: '',
  name: '',
  area: 'Restaurant',
  capacity: '4',
  sortOrder: '0',
  isActive: true,
};

function formatMoney(value: number | string) {
  return Math.round(Number(value || 0)).toLocaleString() + ' LKR';
}

function toPercent(value: number) {
  return Math.round(value * 100) + '%';
}

function normalizeRestaurantSettings(
  settings?: Partial<RestaurantSettingsRecord> | null,
): RestaurantSettingsRecord {
  return {
    ...defaultRestaurantSettings,
    ...settings,
    supportedPaymentMethods: settings?.supportedPaymentMethods ?? defaultRestaurantSettings.supportedPaymentMethods,
    supportedLabels: settings?.supportedLabels ?? defaultRestaurantSettings.supportedLabels,
    modifierPresets: settings?.modifierPresets ?? defaultRestaurantSettings.modifierPresets,
    publicMenuPath: settings?.publicMenuPath?.trim() || defaultRestaurantSettings.publicMenuPath,
    publicMenuTitle: settings?.publicMenuTitle?.trim() || defaultRestaurantSettings.publicMenuTitle,
    publicMenuDescription: settings?.publicMenuDescription?.trim() || defaultRestaurantSettings.publicMenuDescription,
    roomChargePolicy: settings?.roomChargePolicy?.trim() || defaultRestaurantSettings.roomChargePolicy,
    assetCollectionNotes: settings?.assetCollectionNotes?.trim() || defaultRestaurantSettings.assetCollectionNotes,
  };
}

function getPublicMenuUrl(pathValue?: string | null) {
  const safePath = pathValue?.trim() || defaultRestaurantSettings.publicMenuPath;
  const cleanPath = safePath.startsWith('/') ? safePath : '/' + safePath;
  if (typeof window === 'undefined') {
    return cleanPath;
  }

  return new URL(cleanPath, window.location.origin).toString();
}

export function RestaurantBackOffice() {
  const [categories, setCategories] = useState<CategoryRecord[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItemRecord[]>([]);
  const [tables, setTables] = useState<TableRecord[]>([]);
  const [restaurantSettings, setRestaurantSettings] = useState<RestaurantSettingsRecord>(defaultRestaurantSettings);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [availabilityFilter, setAvailabilityFilter] = useState<'all' | 'available' | 'hidden'>('all');
  const [loading, setLoading] = useState(true);
  const [savingItem, setSavingItem] = useState(false);
  const [savingCategory, setSavingCategory] = useState(false);
  const [savingTable, setSavingTable] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [tableDialogOpen, setTableDialogOpen] = useState(false);
  const [itemForm, setItemForm] = useState<ItemFormState>(emptyItemForm);
  const [categoryForm, setCategoryForm] = useState<CategoryFormState>(emptyCategoryForm);
  const [tableForm, setTableForm] = useState<TableFormState>(emptyTableForm);
  const [priceDrafts, setPriceDrafts] = useState<Record<number, string>>({});
  const [modifierDraft, setModifierDraft] = useState(defaultRestaurantSettings.modifierPresets.join(', '));

  const filteredItems = useMemo(() => menuItems.filter((item) => {
    const haystack = (item.name + ' ' + (item.description || '') + ' ' + (item.category?.name || '')).toLowerCase();
    const matchesSearch = haystack.includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || String(item.categoryId) === categoryFilter;
    const matchesAvailability = availabilityFilter === 'all'
      || (availabilityFilter === 'available' ? item.isAvailable : !item.isAvailable);

    return matchesSearch && matchesCategory && matchesAvailability;
  }), [availabilityFilter, categoryFilter, menuItems, searchQuery]);

  const groupedItems = useMemo(() => {
    const categoryLookup = new Map(categories.map((category) => [category.id, category]));
    const groups = new Map<number, { category: CategoryRecord | undefined; items: MenuItemRecord[] }>();

    filteredItems.forEach((item) => {
      const existing = groups.get(item.categoryId);
      if (existing) {
        existing.items.push(item);
        return;
      }

      groups.set(item.categoryId, {
        category: categoryLookup.get(item.categoryId),
        items: [item],
      });
    });

    return Array.from(groups.values())
      .map((group) => ({
        ...group,
        items: group.items.sort((left, right) => left.sortOrder - right.sortOrder || left.name.localeCompare(right.name)),
      }))
      .sort((left, right) => {
        const leftOrder = left.category?.sortOrder ?? Number.MAX_SAFE_INTEGER;
        const rightOrder = right.category?.sortOrder ?? Number.MAX_SAFE_INTEGER;
        return leftOrder - rightOrder || (left.category?.name || '').localeCompare(right.category?.name || '');
      });
  }, [categories, filteredItems]);

  const stats = useMemo(() => ({
    totalItems: menuItems.length,
    liveItems: menuItems.filter((item) => item.isAvailable).length,
    categories: categories.length,
    activeTables: tables.filter((table) => table.isActive).length,
    imageReady: menuItems.filter((item) => Boolean(item.imageUrl?.trim())).length,
  }), [categories, menuItems, tables]);

  async function loadData() {
    setLoading(true);
    try {
      const [categoryData, menuData, tableData, settingsData] = await Promise.all([
        api.getRestaurantCategories({ active: 'all' }),
        api.getRestaurantMenu(),
        api.getRestaurantTables({ active: 'all' }),
        api.getRestaurantSettings(),
      ]);

      setCategories(categoryData);
      setMenuItems(menuData);
      setTables(tableData);
      const nextSettings = normalizeRestaurantSettings(settingsData);
      setRestaurantSettings(nextSettings);
      setModifierDraft(nextSettings.modifierPresets.join(', '));
      setPriceDrafts(Object.fromEntries(menuData.map((item: MenuItemRecord) => [item.id, String(Number(item.price))])));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load restaurant back office');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  function resetFilters() {
    setSearchQuery('');
    setCategoryFilter('all');
    setAvailabilityFilter('all');
  }

  function openNewItemDialog() {
    setItemForm(emptyItemForm);
    setItemDialogOpen(true);
  }

  function openEditItemDialog(item: MenuItemRecord) {
    setItemForm({
      id: item.id,
      name: item.name,
      description: item.description || '',
      categoryId: String(item.categoryId),
      price: String(Number(item.price)),
      preparationTime: String(item.preparationTime),
      sortOrder: String(item.sortOrder),
      imageUrl: item.imageUrl || '',
      isVegetarian: item.isVegetarian,
      isSpicy: item.isSpicy,
      isAvailable: item.isAvailable,
    });
    setItemDialogOpen(true);
  }

  function openNewCategoryDialog() {
    setCategoryForm(emptyCategoryForm);
    setCategoryDialogOpen(true);
  }

  function openEditCategoryDialog(category: CategoryRecord) {
    setCategoryForm({
      id: category.id,
      name: category.name,
      description: category.description || '',
      sortOrder: String(category.sortOrder),
      isActive: category.isActive,
    });
    setCategoryDialogOpen(true);
  }

  function openNewTableDialog() {
    setTableForm(emptyTableForm);
    setTableDialogOpen(true);
  }

  function openEditTableDialog(table: TableRecord) {
    setTableForm({
      id: table.id,
      code: table.code,
      name: table.name,
      area: table.area || 'Restaurant',
      capacity: String(table.capacity),
      sortOrder: String(table.sortOrder),
      isActive: table.isActive,
    });
    setTableDialogOpen(true);
  }

  async function saveItem() {
    if (!itemForm.name.trim()) {
      toast.error('Enter a menu item name');
      return;
    }

    if (!itemForm.categoryId) {
      toast.error('Choose a category for the menu item');
      return;
    }

    if (Number(itemForm.price) <= 0) {
      toast.error('Enter a valid price');
      return;
    }

    setSavingItem(true);
    try {
      const payload = {
        categoryId: Number(itemForm.categoryId),
        name: itemForm.name.trim(),
        description: itemForm.description.trim() || undefined,
        price: Number(itemForm.price),
        preparationTime: Number(itemForm.preparationTime),
        sortOrder: Number(itemForm.sortOrder),
        imageUrl: itemForm.imageUrl.trim() || undefined,
        isVegetarian: itemForm.isVegetarian,
        isSpicy: itemForm.isSpicy,
        isAvailable: itemForm.isAvailable,
      };

      if (itemForm.id) {
        await api.updateRestaurantMenuItem(itemForm.id, payload);
        toast.success('Menu item updated');
      } else {
        await api.createRestaurantMenuItem(payload);
        toast.success('Menu item created');
      }

      setItemDialogOpen(false);
      await loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save menu item');
    } finally {
      setSavingItem(false);
    }
  }

  async function saveCategory() {
    if (!categoryForm.name.trim()) {
      toast.error('Enter a category name');
      return;
    }

    setSavingCategory(true);
    try {
      const payload = {
        name: categoryForm.name.trim(),
        description: categoryForm.description.trim() || undefined,
        sortOrder: Number(categoryForm.sortOrder),
        isActive: categoryForm.isActive,
      };

      if (categoryForm.id) {
        await api.updateRestaurantCategory(categoryForm.id, payload);
        toast.success('Category updated');
      } else {
        await api.createRestaurantCategory(payload);
        toast.success('Category created');
      }

      setCategoryDialogOpen(false);
      await loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save category');
    } finally {
      setSavingCategory(false);
    }
  }

  async function deleteCategory(category: CategoryRecord) {
    if (!window.confirm('Delete category "' + category.name + '"?')) {
      return;
    }

    try {
      await api.deleteRestaurantCategory(category.id);
      toast.success('Category deleted');
      await loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete category');
    }
  }

  async function saveTable() {
    if (!tableForm.code.trim() || !tableForm.name.trim()) {
      toast.error('Enter both a table code and a table name');
      return;
    }

    setSavingTable(true);
    try {
      const payload = {
        code: tableForm.code.trim(),
        name: tableForm.name.trim(),
        area: tableForm.area.trim() || 'Restaurant',
        capacity: Number(tableForm.capacity),
        sortOrder: Number(tableForm.sortOrder),
        isActive: tableForm.isActive,
      };

      if (tableForm.id) {
        await api.updateRestaurantTable(tableForm.id, payload);
        toast.success('Table updated');
      } else {
        await api.createRestaurantTable(payload);
        toast.success('Table created');
      }

      setTableDialogOpen(false);
      await loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save table');
    } finally {
      setSavingTable(false);
    }
  }

  async function deleteTable(table: TableRecord) {
    if (!window.confirm('Delete ' + table.name + '?')) {
      return;
    }

    try {
      await api.deleteRestaurantTable(table.id);
      toast.success('Table deleted');
      await loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete table');
    }
  }

  async function savePrice(item: MenuItemRecord) {
    try {
      await api.updateRestaurantMenuItem(item.id, {
        categoryId: item.categoryId,
        name: item.name,
        description: item.description || undefined,
        price: Number(priceDrafts[item.id] || item.price),
        preparationTime: item.preparationTime,
        sortOrder: item.sortOrder,
        imageUrl: item.imageUrl || undefined,
        isVegetarian: item.isVegetarian,
        isSpicy: item.isSpicy,
        isAvailable: item.isAvailable,
      });
      toast.success('Updated price for ' + item.name);
      await loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update price');
    }
  }

  async function toggleAvailability(item: MenuItemRecord, isAvailable: boolean) {
    try {
      await api.updateRestaurantMenuItem(item.id, {
        categoryId: item.categoryId,
        name: item.name,
        description: item.description || undefined,
        price: Number(item.price),
        preparationTime: item.preparationTime,
        sortOrder: item.sortOrder,
        imageUrl: item.imageUrl || undefined,
        isVegetarian: item.isVegetarian,
        isSpicy: item.isSpicy,
        isAvailable,
      });
      toast.success(item.name + ' is now ' + (isAvailable ? 'live in POS' : 'hidden from POS'));
      await loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update availability');
    }
  }

  async function saveSettings() {
    setSavingSettings(true);
    try {
      const payload = {
        taxRate: Number(restaurantSettings.taxRate),
        serviceChargeRate: Number(restaurantSettings.serviceChargeRate),
        qrAssetMode: restaurantSettings.qrAssetMode,
        specialInstructionsEnabled: restaurantSettings.specialInstructionsEnabled,
        roomChargePolicy: restaurantSettings.roomChargePolicy.trim(),
        modifierPresets: modifierDraft.split(',').map((value) => value.trim()).filter(Boolean),
        publicMenuPath: restaurantSettings.publicMenuPath.trim(),
        publicMenuTitle: restaurantSettings.publicMenuTitle.trim(),
        publicMenuDescription: restaurantSettings.publicMenuDescription.trim(),
        assetCollectionNotes: restaurantSettings.assetCollectionNotes.trim(),
        supportedLabels: restaurantSettings.supportedLabels,
        supportedPaymentMethods: restaurantSettings.supportedPaymentMethods,
      };

      const nextSettings = normalizeRestaurantSettings(await api.updateRestaurantSettings(payload));
      setRestaurantSettings(nextSettings);
      setModifierDraft(nextSettings.modifierPresets.join(', '));
      toast.success('Restaurant settings updated');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update restaurant settings');
    } finally {
      setSavingSettings(false);
    }
  }

  async function copyQrUrl() {
    try {
      await navigator.clipboard.writeText(getPublicMenuUrl(restaurantSettings.publicMenuPath));
      toast.success('QR menu URL copied');
    } catch {
      toast.error('Failed to copy the QR menu URL');
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-slate-500">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Loading restaurant back office...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-[#f8f1ff] via-white to-[#fff8eb] shadow-sm">
        <div className="grid gap-6 px-6 py-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:px-8">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-xs font-medium text-[#2B0A57] shadow-sm">
              <ChefHat className="h-3.5 w-3.5" />
              Restaurant operations workspace
            </div>
            <h1 className="mt-4 text-3xl font-bold text-slate-900">Restaurant Back Office</h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-600 sm:text-base">
              Run the live restaurant from one place. Staff can manage menu items, categories, tables, QR delivery, and pricing rules without bouncing across half-finished screens.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
            <Button className="min-h-11 bg-[#2B0A57] px-5 hover:bg-[#3d1570]" onClick={openNewItemDialog} disabled={categories.length === 0}>
              <Plus className="mr-2 h-4 w-4" />
              Add menu item
            </Button>
            <Button variant="outline" className="min-h-11 px-5" onClick={openNewCategoryDialog}>
              <Tags className="mr-2 h-4 w-4" />
              Add category
            </Button>
            <Button variant="outline" className="min-h-11 px-5" onClick={openNewTableDialog}>
              <TableProperties className="mr-2 h-4 w-4" />
              Add table
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <Card className="border-slate-200"><CardContent className="pt-6"><div className="text-sm text-slate-500">Menu items</div><div className="mt-2 text-3xl font-bold text-slate-900">{stats.totalItems}</div></CardContent></Card>
        <Card className="border-slate-200"><CardContent className="pt-6"><div className="text-sm text-slate-500">Live in POS</div><div className="mt-2 text-3xl font-bold text-slate-900">{stats.liveItems}</div></CardContent></Card>
        <Card className="border-slate-200"><CardContent className="pt-6"><div className="text-sm text-slate-500">Categories</div><div className="mt-2 text-3xl font-bold text-slate-900">{stats.categories}</div></CardContent></Card>
        <Card className="border-slate-200"><CardContent className="pt-6"><div className="text-sm text-slate-500">Tables</div><div className="mt-2 text-3xl font-bold text-slate-900">{stats.activeTables}</div></CardContent></Card>
        <Card className="border-slate-200"><CardContent className="pt-6"><div className="text-sm text-slate-500">Image ready</div><div className="mt-2 text-3xl font-bold text-slate-900">{stats.imageReady}</div></CardContent></Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        <div className="space-y-6 xl:sticky xl:top-6 xl:self-start">
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle>Quick actions</CardTitle>
              <p className="text-sm text-slate-500">Use these for the common restaurant work the team does every day.</p>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="min-h-11 w-full justify-start bg-[#2B0A57] hover:bg-[#3d1570]" onClick={openNewItemDialog} disabled={categories.length === 0}>
                <UtensilsCrossed className="mr-2 h-4 w-4" />
                Create menu item
              </Button>
              <Button variant="outline" className="min-h-11 w-full justify-start" onClick={openNewCategoryDialog}>
                <Tags className="mr-2 h-4 w-4" />
                Create category
              </Button>
              <Button variant="outline" className="min-h-11 w-full justify-start" onClick={openNewTableDialog}>
                <TableProperties className="mr-2 h-4 w-4" />
                Create table
              </Button>
              <Button variant="outline" className="min-h-11 w-full justify-start" onClick={resetFilters}>
                <Search className="mr-2 h-4 w-4" />
                Reset search and filters
              </Button>
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-slate-50/70">
            <CardHeader>
              <CardTitle>QR delivery</CardTitle>
              <p className="text-sm text-slate-500">The public QR menu now runs on live menu data instead of a mock screen.</p>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
                <div className="font-medium text-slate-900">Public URL</div>
                <div className="mt-2 break-all text-xs">{getPublicMenuUrl(restaurantSettings.publicMenuPath)}</div>
              </div>
              <div className="grid gap-2">
                <Button variant="outline" className="justify-start" onClick={copyQrUrl}>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy URL
                </Button>
                <Button variant="outline" className="justify-start" onClick={() => window.open(restaurantSettings.publicMenuPath, '_blank', 'noopener,noreferrer')}>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Open QR menu
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-slate-200">
            <CardHeader>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <CardTitle>Live catalog workspace</CardTitle>
                  <p className="mt-1 text-sm text-slate-500">Search items fast, adjust prices inline, and open the editor only for deeper changes.</p>
                </div>
                <Badge variant="outline" className="w-fit">{filteredItems.length} results</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_180px_180px_auto]">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search name, description, or category" className="h-11 pl-10" />
                </div>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="h-11"><SelectValue placeholder="Category" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All categories</SelectItem>
                    {categories.map((category) => <SelectItem key={category.id} value={String(category.id)}>{category.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={availabilityFilter} onValueChange={(value: 'all' | 'available' | 'hidden') => setAvailabilityFilter(value)}>
                  <SelectTrigger className="h-11"><SelectValue placeholder="Visibility" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All items</SelectItem>
                    <SelectItem value="available">Live in POS</SelectItem>
                    <SelectItem value="hidden">Hidden</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" className="h-11" onClick={resetFilters}>Clear</Button>
              </div>

              <ScrollArea className="h-[56vh] rounded-2xl border border-slate-200 bg-slate-50/50 pr-3">
                {groupedItems.length === 0 ? (
                  <div className="flex h-full items-center justify-center px-6 py-10 text-center text-sm text-slate-500">No menu items match the current filters.</div>
                ) : (
                  <div className="space-y-6 p-4">
                    {groupedItems.map((group) => (
                      <section key={group.category?.id ?? ('category-' + (group.items[0]?.categoryId || 'unknown'))} className="space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <h3 className="text-base font-semibold text-slate-900">{group.category?.name || 'Uncategorized'}</h3>
                            {group.category?.description && <p className="text-sm text-slate-500">{group.category.description}</p>}
                          </div>
                          <Badge variant="outline">{group.items.length} items</Badge>
                        </div>
                        <div className="space-y-3">
                          {group.items.map((item) => {
                            const priceValue = priceDrafts[item.id] || String(Number(item.price));
                            const priceChanged = Number(priceValue) !== Number(item.price);

                            return (
                              <div key={item.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                                  <div className="flex min-w-0 flex-1 gap-4">
                                    <div className="hidden w-24 shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 sm:block">
                                      <AspectRatio ratio={1}>
                                        {item.imageUrl?.trim() ? (
                                          <ImageWithFallback src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
                                        ) : (
                                          <div className="flex h-full items-center justify-center text-xs text-slate-500">No image</div>
                                        )}
                                      </AspectRatio>
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <div className="flex flex-wrap items-center gap-2">
                                        <h4 className="text-base font-semibold text-slate-900">{item.name}</h4>
                                        {item.isVegetarian && <Badge variant="outline">Veg</Badge>}
                                        {item.isSpicy && <Badge className="border-rose-300 bg-rose-100 text-rose-700">Spicy</Badge>}
                                        {!item.isAvailable && <Badge className="border-amber-300 bg-amber-100 text-amber-800">Hidden</Badge>}
                                      </div>
                                      {item.description && <p className="mt-2 text-sm text-slate-600">{item.description}</p>}
                                      <div className="mt-3 flex flex-wrap gap-4 text-sm text-slate-500">
                                        <span>Prep {item.preparationTime} min</span>
                                        <span>Sort order {item.sortOrder}</span>
                                        <span>{item.category?.name || 'Menu item'}</span>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="grid gap-3 sm:grid-cols-[150px_auto] xl:min-w-[300px]">
                                    <Input type="number" value={priceValue} onChange={(event) => setPriceDrafts((current) => ({ ...current, [item.id]: event.target.value }))} className="h-11" />
                                    <Button className="h-11 bg-[#2B0A57] hover:bg-[#3d1570]" onClick={() => void savePrice(item)} disabled={!priceChanged}>
                                      <Wallet className="mr-2 h-4 w-4" />
                                      Save price
                                    </Button>
                                  </div>
                                </div>

                                <div className="mt-4 flex flex-col gap-3 rounded-2xl bg-slate-50 p-3 lg:flex-row lg:items-center lg:justify-between">
                                  <div className="flex items-center justify-between gap-4 lg:justify-start">
                                    <div>
                                      <div className="text-sm font-medium text-slate-900">Live in POS</div>
                                      <div className="text-xs text-slate-500">This toggles waiter and kitchen visibility immediately.</div>
                                    </div>
                                    <Switch checked={item.isAvailable} onCheckedChange={(checked) => void toggleAvailability(item, checked)} />
                                  </div>
                                  <Button variant="outline" className="min-h-10" onClick={() => openEditItemDialog(item)}>
                                    <PencilLine className="mr-2 h-4 w-4" />
                                    Edit item
                                  </Button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </section>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          <div className="grid gap-6 2xl:grid-cols-2">
            <Card className="border-slate-200">
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <CardTitle>Category manager</CardTitle>
                    <p className="mt-1 text-sm text-slate-500">Edit, hide, or remove categories without leaving the live menu workspace.</p>
                  </div>
                  <Button variant="outline" onClick={openNewCategoryDialog}><Plus className="mr-2 h-4 w-4" />Add</Button>
                </div>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                {categories.map((category) => (
                  <div key={category.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-semibold text-slate-900">{category.name}</div>
                        <div className="mt-1 text-sm text-slate-500">Sort order {category.sortOrder}</div>
                      </div>
                      <Badge variant="outline">{category._count?.items ?? 0} items</Badge>
                    </div>
                    {category.description && <p className="mt-3 text-sm text-slate-600">{category.description}</p>}
                    <div className="mt-4 flex flex-wrap gap-2">
                      {!category.isActive && <Badge className="border-amber-300 bg-amber-100 text-amber-800">Hidden</Badge>}
                      <Button variant="outline" size="sm" onClick={() => openEditCategoryDialog(category)}>
                        <PencilLine className="mr-2 h-4 w-4" />Edit
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => void deleteCategory(category)}>
                        <Trash2 className="mr-2 h-4 w-4" />Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-slate-200">
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <CardTitle>Table manager</CardTitle>
                    <p className="mt-1 text-sm text-slate-500">Tables are now configurable instead of hardcoded, so service layout can change safely.</p>
                  </div>
                  <Button variant="outline" onClick={openNewTableDialog}><Plus className="mr-2 h-4 w-4" />Add</Button>
                </div>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                {tables.map((table) => (
                  <div key={table.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-semibold text-slate-900">{table.name}</div>
                        <div className="mt-1 text-sm text-slate-500">Code {table.code} • {table.area || 'Restaurant'} • {table.capacity} seats</div>
                      </div>
                      <Badge variant="outline">{table.openOrderCount ?? 0} open</Badge>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
                      <span>Sort {table.sortOrder}</span>
                      <span>Status {(table.status || 'available').replace('_', ' ')}</span>
                      {!table.isActive && <span>Hidden from POS</span>}
                    </div>
                    {table.currentOrderNumber && <div className="mt-2 text-sm text-slate-600">Current order {table.currentOrderNumber}</div>}
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button variant="outline" size="sm" onClick={() => openEditTableDialog(table)}>
                        <PencilLine className="mr-2 h-4 w-4" />Edit
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => void deleteTable(table)}>
                        <Trash2 className="mr-2 h-4 w-4" />Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <Card className="border-slate-200">
            <CardHeader>
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <CardTitle>Live restaurant settings</CardTitle>
                  <p className="mt-1 text-sm text-slate-500">These settings now drive live tax, service, QR publishing, and waiter modifier shortcuts.</p>
                </div>
                <Button className="bg-[#2B0A57] hover:bg-[#3d1570]" disabled={savingSettings} onClick={() => void saveSettings()}>
                  {savingSettings ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Settings2 className="mr-2 h-4 w-4" />}
                  Save settings
                </Button>
              </div>
            </CardHeader>
            <CardContent className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="tax-rate">Tax rate</Label>
                    <Input id="tax-rate" type="number" step="0.01" value={restaurantSettings.taxRate} onChange={(event) => setRestaurantSettings((current) => ({ ...current, taxRate: Number(event.target.value) }))} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="service-rate">Service charge</Label>
                    <Input id="service-rate" type="number" step="0.01" value={restaurantSettings.serviceChargeRate} onChange={(event) => setRestaurantSettings((current) => ({ ...current, serviceChargeRate: Number(event.target.value) }))} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="menu-title">QR menu title</Label>
                  <Input id="menu-title" value={restaurantSettings.publicMenuTitle} onChange={(event) => setRestaurantSettings((current) => ({ ...current, publicMenuTitle: event.target.value }))} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="menu-description">QR menu description</Label>
                  <Textarea id="menu-description" rows={3} value={restaurantSettings.publicMenuDescription} onChange={(event) => setRestaurantSettings((current) => ({ ...current, publicMenuDescription: event.target.value }))} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="menu-path">Public menu path</Label>
                  <Input id="menu-path" value={restaurantSettings.publicMenuPath} onChange={(event) => setRestaurantSettings((current) => ({ ...current, publicMenuPath: event.target.value }))} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="modifier-presets">Modifier presets</Label>
                  <Textarea id="modifier-presets" rows={3} value={modifierDraft} onChange={(event) => setModifierDraft(event.target.value)} placeholder="No onion, Less spicy, Extra spicy" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="room-charge-policy">Room charge policy</Label>
                  <Textarea id="room-charge-policy" rows={3} value={restaurantSettings.roomChargePolicy} onChange={(event) => setRestaurantSettings((current) => ({ ...current, roomChargePolicy: event.target.value }))} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="asset-notes">Asset notes</Label>
                  <Textarea id="asset-notes" rows={3} value={restaurantSettings.assetCollectionNotes} onChange={(event) => setRestaurantSettings((current) => ({ ...current, assetCollectionNotes: event.target.value }))} />
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-slate-900">Operational snapshot</div>
                      <div className="mt-1 text-sm text-slate-500">These values now reflect live, editable restaurant configuration.</div>
                    </div>
                    <Badge variant="outline">Live</Badge>
                  </div>
                  <div className="mt-4 space-y-3 text-sm text-slate-700">
                    <div className="flex justify-between gap-4"><span>Tax</span><span className="font-semibold">{toPercent(restaurantSettings.taxRate)}</span></div>
                    <div className="flex justify-between gap-4"><span>Service charge</span><span className="font-semibold">{toPercent(restaurantSettings.serviceChargeRate)}</span></div>
                    <div className="flex justify-between gap-4"><span>Special instructions</span><span className="font-semibold">{restaurantSettings.specialInstructionsEnabled ? 'Enabled' : 'Disabled'}</span></div>
                    <div className="flex justify-between gap-4"><span>QR asset mode</span><span className="font-semibold">{restaurantSettings.qrAssetMode.replace(/_/g, ' ')}</span></div>
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-slate-900">POS helper features</div>
                      <div className="mt-1 text-sm text-slate-500">These affect the live waiter workflow directly.</div>
                    </div>
                    <Switch checked={restaurantSettings.specialInstructionsEnabled} onCheckedChange={(checked) => setRestaurantSettings((current) => ({ ...current, specialInstructionsEnabled: checked }))} />
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {modifierDraft.split(',').map((value) => value.trim()).filter(Boolean).map((preset) => (
                      <Badge key={preset} variant="outline">{preset}</Badge>
                    ))}
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="rounded-2xl bg-sky-100 p-3">
                      <QrCode className="h-5 w-5 text-sky-700" />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900">QR and image assets</div>
                      <div className="mt-1 text-sm text-slate-600">{restaurantSettings.assetCollectionNotes}</div>
                    </div>
                  </div>
                  <div className="mt-4 grid gap-3 text-sm text-slate-700">
                    <div className="flex justify-between gap-4"><span>Image-ready items</span><span className="font-semibold">{stats.imageReady}</span></div>
                    <div className="flex justify-between gap-4"><span>Public menu URL</span><span className="font-semibold text-right">{restaurantSettings.publicMenuPath}</span></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={itemDialogOpen} onOpenChange={setItemDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{itemForm.id ? 'Edit menu item' : 'Create menu item'}</DialogTitle>
            <DialogDescription>Keep this focused on the fields restaurant staff actually use in daily service.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="item-name">Name</Label>
              <Input id="item-name" value={itemForm.name} onChange={(event) => setItemForm((current) => ({ ...current, name: event.target.value }))} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="item-description">Description</Label>
              <Textarea id="item-description" rows={3} value={itemForm.description} onChange={(event) => setItemForm((current) => ({ ...current, description: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={itemForm.categoryId} onValueChange={(value) => setItemForm((current) => ({ ...current, categoryId: value }))}>
                <SelectTrigger><SelectValue placeholder="Choose category" /></SelectTrigger>
                <SelectContent>{categories.filter((category) => category.isActive).map((category) => <SelectItem key={category.id} value={String(category.id)}>{category.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="item-price">Price</Label>
              <Input id="item-price" type="number" value={itemForm.price} onChange={(event) => setItemForm((current) => ({ ...current, price: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="item-prep">Preparation time (min)</Label>
              <Input id="item-prep" type="number" value={itemForm.preparationTime} onChange={(event) => setItemForm((current) => ({ ...current, preparationTime: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="item-sort">Sort order</Label>
              <Input id="item-sort" type="number" value={itemForm.sortOrder} onChange={(event) => setItemForm((current) => ({ ...current, sortOrder: event.target.value }))} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="item-image">Image URL</Label>
              <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
                <div className="flex items-center gap-2">
                  <ImagePlus className="h-4 w-4 text-slate-400" />
                  <Input id="item-image" value={itemForm.imageUrl} onChange={(event) => setItemForm((current) => ({ ...current, imageUrl: event.target.value }))} placeholder="Paste a public image URL" />
                </div>
                <div className="mt-4 grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
                  <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                    <AspectRatio ratio={1}>
                      {itemForm.imageUrl.trim() ? (
                        <ImageWithFallback src={itemForm.imageUrl} alt={itemForm.name || 'Preview'} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center bg-gradient-to-br from-[#2B0A57] to-[#d97706] text-white">
                          <ImagePlus className="h-7 w-7" />
                        </div>
                      )}
                    </AspectRatio>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
                    This image is shared by the waiter POS, the back-office catalog, and the public QR menu.
                  </div>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex items-start justify-between gap-4"><div><div className="font-medium text-slate-900">Vegetarian</div><div className="text-xs text-slate-500">Highlight this for guests and staff.</div></div><Switch checked={itemForm.isVegetarian} onCheckedChange={(checked) => setItemForm((current) => ({ ...current, isVegetarian: checked }))} /></div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex items-start justify-between gap-4"><div><div className="font-medium text-slate-900">Spicy</div><div className="text-xs text-slate-500">Show this label in POS and QR menu.</div></div><Switch checked={itemForm.isSpicy} onCheckedChange={(checked) => setItemForm((current) => ({ ...current, isSpicy: checked }))} /></div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 md:col-span-2">
              <div className="flex items-start justify-between gap-4"><div><div className="font-medium text-slate-900">Available for ordering</div><div className="text-xs text-slate-500">If switched off, the dish disappears from the live POS immediately.</div></div><Switch checked={itemForm.isAvailable} onCheckedChange={(checked) => setItemForm((current) => ({ ...current, isAvailable: checked }))} /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setItemDialogOpen(false)}>Cancel</Button>
            <Button className="bg-[#2B0A57] hover:bg-[#3d1570]" disabled={savingItem} onClick={() => void saveItem()}>
              {savingItem ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save item
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{categoryForm.id ? 'Edit category' : 'Create category'}</DialogTitle>
            <DialogDescription>Categories now support live edit and delete, not just one-way creation.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label htmlFor="category-name">Name</Label><Input id="category-name" value={categoryForm.name} onChange={(event) => setCategoryForm((current) => ({ ...current, name: event.target.value }))} /></div>
            <div className="space-y-2"><Label htmlFor="category-description">Description</Label><Textarea id="category-description" rows={3} value={categoryForm.description} onChange={(event) => setCategoryForm((current) => ({ ...current, description: event.target.value }))} /></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2"><Label htmlFor="category-sort">Sort order</Label><Input id="category-sort" type="number" value={categoryForm.sortOrder} onChange={(event) => setCategoryForm((current) => ({ ...current, sortOrder: event.target.value }))} /></div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"><div className="flex items-center justify-between gap-4"><div><div className="font-medium text-slate-900">Active</div><div className="text-xs text-slate-500">Inactive categories stay in history but can be hidden from staff workflows.</div></div><Switch checked={categoryForm.isActive} onCheckedChange={(checked) => setCategoryForm((current) => ({ ...current, isActive: checked }))} /></div></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCategoryDialogOpen(false)}>Cancel</Button>
            <Button className="bg-[#2B0A57] hover:bg-[#3d1570]" disabled={savingCategory} onClick={() => void saveCategory()}>
              {savingCategory ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save category
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={tableDialogOpen} onOpenChange={setTableDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{tableForm.id ? 'Edit table' : 'Create table'}</DialogTitle>
            <DialogDescription>Tables now belong to live restaurant configuration instead of hardcoded frontend assumptions.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2"><Label htmlFor="table-code">Code</Label><Input id="table-code" value={tableForm.code} onChange={(event) => setTableForm((current) => ({ ...current, code: event.target.value }))} /></div>
            <div className="space-y-2"><Label htmlFor="table-name">Name</Label><Input id="table-name" value={tableForm.name} onChange={(event) => setTableForm((current) => ({ ...current, name: event.target.value }))} /></div>
            <div className="space-y-2"><Label htmlFor="table-area">Area</Label><Input id="table-area" value={tableForm.area} onChange={(event) => setTableForm((current) => ({ ...current, area: event.target.value }))} /></div>
            <div className="space-y-2"><Label htmlFor="table-capacity">Capacity</Label><Input id="table-capacity" type="number" value={tableForm.capacity} onChange={(event) => setTableForm((current) => ({ ...current, capacity: event.target.value }))} /></div>
            <div className="space-y-2"><Label htmlFor="table-sort">Sort order</Label><Input id="table-sort" type="number" value={tableForm.sortOrder} onChange={(event) => setTableForm((current) => ({ ...current, sortOrder: event.target.value }))} /></div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"><div className="flex items-center justify-between gap-4"><div><div className="font-medium text-slate-900">Active</div><div className="text-xs text-slate-500">Inactive tables disappear from waiter selection.</div></div><Switch checked={tableForm.isActive} onCheckedChange={(checked) => setTableForm((current) => ({ ...current, isActive: checked }))} /></div></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTableDialogOpen(false)}>Cancel</Button>
            <Button className="bg-[#2B0A57] hover:bg-[#3d1570]" disabled={savingTable} onClick={() => void saveTable()}>
              {savingTable ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save table
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

