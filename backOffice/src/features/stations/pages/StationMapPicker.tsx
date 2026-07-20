import React, { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useTranslation } from "react-i18next";

interface Props {
  lat?: number;
  lng?: number;
  onPick: (lat: number, lng: number) => void;
  onAddressFound?: (address: string) => void;
  cityBounds?: { minLat: number; maxLat: number; minLng: number; maxLng: number } | null;
}

const icon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const fetchAddress = async (lat: number, lng: number, marker: L.Marker, t: (key: string) => string, onAddressFound?: (address: string) => void) => {
  marker.setPopupContent(`<div class="flex items-center gap-2 text-sm"><svg class="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg> ${t("stations.resolving")}</div>`);
  marker.openPopup();
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=jsonv2`,
      { headers: { "Accept-Language": "en", "User-Agent": "BusAdminApp/1.0" } }
    );
    const data = await res.json();
    const address = data?.display_name || data?.address?.road || data?.name || t("stations.addressResolved");
    marker.setPopupContent(`<div class="text-sm">${address}</div>`);
    marker.openPopup();
    if (address && onAddressFound) onAddressFound(address);
  } catch {
    marker.setPopupContent(`<div class="text-sm text-muted-foreground">${t("stations.addressNotFound")}</div>`);
  }
};

const isOutsideBounds = (lat: number, lng: number, b: Props["cityBounds"]) =>
  b && (lat < b.minLat || lat > b.maxLat || lng < b.minLng || lng > b.maxLng);

const StationMapPicker: React.FC<Props> = ({ lat, lng, onPick, onAddressFound, cityBounds }) => {
  const { t } = useTranslation();
  const mapRef = useRef<HTMLDivElement>(null);
  const instanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const onPickRef = useRef(onPick);
  const onAddressFoundRef = useRef(onAddressFound);
  onPickRef.current = onPick;
  onAddressFoundRef.current = onAddressFound;

  const center: [number, number] = lat != null && lng != null
    ? [lat, lng]
    : cityBounds
      ? [(cityBounds.minLat + cityBounds.maxLat) / 2, (cityBounds.minLng + cityBounds.maxLng) / 2]
      : [7.5, -5.5];

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
      zoom: cityBounds ? 12 : 6,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap",
      maxZoom: 18,
    }).addTo(map);

    if (cityBounds) {
      const bounds = L.latLngBounds(
        [cityBounds.minLat, cityBounds.minLng],
        [cityBounds.maxLat, cityBounds.maxLng]
      );
      map.setMaxBounds(bounds);
      map.fitBounds(bounds, { padding: [30, 30], animate: true, duration: 0.5 });
      L.rectangle(bounds, { color: "#8b5cf6", weight: 2, fillOpacity: 0.05 }).addTo(map);
    }

    const markerCenter = lat != null && lng != null ? [lat, lng] : center;
    const marker = L.marker(markerCenter as [number, number], {
      draggable: true,
      icon,
    }).addTo(map);

    marker.bindPopup(`<div class="text-sm">${t("stations.clickToPlace")}</div>`);
    if (lat != null && lng != null) {
      marker.openPopup();
    }

    markerRef.current = marker;

    map.on("click", (e: L.LeafletMouseEvent) => {
      const { lat: clickedLat, lng: clickedLng } = e.latlng;
      if (isOutsideBounds(clickedLat, clickedLng, cityBounds)) return;
      marker.setLatLng([clickedLat, clickedLng]);
      onPickRef.current(clickedLat, clickedLng);
      fetchAddress(clickedLat, clickedLng, marker, t, onAddressFoundRef.current);
    });

    marker.on("dragstart", () => {
      marker.setPopupContent(`<div class="text-sm">${t("stations.dragMarker")}</div>`);
      marker.openPopup();
    });

    marker.on("dragend", () => {
      const pos = marker.getLatLng();
      if (isOutsideBounds(pos.lat, pos.lng, cityBounds)) {
        marker.setLatLng([markerCenter[0], markerCenter[1]]);
        return;
      }
      onPickRef.current(pos.lat, pos.lng);
      fetchAddress(pos.lat, pos.lng, marker, t, onAddressFoundRef.current);
    });

    instanceRef.current = map;

    return () => {
      map.remove();
      instanceRef.current = null;
      markerRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (lat != null && lng != null && markerRef.current && instanceRef.current) {
      markerRef.current.setLatLng([lat, lng]);
      instanceRef.current.flyTo([lat, lng], Math.max(instanceRef.current.getZoom(), 14), {
        animate: true,
        duration: 0.4,
      });
    }
  }, [lat, lng]);

  useEffect(() => {
    if (!instanceRef.current) return;
    if (cityBounds) {
      const bounds = L.latLngBounds(
        [cityBounds.minLat, cityBounds.minLng],
        [cityBounds.maxLat, cityBounds.maxLng]
      );
      instanceRef.current.setMaxBounds(bounds);
    } else {
      instanceRef.current.setMaxBounds(undefined as unknown as L.LatLngBounds);
    }
  }, [cityBounds]);

  return (
    <div className="relative w-full h-96 rounded-lg border overflow-hidden">
      <div className="absolute top-2 right-2 z-[1000] flex gap-1 pointer-events-none">
        <div className="px-2 py-1 rounded text-xs font-medium shadow bg-background text-muted-foreground pointer-events-auto select-none">
          {t("stations.clickToPlace")}
        </div>
      </div>
      <div ref={mapRef} className="w-full h-full z-0" />
    </div>
  );
};

export { StationMapPicker };
