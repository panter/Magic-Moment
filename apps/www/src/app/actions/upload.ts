"use server";

import { getPayload } from "payload";
import configPromise from "../../../payload.config";
import { cookies } from "next/headers";
import sharp from "sharp";
import { extractLocationFromImage } from "@/lib/exif-location";
import { isVideoFile, uploadVideoToCloudinary } from "@/lib/cloudinary";

export async function uploadImage(formData: FormData): Promise<any> {
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

  const file = formData.get("file") as File;
  if (!file) {
    throw new Error("No file provided");
  }

  let buffer = Buffer.from(await file.arrayBuffer());
  let mimetype = file.type;
  let filename = file.name;

  // Check if it's a video file
  if (isVideoFile(filename, mimetype)) {
    console.log("Detected video file, uploading to Cloudinary...");

    try {
      // Upload video to Cloudinary and get thumbnail
      const cloudinaryResult = await uploadVideoToCloudinary(buffer, filename);
      console.log("Cloudinary upload result:", cloudinaryResult);

      // Download the thumbnail from Cloudinary to store in Payload
      const thumbnailResponse = await fetch(cloudinaryResult.thumbnailUrl);
      const thumbnailBuffer = Buffer.from(
        await thumbnailResponse.arrayBuffer()
      );

      // Create media entry with the thumbnail
      const media = await payload.create({
        collection: "media",
        data: {
          alt: file.name,
          videoUrl: cloudinaryResult.videoUrl, // Store video URL in media metadata
        },
        file: {
          data: thumbnailBuffer,
          mimetype: "image/jpeg",
          name: filename.replace(/\.[^/.]+$/, "_thumbnail.jpg"),
          size: thumbnailBuffer.length,
        },
      });

      // Return media with video URL included
      return {
        ...media,
        videoUrl: cloudinaryResult.videoUrl,
        isVideo: true,
      };
    } catch (error) {
      console.error("Error processing video:", error);
      throw new Error("Failed to process video file");
    }
  }

  // Extract location data from original image (before any conversion)
  const locationInfo = await extractLocationFromImage(buffer);
  console.log("Extracted location info:", locationInfo);

  // Convert HEIC/HEIF to JPEG if needed
  if (
    file.type.includes("heic") ||
    file.type.includes("heif") ||
    filename.toLowerCase().endsWith(".heic")
  ) {
    console.log("Converting HEIC to JPEG...");
    try {
      const convertedBuffer = await sharp(buffer)
        .jpeg({ quality: 90 })
        .toBuffer();
      buffer = Buffer.from(convertedBuffer);
      mimetype = "image/jpeg";
      filename = filename.replace(/\.heic$/i, ".jpg");
      console.log("Successfully converted HEIC to JPEG");
    } catch (error) {
      console.error("Error converting HEIC to JPEG:", error);
      // Continue with original file if conversion fails
    }
  }

  // Prepare metadata to store with the media
  const metadata: any = {
    alt: file.name,
  };

  // Add location metadata if available
  if (locationInfo.latitude && locationInfo.longitude) {
    metadata.gpsLatitude = locationInfo.latitude;
    metadata.gpsLongitude = locationInfo.longitude;
    if (locationInfo.locationName) {
      metadata.locationName = locationInfo.locationName;
    }
  }

  const media = await payload.create({
    collection: "media",
    data: metadata,
    file: {
      data: buffer,
      mimetype: mimetype,
      name: filename,
      size: buffer.length,
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
