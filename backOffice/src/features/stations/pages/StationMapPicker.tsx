import React, { useEffect, useRef, useState } from "react";
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

const StationMapPicker: React.FC<Props> = ({ lat, lng, onPick, onAddressFound, cityBounds }) => {
  const { t } = useTranslation();
  const mapRef = useRef<HTMLDivElement>(null);
  const instanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const boundsRef = useRef(cityBounds);
  const onPickRef = useRef(onPick);
  const onAddressFoundRef = useRef(onAddressFound);
  onPickRef.current = onPick;
  onAddressFoundRef.current = onAddressFound;
  boundsRef.current = cityBounds;

  const [activeTool, setActiveTool] = useState<"point" | "drag" | null>(null);
  const activeToolRef = useRef(activeTool);
  activeToolRef.current = activeTool;

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
      draggable: false,
      icon,
    }).addTo(map);

    marker.bindPopup(`<div class="text-sm">${t("stations.clickToPlace")}</div>`);
    if (lat != null && lng != null) {
      marker.openPopup();
    }

    markerRef.current = marker;

    map.on("click", (e: L.LeafletMouseEvent) => {
      const { lat: clickedLat, lng: clickedLng } = e.latlng;
      const b = boundsRef.current;
      if (b && (clickedLat < b.minLat || clickedLat > b.maxLat || clickedLng < b.minLng || clickedLng > b.maxLng)) {
        return;
      }
      marker.setLatLng([clickedLat, clickedLng]);
      marker.setPopupContent(`<div class="flex items-center gap-2 text-sm"><svg class="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg> ${t("stations.resolving")}</div>`);
      marker.openPopup();
      onPickRef.current(clickedLat, clickedLng);
      if (activeToolRef.current === "point") setActiveTool(null);

      fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${clickedLat}&lon=${clickedLng}&format=jsonv2`,
        { headers: { "Accept-Language": "en", "User-Agent": "BusAdminApp/1.0" } }
      )
        .then((res) => res.json())
        .then((data) => {
          const address = data?.display_name || data?.address?.road || data?.name || t("stations.addressResolved");
          if (markerRef.current) {
            markerRef.current.setPopupContent(`<div class="text-sm">${address}</div>`);
            markerRef.current.openPopup();
          }
          if (address && onAddressFoundRef.current) {
            onAddressFoundRef.current(address);
          }
        })
        .catch(() => {
          if (markerRef.current) {
            markerRef.current.setPopupContent(`<div class="text-sm text-muted-foreground">${t("stations.addressNotFound")}</div>`);
          }
        });
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
    if (!instanceRef.current) return;
    instanceRef.current.getContainer().style.cursor = activeTool === "point" ? "crosshair" : "";
  }, [activeTool]);

  useEffect(() => {
    if (!markerRef.current) return;
    if (activeTool === "drag") {
      markerRef.current.dragging?.enable();
      markerRef.current.once("dragend", () => {
        const pos = markerRef.current?.getLatLng();
        if (!pos) return;
        const b = boundsRef.current;
        if (b && (pos.lat < b.minLat || pos.lat > b.maxLat || pos.lng < b.minLng || pos.lng > b.maxLng)) {
          return;
        }
        onPickRef.current(pos.lat, pos.lng);
        setActiveTool(null);
      });
    } else {
      markerRef.current.dragging?.disable();
      markerRef.current.off("dragend");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTool]);

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

  const toggleTool = (tool: "point" | "drag") => {
    setActiveTool((prev) => (prev === tool ? null : tool));
  };

  return (
    <div className="relative w-full h-96 rounded-lg border overflow-hidden">
      <div className="absolute top-2 right-2 z-[1000] flex gap-1">
        <button
          type="button"
          onClick={() => toggleTool("point")}
          title={t("stations.placeMarker")}
          className={`p-1.5 rounded text-xs font-medium shadow transition-colors ${
            activeTool === "point"
              ? "bg-primary text-primary-foreground"
              : "bg-background text-foreground border hover:bg-muted"
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a8 8 0 0 0-8 8c0 5.4 8 12 8 12s8-6.6 8-12a8 8 0 0 0-8-8z"/><circle cx="12" cy="10" r="3"/></svg>
        </button>
        <button
          type="button"
          onClick={() => toggleTool("drag")}
          title={t("stations.dragMarker")}
          className={`p-1.5 rounded text-xs font-medium shadow transition-colors ${
            activeTool === "drag"
              ? "bg-primary text-primary-foreground"
              : "bg-background text-foreground border hover:bg-muted"
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 9l-3 3 3 3"/><path d="M9 5l3-3 3 3"/><path d="M15 19l-3 3-3-3"/><path d="M19 9l3 3-3 3"/><path d="M2 12h20"/><path d="M12 2v20"/></svg>
        </button>
      </div>
      <div ref={mapRef} className="w-full h-full z-0" />
    </div>
  );
};

export { StationMapPicker };
