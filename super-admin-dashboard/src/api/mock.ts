import type {
  Tenant, Booking, Payment, DashboardKpi, RevenueData,
  BookingTrend, GpsBus, SystemStatus, TenantUsageStats,
} from '../types';

const now = Date.now();
const day = 86400000;

const tenants: Tenant[] = [
  { id: 't1', companyName: 'City Express Bus', plan: 'enterprise', status: 'active', totalRevenue: 245000, activeBuses: 45, createdAt: new Date(now - 365 * day).toISOString(), email: 'admin@cityexpress.com', phone: '+1-555-0101', totalBookings: 15200 },
  { id: 't2', companyName: 'GreenLine Coaches', plan: 'professional', status: 'active', totalRevenue: 128000, activeBuses: 22, createdAt: new Date(now - 240 * day).toISOString(), email: 'ops@greenline.com', phone: '+1-555-0102', totalBookings: 8900 },
  { id: 't3', companyName: 'TransNational Travels', plan: 'enterprise', status: 'active', totalRevenue: 312000, activeBuses: 58, createdAt: new Date(now - 540 * day).toISOString(), email: 'ceo@tnational.com', phone: '+1-555-0103', totalBookings: 21400 },
  { id: 't4', companyName: 'Hillside Transport', plan: 'basic', status: 'active', totalRevenue: 42000, activeBuses: 8, createdAt: new Date(now - 90 * day).toISOString(), email: 'info@hillside.com', phone: '+1-555-0104', totalBookings: 3100 },
  { id: 't5', companyName: 'MetroBus Services', plan: 'professional', status: 'suspended', totalRevenue: 87000, activeBuses: 15, createdAt: new Date(now - 180 * day).toISOString(), email: 'contact@metrobus.com', phone: '+1-555-0105', totalBookings: 6200 },
  { id: 't6', companyName: 'SwiftWay Bus Lines', plan: 'basic', status: 'pending', totalRevenue: 0, activeBuses: 0, createdAt: new Date(now - 7 * day).toISOString(), email: 'hello@swiftway.com', phone: '+1-555-0106', totalBookings: 0 },
  { id: 't7', companyName: 'EagleRide', plan: 'professional', status: 'active', totalRevenue: 156000, activeBuses: 28, createdAt: new Date(now - 300 * day).toISOString(), email: 'support@eagleride.com', phone: '+1-555-0107', totalBookings: 10700 },
  { id: 't8', companyName: 'Pioneer Bus Corp', plan: 'enterprise', status: 'active', totalRevenue: 278000, activeBuses: 52, createdAt: new Date(now - 420 * day).toISOString(), email: 'admin@pioneerbus.com', phone: '+1-555-0108', totalBookings: 18900 },
];

const generateRevenueData = (days: number): RevenueData[] =>
  Array.from({ length: days }, (_, i) => ({
    date: new Date(now - (days - 1 - i) * day).toISOString().slice(0, 10),
    amount: Math.round(15000 + Math.random() * 35000),
  }));

const generateBookingTrends = (days: number): BookingTrend[] =>
  Array.from({ length: days }, (_, i) => ({
    date: new Date(now - (days - 1 - i) * day).toISOString().slice(0, 10),
    count: Math.round(200 + Math.random() * 600),
  }));

const generateBuses = (): GpsBus[] => {
  const baseLat = 40.7128;
  const baseLng = -74.006;
  const routes = ['Downtown Express', 'Airport Shuttle', 'Cross-Town', 'Suburban Link', 'Coastal Run'];
  return tenants.filter(t => t.status === 'active').flatMap((tenant) =>
    Array.from({ length: Math.min(tenant.activeBuses, 4) }, (_, i) => ({
      id: `bus-${tenant.id}-${i}`,
      tenantId: tenant.id,
      tenantName: tenant.companyName,
      busNumber: `${tenant.companyName.slice(0, 3).toUpperCase()}-${100 + i}`,
      driverName: ['John Smith', 'Jane Doe', 'Mike Ross', 'Sarah Lee'][i % 4],
      latitude: baseLat + (Math.random() - 0.5) * 0.2,
      longitude: baseLng + (Math.random() - 0.5) * 0.2,
      speed: Math.round(20 + Math.random() * 60),
      heading: Math.round(Math.random() * 360),
      tripId: `trip-${1000 + i}`,
      routeName: routes[i % routes.length],
      status: ['on_trip', 'on_trip', 'idle', 'offline'][Math.floor(Math.random() * 4)] as GpsBus['status'],
      lastUpdated: new Date().toISOString(),
    })),
  );
};

