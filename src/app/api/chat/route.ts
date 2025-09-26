import { anthropic } from "@ai-sdk/anthropic";
import { streamText } from "ai";

// Dynamically set runtime for edge compatibility
export const runtime = "edge";

// Configure maximum duration for Vercel (in seconds)
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    // Validate API key is present
    if (!process.env.ANTHROPIC_API_KEY) {
      return new Response(
        JSON.stringify({
          error: "ANTHROPIC_API_KEY is not configured. Please set it in your environment variables."
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    const { messages } = await req.json();

    // Validate messages
    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: "Invalid messages format" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    const result = streamText({
      model: anthropic("claude-3-haiku-20240307"),
      messages,
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error("Chat API error:", error);

    return new Response(
      JSON.stringify({
        error: "An error occurred while processing your request",
        details: error instanceof Error ? error.message : "Unknown error"
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
}
