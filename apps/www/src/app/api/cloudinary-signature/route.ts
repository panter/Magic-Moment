import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const token = (await cookies()).get("payload-token");
    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Get resource type from request
    const { resourceType = "image" } = await request.json();

    // Validate environment variables
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      console.error("Missing Cloudinary configuration");
      return NextResponse.json(
        { error: "Cloudinary not configured" },
        { status: 500 },
      );
    }

    // Generate signature
    const timestamp = Math.round(Date.now() / 1000);
    const folder = `magic-moment/${resourceType === "video" ? "videos" : "images"}`;

    // Parameters to sign (must be alphabetically sorted)
    const paramsToSign: Record<string, string | number> = {
      folder,
      timestamp,
    };

    // Add eager transformation for videos
    if (resourceType === "video") {
      paramsToSign.eager = "w_1200,h_850,c_fill,g_auto,f_jpg,q_auto:best";
      paramsToSign.eager_async = false;
    }

    // Create signature string (alphabetically sorted)
    const signatureString = Object.keys(paramsToSign)
      .sort()
      .map((key) => `${key}=${paramsToSign[key]}`)
      .join("&");

    // Generate SHA256 signature
    const signature = crypto
      .createHash("sha256")
      .update(signatureString + apiSecret)
      .digest("hex");

    return NextResponse.json({
      signature,
      timestamp,
      cloudName,
      apiKey,
    });
  } catch (error) {
    console.error("Error generating signature:", error);
    return NextResponse.json(
      { error: "Failed to generate signature" },
      { status: 500 },
    );
  }
}
