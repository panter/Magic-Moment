"use client";

import { useState, useEffect } from "react";

interface GeolocationData {
  latitude: number | null;
  longitude: number | null;
  error: string | null;
  loading: boolean;
  permissionStatus: PermissionState | null;
}

export function useGeolocation(requestOnMount = false): GeolocationData & {
  requestLocation: () => void;
} {
  const [location, setLocation] = useState<GeolocationData>({
    latitude: null,
    longitude: null,
    error: null,
    loading: false,
    permissionStatus: null,
  });

  const requestLocation = () => {
    console.log("requestLocation called");

    if (!navigator.geolocation) {
      console.error("Geolocation not supported by browser");
      setLocation((prev) => ({
        ...prev,
        error: "Geolocation is not supported by your browser",
      }));
      return;
    }

    console.log("Starting geolocation request...");
    setLocation((prev) => ({ ...prev, loading: true, error: null }));

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          error: null,
          loading: false,
          permissionStatus: "granted",
        });
        console.log("Browser location obtained:", {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        let errorMessage = "Unable to retrieve your location";
        if (error.code === error.PERMISSION_DENIED) {
          errorMessage = "Location permission denied";
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          errorMessage = "Location information unavailable";
        } else if (error.code === error.TIMEOUT) {
          errorMessage = "Location request timed out";
        }

        setLocation({
          latitude: null,
          longitude: null,
          error: errorMessage,
          loading: false,
          permissionStatus: "denied",
        });
        console.error("Geolocation error:", errorMessage);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  useEffect(() => {
    // Check permission status on mount
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions
        .query({ name: "geolocation" })
        .then((result) => {
          setLocation((prev) => ({
            ...prev,
            permissionStatus: result.state,
          }));

          // Request location if permission is already granted and requestOnMount is true
          if (result.state === "granted" && requestOnMount) {
            requestLocation();
          }

          // Listen for permission changes
          result.onchange = () => {
            setLocation((prev) => ({
              ...prev,
              permissionStatus: result.state,
            }));
          };
        })
        .catch((err) => {
          console.error("Error checking geolocation permission:", err);
        });
    }
  }, [requestOnMount]);

  return {
    ...location,
    requestLocation,
  };
}