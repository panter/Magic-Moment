"use server";

import { getPayload } from "payload";
import configPromise from "../../../payload.config";
import { cookies } from "next/headers";
import OpenAI from "openai";
import { describeImage } from "@/lib/image-analysis";

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
  if (!data.description && data.frontImage) {
    try {
      console.log("Generating automatic description for new design");
      const description = await describeImage(data.frontImage, token.value);
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
    depth: 1, // Include related media
  });

  // Add image URL if frontImage exists
  let frontImageUrl = null;
  if (design.frontImage && typeof design.frontImage === "object") {
    frontImageUrl = design.frontImage.url;
  }

  return {
    ...design,
    frontImageUrl,
  };
}


export async function createVariant(originalId: string) {
  console.log("=== Starting variant creation for design:", originalId);
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

  // Get the original design with media
  const original = await payload.findByID({
    collection: "postcard-designs",
    id: originalId,
    depth: 2,
  });

  if (!original) {
    throw new Error("Original design not found");
  }

  // Log the frontImage structure to understand what we're dealing with
  console.log(
    "Original frontImage structure:",
    JSON.stringify(original.frontImage, null, 2)
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
  let description = original.description;
  if (!description) {
    if (!original.frontImage) {
      throw new Error("No frontImage found on original design");
    }

    // Describe the image using the extracted function
    description = await describeImage(original.frontImage, token.value);

    // Persist the generated description on the original design so we can reuse it later
    await payload.update({
      collection: "postcard-designs",
      id: originalId,
      data: { description },
    });

    console.log("Generated and saved description:", description);
  }

  // Generate a creative variant name with AI
  let variantName = `${original.name} - Variant`;
  try {
    const nameResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            'Generate a creative, short suffix for a postcard variant. Return only 1-3 words that describe a unique style or mood. Examples: "Sunset Dreams", "Vintage Romance", "Ocean Breeze"',
        },
        {
          role: "user",
          content: `Create a variant name suffix for a postcard with this description: "${
            description || original.name
          }"`,
        },
      ],
      max_tokens: 20,
    });
    const suffix =
      nameResponse.choices[0].message.content?.trim() || "Magic Edition";
    variantName = `${original.name} - ${suffix}`;
  } catch (error) {
    console.error("Error generating variant name:", error);
  }

  // Create a creative prompt based on the analyzed image and description
  const postcardPrompt = `Create a postcard out of the original image: "${
    original.name
  }"

    Original image description: ${description}

    Create a variation that transforms the original concept while keeping its essence.
    Include this text elegantly integrated into the design: "${
      description || "Greetings from a magical place!"
    }"

    Make it visually striking with:
    - A creative reinterpretation of the original theme
    - Rich colors and interesting composition
    - A sense of wonder and delight
    - Clear, readable text that's part of the artistic design
    - A unique artistic style (e.g., vintage, impressionist, modern art, fantasy)

    Style: Make it look like a premium artistic postcard with a distinct style different from the original.`;

  try {
    console.log("Generating image with prompt:", postcardPrompt);

    // Generate new image with DALL-E 3
    const imageResponse = await openai.images.generate({
      model: "dall-e-3",
      prompt: postcardPrompt,
      n: 1,
      size: "1792x1024",
      quality: "standard",
      style: "vivid",
    });

    const imageUrl = imageResponse.data?.[0]?.url;
    console.log("Generated image URL:", imageUrl);

    if (!imageUrl) throw new Error("No image generated");

    // Download the image
    console.log("Downloading generated image...");
    const imageBuffer = await fetch(imageUrl).then((res) => res.arrayBuffer());
    const buffer = Buffer.from(imageBuffer);
    console.log("Downloaded image size:", buffer.length);

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
        alt: `${variantName}`,
      },
      file,
    });
    console.log("Uploaded image ID:", uploadedImage.id);

    // Create the variant with the new image
    const variant = await payload.create({
      collection: "postcard-designs",
      data: {
        name: variantName,
        description: description,
        frontImage: uploadedImage.id,
        backgroundColor: original.backgroundColor,
        textColor: original.textColor,
        font: original.font,
        layout: original.layout,
        defaultMessage: original.defaultMessage,
        category: original.category,
        isPublic: false,
        originalDesign: originalId,
        isVariant: true,
        variantPrompt: postcardPrompt,
        createdBy: user.id,
      },
    });

    // Update the original design's variants array
    const currentVariants = original.variants || [];
    await payload.update({
      collection: "postcard-designs",
      id: originalId,
      data: {
        variants: [...currentVariants, variant.id],
      },
    });

    return variant;
  } catch (error) {
    console.error("Error generating variant - full details:", error);
    console.error(
      "Error message:",
      error instanceof Error ? error.message : "Unknown error"
    );
    console.error("Falling back to original image");
    // Fallback: create variant with original image
    const variant = await payload.create({
      collection: "postcard-designs",
      data: {
        name: variantName,
        description: description,
        frontImage: original.frontImage?.id || original.frontImage,
        backgroundColor: original.backgroundColor,
        textColor: original.textColor,
        font: original.font,
        layout: original.layout,
        defaultMessage: original.defaultMessage,
        category: original.category,
        isPublic: false,
        originalDesign: originalId,
        isVariant: true,
        variantPrompt: postcardPrompt,
        createdBy: user.id,
      },
    });

    // Update the original design's variants array
    const currentVariants = original.variants || [];
    await payload.update({
      collection: "postcard-designs",
      id: originalId,
      data: {
        variants: [...currentVariants, variant.id],
      },
    });

    return variant;
  }
}
