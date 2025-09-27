"use client";

import { useEffect, useId } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for default markers in Leaflet
// biome-ignore lint/suspicious/noExplicitAny: Leaflet's type definitions are incomplete
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

interface LocationMapProps {
  latitude: number;
  longitude: number;
  locationName?: string;
  height?: string;
  className?: string;
}

export function Map({
  latitude,
  longitude,
  locationName,
  height = "400px",
  className = "",
}: LocationMapProps) {
  const mapId = useId();

  useEffect(() => {
    // Create map instance
    const mapInstance = L.map(mapId, {
      center: [latitude, longitude],
      zoom: 13,
      scrollWheelZoom: false,
    });

    // Add OpenStreetMap tiles
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(mapInstance);

    // Add marker
    const marker = L.marker([latitude, longitude]).addTo(mapInstance);

    // Add popup if location name is provided
    if (locationName) {
      marker.bindPopup(locationName).openPopup();
    }

    // Cleanup on unmount
    return () => {
      mapInstance.remove();
    };
  }, [latitude, longitude, locationName, mapId]);

  return (
    <div
      id={mapId}
      className={className}
      style={{
        height,
        width: "100%",
        borderRadius: "0.5rem",
        overflow: "hidden",
      }}
    />
  );
}
