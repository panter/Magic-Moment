"use server";

import { getPayload } from "payload";
import configPromise from "../../../payload.config";
import { cookies } from "next/headers";
import OpenAI from "openai";
import { describeImage } from "@/lib/image-analysis";

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
    const analysisResult = await describeImage(design.imageOriginal, token.value);

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
    const words = customPrompt.split(' ').slice(0, 3);
    variantStyle = words.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
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

  // Create a creative prompt based on the analyzed image and description
  let postcardPrompt = "";

  if (customPrompt) {
    // Use the custom prompt provided by the user
    postcardPrompt = `Create a postcard variant of: "${
      design.name
    }"

    Original image description: ${description}

    Apply this specific style transformation: ${customPrompt}

    Include this text elegantly integrated into the design: "${
      description || "Greetings from a magical place!"
    }"

    Make sure the text is clear and readable while being part of the artistic design.
    Keep the essence of the original while applying the requested style transformation.`;
  } else {
    // Use the default creative prompt
    postcardPrompt = `Create a postcard variant of: "${
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
  }

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