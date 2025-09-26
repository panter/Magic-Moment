"use server";

import { getPayload } from "payload";
import configPromise from "../../../payload.config";
import { cookies } from "next/headers";
import OpenAI from "openai";
import { describeImage } from "@/lib/image-analysis";
import { MESSAGE_CHAR_LIMIT } from "@/lib/constants";
import { createVariant as createVariantImport } from "./createVariant";
import type { CreateDesignInput, UpdateDesignInput } from "./types";

export async function getUserDesigns() {
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

  const designs = await payload.find({
    collection: "postcard-designs",
    where: {
      createdBy: {
        equals: user.id,
      },
    },
    sort: "-createdAt",
  });

  return designs;
}

export async function createDesign(data: CreateDesignInput) {
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

  // If no description provided, generate it from the image
  let finalData = { ...data };

  // Set imageOriginal from frontImage if provided (for backward compatibility)
  if (data.frontImage && !data.imageOriginal) {
    finalData.imageOriginal = data.frontImage;
  }

  // Log incoming data for debugging
  console.log("createDesign received data:", {
    hasDescription: !!data.description,
    hasLatitude: !!data.latitude,
    hasLongitude: !!data.longitude,
    hasBrowserLatitude: !!data.browserLatitude,
    hasBrowserLongitude: !!data.browserLongitude,
    browserCoords: data.browserLatitude && data.browserLongitude ?
      { lat: data.browserLatitude, lng: data.browserLongitude } : null
  });

  // STEP 1: Set coordinates FIRST (highest priority)
  // If design already has coordinates, use them
  if (data.latitude && data.longitude) {
    finalData.latitude = data.latitude;
    finalData.longitude = data.longitude;
    if (data.locationName) {
      finalData.locationName = data.locationName;
    }
    console.log("✅ Using existing coordinates from data");
  }
  // Otherwise, use browser location if available
  else if (data.browserLatitude && data.browserLongitude) {
    finalData.latitude = data.browserLatitude;
    finalData.longitude = data.browserLongitude;
    console.log("✅ Using browser location as primary source:", {
      latitude: data.browserLatitude,
      longitude: data.browserLongitude,
    });

    // Try to get location name for browser coordinates
    try {
      const { geocodeCoordinates } = await import("@/lib/exif-location");
      const locationResult = await geocodeCoordinates(data.browserLatitude, data.browserLongitude);
      if (locationResult.locationName) {
        finalData.locationName = locationResult.locationName;
        console.log("Got location name for browser coordinates:", locationResult.locationName);
      }
    } catch (err) {
      console.error("Error getting location name for browser coordinates:", err);
    }
  }

  // STEP 2: Generate description and try EXIF as fallback for geo (but don't override browser location)
  if (finalData.imageOriginal) {
    try {
      const needsDescription = !data.description && !finalData.description;
      const stillNeedsGeoData = !finalData.latitude && !finalData.longitude;

      if (needsDescription || stillNeedsGeoData) {
        console.log("Analyzing image", { needsDescription, stillNeedsGeoData });
        const analysisResult = await describeImage(finalData.imageOriginal, token.value);

        // Use description if not provided
        if (needsDescription && analysisResult.description) {
          finalData.description = analysisResult.description;
          console.log("Generated description:", analysisResult.description);
        }

        // Only use EXIF geo data if we don't have any coordinates yet (as fallback)
        if (stillNeedsGeoData && analysisResult.geoData) {
          if (analysisResult.geoData.latitude && analysisResult.geoData.longitude) {
            finalData.latitude = analysisResult.geoData.latitude;
            finalData.longitude = analysisResult.geoData.longitude;
            if (analysisResult.geoData.locationName) {
              finalData.locationName = analysisResult.geoData.locationName;
            }
            console.log("✅ No browser location, using EXIF geo data as fallback:", analysisResult.geoData);
          }
        }
      }
    } catch (error) {
      console.error("Error analyzing image (continuing without description):", error);
      // Continue - coordinates from browser are already set if available
    }
  }

  // Clean up browser location fields (don't store them in the database)
  delete finalData.browserLatitude;
  delete finalData.browserLongitude;

  // Log final data being saved
  console.log("Final design data being saved:", {
    hasLatitude: !!finalData.latitude,
    hasLongitude: !!finalData.longitude,
    hasLocationName: !!finalData.locationName,
    latitude: finalData.latitude,
    longitude: finalData.longitude,
    locationName: finalData.locationName,
  });

  const design = await payload.create({
    collection: "postcard-designs",
    data: {
      ...finalData,
      createdBy: user.id,
    },
  });

  return design;
}

export async function updateDesign(id: string, data: UpdateDesignInput) {
  const payload = await getPayload({ config: configPromise });
  const token = (await cookies()).get("payload-token");

  if (!token) {
    throw new Error("Not authenticated");
  }

  const design = await payload.update({
    collection: "postcard-designs",
    id,
    data,
  });

  return design;
}

