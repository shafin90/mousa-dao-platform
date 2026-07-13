import { useMemo, memo } from 'react';
import type { BusMarkerData, TenantInfo } from '../types';

interface SidebarFiltersProps {
  tenants: TenantInfo[];
  trips: string[];
  buses: BusMarkerData[];
  filteredBuses: BusMarkerData[];
  tenantFilter: string;
  tripFilter: string;
  onTenantFilterChange: (id: string) => void;
  onTripFilterChange: (id: string) => void;
  onBusSelect: (bus: BusMarkerData) => void;
  selectedBusId: string | null;
  isConnected: boolean;
  onClose?: () => void;
}

function SidebarFilters({
  tenants,
  trips,
  buses,
  filteredBuses,
  tenantFilter,
  tripFilter,
  onTenantFilterChange,
  onTripFilterChange,
  onBusSelect,
  selectedBusId,
  isConnected,
  onClose,
}: SidebarFiltersProps) {
  const stats = useMemo(
    () => ({
      total: buses.length,
      moving: buses.filter((b) => b.status === 'on_trip').length,
      idle: buses.filter((b) => b.status === 'idle').length,
      showing: filteredBuses.length,
    }),
    [buses, filteredBuses],
  );

  return (
    <div className="w-72 md:w-56 lg:w-72 bg-white border-r border-card-border flex flex-col h-full shrink-0 shadow-lg lg:shadow-none">
      <div className="px-4 py-3 border-b border-card-border">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-sm font-semibold text-text-primary">
            Live Tracking
          </h2>
          <div className="flex items-center gap-1.5">
            <span
              className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                isConnected
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-red-50 text-red-700 border-red-200'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isConnected ? 'bg-emerald-500' : 'bg-red-500'
                }`}
              />
              {isConnected ? 'Live' : 'Offline'}
            </span>
            {onClose && (
              <button
                onClick={onClose}
                className="lg:hidden p-1 rounded-md hover:bg-gray-100 text-text-secondary"
                aria-label="Close sidebar"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            )}
          </div>
        </div>
        <div className="flex gap-3 text-xs text-text-secondary">
          <span>{stats.moving} moving</span>
          <span>{stats.idle} idle</span>
          <span>{stats.showing} shown</span>
        </div>
      </div>

      <div className="px-4 py-3 border-b border-card-border space-y-2">
        <div>
          <label className="text-[10px] font-medium uppercase tracking-wider text-text-secondary">
            Company
          </label>
          <select
            value={tenantFilter}
            onChange={(e) => onTenantFilterChange(e.target.value)}
            className="mt-1 w-full px-2 py-1.5 text-xs border border-card-border rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
          >
            <option value="all">
              All Companies ({stats.total})
            </option>
            {tenants.map((t) => (
              <option key={t.id} value={t.id}>
                {t.companyName} ({t.activeBuses})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-[10px] font-medium uppercase tracking-wider text-text-secondary">
            Trip
          </label>
          <select
            value={tripFilter}
            onChange={(e) => onTripFilterChange(e.target.value)}
            className="mt-1 w-full px-2 py-1.5 text-xs border border-card-border rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
          >
            <option value="all">All Trips</option>
            {trips.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="px-4 py-2 text-[10px] font-medium uppercase tracking-wider text-text-secondary border-b border-card-border">
          Active Buses ({stats.showing})
        </div>
        <div className="divide-y divide-card-border">
          {filteredBuses.map((bus) => (
            <button
              key={bus.id}
              onClick={() => onBusSelect(bus)}
              className={`w-full text-left px-4 py-2.5 hover:bg-gray-50 transition-colors ${
                selectedBusId === bus.id
                  ? 'bg-accent-light border-l-2 border-accent'
                  : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`text-sm font-medium ${
                    selectedBusId === bus.id
                      ? 'text-accent'
                      : 'text-text-primary'
                  }`}
                >
                  {bus.busNumber}
                </span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                    bus.status === 'on_trip'
                      ? 'bg-emerald-50 text-emerald-700'
                      : bus.status === 'idle'
                        ? 'bg-amber-50 text-amber-700'
                        : 'bg-slate-50 text-slate-500'
                  }`}
                >
                  {bus.status === 'on_trip'
                    ? `${bus.speed} km/h`
                    : bus.status}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-text-secondary truncate">
                  {bus.routeName}
                </span>
                <span className="text-[10px] text-text-secondary">·</span>
                <span className="text-xs text-text-secondary truncate">
                  {bus.tenantName}
                </span>
              </div>
            </button>
          ))}
          {filteredBuses.length === 0 && (
            <div className="px-4 py-8 text-center text-xs text-text-secondary">
              No active buses found
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default memo(SidebarFilters);
