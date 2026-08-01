import { type ReactNode, Suspense, lazy } from 'react';
import { createBrowserRouter, Navigate, Outlet } from 'react-router';
import { Layout } from './components/Layout';
import { prototypeModulesEnabled } from './lib/feature-flags';
import { useAuth } from './lib/auth-context';

function lazyNamed<TModule extends Record<string, any>, TKey extends keyof TModule>(
  loader: () => Promise<TModule>,
  key: TKey,
) {
  return lazy(async () => {
    const module = await loader();
    return { default: module[key] as React.ComponentType };
  });
}

const DashboardPage = lazyNamed(() => import('./pages/Dashboard'), 'Dashboard');
const BookingPage = lazyNamed(() => import('./pages/Booking'), 'Booking');
const ArrivalListPage = lazyNamed(() => import('./pages/ArrivalList'), 'ArrivalList');
const CheckoutListPage = lazyNamed(() => import('./pages/CheckoutList'), 'CheckoutList');
const UsersPage = lazyNamed(() => import('./pages/Users'), 'Users');
const LoginPage = lazyNamed(() => import('./pages/Login'), 'Login');
const QRMenuPage = lazyNamed(() => import('./pages/QRMenu'), 'QRMenu');

const BookingDiaryPage = lazyNamed(() => import('./pages/BookingDiary'), 'BookingDiary');
const GuestHistoryPage = lazyNamed(() => import('./pages/GuestHistory'), 'GuestHistory');
const RoomManagementPage = lazyNamed(() => import('./pages/RoomManagement'), 'RoomManagement');
const HousekeepingPage = lazyNamed(() => import('./pages/Housekeeping'), 'Housekeeping');
const RestaurantPOSPage = lazyNamed(() => import('./pages/RestaurantPOS'), 'RestaurantPOS');
const KitchenDisplayPage = lazyNamed(() => import('./pages/KitchenDisplay'), 'KitchenDisplay');
const RestaurantBackOfficePage = lazyNamed(() => import('./pages/RestaurantBackOffice'), 'RestaurantBackOffice');
const ReportsPage = lazyNamed(() => import('./pages/Reports'), 'Reports');
const RolesPage = lazyNamed(() => import('./pages/Roles'), 'Roles');
const WeddingBookingPage = lazyNamed(() => import('./pages/WeddingBooking'), 'WeddingBooking');
const EventReservationPage = lazyNamed(() => import('./pages/EventReservation'), 'EventReservation');
const EventCalendarPage = lazyNamed(() => import('./pages/EventCalendar'), 'EventCalendar');
const EventWeddingPackagesPage = lazyNamed(() => import('./pages/EventWeddingPackages'), 'EventWeddingPackages');
const EventPackagesPage = lazyNamed(() => import('./pages/EventPackages'), 'EventPackages');
const DayOutPlansPage = lazyNamed(() => import('./pages/DayOutPlans'), 'DayOutPlans');
const RoomTypesPage = lazyNamed(() => import('./pages/RoomTypes'), 'RoomTypes');
const RoomsPage = lazyNamed(() => import('./pages/Rooms'), 'Rooms');
const RatePlansPage = lazyNamed(() => import('./pages/RatePlans'), 'RatePlans');
const MealPlansPage = lazyNamed(() => import('./pages/MealPlans'), 'MealPlans');

const administratorRoles = ['Administrator'];
const restaurantRoles = ['Administrator', 'Manager', 'Restaurant Staff'];
const frontOfficeRoles = ['Administrator', 'Manager', 'Front Office'];
const housekeepingRoles = ['Administrator', 'Manager', 'Housekeeping'];
const managerRoles = ['Administrator', 'Manager'];
const eventRoles = ['Administrator', 'Manager', 'Front Office'];
const reportRoles = ['Administrator', 'Manager', 'Front Office'];
const roomReaderRoles = ['Administrator', 'Manager', 'Front Office', 'Housekeeping'];
const roomEditorRoles = ['Administrator', 'Manager', 'Front Office'];

