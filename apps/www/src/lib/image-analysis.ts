"use server";

import OpenAI from "openai";
import { getPayload } from "payload";
import configPromise from "../../payload.config";
import { NEXT_PUBLIC_URL } from "./constants";
import {
  extractLocationFromImage,
  formatLocationForDescription,
} from "./exif-location";

interface GeoData {
  latitude?: number;
  longitude?: number;
  locationName?: string;
}

interface ImageAnalysisResult {
  description: string;
  geoData: GeoData;
}

/**
 * Describes what is visible in an image from Payload media using OpenAI Vision
 * and extracts geo information from EXIF data
 * @param mediaRef - Either a media document ID string or a media document object
 * @param authToken - The payload authentication token value
 * @returns Description and geo data extracted from the image
 */
export async function describeImage(
  mediaRef: string | any,
  authToken: string,
): Promise<ImageAnalysisResult> {
  // Initialize OpenAI
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OpenAI API key is not configured");
  }

  const openai = new OpenAI({ apiKey });
  const payload = await getPayload({ config: configPromise });

  // Resolve the media document if we only have an ID string
  let mediaDoc = mediaRef;
  if (typeof mediaRef === "string") {
    mediaDoc = await payload.findByID({
      collection: "media",
      id: mediaRef,
      depth: 0,
    });
  }

  if (!mediaDoc) {
    throw new Error("Media document not found");
  }

  // Get the image buffer for EXIF extraction
  const imageBuffer = await getImageBuffer(mediaDoc, authToken);

  // Extract location information from EXIF
  const locationInfo = await extractLocationFromImage(imageBuffer);
  const locationString = formatLocationForDescription(locationInfo);

  // Log EXIF extraction results
  if (locationInfo.latitude && locationInfo.longitude) {
    console.log(
      `✅ EXIF coordinates extracted successfully for ${
        mediaDoc.filename || "image"
      }:`,
      {
        latitude: locationInfo.latitude,
        longitude: locationInfo.longitude,
        locationName: locationInfo.locationName || "No location name available",
      },
    );
  } else {
    console.log(
      `❌ No EXIF coordinates found for ${mediaDoc.filename || "image"}`,
    );
  }

  // Convert buffer to data URL for OpenAI
  const jpegBuffer = await import("sharp").then((sharp) =>
    sharp.default(imageBuffer).jpeg({ quality: 90 }).toBuffer(),
  );
  const base64 = jpegBuffer.toString("base64");
  const imageDataUrl = `data:image/jpeg;base64,${base64}`;

  // Describe the image with OpenAI Vision
  const visionResponse = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "You are an image analysis tool. Describe what you see in the image objectively and factually. Include details about objects, people, scenery, colors, composition, and any text visible in the image. Be concise but thorough.",
      },
      {
        role: "user",
        content: [
          { type: "text", text: "Describe what is visible in this image:" },
          { type: "image_url", image_url: { url: imageDataUrl } },
        ],
      },
    ],
    max_tokens: 200,
  });

  const description = visionResponse.choices[0].message.content;
  if (!description) {
    throw new Error("OpenAI Vision API returned no description");
  }

  // Add location information if available
  const finalDescription = locationString
    ? `${description}\n\n${locationString}`
    : description;

  return {
    description: finalDescription,
    geoData: {
      latitude: locationInfo.latitude || undefined,
      longitude: locationInfo.longitude || undefined,
      locationName: locationInfo.locationName || undefined,
    },
  };
}

/**
 * Fetches an image from Payload media and returns the raw buffer
 * @param mediaDoc - The resolved media document
 * @param authToken - The payload authentication token value
 * @returns The raw image buffer
 */
async function getImageBuffer(
  mediaDoc: any,
  authToken: string,
): Promise<Buffer> {
  // Get the URL from the media document
  const urlFromDoc: string | undefined = mediaDoc.url;
  if (!urlFromDoc) {
    throw new Error("Media document is missing a url field");
  }

  // Check if this is a Vercel Blob Storage URL or external URL
  const isExternalUrl =
    urlFromDoc.startsWith("http://") || urlFromDoc.startsWith("https://");
  const isVercelBlobUrl =
    isExternalUrl &&
    (urlFromDoc.includes(".blob.vercel-store.com/") ||
      urlFromDoc.includes(".public.blob.vercel-storage.com/"));

  let fullUrl: string;
  let fetchOptions: RequestInit = {};

  if (
    isVercelBlobUrl ||
    (isExternalUrl &&
      !urlFromDoc.startsWith(NEXT_PUBLIC_URL || "http://localhost:3000"))
  ) {
    // For Vercel Blob URLs and other external URLs, use them directly without authentication
    fullUrl = urlFromDoc;
    console.log("Fetching from external/blob URL:", fullUrl);
  } else {
    // For relative URLs or URLs pointing to our own application, construct the full URL and use authentication
    const baseUrl = NEXT_PUBLIC_URL || "http://localhost:3000";
    fullUrl = isExternalUrl
      ? urlFromDoc
      : `${baseUrl}${urlFromDoc.startsWith("/") ? "" : "/"}${urlFromDoc}`;

    // Add authentication for internal URLs
    fetchOptions = {
      headers: {
        cookie: `payload-token=${authToken}`,
      },
    };
    console.log("Fetching from internal URL with auth:", fullUrl);
  }

  // Fetch the binary
  const res = await fetch(fullUrl, fetchOptions);

  if (!res.ok) {
    throw new Error(
      `Failed to fetch media binary (${res.status} ${res.statusText}) from ${fullUrl}`,
    );
  }

  const contentType = res.headers.get("content-type") || "image/jpeg";
  console.log("Content type:", contentType);

  const arrayBuf = await res.arrayBuffer();
  const inputBuffer = Buffer.from(arrayBuf);

  return inputBuffer;
}
