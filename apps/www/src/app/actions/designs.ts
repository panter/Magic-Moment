"use server";

import { getPayload } from "payload";
import configPromise from "../../../payload.config";
import { cookies } from "next/headers";
import OpenAI from "openai";
import { describeImage } from "@/lib/image-analysis";
import { MESSAGE_CHAR_LIMIT } from "@/lib/constants";
import { createVariant as createVariantImport } from "./createVariant";

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

export async function createDesign(data: any) {
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

  if (!data.description && finalData.imageOriginal) {
    try {
      console.log("Generating automatic description for new design");
      const description = await describeImage(finalData.imageOriginal, token.value);
      finalData.description = description;
      console.log("Generated description:", description);
    } catch (error) {
      console.error("Error generating description:", error);
      // Continue without description if generation fails
    }
  }

  const design = await payload.create({
    collection: "postcard-designs",
    data: {
      ...finalData,
      createdBy: user.id,
    },
  });

  return design;
}

export async function updateDesign(id: string, data: any) {
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
  let imageVariantsData = [];

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

  // If no description and we have an image, generate one
  if (!description && (imageId || design.frontImage)) {
    const imageToDescribe = imageId || design.frontImage;
    try {
      description = await describeImage(imageToDescribe, token.value);

      // Save the generated description
      await payload.update({
        collection: "postcard-designs",
        id: designId,
        data: { description },
      });
    } catch (error) {
      console.error("Error generating description:", error);
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
