"use client";

import { MapContainer, TileLayer, CircleMarker, useMap } from "react-leaflet";
import { useMemo } from "react";
import "leaflet/dist/leaflet.css";
import type { ZoningAlert } from "@/types";

interface ZoningMapProps {
  alerts: ZoningAlert[];
  selectedId?: string | null;
  onSelectAlert?: (id: string) => void;
}

function FlyToAlert({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useMemo(() => {
    map.flyTo([lat, lng], 14, { duration: 0.8 });
  }, [lat, lng, map]);
  return null;
}

export function ZoningMap({
  alerts,
  selectedId,
  onSelectAlert,
}: ZoningMapProps) {
  const selectedAlert = alerts.find((a) => a.id === selectedId);

  const getMarkerColor = (type: string) => {
    const colors: { [key: string]: string } = {
      Rezoning: "#a855f7",
      "New Development": "#3b82f6",
      Infrastructure: "#f97316",
      Heritage: "#10b981",
    };
    return colors[type] || "#6b7280";
  };

  return (
    <MapContainer
      center={[43.5183, -79.8774]}
      zoom={12}
      style={{ height: "100%", width: "100%" }}
      className="z-0"
      zoomControl={false}
    >
      {/* Clean minimal tile layer */}
      <TileLayer
        attribution='&copy; <a href="https://carto.com/">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
      />

      {selectedAlert && (
        <FlyToAlert lat={selectedAlert.lat} lng={selectedAlert.lng} />
      )}

      {alerts.map((alert) => {
        const isSelected = alert.id === selectedId;
        const markerColor = getMarkerColor(alert.type);

        return (
          <CircleMarker
            key={alert.id}
            center={[alert.lat, alert.lng]}
            radius={isSelected ? 12 : 8}
            pathOptions={{
              color: markerColor,
              fillColor: isSelected ? markerColor : "#ffffff",
              fillOpacity: isSelected ? 0.8 : 1,
              weight: 2,
            }}
            eventHandlers={{
              click: () => onSelectAlert?.(alert.id),
            }}
          />
        );
      })}
    </MapContainer>
  );
}
