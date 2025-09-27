"use server";

import OpenAI from "openai";
import { cookies } from "next/headers";
import { getPayload } from "payload";
import configPromise from "../../payload.config";
import {
  CropHintsSchema,
  type CropHints,
  type CropRect,
  type ManualAdjustment,
  POSTCARD_ASPECT_RATIO,
} from "./smart-crop-types";

/**
 * Get auth token from cookies
 */
async function getAuthToken(): Promise<string> {
  const cookieStore = await cookies();
  const authToken = cookieStore.get("payload-token")?.value;
  if (!authToken) {
    throw new Error("Authentication required");
  }
  return authToken;
}

/**
 * Fetches an image and converts it to base64 for OpenAI
 * Handles both absolute and relative URLs
 */
async function getImageAsBase64(
  imageUrl: string,
  authToken: string,
): Promise<string> {
  // If already a data URL, return as is
  if (imageUrl.startsWith("data:")) {
    return imageUrl;
  }

  // Construct full URL if needed
  const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3000";
  const fullUrl =
    imageUrl.startsWith("http://") || imageUrl.startsWith("https://")
      ? imageUrl
      : `${baseUrl}${imageUrl.startsWith("/") ? "" : "/"}${imageUrl}`;

  // For localhost/relative URLs, fetch with auth cookie and convert to base64
  const needsBase64Conversion =
    fullUrl.includes("localhost:") ||
    fullUrl.includes("127.0.0.1:") ||
    !fullUrl.startsWith("http");

  if (needsBase64Conversion) {
    console.log("Converting to base64 for OpenAI:", fullUrl);

    const res = await fetch(fullUrl, {
      headers: {
        cookie: `payload-token=${authToken}`,
      },
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch image: ${res.status} ${res.statusText}`);
    }

    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString("base64");
    const mimeType = res.headers.get("content-type") || "image/jpeg";

    return `data:${mimeType};base64,${base64}`;
  }

  // External URL - OpenAI can access directly
  return fullUrl;
}

/**
 * Analyzes an image to get smart crop hints using OpenAI Vision
 */
export async function getSmartCropHints(imageUrl: string): Promise<CropHints> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OpenAI API key is not configured");
  }

  // Get auth token and convert image to accessible format
  const authToken = await getAuthToken();
  const imageDataUrl = await getImageAsBase64(imageUrl, authToken);

  // Create OpenAI client inside function to avoid stale connections
  const client = new OpenAI({ apiKey });

  const completion = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `You are an intelligent image cropping assistant specialized in finding optimal 3:2 aspect ratio crops for postcards.

        CRITICAL RULES for focal point detection:
        1. For portraits: ALWAYS center on FACE or EYES, never on body center
        2. If eyes are visible, focal point should be centered between the eyes
        3. If only face visible, focal point should be at face center
        4. For full body shots, focal point should be at head/upper chest level, NOT geometric center
        5. Never use the geometric center of a person's body as focal point

        Provide hierarchical object detection with these importance levels:
        - Face/Eyes: 10 (highest)
        - Upper body/Head: 8-9
        - Full body: 6-7
        - Important objects/text: 5-8
        - Background elements: 1-4

        Return normalized coordinates (0-1 range) for all detections.`,
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Analyze this image and provide smart cropping hints for a 3:2 postcard aspect ratio. Focus on faces/eyes for portraits.",
          },
          {
            type: "image_url",
            image_url: { url: imageDataUrl },
          },
        ],
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "crop_hints",
        strict: true,
        schema: {
          type: "object",
          properties: {
            focalPoint: {
              type: "object",
              properties: {
                x: { type: "number" },
                y: { type: "number" },
              },
              required: ["x", "y"],
              additionalProperties: false,
            },
            primarySubject: {
              type: "object",
              properties: {
                type: { type: "string" },
                confidence: { type: "number" },
                box: {
                  type: "object",
                  properties: {
                    x: { type: "number" },
                    y: { type: "number" },
                    w: { type: "number" },
                    h: { type: "number" },
                  },
                  required: ["x", "y", "w", "h"],
                  additionalProperties: false,
                },
              },
              required: ["type", "confidence", "box"],
              additionalProperties: false,
            },
            regions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  label: { type: "string" },
                  type: {
                    type: "string",
                    enum: [
                      "face",
                      "eyes",
                      "upper_body",
                      "full_body",
                      "object",
                      "text",
                      "logo",
                      "landmark",
                    ],
                  },
                  importance: { type: "number" },
                  confidence: { type: "number" },
                  box: {
                    type: "object",
                    properties: {
                      x: { type: "number" },
                      y: { type: "number" },
                      w: { type: "number" },
                      h: { type: "number" },
                    },
                    required: ["x", "y", "w", "h"],
                    additionalProperties: false,
                  },
                },
                required: ["label", "type", "importance", "confidence", "box"],
                additionalProperties: false,
              },
            },
          },
          required: ["focalPoint", "primarySubject", "regions"],
          additionalProperties: false,
        },
      },
    },
    max_tokens: 500,
  });

  const content = completion.choices[0].message.content;
  if (!content) {
    throw new Error("OpenAI returned no content");
  }

  const parsed = JSON.parse(content);
  const validated = CropHintsSchema.parse(parsed);

  return validated;
}

/**
 * Computes optimal crop rectangle for postcard aspect ratio
 */
export async function computeCropRect(
  imgW: number,
  imgH: number,
  focal: { x: number; y: number },
  manualAdjustment?: ManualAdjustment,
): CropRect {
  // Calculate crop dimensions for 3:2 aspect ratio
  let cropW = imgW;
  let cropH = Math.round(imgW / POSTCARD_ASPECT_RATIO);

  if (cropH > imgH) {
    cropH = imgH;
    cropW = Math.round(imgH * POSTCARD_ASPECT_RATIO);
  }

  // Apply focal point
  let cx = Math.round(focal.x * imgW);
  let cy = Math.round(focal.y * imgH);

  // Apply manual adjustment if provided
  if (manualAdjustment) {
    cx += Math.round(manualAdjustment.x * imgW * 0.3); // 30% max adjustment
    cy += Math.round(manualAdjustment.y * imgH * 0.3);
  }

  // Calculate crop position
  let x = Math.round(cx - cropW / 2);
  let y = Math.round(cy - cropH / 2);

  // Clamp to image bounds
  x = Math.max(0, Math.min(x, imgW - cropW));
  y = Math.max(0, Math.min(y, imgH - cropH));

  return { x, y, w: cropW, h: cropH };
}

/**
 * Performs smart crop on an image and returns the cropped buffer
 */
export async function performSmartCrop(
  mediaRef: string | any,
  manualAdjustment?: ManualAdjustment,
): Promise<Buffer> {
  const authToken = await getAuthToken();
  const payload = await getPayload({ config: configPromise });

  // Resolve media document if needed
  let mediaDoc = mediaRef;
  if (typeof mediaRef === "string") {
    mediaDoc = await payload.findByID({
      collection: "media",
      id: mediaRef,
      depth: 0,
    });
  }

  if (!mediaDoc || !mediaDoc.url) {
    throw new Error("Media document not found or missing URL");
  }

  // Get smart crop hints
  const hints = await getSmartCropHints(mediaDoc.url);

  // Fetch the image buffer
  const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3000";
  const fullUrl = mediaDoc.url.startsWith("http")
    ? mediaDoc.url
    : `${baseUrl}${mediaDoc.url}`;

  const res = await fetch(fullUrl, {
    headers: {
      cookie: `payload-token=${authToken}`,
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch image for cropping: ${res.status}`);
  }

  const arrayBuffer = await res.arrayBuffer();
  const inputBuffer = Buffer.from(arrayBuffer);

  // Get image dimensions and compute crop
  const sharp = await import("sharp");
  const metadata = await sharp.default(inputBuffer).metadata();

  if (!metadata.width || !metadata.height) {
    throw new Error("Could not determine image dimensions");
  }

  const cropRect = computeCropRect(
    metadata.width,
    metadata.height,
    hints.focalPoint,
    manualAdjustment,
  );

  // Perform the crop
  const croppedBuffer = await sharp
    .default(inputBuffer)
    .extract({
      left: cropRect.x,
      top: cropRect.y,
      width: cropRect.w,
      height: cropRect.h,
    })
    .jpeg({ quality: 90 })
    .toBuffer();

  return croppedBuffer;
}
