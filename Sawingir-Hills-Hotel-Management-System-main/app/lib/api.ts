import { getClientEnv } from './runtime-env';

const API_BASE = getClientEnv('VITE_API_URL', 'http://localhost:3010/api');
const API_ORIGIN = API_BASE.replace(/\/api\/?$/, '');
const NETWORK_ERROR_MESSAGE = `Unable to reach the API at ${API_ORIGIN}. Start the backend server and check VITE_API_URL.`;

type QueryValue = string | number | boolean | null | undefined;

interface RequestOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
}

function normalizeApiError(error: unknown): Error {
  if (error instanceof TypeError) {
    return new Error(NETWORK_ERROR_MESSAGE);
  }

  if (error instanceof Error) {
    return error;
  }

  return new Error('Unexpected API error');
}

function buildQuery(params?: Record<string, QueryValue>) {
  if (!params) {
    return '';
  }

  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') {
      continue;
    }
    searchParams.set(key, String(value));
  }

  const query = searchParams.toString();
  return query ? `?${query}` : '';
}

class ApiClient {
  private accessToken: string | null = null;
  private refreshPromise: Promise<boolean> | null = null;

  setAccessToken(token: string | null) {
    this.accessToken = token;
  }

  clearSession() {
    this.accessToken = null;
  }

