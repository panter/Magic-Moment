export interface ConversionResult {
  buffer: Buffer;
  mimetype: string;
  filename: string;
  cloudinaryUrl?: string;
}

async function uploadToCloudinaryForConversion(
  buffer: Buffer,
  filename: string
): Promise<{ url: string; buffer: Buffer }> {
  // Get upload signature from API
  const signatureResponse = await fetch("/api/cloudinary-signature", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ resourceType: "image" }),
  });

  if (!signatureResponse.ok) {
    throw new Error("Failed to get upload signature");
  }

  const { signature, timestamp, cloudName, apiKey } = await signatureResponse.json();

  // Create form data
  const formData = new FormData();
  // Convert buffer to Uint8Array for Blob constructor
  const uint8Array = new Uint8Array(buffer);
  formData.append("file", new Blob([uint8Array], { type: "image/heic" }), filename);
  formData.append("api_key", apiKey);
  formData.append("timestamp", timestamp.toString());
  formData.append("signature", signature);
  formData.append("folder", "magic-moment/converted");
  // Force conversion to JPEG
  formData.append("format", "jpg");
  formData.append("quality", "auto:best");

  // Upload to Cloudinary
  const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
  const uploadResponse = await fetch(uploadUrl, {
    method: "POST",
    body: formData,
  });

  if (!uploadResponse.ok) {
    throw new Error("Failed to upload to Cloudinary");
  }

  const result = await uploadResponse.json();

  // Download the converted JPEG from Cloudinary
  const convertedResponse = await fetch(result.secure_url);
  if (!convertedResponse.ok) {
    throw new Error("Failed to download converted image");
  }

  const convertedBuffer = Buffer.from(await convertedResponse.arrayBuffer());

  return {
    url: result.secure_url,
    buffer: convertedBuffer,
  };
}

export async function convertHeicToJpegServerSide(
  buffer: Buffer,
  filename: string,
  mimetype: string
): Promise<ConversionResult> {
  console.log("mimetype:", mimetype);
  console.log("filename:", filename);

  if (
    mimetype.includes("heic") ||
    mimetype.includes("heif") ||
    filename.toLowerCase().endsWith(".heic") ||
    filename.toLowerCase().endsWith(".heif")
  ) {
    console.log("Converting HEIC/HEIF to JPEG using Cloudinary...");
    try {
      const { url, buffer: convertedBuffer } = await uploadToCloudinaryForConversion(buffer, filename);

      return {
        buffer: convertedBuffer,
        mimetype: "image/jpeg",
        filename: filename.replace(/\.(heic|heif)$/i, ".jpg"),
        cloudinaryUrl: url,
      };
    } catch (error) {
      console.error("Error converting HEIC/HEIF to JPEG via Cloudinary:", error);
      // Return original if conversion fails
      return { buffer, mimetype, filename };
    }
  }

  // Return original if not HEIC/HEIF
  return { buffer, mimetype, filename };
}