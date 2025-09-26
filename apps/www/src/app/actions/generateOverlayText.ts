"use server";

import OpenAI from "openai";

interface GenerateOverlayTextParams {
  locationName?: string;
  message?: string;
  description?: string;
}

export async function generateOverlayText({
  locationName,
  message,
  description,
}: GenerateOverlayTextParams): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    // Fallback to simple text if OpenAI is not configured
    if (locationName) {
      const cityName = locationName.split(',')[0].trim();
      return cityName;
    }
    return new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  }

  const openai = new OpenAI({ apiKey });

  try {
    // Build context for the LLM
    const contextParts = [];
    if (locationName) {
      contextParts.push(`The photo was taken in ${locationName}.`);
    }
    if (description) {
      contextParts.push(`The image shows: ${description}`);
    }
    if (message) {
      contextParts.push(`The postcard message says: "${message}"`);
    }

    const context = contextParts.join(' ');

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a creative postcard overlay text generator. Generate a SHORT, memorable text overlay for a postcard.

Rules:
- Maximum 2-3 words total
- For multi-line text, put each line on a separate line (press enter for line breaks)
- Be specific to the context provided
- Avoid generic phrases like "Wish you were here" or "Adventure awaits"
- If a location is mentioned, you can use it creatively
- Consider the mood and content of the message and image description
- Be concise and impactful
- You can use the local language if appropriate (e.g., "Grüezi" for Zurich)

Examples of good overlays (shown with actual line breaks):
Zurich
2025

or:

Alpine
Dreams

or:

Golden Hour

Return ONLY the text overlay itself, without any quotes or formatting. Do not wrap the response in quotes.`,
        },
        {
          role: "user",
          content: context || "Generate a creative postcard overlay text.",
        },
      ],
      temperature: 0.9,
      max_tokens: 20,
    });

    let generatedText = completion.choices[0]?.message?.content?.trim();

    if (!generatedText) {
      throw new Error("No text generated");
    }

    // Clean up the response
    // Remove surrounding quotes if present
    generatedText = generatedText.replace(/^["']|["']$/g, '');
    // Remove any escaped quotes
    generatedText = generatedText.replace(/\\"/g, '"');
    generatedText = generatedText.replace(/\\'/g, "'");

    return generatedText;
  } catch (error) {
    console.error("Error generating overlay text:", error);

    // Fallback to simple text
    if (locationName) {
      const cityName = locationName.split(',')[0].trim();
      return cityName;
    }
    return new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  }
}