const bookings: Booking[] = Array.from({ length: 50 }, (_, i) => {
  const tenant = tenants[i % tenants.length];
  return {
    id: `bkg-${1000 + i}`,
    tenantId: tenant.id,
    tenantName: tenant.companyName,
    customerName: ['Alice Johnson', 'Bob Williams', 'Carol Davis', 'David Brown', 'Eva Martinez', 'Frank Wilson', 'Grace Lee', 'Henry Taylor'][i % 8],
    route: ['NYC-BOS', 'NYC-PHL', 'NYC-DC', 'BOS-NYC', 'PHL-NYC'][i % 5],
    date: new Date(now - (50 - i) * day).toISOString(),
    status: (['confirmed', 'completed', 'completed', 'cancelled', 'refunded'] as const)[i % 5],
    amount: Math.round(25 + Math.random() * 75),
    seatNumber: `${10 + Math.floor(Math.random() * 40)}${['A', 'B', 'C', 'D'][i % 4]}`,
  };
});

const payments: Payment[] = Array.from({ length: 50 }, (_, i) => {
  const tenant = tenants[i % tenants.length];
  return {
    id: `pay-${1000 + i}`,
    tenantId: tenant.id,
    tenantName: tenant.companyName,
    amount: Math.round(25 + Math.random() * 75),
    fee: Math.round(1 + Math.random() * 3),
    netAmount: 0,
    status: (['successful', 'successful', 'successful', 'pending', 'failed', 'refunded'] as const)[i % 6],
    method: ['credit_card', 'debit_card', 'cash', 'wallet'][i % 4],
    createdAt: new Date(now - (50 - i) * day).toISOString(),
    bookingId: `bkg-${1000 + i}`,
  };
});
payments.forEach(p => { p.netAmount = p.amount - p.fee; });

