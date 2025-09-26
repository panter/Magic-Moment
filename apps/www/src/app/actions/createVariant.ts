"use server";

import { getPayload } from "payload";
import configPromise from "../../../payload.config";
import { cookies } from "next/headers";
import OpenAI from "openai";
import { toFile } from "openai/uploads";
import { describeImage } from "@/lib/image-analysis";
import sharp from "sharp";

export async function createVariant(designId: string, customPrompt?: string) {
  console.log("=== Starting variant creation for design:", designId);
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

  // Get the design with media
  const design = await payload.findByID({
    collection: "postcard-designs",
    id: designId,
    depth: 2,
  });

  if (!design) {
    throw new Error("Design not found");
  }

  // Log the imageOriginal structure to understand what we're dealing with
  console.log(
    "Original image structure:",
    JSON.stringify(design.imageOriginal, null, 2)
  );

  // Initialize OpenAI
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error("OPENAI_API_KEY is not set in environment variables");
    throw new Error("OpenAI API key is not configured");
  }
  console.log("OpenAI API key found, length:", apiKey.length);

  const openai = new OpenAI({
    apiKey: apiKey,
  });

  // Get description or generate one based on the image
  let description = design.description;
  const needsDescription = !description;
  const needsGeoData = !design.latitude && !design.longitude;

  if ((needsDescription || needsGeoData) && design.imageOriginal) {
    // Analyze the image
    const analysisResult = await describeImage(
      design.imageOriginal,
      token.value
    );

    if (needsDescription) {
      description = analysisResult.description;
    }

    // Prepare update data
    const updateData: any = {};
    if (needsDescription) {
      updateData.description = analysisResult.description;
    }
    if (needsGeoData && analysisResult.geoData) {
      if (analysisResult.geoData.latitude) {
        updateData.latitude = analysisResult.geoData.latitude;
      }
      if (analysisResult.geoData.longitude) {
        updateData.longitude = analysisResult.geoData.longitude;
      }
      if (analysisResult.geoData.locationName) {
        updateData.locationName = analysisResult.geoData.locationName;
      }
    }

    // Persist the generated data on the design
    if (Object.keys(updateData).length > 0) {
      await payload.update({
        collection: "postcard-designs",
        id: designId,
        data: updateData,
      });
      console.log("Updated design with:", updateData);
    }
  } else if (!description) {
    throw new Error("No original image found on design");
  }

  // Generate a creative variant style name based on the custom prompt or AI
  let variantStyle = "Magic Edition";
  if (customPrompt) {
    // Extract a short style name from the custom prompt
    const words = customPrompt.split(" ").slice(0, 3);
    variantStyle = words
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  } else {
    try {
      const nameResponse = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              'Generate a creative, short style name for a postcard variant. Return only 1-3 words that describe a unique style or mood. Examples: "Sunset Dreams", "Vintage Romance", "Ocean Breeze"',
          },
          {
            role: "user",
            content: `Create a variant style name for a postcard with this description: "${
              description || design.name
            }"`,
          },
        ],
        max_tokens: 20,
      });
      variantStyle =
        nameResponse.choices[0].message.content?.trim() || "Magic Edition";
    } catch (error) {
      console.error("Error generating variant style name:", error);
    }
  }

  // Get the original image data URL for better variant generation
  let originalImageDataUrl: string | null = null;
  if (design.imageOriginal) {
    try {
      // Get the media document
      let mediaDoc = design.imageOriginal;
      if (typeof design.imageOriginal === "string") {
        mediaDoc = await payload.findByID({
          collection: "media",
          id: design.imageOriginal,
          depth: 0,
        });
      }

      if (mediaDoc) {
        // Get the URL from the media document
        const urlFromDoc = mediaDoc.url;
        if (urlFromDoc) {
          const baseUrl =
            process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3000";
          const fullUrl =
            urlFromDoc.startsWith("http://") ||
            urlFromDoc.startsWith("https://")
              ? urlFromDoc
              : `${baseUrl}${
                  urlFromDoc.startsWith("/") ? "" : "/"
                }${urlFromDoc}`;

          // Fetch the image
          const res = await fetch(fullUrl, {
            headers: {
              cookie: `payload-token=${token.value}`,
            },
          });

          if (res.ok) {
            const arrayBuf = await res.arrayBuffer();
            const inputBuffer = Buffer.from(arrayBuf);

            // Convert to JPEG and create data URL
            const jpegBuffer = await sharp(inputBuffer)
              .jpeg({ quality: 90 })
              .toBuffer();
            const base64 = jpegBuffer.toString("base64");
            originalImageDataUrl = `data:image/jpeg;base64,${base64}`;
            // Keep the original image buffer for image-to-image edits
            var originalImageBuffer = jpegBuffer;
            console.log(
              "Successfully loaded original image for variant generation"
            );
          }
        }
      }
    } catch (error) {
      console.error("Error loading original image:", error);
      // Continue without original image
    }
  }

  // Build a simple, less-opinionated prompt. Use the original image and apply the user's transformation.
  let postcardPrompt = "";
  const contextFromDescription = description
    ? `Context about the original scene: "${description}".`
    : "";

  if (customPrompt) {
    postcardPrompt =
      `${contextFromDescription} Create a variant of the original image. Apply this transformation: ${customPrompt}`.trim();
  } else {
    postcardPrompt =
      `${contextFromDescription} Create a faithful variant of the original image while keeping its main subjects and composition.`.trim();
  }

  try {
    console.log("Generating image variant from original using image edits");

    if (!originalImageDataUrl) {
      throw new Error(
        "Original image could not be loaded for variant generation"
      );
    }
    if (
      typeof (global as any).originalImageBuffer === "undefined" &&
      typeof originalImageBuffer === "undefined"
    ) {
      // TypeScript guard; originalImageBuffer is created where the image was loaded
    }

    // Use image-to-image edit. We send the original image and a concise prompt.
    const imageFile = await toFile(originalImageBuffer!, "original.jpg", {
      type: "image/jpeg",
    });

    const editResponse = await openai.images.edit({
      model: "gpt-image-1",
      image: imageFile,
      prompt: postcardPrompt,
      n: 1,
      size: "1536x1024",
    });

    const imageUrl = editResponse.data?.[0]?.url;
    if (!imageUrl) throw new Error("No image returned from edit endpoint");

    // Fetch the image from the URL
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) throw new Error("Failed to fetch generated image");
    const arrayBuffer = await imageResponse.arrayBuffer();
    const b64 = Buffer.from(arrayBuffer).toString("base64");

    const buffer = Buffer.from(b64, "base64");
    console.log("Generated variant image buffer size:", buffer.length);

    // Create a file-like object for Payload
    const file = {
      data: buffer,
      mimetype: "image/png",
      name: `variant-${Date.now()}.png`,
      size: buffer.length,
    };

    // Upload to media collection
    console.log("Uploading to media collection...");
    const uploadedImage = await payload.create({
      collection: "media",
      data: {
        alt: `${design.name} - ${variantStyle}`,
      },
      file,
    });
    console.log("Uploaded image ID:", uploadedImage.id);

    // Update the design's imageVariants array
    const currentVariants = design.imageVariants || [];
    await payload.update({
      collection: "postcard-designs",
      id: designId,
      data: {
        imageVariants: [...currentVariants, uploadedImage.id],
      },
    });

    return { variantImage: uploadedImage, variantStyle };
  } catch (error) {
    console.error("Error generating variant - full details:", error);
    console.error(
      "Error message:",
      error instanceof Error ? error.message : "Unknown error"
    );
    throw new Error("Failed to generate variant image");
  }
}
