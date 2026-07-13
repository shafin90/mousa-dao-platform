import apiClient from './client';
import type { Tenant, Booking, Payment, DashboardKpi, RevenueData, BookingTrend, SystemStatus } from '../types';

export const api = {
  getDashboardKpi: async (): Promise<DashboardKpi> => {
    const response = await apiClient.get('/analytics/dashboard');
    const d = response.data.data;
    return {
      totalTenants: d.totalUsers || 0,
      totalRevenue: d.totalRevenue || 0,
      totalBookings: d.totalBookings || 0,
      activeTrips: d.totalTrips || 0,
      activeBuses: d.activeBuses || 0,
      systemStatus: 'healthy',
    };
  },

  getRevenue: async (period: 'daily' | 'monthly' = 'monthly'): Promise<RevenueData[]> => {
    const now = new Date();
    const startDate = period === 'daily'
      ? new Date(now.getTime() - 30 * 86400000).toISOString().slice(0, 10)
      : new Date(now.getTime() - 365 * 86400000).toISOString().slice(0, 10);
    const endDate = now.toISOString().slice(0, 10);
    const response = await apiClient.get('/analytics/revenue', { params: { startDate, endDate } });
    const items = response.data.data.dailyRevenue || [];
    return items.map((i: any) => ({ date: i._id, amount: i.dailyRevenue }));
  },

  getBookingTrends: async (): Promise<BookingTrend[]> => {
    const response = await apiClient.get('/analytics/booking-trends');
    const items = response.data.data || [];
    return items.map((i: any) => ({ date: i._id, count: i.count }));
  },

  getTenants: async (params?: { page?: number; search?: string }): Promise<{ data: Tenant[]; total: number }> => {
    const response = await apiClient.get('/tenants', { params });
    const body = response.data.data;
    const items = (body.tenants || body || []).map((t: any) => ({
      id: t._id || t.id,
      companyName: t.name || '',
      plan: t.plan || 'basic',
      status: t.status || 'active',
      totalRevenue: t.totalRevenue || 0,
      activeBuses: t.activeBuses || 0,
      createdAt: t.createdAt || '',
      email: t.email || '',
      phone: t.phone || '',
      totalBookings: t.totalBookings || 0,
    }));
    return { data: items, total: body.total || items.length };
  },

  getTenant: async (id: string): Promise<Tenant> => {
    const response = await apiClient.get(`/tenants/${id}`);
    const t = response.data.data;
    return {
      id: t._id || t.id,
      companyName: t.name || '',
      plan: t.plan || 'basic',
      status: t.status || 'active',
      totalRevenue: t.totalRevenue || 0,
      activeBuses: t.activeBuses || 0,
      createdAt: t.createdAt || '',
      email: t.email || '',
      phone: t.phone || '',
      totalBookings: t.totalBookings || 0,
    };
  },

  getTenantUsage: async (_id: string): Promise<null> => null,

  createTenant: async (data: Partial<Tenant>): Promise<Tenant> => {
    const response = await apiClient.post('/tenants', data);
    const t = response.data.data;
    return {
      id: t._id || t.id,
      companyName: t.name || '',
      plan: t.plan || 'basic',
      status: t.status || 'active',
      totalRevenue: 0,
      activeBuses: 0,
      createdAt: t.createdAt || '',
      email: t.email || '',
      phone: t.phone || '',
      totalBookings: 0,
    };
  },

  updateTenantStatus: async (id: string, status: 'active' | 'suspended'): Promise<Tenant> => {
    const response = status === 'suspended'
      ? await apiClient.patch(`/tenants/${id}/suspend`)
      : await apiClient.patch(`/tenants/${id}/activate`);
    const t = response.data.data;
    return {
      id: t._id || t.id,
      companyName: t.name || '',
      plan: t.plan || 'basic',
      status: t.status || 'active',
      totalRevenue: 0,
      activeBuses: 0,
      createdAt: t.createdAt || '',
      email: t.email || '',
      phone: t.phone || '',
      totalBookings: 0,
    };
  },

  getGpsLive: async (): Promise<any[]> => {
    const response = await apiClient.get('/tracking/active-buses');
    return (response.data.data || []).map((b: any) => ({
      id: b._id || b.id,
      busNumber: b.busId?.busNumber || '',
      tenantId: 'default',
      tenantName: 'Main Operator',
      latitude: b.latitude || 0,
      longitude: b.longitude || 0,
      speed: b.speed || 0,
      heading: b.heading || 0,
      tripId: typeof b.tripId === 'object' ? b.tripId._id : b.tripId || '',
      routeName: '',
      driverName: '',
      status: b.speed > 0 ? 'on_trip' : 'idle',
      lastUpdated: b.updatedAt || new Date().toISOString(),
    }));
  },

  getBookings: async (params?: { page?: number; tenantId?: string; date?: string; status?: string }): Promise<{ data: Booking[]; total: number }> => {
    const response = await apiClient.get('/bookings', { params });
    const items = (response.data.data || []).map((b: any) => ({
      id: b._id || b.id,
      tenantId: '',
      tenantName: '',
      customerName: b.customer || b.userId?.profile?.firstName + ' ' + b.userId?.profile?.lastName || '',
      route: b.route || '',
      date: b.tripId?.date || b.date || '',
      status: b.status || 'confirmed',
      amount: b.totalAmount || 0,
      seatNumber: (b.seats || []).join(', '),
    }));
    const total = response.data.pagination?.total || response.data.data?.length || items.length;
    return { data: items, total };
  },

  getBooking: async (id: string): Promise<Booking> => {
    const response = await apiClient.get(`/bookings/${id}`);
    const b = response.data.data;
    return {
      id: b._id || b.id,
      tenantId: '',
      tenantName: '',
      customerName: '',
      route: '',
      date: b.date || '',
      status: b.status || 'confirmed',
      amount: b.totalAmount || 0,
      seatNumber: '',
    };
  },

  getPayments: async (params?: { page?: number; status?: string }): Promise<{ data: Payment[]; total: number }> => {
    const response = await apiClient.get('/payments', { params });
    const items = (response.data.data || []).map((p: any) => ({
      id: p._id || p.id,
      tenantId: '',
      tenantName: '',
      amount: p.amount || 0,
      fee: 0,
      netAmount: p.amount || 0,
      status: p.status || 'pending',
      method: p.method || '',
      createdAt: p.createdAt || '',
      bookingId: p.bookingId || '',
    }));
    const total = response.data.pagination?.total || items.length;
    return { data: items, total };
  },

  getSystemStatus: async (): Promise<SystemStatus> => {
    try {
      const response = await apiClient.get('/system-status');
      return response.data.data;
    } catch (err: any) {
      if (err.response?.status === 404) {
        return {
          apiUptime: 0,
          activeWebSocketConnections: 0,
          rabbitMQStatus: 'degraded',
          errorLogs: [],
          lastChecked: new Date().toISOString(),
        };
      }
      throw err;
    }
  },
};