const systemStatus: SystemStatus = {
  apiUptime: 99.97,
  activeWebSocketConnections: 42,
  rabbitMQStatus: 'healthy',
  errorLogs: [
    { id: 'e1', message: 'Booking service timeout', severity: 'warning', timestamp: new Date(now - 3600000).toISOString(), source: 'booking-service' },
    { id: 'e2', message: 'Payment gateway delayed response', severity: 'warning', timestamp: new Date(now - 7200000).toISOString(), source: 'payment-service' },
    { id: 'e3', message: 'GPS batch update failed', severity: 'error', timestamp: new Date(now - 14400000).toISOString(), source: 'gps-service' },
    { id: 'e4', message: 'Rate limit exceeded for tenant t2', severity: 'info', timestamp: new Date(now - 21600000).toISOString(), source: 'api-gateway' },
    { id: 'e5', message: 'Database connection pool warning', severity: 'warning', timestamp: new Date(now - 28800000).toISOString(), source: 'db-main' },
  ],
  lastChecked: new Date().toISOString(),
};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const mockApi = {
  getDashboardKpi: async (): Promise<DashboardKpi> => {
    await delay(300);
    const activeTenants = tenants.filter(t => t.status === 'active');
    return {
      totalTenants: tenants.length,
      totalRevenue: tenants.reduce((s, t) => s + t.totalRevenue, 0),
      totalBookings: tenants.reduce((s, t) => s + t.totalBookings, 0),
      activeTrips: activeTenants.reduce((s, t) => s + Math.min(t.activeBuses, Math.round(t.activeBuses * 0.7)), 0),
      activeBuses: activeTenants.reduce((s, t) => s + t.activeBuses, 0),
      systemStatus: 99.97 > 99.5 ? 'healthy' : 'degraded',
    };
  },

  getRevenue: async (period?: string): Promise<RevenueData[]> => {
    await delay(300);
    return generateRevenueData(period === 'daily' ? 30 : 12);
  },

  getBookingTrends: async (period?: string): Promise<BookingTrend[]> => {
    await delay(300);
    return generateBookingTrends(period === 'daily' ? 30 : 12);
  },

  getTenants: async (params?: { page?: number; search?: string }): Promise<{ data: Tenant[]; total: number }> => {
    await delay(300);
    let filtered = [...tenants];
    if (params?.search) {
      const q = params.search.toLowerCase();
      filtered = filtered.filter(t => t.companyName.toLowerCase().includes(q));
    }
    const page = params?.page || 1;
    const pageSize = 20;
    const start = (page - 1) * pageSize;
    return { data: filtered.slice(start, start + pageSize), total: filtered.length };
  },

  getTenant: async (id: string): Promise<Tenant> => {
    await delay(200);
    const t = tenants.find(t => t.id === id);
    if (!t) throw new Error('Tenant not found');
    return t;
  },

  getTenantUsage: async (_id: string): Promise<TenantUsageStats> => {
    await delay(200);
    return {
      totalBookings: Math.round(2000 + Math.random() * 15000),
      totalRevenue: Math.round(50000 + Math.random() * 250000),
      activeBuses: Math.round(5 + Math.random() * 50),
      activeTrips: Math.round(3 + Math.random() * 30),
      monthlyGrowth: Math.round((Math.random() * 20 - 5) * 10) / 10,
      每日Revenue: generateRevenueData(30),
    };
  },

  createTenant: async (data: Partial<Tenant>): Promise<Tenant> => {
    await delay(400);
    const t: Tenant = {
      id: `t${tenants.length + 1}`,
      companyName: data.companyName || '',
      plan: data.plan || 'basic',
      status: 'pending',
      totalRevenue: 0,
      activeBuses: 0,
      createdAt: new Date().toISOString(),
      email: data.email || '',
      phone: data.phone || '',
      totalBookings: 0,
    };
    tenants.push(t);
    return t;
  },

  updateTenantStatus: async (id: string, status: 'active' | 'suspended'): Promise<Tenant> => {
    await delay(300);
    const t = tenants.find(t => t.id === id);
    if (!t) throw new Error('Tenant not found');
    t.status = status;
    return t;
  },

  getGpsLive: async (): Promise<GpsBus[]> => {
    await delay(200);
    return generateBuses();
  },

  getBookings: async (params?: { page?: number; tenantId?: string; date?: string; status?: string }): Promise<{ data: Booking[]; total: number }> => {
    await delay(300);
    let filtered = [...bookings];
    if (params?.tenantId) filtered = filtered.filter(b => b.tenantId === params.tenantId);
    if (params?.status) filtered = filtered.filter(b => b.status === params.status);
    if (params?.date) filtered = filtered.filter(b => b.date.slice(0, 10) === params.date);
    const page = params?.page || 1;
    const pageSize = 20;
    const start = (page - 1) * pageSize;
    return { data: filtered.slice(start, start + pageSize), total: filtered.length };
  },

  getBooking: async (id: string): Promise<Booking> => {
    await delay(200);
    const b = bookings.find(b => b.id === id);
    if (!b) throw new Error('Booking not found');
    return b;
  },

  getPayments: async (params?: { page?: number; status?: string }): Promise<{ data: Payment[]; total: number }> => {
    await delay(300);
    let filtered = [...payments];
    if (params?.status) filtered = filtered.filter(p => p.status === params.status);
    const page = params?.page || 1;
    const pageSize = 20;
    const start = (page - 1) * pageSize;
    return { data: filtered.slice(start, start + pageSize), total: filtered.length };
  },

  getSystemStatus: async (): Promise<SystemStatus> => {
    await delay(200);
    return { ...systemStatus, activeWebSocketConnections: Math.round(40 + Math.random() * 10) };
  },
};

export const isMockMode = () => !import.meta.env.VITE_API_URL;
