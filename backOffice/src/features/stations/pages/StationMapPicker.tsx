import React, { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface Props {
  lat?: number;
  lng?: number;
  onPick: (lat: number, lng: number) => void;
  onAddressFound?: (address: string) => void;
}

const StationMapPicker: React.FC<Props> = ({ lat, lng, onPick, onAddressFound }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const instanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.CircleMarker | null>(null);
  const onPickRef = useRef(onPick);
  const onAddressFoundRef = useRef(onAddressFound);
  onPickRef.current = onPick;
  onAddressFoundRef.current = onAddressFound;

  const center: [number, number] = lat != null && lng != null ? [lat, lng] : [40.7128, -74.006];

  useEffect(() => {
    if (!mapRef.current) return;
    if (instanceRef.current) {
      instanceRef.current.remove();
      instanceRef.current = null;
    }

    const map = L.map(mapRef.current, {
      zoomControl: true,
      scrollWheelZoom: true,
      center,
      zoom: 5,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap",
      maxZoom: 18,
    }).addTo(map);

    const marker = L.circleMarker(center, {
      radius: 8,
      fillColor: "#8b5cf6",
      color: "#7c3aed",
      weight: 2,
      opacity: 1,
      fillOpacity: 0.8,
    }).addTo(map);

    markerRef.current = marker;

    map.on("click", (e: L.LeafletMouseEvent) => {
      const { lat: clickedLat, lng: clickedLng } = e.latlng;
      marker.setLatLng([clickedLat, clickedLng]);
      onPickRef.current(clickedLat, clickedLng);
      if (onAddressFoundRef.current) {
        fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${clickedLat}&lon=${clickedLng}&format=jsonv2`,
          { headers: { "Accept-Language": "en", "User-Agent": "BusAdminApp/1.0" } }
        )
          .then((res) => res.json())
          .then((data) => {
            const address = data?.display_name || data?.address?.road || data?.name || "";
            if (address) onAddressFoundRef.current!(address);
          })
          .catch(() => {});
      }
    });

    instanceRef.current = map;

    return () => {
      map.remove();
      instanceRef.current = null;
      markerRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (lat != null && lng != null && markerRef.current && instanceRef.current) {
      markerRef.current.setLatLng([lat, lng]);
      instanceRef.current.setView([lat, lng], instanceRef.current.getZoom());
    }
  }, [lat, lng]);

  return (
    <div className="relative w-full h-52 rounded-lg border overflow-hidden">
      <div ref={mapRef} className="w-full h-full z-0" />
    </div>
  );
};

export { StationMapPicker };
