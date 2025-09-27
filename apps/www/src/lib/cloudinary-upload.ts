export interface CloudinaryUploadResponse {
  secure_url: string;
  public_id: string;
  format: string;
  width?: number;
  height?: number;
  resource_type: "image" | "video";
  duration?: number;
  eager?: Array<{
    secure_url: string;
  }>;
}

export interface DirectUploadResult {
  url: string;
  publicId: string;
  thumbnailUrl?: string;
  resourceType: "image" | "video";
  duration?: number;
}

async function getUploadSignature(
  resourceType: "image" | "video" = "image",
  needsFormatConversion: boolean = false,
): Promise<{
  signature: string;
  timestamp: number;
  cloudName: string;
  apiKey: string;
}> {
  const response = await fetch("/api/cloudinary-signature", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ resourceType, needsFormatConversion }),
  });

  if (!response.ok) {
    throw new Error("Failed to get upload signature");
  }

  return response.json();
}

export async function uploadToCloudinary(
  file: File,
  onProgress?: (progress: number) => void,
): Promise<DirectUploadResult> {
  const isVideo = file.type.startsWith("video/");
  const resourceType = isVideo ? "video" : "image";

  // Check if it's a HEIC file
  const isHeic = file.type.includes("heic") ||
                 file.type.includes("heif") ||
                 file.name.toLowerCase().endsWith(".heic") ||
                 file.name.toLowerCase().endsWith(".heif");

  // Get signature from server
  const { signature, timestamp, cloudName, apiKey } =
    await getUploadSignature(resourceType, isHeic && !isVideo);

  // Prepare form data
  const formData = new FormData();
  formData.append("file", file);
  formData.append("api_key", apiKey);
  formData.append("timestamp", timestamp.toString());
  formData.append("signature", signature);
  formData.append("folder", `magic-moment/${isVideo ? "videos" : "images"}`);

  // Add format conversion for HEIC files
  if (isHeic && !isVideo) {
    console.log("HEIC file detected, requesting JPEG conversion from Cloudinary");
    formData.append("format", "jpg");
    // Note: quality parameter doesn't need to be in the signature
  }

  // Add eager transformation for video thumbnails
  if (isVideo) {
    formData.append("eager", "w_1200,h_850,c_fill,g_auto,f_jpg,q_auto:best");
    formData.append("eager_async", "false");
  }

  // Upload to Cloudinary
  const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`;

  // Use XMLHttpRequest for progress tracking
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable && onProgress) {
        const progress = Math.round((event.loaded / event.total) * 100);
        onProgress(progress);
      }
    });

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const response: CloudinaryUploadResponse = JSON.parse(xhr.responseText);

        // Extract thumbnail URL for videos
        let thumbnailUrl: string | undefined;
        if (isVideo && response.eager?.[0]) {
          thumbnailUrl = response.eager[0].secure_url;
        } else if (isVideo) {
          // Fallback: replace video extension with .jpg
          thumbnailUrl = response.secure_url.replace(
            /\.(mp4|mov|avi|webm)$/i,
            ".jpg",
          );
        }

        // For HEIC files, the response URL will be the converted JPEG
        if (isHeic && !isVideo) {
          console.log("HEIC converted to JPEG, URL:", response.secure_url);
        }

        resolve({
          url: response.secure_url,
          publicId: response.public_id,
          thumbnailUrl,
          resourceType: response.resource_type,
          duration: response.duration,
        });
      } else {
        reject(new Error(`Upload failed with status ${xhr.status}`));
      }
    });

    xhr.addEventListener("error", () => {
      reject(new Error("Upload failed"));
    });

    xhr.open("POST", uploadUrl);
    xhr.send(formData);
  });
}

export async function convertHeicToJpeg(file: File): Promise<File> {
  // Check if we need to convert
  if (
    !file.type.includes("heic") &&
    !file.type.includes("heif") &&
    !file.name.toLowerCase().endsWith(".heic")
  ) {
    return file;
  }

  // For HEIC/HEIF files, we'll need to handle them differently
  // Since browsers don't natively support HEIC, we'll need to either:
  // 1. Use a library like heic2any (requires additional package)
  // 2. Convert server-side after upload
  // For now, we'll return the original file and let Cloudinary handle it
  console.warn(
    "HEIC/HEIF file detected. Cloudinary will handle the conversion.",
  );
  return file;
}