  private async request<T>(endpoint: string, options: RequestOptions = {}, retry = true): Promise<T> {
    const { method = 'GET', body, headers = {} } = options;

    const config: RequestInit = {
      method,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    if (this.accessToken) {
      (config.headers as Record<string, string>).Authorization = `Bearer ${this.accessToken}`;
    }

    if (body !== undefined) {
      config.body = JSON.stringify(body);
    }

    let response: Response;
    try {
      response = await fetch(`${API_BASE}${endpoint}`, config);
    } catch (error) {
      throw normalizeApiError(error);
    }

    if (response.status === 401 && retry && endpoint !== '/auth/refresh') {
      const refreshed = await this.tryRefresh();
      if (refreshed) {
        return this.request<T>(endpoint, options, false);
      }
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(error.message || `API Error: ${response.status}`);
    }

    if (response.status === 204 || response.status === 205) {
      return undefined as T;
    }

    return response.json();
  }

  private async publicRequest<T>(endpoint: string): Promise<T> {
    let response: Response;
    try {
      response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      throw normalizeApiError(error);
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(error.message || `API Error: ${response.status}`);
    }

    if (response.status === 204 || response.status === 205) {
      return undefined as T;
    }

    return response.json();
  }

  async tryRefresh(): Promise<boolean> {
    if (this.refreshPromise) return this.refreshPromise;

    this.refreshPromise = (async () => {
      try {
        const response = await fetch(`${API_BASE}/auth/refresh`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        });

        if (!response.ok) {
          this.clearSession();
          return false;
        }

        const data = await response.json();
        this.setAccessToken(data.accessToken);
        return true;
      } catch {
        this.clearSession();
        return false;
      } finally {
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  async login(username: string, password: string) {
    let response: Response;
    try {
      response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
    } catch (error) {
      throw normalizeApiError(error);
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Login failed' }));
      throw new Error(error.message || 'Invalid credentials');
    }

    const data = await response.json();
    this.setAccessToken(data.accessToken);
    return data;
  }

  async refreshSession() {
    let response: Response;
    try {
      response = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
    } catch {
      this.clearSession();
      return null;
    }

    if (!response.ok) {
      this.clearSession();
      return null;
    }

    const data = await response.json();
    this.setAccessToken(data.accessToken);
    return data;
  }

  async logout() {
    try {
      await fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
    } finally {
      this.clearSession();
    }
  }

  async getMe() {
    return this.request<any>('/auth/me');
  }

  async getDashboard() {
    return this.request<any>('/reports/dashboard');
  }

  async getOccupancy(days = 7) {
    return this.request<any[]>(`/reports/occupancy?days=${days}`);
  }

  async getRevenue() {
    return this.request<any[]>('/reports/revenue');
  }

  async getBookingSources() {
    return this.request<any[]>('/reports/booking-sources');
  }

  async getRooms(params?: Record<string, QueryValue>) {
    return this.request<any>(`/rooms${buildQuery(params)}`);
  }

  async getRoomTypes(params?: Record<string, QueryValue>) {
    return this.request<any[]>(`/rooms/types${buildQuery(params)}`);
  }

  async updateRoomStatus(id: number, status: string) {
    return this.request<any>(`/rooms/${id}/status`, { method: 'PATCH', body: { status } });
  }

  async getBookings(params?: Record<string, QueryValue>) {
    return this.request<any>(`/bookings${buildQuery(params)}`);
  }

  async getBooking(id: number) {
    return this.request<any>(`/bookings/${id}`);
  }

  async createBooking(data: any) {
    return this.request<any>('/bookings', { method: 'POST', body: data });
  }

  async updateBooking(id: number, data: any) {
    return this.request<any>(`/bookings/${id}`, { method: 'PUT', body: data });
  }

  async recordBookingPayment(id: number, data: any) {
    return this.request<any>(`/bookings/${id}/payment`, { method: 'PATCH', body: data });
  }

  async updateBookingStatus(id: number, status: string, data?: Record<string, unknown>) {
    return this.request<any>(`/bookings/${id}/status`, { method: 'PATCH', body: { status, ...(data || {}) } });
  }

  async getTodayArrivals() {
    return this.request<any[]>('/bookings/arrivals/today');
  }

  async getTodayCheckouts() {
    return this.request<any[]>('/bookings/checkouts/today');
  }

  async getRestaurantTables(params?: Record<string, QueryValue>) {
    return this.request<any[]>(`/restaurant/tables${buildQuery(params)}`);
  }

  async createRestaurantTable(data: any) {
    return this.request<any>('/restaurant/tables', { method: 'POST', body: data });
  }

  async updateRestaurantTable(id: number, data: any) {
    return this.request<any>(`/restaurant/tables/${id}`, { method: 'PATCH', body: data });
  }

  async deleteRestaurantTable(id: number) {
    return this.request<void>(`/restaurant/tables/${id}`, { method: 'DELETE' });
  }

  async getRestaurantCategories(params?: Record<string, QueryValue>) {
    return this.request<any[]>(`/restaurant/categories${buildQuery(params)}`);
  }

  async createRestaurantCategory(data: any) {
    return this.request<any>('/restaurant/categories', { method: 'POST', body: data });
  }

  async updateRestaurantCategory(id: number, data: any) {
    return this.request<any>(`/restaurant/categories/${id}`, { method: 'PATCH', body: data });
  }

  async deleteRestaurantCategory(id: number) {
    return this.request<void>(`/restaurant/categories/${id}`, { method: 'DELETE' });
  }

  async getRestaurantMenu(params?: Record<string, QueryValue>) {
    return this.request<any[]>(`/restaurant/menu${buildQuery(params)}`);
  }

  async getRestaurantSettings() {
    return this.request<any>('/restaurant/settings');
  }

  async updateRestaurantSettings(data: any) {
    return this.request<any>('/restaurant/settings', { method: 'PATCH', body: data });
  }

  async getRestaurantPublicMenu() {
    return this.publicRequest<any>('/restaurant/public-menu');
  }

  async createRestaurantMenuItem(data: any) {
    return this.request<any>('/restaurant/menu', { method: 'POST', body: data });
  }

  async updateRestaurantMenuItem(id: number, data: any) {
    return this.request<any>(`/restaurant/menu/${id}`, { method: 'PUT', body: data });
  }

  async getRestaurantOrders(params?: Record<string, QueryValue>) {
    return this.request<any>(`/restaurant/orders${buildQuery(params)}`);
  }

  async getRestaurantOrder(id: number) {
    return this.request<any>(`/restaurant/orders/${id}`);
  }

  async createRestaurantOrder(data: any) {
    return this.request<any>('/restaurant/orders', { method: 'POST', body: data });
  }

  async addRestaurantOrderItems(id: number, data: any) {
    return this.request<any>(`/restaurant/orders/${id}/items`, { method: 'POST', body: data });
  }

  async releaseRestaurantOrder(id: number) {
    return this.request<any>(`/restaurant/orders/${id}/release`, { method: 'PATCH' });
  }

  async updateRestaurantOrderStatus(id: number, status: string) {
    return this.request<any>(`/restaurant/orders/${id}/status`, { method: 'PATCH', body: { status } });
  }

  async updateRestaurantOrderItemStatus(orderId: number, itemId: number, status: string) {
    return this.request<any>(`/restaurant/orders/${orderId}/items/${itemId}/status`, { method: 'PATCH', body: { status } });
  }

  async updateRestaurantPayment(id: number, data: any) {
    return this.request<any>(`/restaurant/orders/${id}/payment`, { method: 'PATCH', body: data });
  }

  async requestRestaurantVoid(id: number, reason: string) {
    return this.request<any>(`/restaurant/orders/${id}/void-request`, { method: 'PATCH', body: { reason } });
  }

  async approveRestaurantVoid(id: number, reason: string) {
    return this.request<any>(`/restaurant/orders/${id}/void-approve`, { method: 'PATCH', body: { reason } });
  }

  async refundRestaurantOrder(id: number, data: any) {
    return this.request<any>(`/restaurant/orders/${id}/refund`, { method: 'POST', body: data });
  }

  async getKitchenOrders() {
    return this.request<any[]>('/restaurant/kitchen');
  }

  async getMealPlans() {
    return this.request<any[]>('/restaurant/meal-plans');
  }

  async getUsers(params?: Record<string, QueryValue>) {
    return this.request<any>(`/admin/users${buildQuery(params)}`);
  }

  async createUser(data: any) {
    return this.request<any>('/admin/users', { method: 'POST', body: data });
  }

  async updateUser(id: number, data: any) {
    return this.request<any>(`/admin/users/${id}`, { method: 'PUT', body: data });
  }

  async updateUserStatus(id: number, data: { status: string; roleId?: number }) {
    return this.request<any>(`/admin/users/${id}/status`, { method: 'PATCH', body: data });
  }

  async getRoles() {
    return this.request<any[]>('/admin/roles');
  }

  async health() {
    return this.request<any>('/health');
  }
}

export const api = new ApiClient();




