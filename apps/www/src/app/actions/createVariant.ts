"use server";

import { getPayload } from "payload";
import configPromise from "../../../payload.config";
import { cookies } from "next/headers";
import OpenAI from "openai";
import { describeImage } from "@/lib/image-analysis";

export async function createVariant(designId: string) {
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
  if (!description) {
    if (!design.imageOriginal) {
      throw new Error("No original image found on design");
    }

    // Describe the image using the extracted function
    description = await describeImage(design.imageOriginal, token.value);

    // Persist the generated description on the design so we can reuse it later
    await payload.update({
      collection: "postcard-designs",
      id: designId,
      data: { description },
    });

    console.log("Generated and saved description:", description);
  }

  // Generate a creative variant style name with AI
  let variantStyle = "Magic Edition";
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

  // Create a creative prompt based on the analyzed image and description
  const postcardPrompt = `Create a postcard variant of: "${
    design.name
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