export async function deleteDesign(id: string) {
  const payload = await getPayload({ config: configPromise });
  const token = (await cookies()).get("payload-token");

  if (!token) {
    throw new Error("Not authenticated");
  }

  await payload.delete({
    collection: "postcard-designs",
    id,
  });

  return { success: true };
}

export async function getDesignById(id: string) {
  const payload = await getPayload({ config: configPromise });

  const design = await payload.findByID({
    collection: "postcard-designs",
    id,
  });

  return design;
}

export async function getDesign(id: string) {
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

  const design = await payload.findByID({
    collection: "postcard-designs",
    id,
    depth: 2, // Include related media with full details
  });

  // Add image URLs
  let frontImageUrl = null;
  let imageOriginalUrl = null;
  let imageVariantsData: Array<{ id: string; url: string; alt: string }> = [];

  if (design.frontImage && typeof design.frontImage === "object") {
    frontImageUrl = design.frontImage.url;
  }

  if (design.imageOriginal && typeof design.imageOriginal === "object") {
    imageOriginalUrl = design.imageOriginal.url;
  }

  // Process image variants
  if (design.imageVariants && Array.isArray(design.imageVariants)) {
    imageVariantsData = design.imageVariants
      .filter((variant: any) => variant && typeof variant === "object")
      .map((variant: any) => ({
        id: variant.id,
        url: variant.url,
        alt: variant.alt || "Variant image"
      }));
  }

  return {
    ...design,
    frontImageUrl,
    imageOriginalUrl,
    imageVariantsData,
    // Ensure fields exist for TypeScript
    imageOriginal: design.imageOriginal,
    frontImage: design.frontImage,
  };
}

export async function generatePostcardMessage(
  designId: string,
  currentMessage?: string,
  imageId?: string,
  retryCount = 0
) {
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

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OpenAI API key is not configured");
  }

  const openai = new OpenAI({ apiKey });

  // Get or generate image description
  let description = "";

  // First try to get existing design description
  const design = await payload.findByID({
    collection: "postcard-designs",
    id: designId,
    depth: 1,
  });

  description = design.description;

  // If no description or geo data, analyze the image
  const needsDescription = !description;
  const needsGeoData = !design.latitude && !design.longitude;

  if ((needsDescription || needsGeoData) && (imageId || design.frontImage)) {
    const imageToDescribe = imageId || design.frontImage;
    try {
      const analysisResult = await describeImage(imageToDescribe, token.value);

      // Use the description from the analysis
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

      // Save the generated description and/or geo data
      if (Object.keys(updateData).length > 0) {
        await payload.update({
          collection: "postcard-designs",
          id: designId,
          data: updateData,
        });
        console.log("Updated design with:", updateData);
      }
    } catch (error) {
      console.error("Error analyzing image:", error);
    }
  }

  // Generate postcard message
  try {
    const prompt = currentMessage
      ? `You have a postcard with this image: "${description}".
         The current message is: "${currentMessage}".
         Generate an improved, creative postcard message that builds on the current message.
         IMPORTANT: Keep it under ${MESSAGE_CHAR_LIMIT} characters (including spaces and punctuation).
         Make it personal, warm, and natural.`
      : `You have a postcard with this image: "${description || 'a beautiful scene'}".
         Generate a creative, warm postcard message that relates to the image.
         IMPORTANT: Keep it under ${MESSAGE_CHAR_LIMIT} characters (including spaces and punctuation).
         Make it personal and heartfelt, as if written to a dear friend.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a creative writer helping to compose heartfelt postcard messages. Write in first person, as if the sender is writing to someone they care about. STRICT LIMIT: ${MESSAGE_CHAR_LIMIT} characters maximum. Be concise but meaningful.`
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 100,
      temperature: 0.8,
    });

    const generatedMessage = response.choices[0].message.content?.trim();

    if (!generatedMessage) {
      throw new Error("Failed to generate message");
    }

    // Check if message is within limit, retry if too long
    if (generatedMessage.length > MESSAGE_CHAR_LIMIT && retryCount < 3) {
      console.log(`Message too long (${generatedMessage.length} chars), retrying...`);
      return generatePostcardMessage(designId, currentMessage, imageId, retryCount + 1);
    }

    // If still too long after retries, truncate
    const finalMessage = generatedMessage.length > MESSAGE_CHAR_LIMIT
      ? generatedMessage.substring(0, MESSAGE_CHAR_LIMIT - 3) + "..."
      : generatedMessage;

    return { message: finalMessage, description, charCount: finalMessage.length };
  } catch (error) {
    console.error("Error generating postcard message:", error);
    throw new Error("Failed to generate message");
  }
}

// Re-export createVariant
export const createVariant = createVariantImport;
