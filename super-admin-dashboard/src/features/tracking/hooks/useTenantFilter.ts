import { useState, useMemo } from 'react';
import type { BusMarkerData, TenantInfo } from '../types';

interface UseTenantFilterResult {
  tenantFilter: string;
  setTenantFilter: (id: string) => void;
  tripFilter: string;
  setTripFilter: (id: string) => void;
  filteredBuses: BusMarkerData[];
  uniqueTenants: TenantInfo[];
  uniqueTrips: string[];
}

export function useTenantFilter(
  buses: BusMarkerData[],
): UseTenantFilterResult {
  const [tenantFilter, setTenantFilter] = useState('all');
  const [tripFilter, setTripFilter] = useState('all');

  const uniqueTenants = useMemo(() => {
    const map = new Map<string, TenantInfo>();
    buses.forEach((b) => {
      if (!map.has(b.tenantId)) {
        map.set(b.tenantId, {
          id: b.tenantId,
          companyName: b.tenantName,
          activeBuses: 0,
        });
      }
      map.get(b.tenantId)!.activeBuses++;
    });
    return Array.from(map.values());
  }, [buses]);

  const uniqueTrips = useMemo(() => {
    return [...new Set(buses.filter((b) => b.tripId).map((b) => b.tripId))];
  }, [buses]);

  const filteredBuses = useMemo(() => {
    let result = buses;
    if (tenantFilter !== 'all') {
      result = result.filter((b) => b.tenantId === tenantFilter);
    }
    if (tripFilter !== 'all') {
      result = result.filter((b) => b.tripId === tripFilter);
    }
    return result;
  }, [buses, tenantFilter, tripFilter]);

  return {
    tenantFilter,
    setTenantFilter,
    tripFilter,
    setTripFilter,
    filteredBuses,
    uniqueTenants,
    uniqueTrips,
  };
}
