export interface BusLocation {
  companyId: string;
  busId: string;
  tripId: string;
  latitude: number;
  longitude: number;
  speed: number;
  heading: number;
  updatedAt: string;
}

export interface TripData {
  id: string;
  companyId: string;
  routeName: string;
  busNumber: string;
  driverName: string;
  status: 'active' | 'completed' | 'cancelled';
  startTime: string;
}

export interface TenantInfo {
  id: string;
  companyName: string;
  activeBuses: number;
}

export interface BusMarkerData {
  id: string;
  busNumber: string;
  tenantId: string;
  tenantName: string;
  latitude: number;
  longitude: number;
  speed: number;
  heading: number;
  tripId: string;
  routeName: string;
  driverName: string;
  status: string;
  lastUpdated: string;
}
