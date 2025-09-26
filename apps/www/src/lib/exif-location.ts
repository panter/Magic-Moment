import * as exifr from "exifr";

interface LocationInfo {
  latitude: number | null;
  longitude: number | null;
  locationName: string | null;
  fullLocationData?: any;
}

/**
 * Extract GPS coordinates from image buffer
 */
export async function extractGPSFromImage(
  imageBuffer: Buffer
): Promise<{ latitude: number | null; longitude: number | null }> {
  try {
    const exifData = await exifr.parse(imageBuffer, {
      gps: true,
      pick: ["latitude", "longitude"],
    });

    if (exifData && exifData.latitude && exifData.longitude) {
      return {
        latitude: exifData.latitude,
        longitude: exifData.longitude,
      };
    }
  } catch (error) {
    console.error("Error extracting EXIF data:", error);
  }

  return { latitude: null, longitude: null };
}

/**
 * Convert GPS coordinates to location name using OpenStreetMap Nominatim API
 * This is a free service that doesn't require an API key
 */
export async function geocodeCoordinates(
  latitude: number,
  longitude: number
): Promise<{ locationName: string | null; fullLocationData?: any }> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=en`;

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Magic-Moment-Postcard-App/1.0", // Required by Nominatim API
      },
    });

    if (!response.ok) {
      console.error("Geocoding API returned status:", response.status);
      return { locationName: null };
    }

    const data = await response.json();

    // Extract meaningful location parts
    const parts: string[] = [];

    if (data.address) {
      // Priority order for location components
      const locationComponents = [
        data.address.city,
        data.address.town,
        data.address.village,
        data.address.municipality,
        data.address.suburb,
        data.address.county,
        data.address.state,
        data.address.country,
      ];

      // Add first 2-3 non-null components
      for (const component of locationComponents) {
        if (component && !parts.includes(component)) {
          parts.push(component);
          if (parts.length >= 3) break;
        }
      }
    }

    const locationName = parts.length > 0 ? parts.join(", ") : null;

    return {
      locationName,
      fullLocationData: data,
    };
  } catch (error) {
    console.error("Error geocoding coordinates:", error);
    return { locationName: null };
  }
}

/**
 * Extract location information from an image buffer
 * Returns GPS coordinates and location name if available
 */
export async function extractLocationFromImage(
  imageBuffer: Buffer
): Promise<LocationInfo> {
  // Extract GPS coordinates from EXIF
  const { latitude, longitude } = await extractGPSFromImage(imageBuffer);

  if (latitude === null || longitude === null) {
    return {
      latitude: null,
      longitude: null,
      locationName: null,
    };
  }

  // Geocode the coordinates to get location name
  const { locationName, fullLocationData } = await geocodeCoordinates(
    latitude,
    longitude
  );

  return {
    latitude,
    longitude,
    locationName,
    fullLocationData,
  };
}

/**
 * Format location info for inclusion in image description
 */
export function formatLocationForDescription(location: LocationInfo): string {
  if (!location.locationName) {
    if (location.latitude && location.longitude) {
      return `Location: ${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`;
    }
    return "";
  }

  return `Location: ${location.locationName}`;
}