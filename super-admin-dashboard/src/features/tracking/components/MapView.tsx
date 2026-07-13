import { useEffect, useRef, useState, memo } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useMapMarkers } from '../hooks/useMapMarkers';
import type { BusMarkerData } from '../types';

const ERROR_THRESHOLD = 3;

interface MapViewProps {
  buses: BusMarkerData[];
  selectedBusId: string | null;
  onBusSelect: (bus: BusMarkerData) => void;
}

const MAP_STYLE =
  import.meta.env.VITE_MAP_STYLE ||
  'https://tiles.openfreemap.org/styles/liberty';

const DEFAULT_CENTER: [number, number] = [-74.006, 40.7128];
const DEFAULT_ZOOM = 12;

function MapView({ buses, selectedBusId, onBusSelect }: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<maplibregl.Map | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const errorCountRef = useRef(0);

  useEffect(() => {
    if (!mapContainer.current) return;

    let cancelled = false;

    try {
      const map = new maplibregl.Map({
        container: mapContainer.current,
        style: MAP_STYLE,
        center: DEFAULT_CENTER,
        zoom: DEFAULT_ZOOM,
      });
      map.addControl(new maplibregl.AttributionControl(), 'bottom-left');

      map.addControl(new maplibregl.NavigationControl(), 'top-right');
      map.addControl(new maplibregl.ScaleControl(), 'bottom-right');

      map.on('error', () => {
        if (cancelled) return;
        errorCountRef.current++;
        if (errorCountRef.current >= ERROR_THRESHOLD) {
          setMapError('Failed to load map tiles');
        }
      });

      map.once('load', () => {
        if (cancelled) return;
        mapInstance.current = map;
        errorCountRef.current = 0;
        setMapReady(true);
      });

      mapInstance.current = map;
    } catch {
      if (!cancelled) setMapError('Failed to initialize map');
    }

    return () => {
      cancelled = true;
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
        setMapReady(false);
      }
    };
  }, []);

  useMapMarkers(
    mapReady ? mapInstance.current : null,
    buses,
    selectedBusId,
    onBusSelect,
  );

  if (mapError) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-xl border border-card-border">
        <div className="text-center p-8">
          <div className="text-red-500 text-lg mb-2">!</div>
          <p className="text-text-secondary text-sm">{mapError}</p>
        </div>
      </div>
    );
  }

  if (!mapReady) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-xl border border-card-border">
        <div className="flex items-center gap-2 text-sm text-text-secondary">
          <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          Loading map...
        </div>
      </div>
    );
  }

  return (
    <div ref={mapContainer} className="w-full h-full rounded-xl overflow-hidden" />
  );
}

export default memo(MapView);
