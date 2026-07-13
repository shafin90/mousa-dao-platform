import { useState, useEffect, useRef, useCallback } from 'react';
import { trackingSocket } from '../services/socketService';
import { trackingService } from '../services/trackingService';
import type { BusMarkerData } from '../types';

const STALE_BUS_MS = 5 * 60 * 1000;
const STALE_CHECK_INTERVAL_MS = 60 * 1000;

interface UseLiveTrackingResult {
  buses: BusMarkerData[];
  isConnected: boolean;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useLiveTracking(): UseLiveTrackingResult {
  const [buses, setBuses] = useState<BusMarkerData[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const busMapRef = useRef(new Map<string, BusMarkerData>());
  const prevJsonRef = useRef('');
  const refreshPendingRef = useRef(false);

  const commitBuses = useCallback(() => {
    const arr = Array.from(busMapRef.current.values());
    const json = JSON.stringify(arr, ['id', 'latitude', 'longitude', 'speed', 'heading', 'lastUpdated']);
    if (json !== prevJsonRef.current) {
      prevJsonRef.current = json;
      setBuses(arr);
    }
  }, []);

  const refresh = useCallback(async () => {
    if (refreshPendingRef.current) return;
    refreshPendingRef.current = true;
    try {
      setLoading(true);
      setError(null);
      const data = await trackingService.getActiveBuses();
      busMapRef.current.clear();
      data.forEach((b) => busMapRef.current.set(b.id, b));
      commitBuses();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load tracking data',
      );
    } finally {
      setLoading(false);
      refreshPendingRef.current = false;
    }
  }, [commitBuses]);

  const removeStaleBuses = useCallback(() => {
    const cutoff = Date.now() - STALE_BUS_MS;
    let changed = false;
    busMapRef.current.forEach((bus, id) => {
      const ts = new Date(bus.lastUpdated).getTime();
      if (ts < cutoff) {
        busMapRef.current.delete(id);
        changed = true;
      }
    });
    if (changed) commitBuses();
  }, [commitBuses]);

  useEffect(() => {
    refresh();
    trackingSocket.connect();

    const unsubConnection =
      trackingSocket.onConnectionChange(setIsConnected);

    const unsubGps = trackingSocket.subscribeToGps((update) => {
      const existing = busMapRef.current.get(update.busId);

      if (existing) {
        const updated: BusMarkerData = {
          ...existing,
          latitude: update.latitude,
          longitude: update.longitude,
          speed: update.speed,
          heading: update.heading,
          lastUpdated: update.updatedAt,
        };
        busMapRef.current.set(update.busId, updated);
      } else {
        const minimal: BusMarkerData = {
          id: update.busId,
          busNumber: update.busId,
          tenantId: update.companyId,
          tenantName: '',
          latitude: update.latitude,
          longitude: update.longitude,
          speed: update.speed,
          heading: update.heading,
          tripId: update.tripId,
          routeName: '',
          driverName: '',
          status: 'on_trip',
          lastUpdated: update.updatedAt,
        };
        busMapRef.current.set(update.busId, minimal);
        refresh();
      }

      commitBuses();
    });

    const staleTimer = setInterval(removeStaleBuses, STALE_CHECK_INTERVAL_MS);

    return () => {
      unsubConnection();
      unsubGps();
      trackingSocket.disconnect();
      clearInterval(staleTimer);
    };
  }, [refresh, commitBuses, removeStaleBuses]);

  return { buses, isConnected, loading, error, refresh };
}
