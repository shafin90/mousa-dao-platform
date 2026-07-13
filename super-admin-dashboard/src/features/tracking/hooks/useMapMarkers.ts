import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import type { BusMarkerData } from '../types';

const BUS_COLORS = [
  '#3b82f6',
  '#22c55e',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#06b6d4',
  '#ec4899',
  '#f97316',
];

function escapeHtml(str: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };
  return str.replace(/[&<>"']/g, (ch) => map[ch]);
}

function formatTime(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    const now = Date.now();
    const diff = now - d.getTime();
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    return d.toLocaleTimeString();
  } catch {
    return '—';
  }
}

function createPopupHtml(bus: BusMarkerData): string {
  const statusColor =
    bus.status === 'on_trip'
      ? '#22c55e'
      : bus.status === 'idle'
        ? '#f59e0b'
        : '#94a3b8';
  const statusLabel =
    bus.status === 'on_trip'
      ? 'Moving'
      : bus.status === 'idle'
        ? 'Idle'
        : 'Offline';
  return `
    <div style="font-family:system-ui,sans-serif;padding:4px;min-width:180px;">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
        <span style="font-weight:600;font-size:14px;color:#0f172a;">${escapeHtml(bus.busNumber)}</span>
        <span style="font-size:11px;padding:2px 8px;border-radius:999px;background:${statusColor}20;color:${statusColor};font-weight:500;border:1px solid ${statusColor}40;">
          ${statusLabel}
        </span>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px 12px;font-size:12px;">
        <span style="color:#64748b;">Driver</span>
        <span style="color:#0f172a;font-weight:500;">${escapeHtml(bus.driverName || '—')}</span>
        <span style="color:#64748b;">Speed</span>
        <span style="color:#0f172a;font-weight:500;">${bus.speed} km/h</span>
        <span style="color:#64748b;">Trip</span>
        <span style="color:#0f172a;font-weight:500;font-size:10px;">${escapeHtml(bus.tripId || '—')}</span>
        <span style="color:#64748b;">Updated</span>
        <span style="color:#0f172a;font-weight:500;">${formatTime(bus.lastUpdated)}</span>
      </div>
    </div>
  `;
}

export function useMapMarkers(
  map: maplibregl.Map | null,
  buses: BusMarkerData[],
  selectedBusId: string | null,
  onBusSelect: (bus: BusMarkerData) => void,
) {
  const markersRef = useRef<
    Map<string, { marker: maplibregl.Marker; popup: maplibregl.Popup }>
  >(new Map());
  const colorMapRef = useRef<Map<string, string>>(new Map());
  const colorIndexRef = useRef(0);
  const onBusSelectRef = useRef(onBusSelect);
  onBusSelectRef.current = onBusSelect;

  useEffect(() => {
    return () => {
      markersRef.current.forEach(({ marker, popup }) => {
        popup.remove();
        marker.remove();
      });
      markersRef.current.clear();
      colorMapRef.current.clear();
      colorIndexRef.current = 0;
    };
  }, []);

  useEffect(() => {
    if (!map || !map.loaded()) return;

    const markers = markersRef.current;
    const colorMap = colorMapRef.current;
    const currentIds = new Set(buses.map((b) => b.id));

    const staleMarkerIds: string[] = [];
    markers.forEach((_, id) => {
      if (!currentIds.has(id)) {
        staleMarkerIds.push(id);
      }
    });
    staleMarkerIds.forEach((id) => {
      const entry = markers.get(id);
      if (entry) {
        entry.popup.remove();
        entry.marker.remove();
        markers.delete(id);
      }
    });

    buses.forEach((bus) => {
      if (!colorMap.has(bus.tenantId)) {
        colorMap.set(
          bus.tenantId,
          BUS_COLORS[colorIndexRef.current % BUS_COLORS.length],
        );
        colorIndexRef.current++;
      }
    });

    buses.forEach((bus) => {
      const color = colorMap.get(bus.tenantId) || '#3b82f6';
      const existing = markers.get(bus.id);

      if (existing) {
        existing.marker.setLngLat([bus.longitude, bus.latitude]);
        existing.popup.setHTML(createPopupHtml(bus));
      } else {
        const el = document.createElement('div');
        el.style.cssText = `
          width: 36px; height: 36px; cursor: pointer;
        `;
        const heading = bus.heading || 0;
        const isSelected = bus.id === selectedBusId;
        const size = isSelected ? 14 : 10;
        el.innerHTML = `
          <svg width="36" height="36" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg">
            ${isSelected ? '<circle cx="18" cy="18" r="17" fill="none" stroke="#fff" stroke-width="3" opacity="0.9"/>' : ''}
            <circle cx="18" cy="18" r="${size}" fill="${color}" stroke="#fff" stroke-width="2"/>
            ${bus.speed > 0
              ? `<g transform="translate(18,18) rotate(${heading})">
                  <polygon points="0,-${size - 3} -${(size - 3) * 0.6},${(size - 3) * 0.4} ${(size - 3) * 0.6},${(size - 3) * 0.4}" fill="#fff"/>
                </g>`
              : '<circle cx="18" cy="18" r="3" fill="#fff" opacity="0.8"/>'
            }
          </svg>
        `;
        const capturedBus = bus;
        el.addEventListener('click', () => {
          onBusSelectRef.current(capturedBus);
        });

        const popup = new maplibregl.Popup({
          offset: 25,
          closeButton: true,
          closeOnClick: false,
          maxWidth: '280px',
        }).setHTML(createPopupHtml(bus));

        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([bus.longitude, bus.latitude])
          .setPopup(popup)
          .addTo(map);

        markers.set(bus.id, { marker, popup });
      }
    });
  }, [map, buses, selectedBusId]);
}
