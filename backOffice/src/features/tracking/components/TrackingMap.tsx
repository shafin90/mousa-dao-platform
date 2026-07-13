import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { GpsBus } from "../api/trackingApi";

interface TrackingMapProps {
  buses: GpsBus[];
  selectedBusId: string | null;
  onBusSelect: (bus: GpsBus) => void;
}

const busIcon = L.divIcon({
  className: "",
  html: `<div style="width:12px;height:12px;border-radius:50%;background:#3b82f6;border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,0.3)"></div>`,
  iconSize: [12, 12],
  iconAnchor: [6, 6],
});

const selectedIcon = L.divIcon({
  className: "",
  html: `<div style="width:16px;height:16px;border-radius:50%;background:#2563eb;border:3px solid #93c5fd;box-shadow:0 2px 6px rgba(0,0,0,0.4)"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

export function TrackingMap({ buses, selectedBusId, onBusSelect }: TrackingMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, {
      center: [6.85, -5.3],
      zoom: 7,
      zoomControl: true,
    });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);
    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const currentIds = new Set(buses.map((b) => b.id));
    markersRef.current.forEach((marker, id) => {
      if (!currentIds.has(id)) {
        marker.remove();
        markersRef.current.delete(id);
      }
    });

    buses.forEach((bus) => {
      const existing = markersRef.current.get(bus.id);
      const icon = bus.id === selectedBusId ? selectedIcon : busIcon;
      if (existing) {
        existing.setIcon(icon);
        existing.setLatLng([bus.latitude, bus.longitude]);
        existing.setTooltipContent(`<b>${bus.busNumber}</b><br/>${bus.speed} km/h`);
      } else {
        const marker = L.marker([bus.latitude, bus.longitude], { icon })
          .addTo(map)
          .bindTooltip(`<b>${bus.busNumber}</b><br/>${bus.speed} km/h`, {
            direction: "top",
            offset: L.point(0, -8),
          });
        marker.on("click", () => onBusSelect(bus));
        markersRef.current.set(bus.id, marker);
      }
    });
  }, [buses, selectedBusId, onBusSelect]);

  return <div ref={containerRef} className="w-full h-full rounded-lg" />;
}
