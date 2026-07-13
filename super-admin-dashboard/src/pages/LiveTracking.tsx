import { useState, useCallback } from 'react';
import MapView from '../features/tracking/components/MapView';
import SidebarFilters from '../features/tracking/components/SidebarFilters';
import { useLiveTracking } from '../features/tracking/hooks/useLiveTracking';
import { useTenantFilter } from '../features/tracking/hooks/useTenantFilter';
import type { BusMarkerData } from '../features/tracking/types';

export default function LiveTracking() {
  const { buses, isConnected, loading, error } = useLiveTracking();
  const {
    tenantFilter,
    setTenantFilter,
    tripFilter,
    setTripFilter,
    filteredBuses,
    uniqueTenants,
    uniqueTrips,
  } = useTenantFilter(buses);

  const [selectedBus, setSelectedBus] = useState<BusMarkerData | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleBusSelect = useCallback((bus: BusMarkerData) => {
    setSelectedBus((prev) => (prev?.id === bus.id ? null : bus));
  }, []);

  if (error) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="text-center p-8 bg-white rounded-xl border border-card-border">
          <div className="text-red-500 text-2xl mb-2">!</div>
          <p className="text-text-secondary text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (loading && buses.length === 0) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="flex items-center gap-2 text-sm text-text-secondary">
          <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          Loading tracking data...
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      <div
        className={`${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } fixed lg:relative lg:translate-x-0 z-20 transition-transform duration-200 ease-in-out`}
      >
        <SidebarFilters
          tenants={uniqueTenants}
          trips={uniqueTrips}
          buses={buses}
          filteredBuses={filteredBuses}
          tenantFilter={tenantFilter}
          tripFilter={tripFilter}
          onTenantFilterChange={setTenantFilter}
          onTripFilterChange={setTripFilter}
          onBusSelect={handleBusSelect}
          selectedBusId={selectedBus?.id || null}
          isConnected={isConnected}
          onClose={() => setSidebarOpen(false)}
        />
      </div>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-10 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex-1 min-w-0 relative">
        {!sidebarOpen && (
          <button
            onClick={() => setSidebarOpen(true)}
            className="absolute top-3 left-3 z-10 bg-white border border-card-border rounded-md px-2.5 py-1.5 text-xs font-medium text-text-primary shadow-sm hover:bg-gray-50"
          >
            Show List
          </button>
        )}
        <MapView
          buses={filteredBuses}
          selectedBusId={selectedBus?.id || null}
          onBusSelect={handleBusSelect}
        />
      </div>
    </div>
  );
}
