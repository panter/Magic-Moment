import { NextResponse } from "next/server";
import { getAvailableProviders } from "@/lib/auth.config";

export async function GET() {
  const availableProviders = getAvailableProviders();

  // Return an object matching NextAuth's provider format
  const providers: Record<string, any> = {};

  availableProviders.forEach((provider) => {
    providers[provider] = {
      id: provider,
      name: provider.charAt(0).toUpperCase() + provider.slice(1),
    };
  });

  return NextResponse.json(providers);
}
