import { NextResponse } from "next/server";

export async function GET() {
  // Check which providers are configured based on environment variables
  const providers = {
    google: !!(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET),
    github: !!(process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET),
    apple: !!(process.env.AUTH_APPLE_ID && process.env.AUTH_APPLE_SECRET),
    linkedin: !!(
      process.env.AUTH_LINKEDIN_ID && process.env.AUTH_LINKEDIN_SECRET
    ),
  };

  return NextResponse.json(providers);
}
