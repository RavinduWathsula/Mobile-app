import { useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { AspectRatio } from '../components/ui/aspect-ratio';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { ChefHat, Loader2, Search, Sparkles, UtensilsCrossed } from 'lucide-react';

interface PublicCategory {
  id: number;
  name: string;
  description?: string | null;
}

interface PublicMenuItem {
  id: number;
  categoryId: number;
  name: string;
  description?: string | null;
  price: number | string;
  imageUrl?: string | null;
  isVegetarian: boolean;
  isSpicy: boolean;
  preparationTime: number;
  category?: { id: number; name: string } | null;
}

interface PublicMenuSettings {
  taxRate: number;
  serviceChargeRate: number;
  publicMenuTitle: string;
  publicMenuDescription: string;
}

function formatMoney(value: number | string) {
  return `${Math.round(Number(value || 0)).toLocaleString()} LKR`;
}

export function QRMenu() {
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<PublicCategory[]>([]);
  const [items, setItems] = useState<PublicMenuItem[]>([]);
  const [settings, setSettings] = useState<PublicMenuSettings | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadMenu() {
      setLoading(true);
      setError('');
      try {
        const response = await api.getRestaurantPublicMenu();
        setCategories(response.categories ?? []);
        setItems(response.items ?? []);
        setSettings(response.settings ?? null);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Failed to load the live restaurant menu');
      } finally {
        setLoading(false);
      }
    }

    void loadMenu();
  }, []);

  const filteredItems = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();

    return items.filter((item) => {
      const matchesCategory = activeCategory === 'all' || String(item.categoryId) === activeCategory;
      const matchesSearch = normalizedSearch.length === 0
        || item.name.toLowerCase().includes(normalizedSearch)
        || item.description?.toLowerCase().includes(normalizedSearch)
        || item.category?.name?.toLowerCase().includes(normalizedSearch);

      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, items, searchQuery]);

  const groupedItems = useMemo(() => categories
    .map((category) => ({
      category,
      items: filteredItems.filter((item) => item.categoryId === category.id),
    }))
    .filter((group) => group.items.length > 0), [categories, filteredItems]);

  const taxLabel = settings ? `${Math.round(settings.taxRate * 100)}% tax` : 'Live tax';
  const serviceLabel = settings ? `${Math.round(settings.serviceChargeRate * 100)}% service` : 'Live service charge';

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#fff8eb,_#f8f1ff_35%,_#f5f6fa_70%)]">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-[32px] border border-slate-200 bg-white/95 shadow-sm">
          <div className="border-b border-slate-200 bg-gradient-to-br from-[#2B0A57] via-[#4c1d95] to-[#d97706] px-6 py-8 text-white sm:px-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white/90">
                  <UtensilsCrossed className="h-3.5 w-3.5" />
                  Live QR menu
                </div>
                <h1 className="mt-4 text-3xl font-bold sm:text-4xl">{settings?.publicMenuTitle || 'Sawingir Hills Restaurant'}</h1>
                <p className="mt-3 max-w-2xl text-sm text-white/80 sm:text-base">
                  {settings?.publicMenuDescription || 'Browse the live hotel menu. Prices, availability, and dietary labels come directly from the restaurant back office.'}
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-sm">
                  <div className="text-xs uppercase tracking-[0.2em] text-white/65">Pricing</div>
                  <div className="mt-2 text-sm font-semibold">{taxLabel}</div>
                </div>
                <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-sm">
                  <div className="text-xs uppercase tracking-[0.2em] text-white/65">Service</div>
                  <div className="mt-2 text-sm font-semibold">{serviceLabel}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="px-4 py-5 sm:px-6 lg:px-8">
            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search dishes, drinks, or categories"
                  className="h-12 rounded-2xl border-slate-200 bg-white pl-11"
                />
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1">
                <Button
                  size="sm"
                  variant={activeCategory === 'all' ? 'default' : 'outline'}
                  className={activeCategory === 'all' ? 'min-h-10 rounded-full bg-[#2B0A57] px-4 hover:bg-[#3d1570]' : 'min-h-10 rounded-full px-4'}
                  onClick={() => setActiveCategory('all')}
                >
                  All
                </Button>
                {categories.map((category) => (
                  <Button
                    key={category.id}
                    size="sm"
                    variant={activeCategory === String(category.id) ? 'default' : 'outline'}
                    className={activeCategory === String(category.id) ? 'min-h-10 rounded-full bg-[#2B0A57] px-4 hover:bg-[#3d1570]' : 'min-h-10 rounded-full px-4'}
                    onClick={() => setActiveCategory(String(category.id))}
                  >
                    {category.name}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <div className="border-t border-slate-200 bg-slate-50/60 px-4 py-6 sm:px-6 lg:px-8">
            {loading ? (
              <div className="flex min-h-[40vh] items-center justify-center text-slate-500">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Loading the live menu...
              </div>
            ) : error ? (
              <div className="rounded-3xl border border-rose-200 bg-rose-50 px-6 py-10 text-center text-sm text-rose-800">
                {error}
              </div>
            ) : groupedItems.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center text-sm text-slate-500">
                No menu items match the current search.
              </div>
            ) : (
              <div className="space-y-8">
                {groupedItems.map((group) => (
                  <section key={group.category.id} className="space-y-4">
                    <div className="flex flex-wrap items-end justify-between gap-3">
                      <div>
                        <h2 className="text-2xl font-semibold text-slate-900">{group.category.name}</h2>
                        {group.category.description && (
                          <p className="mt-1 text-sm text-slate-500">{group.category.description}</p>
                        )}
                      </div>
                      <Badge variant="outline" className="border-slate-300 bg-white text-slate-700">
                        {group.items.length} items
                      </Badge>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                      {group.items.map((item) => (
                        <Card key={item.id} className="overflow-hidden rounded-[28px] border-slate-200 bg-white shadow-sm">
                          <div className="border-b border-slate-200 bg-slate-100">
                            <AspectRatio ratio={16 / 10}>
                              {item.imageUrl ? (
                                <ImageWithFallback src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
                              ) : (
                                <div className="flex h-full items-center justify-center bg-gradient-to-br from-[#2B0A57] to-[#d97706] text-white">
                                  <Sparkles className="h-7 w-7" />
                                </div>
                              )}
                            </AspectRatio>
                          </div>
                          <CardContent className="space-y-4 p-5">
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <h3 className="text-lg font-semibold text-slate-900">{item.name}</h3>
                                {item.description && (
                                  <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
                                )}
                              </div>
                              <div className="text-right">
                                <div className="text-lg font-bold text-[#2B0A57]">{formatMoney(item.price)}</div>
                                <div className="mt-1 text-xs text-slate-500">Approx. {item.preparationTime} min</div>
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-2">
                              {item.isVegetarian && <Badge variant="outline">Vegetarian</Badge>}
                              {item.isSpicy && <Badge className="border-rose-300 bg-rose-100 text-rose-700">Spicy</Badge>}
                              <Badge className="border-slate-200 bg-slate-100 text-slate-700">{item.category?.name || 'Menu item'}</Badge>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-slate-200 bg-white px-6 py-4 text-sm text-slate-500 sm:px-8">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 text-slate-700">
                <ChefHat className="h-4 w-4 text-[#2B0A57]" />
                Please call a waiter to place your order.
              </div>
              <div>Prices and availability are updated from the live restaurant system.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