function LoadingScreen({ message }: { message: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5F6FA] text-sm text-gray-500">
      {message}
    </div>
  );
}

function SuspenseOutlet({ message }: { message: string }) {
  return (
    <Suspense fallback={<LoadingScreen message={message} />}>
      <Outlet />
    </Suspense>
  );
}

function RequireAuth() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <LoadingScreen message="Checking your session..." />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <SuspenseOutlet message="Loading workspace..." />;
}

function PublicOnly() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <LoadingScreen message="Checking your session..." />;
  if (isAuthenticated) return <Navigate to="/" replace />;
  return <SuspenseOutlet message="Loading sign in..." />;
}

function RequireRoles({ roles, children }: { roles: string[]; children: ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen message="Checking access..." />;
  }

  if (!roles.includes(user?.role || '')) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function withRoles(element: ReactNode, roles: string[]) {
  return <RequireRoles roles={roles}>{element}</RequireRoles>;
}

const coreAppRoutes = [
  { index: true, element: <DashboardPage /> },
  { path: 'booking', element: withRoles(<BookingPage />, frontOfficeRoles) },
  { path: 'arrivals', element: withRoles(<ArrivalListPage />, frontOfficeRoles) },
  { path: 'checkouts', element: withRoles(<CheckoutListPage />, frontOfficeRoles) },
  { path: 'users', element: withRoles(<UsersPage />, managerRoles) },
  { path: 'restaurant-pos', element: withRoles(<RestaurantPOSPage />, restaurantRoles) },
  { path: 'kitchen-display', element: withRoles(<KitchenDisplayPage />, restaurantRoles) },
  { path: 'restaurant-backoffice', element: withRoles(<RestaurantBackOfficePage />, restaurantRoles) },
];

const prototypeRoutes = [
  { path: 'booking-diary', element: withRoles(<BookingDiaryPage />, frontOfficeRoles) },
  { path: 'guest-history', element: withRoles(<GuestHistoryPage />, frontOfficeRoles) },
  { path: 'room-management', element: withRoles(<RoomManagementPage />, roomEditorRoles) },
  { path: 'room-types', element: withRoles(<RoomTypesPage />, roomEditorRoles) },
  { path: 'rooms', element: withRoles(<RoomsPage />, roomReaderRoles) },
  { path: 'rate-plans', element: withRoles(<RatePlansPage />, roomEditorRoles) },
  { path: 'meal-plans', element: withRoles(<MealPlansPage />, roomEditorRoles) },
  { path: 'event-wedding-packages', element: withRoles(<EventWeddingPackagesPage />, managerRoles) },
  { path: 'event-packages', element: withRoles(<EventPackagesPage />, managerRoles) },
  { path: 'housekeeping', element: withRoles(<HousekeepingPage />, housekeepingRoles) },
  { path: 'wedding-booking', element: withRoles(<WeddingBookingPage />, eventRoles) },
  { path: 'event-reservation', element: withRoles(<EventReservationPage />, eventRoles) },
  { path: 'event-calendar', element: withRoles(<EventCalendarPage />, eventRoles) },
  { path: 'day-out-plans', element: withRoles(<DayOutPlansPage />, managerRoles) },
  { path: 'reports', element: withRoles(<ReportsPage />, reportRoles) },
  { path: 'roles', element: withRoles(<RolesPage />, managerRoles) },
];

export const router = createBrowserRouter([
  {
    element: <PublicOnly />,
    children: [
      { path: '/login', element: <LoginPage /> },
    ],
  },
  {
    element: <RequireAuth />,
    children: [
      {
        path: '/',
        Component: Layout,
        children: [
          ...coreAppRoutes,
          ...(prototypeModulesEnabled ? prototypeRoutes : []),
          { path: '*', element: <Navigate to="/" replace /> },
        ],
      },
    ],
  },
  {
    path: '/qr-menu',
    element: <QRMenuPage />,
  },
  {
    path: '*',
    element: <Navigate to="/login" replace />,
  },
]);

