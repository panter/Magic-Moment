import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export default cloudinary;

export async function uploadVideoToCloudinary(
  videoBuffer: Buffer,
  filename: string,
): Promise<{
  videoUrl: string;
  thumbnailUrl: string;
  publicId: string;
  duration?: number;
}> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: "video",
        folder: "magic-moment/videos",
        public_id: `video_${Date.now()}_${filename.replace(/\.[^/.]+$/, "")}`,
        eager: [
          {
            width: 1200,
            height: 850,
            crop: "fill",
            gravity: "auto",
            format: "jpg",
            quality: "auto:best",
          },
        ],
        eager_async: false,
      },
      (error, result) => {
        if (error) {
          console.error("Cloudinary upload error:", error);
          reject(error);
        } else if (result) {
          const thumbnailUrl =
            result.eager?.[0]?.secure_url ||
            result.secure_url.replace(/\.(mp4|mov|avi|webm)$/i, ".jpg");

          resolve({
            videoUrl: result.secure_url,
            thumbnailUrl,
            publicId: result.public_id,
            duration: result.duration,
          });
        }
      },
    );

    uploadStream.end(videoBuffer);
  });
}

export function isVideoFile(filename: string, mimetype?: string): boolean {
  const videoExtensions = [".mp4", ".mov", ".avi", ".webm", ".m4v", ".mkv"];
  const videoMimeTypes = [
    "video/mp4",
    "video/quicktime",
    "video/x-msvideo",
    "video/webm",
    "video/x-m4v",
    "video/x-matroska",
  ];

  const hasVideoExtension = videoExtensions.some((ext) =>
    filename.toLowerCase().endsWith(ext),
  );

  const hasVideoMimeType = mimetype
    ? videoMimeTypes.includes(mimetype.toLowerCase())
    : false;

  return hasVideoExtension || hasVideoMimeType;
}
