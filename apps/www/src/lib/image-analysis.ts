import OpenAI from "openai";
import sharp from "sharp";
import { getPayload } from "payload";
import configPromise from "../../payload.config";

/**
 * Describes what is visible in an image from Payload media using OpenAI Vision
 * @param mediaRef - Either a media document ID string or a media document object
 * @param authToken - The payload authentication token value
 * @returns A factual description of what is visible in the image
 */
export async function describeImage(
  mediaRef: string | any,
  authToken: string
): Promise<string> {
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

  // Get the image data URL
  const imageDataUrl = await getImageDataURL(mediaDoc, authToken);

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

  return description;
}

/**
 * Fetches an image from Payload media and converts it to a base64 data URL
 * @param mediaDoc - The resolved media document
 * @param authToken - The payload authentication token value
 * @returns A base64 data URL of the image in JPEG format
 */
async function getImageDataURL(
  mediaDoc: any,
  authToken: string
): Promise<string> {
  // Get the URL from the media document
  const urlFromDoc: string | undefined = mediaDoc.url;
  if (!urlFromDoc) {
    throw new Error("Media document is missing a url field");
  }

  // Construct the full URL
  const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3000";
  const fullUrl =
    urlFromDoc.startsWith("http://") || urlFromDoc.startsWith("https://")
      ? urlFromDoc
      : `${baseUrl}${urlFromDoc.startsWith("/") ? "" : "/"}${urlFromDoc}`;

  console.log("Fetching image from:", fullUrl);

  // Fetch the binary from Payload using the auth cookie so protected routes work
  const res = await fetch(fullUrl, {
    headers: {
      cookie: `payload-token=${authToken}`,
    },
  });

  if (!res.ok) {
    throw new Error(
      `Failed to fetch media binary (${res.status} ${res.statusText}) from ${fullUrl}`
    );
  }

  const contentType = res.headers.get("content-type") || "image/jpeg";
  console.log("Content type:", contentType);

  const arrayBuf = await res.arrayBuffer();
  const inputBuffer = Buffer.from(arrayBuf);

  // Always convert to JPEG to ensure compatibility with OpenAI Vision
  console.log("Converting to JPEG for OpenAI Vision API");
  const jpegBuffer = await sharp(inputBuffer).jpeg({ quality: 90 }).toBuffer();
  const base64 = jpegBuffer.toString("base64");

  return `data:image/jpeg;base64,${base64}`;
}
