import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface LatLng {
  lat: number;
  lng: number;
}

interface Props {
  from: LatLng;
  to: LatLng;
  fromLabel: string;
  toLabel: string;
}

const ROUTE_COLOR = "#8b5cf6";
const ROUTE_WEIGHT = 4;

async function fetchRoute(from: LatLng, to: LatLng): Promise<[number, number][] | null> {
  const url = `https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?geometries=geojson&overview=full&steps=false`;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.code !== "Ok" || !data.routes?.length) return null;
    const coords: [number, number][] = data.routes[0].geometry.coordinates.map(
      ([lng, lat]: [number, number]) => [lat, lng] as [number, number]
    );
    return coords;
  } catch {
    return null;
  }
}

export const RouteMap: React.FC<Props> = ({ from, to, fromLabel, toLabel }) => {
  const { t } = useTranslation();
  const mapRef = useRef<HTMLDivElement>(null);
  const instanceRef = useRef<L.Map | null>(null);
  const routeLayerRef = useRef<L.Polyline | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!mapRef.current) return;
    if (instanceRef.current) {
      instanceRef.current.remove();
      instanceRef.current = null;
    }

    const map = L.map(mapRef.current, {
      zoomControl: true,
      scrollWheelZoom: false,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a>",
      maxZoom: 18,
    }).addTo(map);

    const fromMarker = L.circleMarker([from.lat, from.lng], {
      radius: 10,
      fillColor: "#10b981",
      color: "#059669",
      weight: 2,
      opacity: 1,
      fillOpacity: 0.8,
    }).addTo(map);
    fromMarker.bindTooltip(fromLabel, { direction: "top", offset: L.point(0, -12) });

    const toMarker = L.circleMarker([to.lat, to.lng], {
      radius: 10,
      fillColor: "#3b82f6",
      color: "#2563eb",
      weight: 2,
      opacity: 1,
      fillOpacity: 0.8,
    }).addTo(map);
    toMarker.bindTooltip(toLabel, { direction: "top", offset: L.point(0, -12) });

    const straightLine = L.polyline(
      [[from.lat, from.lng], [to.lat, to.lng]],
      {
        color: ROUTE_COLOR,
        weight: 2,
        opacity: 0.4,
        dashArray: "6, 6",
      }
    ).addTo(map);

    const bounds = L.latLngBounds([from.lat, from.lng], [to.lat, to.lng]);
    map.fitBounds(bounds, { padding: [40, 40] });

    instanceRef.current = map;

    setLoading(true);
    fetchRoute(from, to).then((coords) => {
      if (!mapRef.current) return;
      if (routeLayerRef.current) {
        routeLayerRef.current.remove();
        routeLayerRef.current = null;
      }
      if (coords && coords.length > 1) {
        straightLine.remove();
        routeLayerRef.current = L.polyline(coords, {
          color: ROUTE_COLOR,
          weight: ROUTE_WEIGHT,
          opacity: 0.85,
        }).addTo(map);
      }
      setLoading(false);
    });

    return () => {
      map.remove();
      instanceRef.current = null;
      routeLayerRef.current = null;
    };
  }, [from.lat, from.lng, to.lat, to.lng, fromLabel, toLabel]);

  return (
    <div className="space-y-2">
      <div className="relative w-full h-56 rounded-lg border overflow-hidden">
        {loading && (
          <div className="absolute inset-0 z-[1000] flex items-center justify-center bg-background/40 backdrop-blur-[1px]">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="inline-block w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              {t("common.loading")}...
            </div>
          </div>
        )}
        <div ref={mapRef} className="w-full h-full z-0" />
      </div>
      <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
        <span className="flex items-center gap-1">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500" /> {fromLabel}
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-blue-500" /> {toLabel}
        </span>
      </div>
    </div>
  );
};
