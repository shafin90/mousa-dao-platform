import { api } from '../../../api/endpoints';
import type { BusMarkerData, TenantInfo, TripData } from '../types';

const MAX_RETRIES = 3;

async function withRetry<T>(fn: () => Promise<T>, signal?: AbortSignal): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (signal?.aborted) throw err;
      if (attempt < MAX_RETRIES) {
        const delay = Math.min(1000 * Math.pow(2, attempt), 8000);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }
  throw lastError;
}

function toBusMarkerData(bus: any): BusMarkerData {
  const id = bus.busId || bus.id || '';
  return {
    id,
    busNumber: bus.busNumber || bus.busId || id,
    tenantId: bus.tenantId || bus.companyId || '',
    tenantName: bus.tenantName || bus.companyName || '',
    latitude: bus.latitude,
    longitude: bus.longitude,
    speed: bus.speed || 0,
    heading: bus.heading || 0,
    tripId: bus.tripId || '',
    routeName: bus.routeName || '',
    driverName: bus.driverName || '',
    status: bus.status || 'on_trip',
    lastUpdated: bus.updatedAt || bus.lastUpdated || new Date().toISOString(),
  };
}

export const trackingService = {
  async getActiveBuses(signal?: AbortSignal): Promise<BusMarkerData[]> {
    const buses = await withRetry(() => api.getGpsLive(), signal);
    return buses.filter((b: any) => b.status !== 'offline').map(toBusMarkerData);
  },

  async getAllBuses(signal?: AbortSignal): Promise<BusMarkerData[]> {
    const buses = await withRetry(() => api.getGpsLive(), signal);
    return buses.map(toBusMarkerData);
  },

  async getTenants(signal?: AbortSignal): Promise<TenantInfo[]> {
    const buses = await withRetry(() => api.getGpsLive(), signal);
    const tenantMap = new Map<string, TenantInfo>();
    buses.forEach((b: any) => {
      const tenantId = b.tenantId || b.companyId || '';
      const tenantName = b.tenantName || b.companyName || '';
      if (!tenantMap.has(tenantId)) {
        tenantMap.set(tenantId, {
          id: tenantId,
          companyName: tenantName,
          activeBuses: 0,
        });
      }
      if (b.status !== 'offline') {
        tenantMap.get(tenantId)!.activeBuses++;
      }
    });
    return Array.from(tenantMap.values());
  },

  async getActiveTrips(signal?: AbortSignal): Promise<TripData[]> {
    const buses = await withRetry(() => api.getGpsLive(), signal);
    const tripMap = new Map<string, TripData>();
    buses
      .filter((b: any) => b.status === 'on_trip')
      .forEach((b: any) => {
        const tripId = b.tripId || '';
        if (!tripMap.has(tripId)) {
          tripMap.set(tripId, {
            id: tripId,
            companyId: b.tenantId || b.companyId || '',
            routeName: b.routeName || '',
            busNumber: b.busNumber || b.busId || '',
            driverName: b.driverName || '',
            status: 'active',
            startTime: new Date(
              Date.now() - Math.random() * 3600000,
            ).toISOString(),
          });
        }
      });
    return Array.from(tripMap.values());
  },
};
