"use server";

import { getPayload } from "payload";
import configPromise from "../../../payload.config";
import { cookies } from "next/headers";

export interface UploadFromUrlInput {
  url: string;
  filename: string;
  mimeType: string;
  isVideo?: boolean;
  thumbnailUrl?: string;
  gpsLatitude?: number;
  gpsLongitude?: number;
  locationName?: string;
}

export async function uploadFromUrl(input: UploadFromUrlInput): Promise<any> {
  const payload = await getPayload({ config: configPromise });
  const token = (await cookies()).get("payload-token");

  if (!token) {
    throw new Error("Not authenticated");
  }

  const headers = new Headers();
  headers.set("cookie", `payload-token=${token.value}`);
  const { user } = await payload.auth({ headers });

  if (!user) {
    throw new Error("Not authenticated");
  }

  try {
    let mediaUrl = input.url;
    let mediaBuffer: Buffer;
    let mediaMimeType = input.mimeType;
    let mediaFilename = input.filename;

    // If it's a video, use the thumbnail for the media collection
    if (input.isVideo && input.thumbnailUrl) {
      console.log("Processing video upload with thumbnail");

      // Download thumbnail from Cloudinary
      const thumbnailResponse = await fetch(input.thumbnailUrl);
      if (!thumbnailResponse.ok) {
        throw new Error("Failed to fetch thumbnail");
      }

      mediaBuffer = Buffer.from(await thumbnailResponse.arrayBuffer());
      mediaMimeType = "image/jpeg";
      mediaFilename = input.filename.replace(/\.[^/.]+$/, "_thumbnail.jpg");

      // Create media with video URL in metadata
      const media = await payload.create({
        collection: "media",
        data: {
          alt: input.filename,
          videoUrl: input.url,
          ...(input.gpsLatitude && input.gpsLongitude
            ? {
                gpsLatitude: input.gpsLatitude,
                gpsLongitude: input.gpsLongitude,
                locationName: input.locationName,
              }
            : {}),
        },
        file: {
          data: mediaBuffer,
          mimetype: mediaMimeType,
          name: mediaFilename,
          size: mediaBuffer.length,
        },
      });

      return {
        ...media,
        videoUrl: input.url,
        isVideo: true,
      };
    } else {
      // For images, download from Cloudinary and store in Payload
      console.log("Processing image upload");

      const imageResponse = await fetch(input.url);
      if (!imageResponse.ok) {
        throw new Error("Failed to fetch image");
      }

      mediaBuffer = Buffer.from(await imageResponse.arrayBuffer());

      // Create media entry
      const media = await payload.create({
        collection: "media",
        data: {
          alt: input.filename,
          ...(input.gpsLatitude && input.gpsLongitude
            ? {
                gpsLatitude: input.gpsLatitude,
                gpsLongitude: input.gpsLongitude,
                locationName: input.locationName,
              }
            : {}),
        },
        file: {
          data: mediaBuffer,
          mimetype: mediaMimeType,
          name: mediaFilename,
          size: mediaBuffer.length,
        },
      });

      console.log("Uploaded media object:", {
        id: media.id,
        hasUrl: !!media.url,
        url: media.url,
        filename: media.filename,
      });

      return media;
    }
  } catch (error) {
    console.error("Error processing upload from URL:", error);
    throw new Error("Failed to process upload");
  }
}
