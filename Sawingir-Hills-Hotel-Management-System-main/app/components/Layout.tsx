import { useEffect, useMemo, useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router';
import { useTheme } from '../lib/theme-context';
import { useAuth } from '../lib/auth-context';
import { prototypeModulesEnabled } from '../lib/feature-flags';
import {
  type LucideIcon,
  LayoutDashboard,
  Hotel,
  Calendar,
  CalendarClock,
  UserCheck,
  LogOut,
  Users,
  BedDouble,
  UserCog,
  ClipboardList,
  CheckSquare,
  UtensilsCrossed,
  MenuSquare,
  ShoppingCart,
  ChefHat,
  BarChart3,
  Settings,
  Shield,
  Search,
  Bell,
  ChevronLeft,
  ChevronRight,
  Globe,
  Heart,
  Briefcase,
  Palmtree,
  Mountain,
  Moon,
  Sun,
} from 'lucide-react';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';

type NavLinkItem = {
  title: string;
  icon: LucideIcon;
  path: string;
  roles?: string[];
};

type NavSection = {
  title: string;
  icon: LucideIcon;
  group: string;
  path?: string;
  items?: NavLinkItem[];
  roles?: string[];
};

type RoleProfile = {
  preferredGroups: string[];
  preferredSections: string[];
  expandedSections: string[];
};

const restaurantRoles = ['Administrator', 'Manager', 'Restaurant Staff'];
const frontOfficeRoles = ['Administrator', 'Manager', 'Front Office'];
const housekeepingRoles = ['Administrator', 'Manager', 'Housekeeping'];
const managerRoles = ['Administrator', 'Manager'];
const eventRoles = ['Administrator', 'Manager', 'Front Office'];
const reportRoles = ['Administrator', 'Manager', 'Front Office'];
const roomReaderRoles = ['Administrator', 'Manager', 'Front Office', 'Housekeeping'];
const roomEditorRoles = ['Administrator', 'Manager', 'Front Office'];

const navigationBlueprint: NavSection[] = [
  {
    title: 'Dashboard',
    group: 'Workspace',
    icon: LayoutDashboard,
    path: '/',
  },
  {
    title: 'Guest Operations',
    group: 'Operations',
    icon: Hotel,
    roles: frontOfficeRoles,
    items: [
      { title: 'Reservations', icon: Calendar, path: '/booking', roles: frontOfficeRoles },
      { title: 'Arrivals', icon: UserCheck, path: '/arrivals', roles: frontOfficeRoles },
      { title: 'Departures', icon: LogOut, path: '/checkouts', roles: frontOfficeRoles },
      ...(prototypeModulesEnabled
        ? [
            { title: 'Booking Diary', icon: CalendarClock, path: '/booking-diary', roles: frontOfficeRoles },
            { title: 'Guest History', icon: Users, path: '/guest-history', roles: frontOfficeRoles },
          ]
        : []),
    ],
  },
  {
    title: 'Restaurant',
    group: 'Operations',
    icon: UtensilsCrossed,
    roles: restaurantRoles,
    items: [
      { title: 'POS Orders', icon: ShoppingCart, path: '/restaurant-pos', roles: restaurantRoles },
      { title: 'Kitchen Display', icon: ChefHat, path: '/kitchen-display', roles: restaurantRoles },
      { title: 'Menu & Pricing', icon: MenuSquare, path: '/restaurant-backoffice', roles: restaurantRoles },
    ],
  },
  {
    title: 'Property',
    group: 'Operations',
    icon: BedDouble,
    roles: roomReaderRoles,
    items: prototypeModulesEnabled
      ? [
          { title: 'Housekeeping', icon: CheckSquare, path: '/housekeeping', roles: housekeepingRoles },
          { title: 'Room Inventory', icon: BedDouble, path: '/room-management', roles: roomEditorRoles },
          { title: 'Room Types', icon: BedDouble, path: '/room-types', roles: roomEditorRoles },
          { title: 'Rooms', icon: Hotel, path: '/rooms', roles: roomReaderRoles },
          { title: 'Rate Plans', icon: ClipboardList, path: '/rate-plans', roles: roomEditorRoles },
          { title: 'Meal Plans', icon: MenuSquare, path: '/meal-plans', roles: roomEditorRoles },
        ]
      : [],
  },
  {
    title: 'Events & Leisure',
    group: 'Experience',
    icon: Heart,
    roles: eventRoles,
    items: prototypeModulesEnabled
      ? [
          { title: 'Wedding Bookings', icon: Heart, path: '/wedding-booking', roles: eventRoles },
          { title: 'Event Bookings', icon: Briefcase, path: '/event-reservation', roles: eventRoles },
          { title: 'Event Calendar', icon: CalendarClock, path: '/event-calendar', roles: eventRoles },
          { title: 'Wedding Packages', icon: Heart, path: '/event-wedding-packages', roles: managerRoles },
          { title: 'Event Packages', icon: Briefcase, path: '/event-packages', roles: managerRoles },
          { title: 'Day Out Plans', icon: Palmtree, path: '/day-out-plans', roles: managerRoles },
        ]
      : [],
  },
  {
    title: 'Control Center',
    group: 'Management',
    icon: Shield,
    roles: managerRoles,
    items: [
      { title: 'Users', icon: Users, path: '/users', roles: managerRoles },
      ...(prototypeModulesEnabled
        ? [
            { title: 'Reports', icon: BarChart3, path: '/reports', roles: reportRoles },
            { title: 'Roles & Permissions', icon: UserCog, path: '/roles', roles: managerRoles },
          ]
        : []),
    ],
  },
];

const defaultNavGroupOrder = ['Workspace', 'Operations', 'Experience', 'Management'];

const roleProfiles: Record<string, RoleProfile> = {
  Administrator: {
    preferredGroups: ['Workspace', 'Operations', 'Experience', 'Management'],
    preferredSections: ['Dashboard', 'Guest Operations', 'Restaurant', 'Property', 'Events & Leisure', 'Control Center'],
    expandedSections: ['Guest Operations', 'Restaurant', 'Control Center'],
  },
  Manager: {
    preferredGroups: ['Workspace', 'Operations', 'Management', 'Experience'],
    preferredSections: ['Dashboard', 'Guest Operations', 'Restaurant', 'Control Center', 'Property', 'Events & Leisure'],
    expandedSections: ['Guest Operations', 'Restaurant', 'Control Center'],
  },
  'Front Office': {
    preferredGroups: ['Workspace', 'Operations', 'Experience', 'Management'],
    preferredSections: ['Dashboard', 'Guest Operations', 'Events & Leisure', 'Property', 'Control Center'],
    expandedSections: ['Guest Operations', 'Events & Leisure'],
  },
  'Restaurant Staff': {
    preferredGroups: ['Workspace', 'Operations'],
    preferredSections: ['Dashboard', 'Restaurant'],
    expandedSections: ['Restaurant'],
  },
  Housekeeping: {
    preferredGroups: ['Workspace', 'Operations'],
    preferredSections: ['Dashboard', 'Property'],
    expandedSections: ['Property'],
  },
  default: {
    preferredGroups: defaultNavGroupOrder,
    preferredSections: ['Dashboard', 'Guest Operations', 'Restaurant', 'Property', 'Events & Leisure', 'Control Center'],
    expandedSections: ['Guest Operations'],
  },
};

function sortByPreference<T extends { title: string }>(items: T[], preferredTitles: string[]) {
  const orderMap = new Map(preferredTitles.map((title, index) => [title, index]));

  return [...items].sort((left, right) => {
    const leftOrder = orderMap.get(left.title) ?? Number.MAX_SAFE_INTEGER;
    const rightOrder = orderMap.get(right.title) ?? Number.MAX_SAFE_INTEGER;

    if (leftOrder !== rightOrder) {
      return leftOrder - rightOrder;
    }

    return left.title.localeCompare(right.title);
  });
}

export function Layout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { resolvedTheme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();

  const currentRoleProfile = useMemo(() => roleProfiles[user?.role || ''] || roleProfiles.default, [user?.role]);
  const [expandedSections, setExpandedSections] = useState<string[]>(currentRoleProfile.expandedSections);

  const initials = useMemo(() => {
    if (!user?.fullName) return 'SH';
    return user.fullName
      .split(' ')
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || '')
      .join('');
  }, [user?.fullName]);

  const navigationSections = useMemo(() => {
    const visibleSections = navigationBlueprint
      .map((section) => {
        if (!section.items) return section;
        const items = section.items.filter((item) => !item.roles || item.roles.includes(user?.role || ''));
        return { ...section, items };
      })
      .filter((section) => {
        if (section.items) return section.items.length > 0;
        return !section.roles || section.roles.includes(user?.role || '');
      });

    return sortByPreference(visibleSections, currentRoleProfile.preferredSections);
  }, [currentRoleProfile.preferredSections, user?.role]);

  const navigationGroups = useMemo(() => {
    const groupOrder = currentRoleProfile.preferredGroups.length ? currentRoleProfile.preferredGroups : defaultNavGroupOrder;
    return groupOrder
      .map((groupTitle) => ({
        title: groupTitle,
        sections: navigationSections.filter((section) => section.group === groupTitle),
      }))
      .filter((group) => group.sections.length > 0);
  }, [currentRoleProfile.preferredGroups, navigationSections]);

  const isSectionActive = (section: NavSection) => {
    if (section.path) return location.pathname === section.path;
    return section.items?.some((item) => item.path === location.pathname) || false;
  };

  useEffect(() => {
    const allowedExpandedSections = currentRoleProfile.expandedSections.filter((title) => (
      navigationSections.some((section) => section.title === title)
    ));
    setExpandedSections(allowedExpandedSections);
  }, [currentRoleProfile.expandedSections, navigationSections, user?.role]);

  useEffect(() => {
    const activeSections = navigationSections
      .filter((section) => section.items && isSectionActive(section))
      .map((section) => section.title);

    if (!activeSections.length) return;
    setExpandedSections((current) => [...new Set([...current, ...activeSections])]);
  }, [location.pathname, navigationSections]);

  const toggleSection = (title: string) => {
    if (sidebarCollapsed) {
      setSidebarCollapsed(false);
      setExpandedSections((current) => (current.includes(title) ? current : [...current, title]));
      return;
    }

    setExpandedSections((current) => (
      current.includes(title) ? current.filter((item) => item !== title) : [...current, title]
    ));
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-background text-foreground">
      <aside className={`${sidebarCollapsed ? 'w-20' : 'w-[290px]'} flex flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-all duration-300`}>
        <div className="border-b border-sidebar-border/90 px-4 py-4">
          {!sidebarCollapsed ? (
            <>
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-[#5d2ea5] text-primary-foreground shadow-[0_12px_22px_rgba(96,52,156,0.22)]">
                  <Mountain className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-[var(--font-display)] text-[1.15rem] font-semibold tracking-[-0.03em] text-foreground">Sawingir Hills</div>
                  <div className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Hotel Management</div>
                </div>
              </div>

            </>
          ) : (
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-[#5d2ea5] text-primary-foreground shadow-[0_12px_22px_rgba(96,52,156,0.22)]">
              <Mountain className="h-5 w-5" />
            </div>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <div className="space-y-5">
            {navigationGroups.map((group) => (
              <div key={group.title} className="space-y-2">
                {!sidebarCollapsed && (
                  <div className="px-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{group.title}</div>
                )}
                <div className="space-y-1.5">
                  {group.sections.map((section) => {
                    const active = isSectionActive(section);
                    const isExpanded = expandedSections.includes(section.title);

                    if (section.items) {
                      return (
                        <div key={section.title} className="space-y-1">
                          <button
                            onClick={() => toggleSection(section.title)}
                            title={sidebarCollapsed ? section.title : undefined}
                            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                              active
                                ? 'border border-primary/15 bg-primary/8 text-primary'
                                : 'text-muted-foreground hover:bg-accent/70 hover:text-foreground'
                            }`}
                          >
                            <section.icon className="h-5 w-5 flex-shrink-0" />
                            {!sidebarCollapsed && (
                              <>
                                <span className="flex-1 text-left font-medium">{section.title}</span>
                                <ChevronRight className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                              </>
                            )}
                          </button>
                          {!sidebarCollapsed && isExpanded && (
                            <div className="ml-6 border-l border-border pl-3 dark:border-border">
                              {section.items.map((subItem) => {
                                const subItemActive = location.pathname === subItem.path;
                                return (
                                  <Link
                                    key={subItem.path}
                                    to={subItem.path}
                                    className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                                      subItemActive
                                        ? 'bg-primary/10 font-medium text-primary'
                                        : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground'
                                    }`}
                                  >
                                    <subItem.icon className="h-4 w-4 flex-shrink-0" />
                                    <span className="font-medium">{subItem.title}</span>
                                  </Link>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    }

                    return (
                      <Link
                        key={section.title}
                        to={section.path || '/'}
                        title={sidebarCollapsed ? section.title : undefined}
                        className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                          active
                            ? 'border border-primary/15 bg-primary/8 text-primary'
                            : 'text-muted-foreground hover:bg-accent/70 hover:text-foreground'
                        }`}
                      >
                        <section.icon className="h-5 w-5 flex-shrink-0" />
                        {!sidebarCollapsed && <span className="font-medium">{section.title}</span>}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </nav>

        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="flex h-14 items-center justify-center border-t border-sidebar-border/90 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          {sidebarCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
        </button>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col p-4">
        <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-[24px] border border-border bg-card shadow-[0_18px_48px_rgba(73,30,118,0.08)] dark:bg-card">
          <header className="flex h-20 items-center justify-between gap-6 border-b border-border px-5 lg:px-6">
            <div className="flex min-w-0 flex-1 items-center gap-4">
              <div className="min-w-0 flex-1 max-w-2xl">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search guests, bookings, rooms..."
                    className="h-11 rounded-xl border-border bg-background pl-11"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Badge variant="outline" className="hidden sm:inline-flex border-primary/15 bg-primary/10 px-3 py-1 text-primary">LKR</Badge>
              <Button variant="ghost" size="icon" className="rounded-xl text-muted-foreground hover:text-foreground">
                <Globe className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="rounded-xl text-muted-foreground hover:text-foreground"
                title={resolvedTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {resolvedTheme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </Button>
              <Button variant="ghost" size="icon" className="relative rounded-xl text-muted-foreground hover:text-foreground">
                <Bell className="h-5 w-5" />
                <span className="absolute right-3 top-3 h-2 w-2 rounded-full bg-primary" />
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="h-12 rounded-xl border-border bg-background px-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary text-sm text-primary-foreground">{initials}</AvatarFallback>
                    </Avatar>
                    <div className="hidden text-left sm:block">
                      <div className="text-sm font-medium text-foreground">{user?.fullName || 'Signed In User'}</div>
                      <div className="text-xs text-muted-foreground">{user?.role || 'User'}</div>
                    </div>
                    <ChevronRight className="hidden h-4 w-4 rotate-90 text-muted-foreground sm:block" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 rounded-2xl border-border/80 bg-popover/95">
                  <DropdownMenuLabel>
                    <div className="font-semibold text-foreground">{user?.fullName || 'Signed In User'}</div>
                    <div className="mt-0.5 text-xs font-normal text-muted-foreground">{user?.email || ''}</div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="cursor-pointer rounded-xl">
                    <UserCog className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span>{user?.role || 'User'}</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer rounded-xl">
                    <Settings className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span>{user?.department || 'Department'}</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="cursor-pointer rounded-xl text-red-600 focus:bg-red-50 focus:text-red-600" onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Logout</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto bg-muted/20 px-5 py-5 lg:px-6 lg:py-6 dark:bg-transparent">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}




