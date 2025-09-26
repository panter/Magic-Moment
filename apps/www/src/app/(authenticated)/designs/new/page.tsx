"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createDesign } from "@/app/actions/designs";
import { uploadImage } from "@/app/actions/upload";
import { Button, ErrorMessage, ImageUpload } from "@repo/ui";
import { useGeolocation } from "@/hooks/useGeolocation";
import type { CreateDesignInput } from "@/app/actions/types";

export default function NewDesignPage() {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const { latitude, longitude, requestLocation, permissionStatus } =
    useGeolocation();
  const [locationRequested, setLocationRequested] = useState(false);

  const handleImageChange = (file: File | null) => {
    setImageFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Automatically request location when image is uploaded
      // Only if we don't have location yet and haven't asked before
      if (!latitude && !longitude && !locationRequested && permissionStatus !== "denied") {
        console.log("Auto-requesting location after image upload");
        // Small delay to ensure UI is ready
        setTimeout(() => {
          requestLocation();
          setLocationRequested(true);
        }, 100);
      }
    } else {
      setImagePreview(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageFile) {
      setError("Please select an image");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Upload the image first
      const formData = new FormData();
      formData.append("file", imageFile);
      const uploadedImage = await uploadImage(formData);

      // Generate automatic name from filename (without extension)
      const automaticName = imageFile.name
        .replace(/\.[^/.]+$/, "") // Remove extension
        .replace(/[-_]/g, " ") // Replace dashes and underscores with spaces
        .replace(/\b\w/g, (l) => l.toUpperCase()); // Capitalize first letter of each word

      // Create the design with the uploaded image
      // Description will be generated automatically on the server
      const designData: CreateDesignInput = {
        name: automaticName,
        description: "", // Will be generated automatically
        category: "custom",
        imageOriginal: uploadedImage.id,
        frontImage: uploadedImage.id,
        backgroundColor: "#ffffff",
        textColor: "#000000",
        font: "sans",
        layout: "full-image",
        isPublic: false,
      };

      // Include browser location if available (will be used as fallback if image has no EXIF)
      if (latitude && longitude) {
        designData.browserLatitude = latitude;
        designData.browserLongitude = longitude;
        console.log("Sending browser location as fallback:", {
          latitude,
          longitude,
          designData,
        });
      } else {
        console.log("No browser location available:", { latitude, longitude });
      }

      const design = await createDesign(designData);

      // Redirect to the edit page of the newly created design
      router.push(`/designs/${design.id}/edit`);
    } catch (err) {
      console.error("Error creating design:", err);
      setError("Failed to create design");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-amber-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Create New Design
          </h1>
          <p className="text-gray-600 mb-8">
            Upload an image and we'll automatically generate a name and
            description for your postcard design.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && <ErrorMessage>{error}</ErrorMessage>}

            <ImageUpload
              label="Upload Postcard Image"
              value={imageFile}
              preview={imagePreview}
              onChange={handleImageChange}
              disabled={loading}
            />

            {imageFile && (
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">
                  <span className="font-semibold">Automatic name:</span>{" "}
                  {imageFile.name
                    .replace(/\.[^/.]+$/, "")
                    .replace(/[-_]/g, " ")
                    .replace(/\b\w/g, (l) => l.toUpperCase())}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Description will be generated automatically from the image
                  content
                </p>
                {/* Location status */}
                {latitude && longitude ? (
                  <p className="text-sm text-green-600 mt-2">
                    ✅ Current location captured ({latitude.toFixed(4)}, {longitude.toFixed(4)}) - will be used if image has no GPS data
                  </p>
                ) : permissionStatus === "denied" ? (
                  <p className="text-sm text-amber-600 mt-2">
                    ⚠️ Location access denied - only image GPS data will be used
                  </p>
                ) : locationRequested ? (
                  <p className="text-sm text-blue-500 mt-2 animate-pulse">
                    ⏳ Getting your location...
                  </p>
                ) : permissionStatus === "prompt" && (
                  <button
                    type="button"
                    onClick={() => {
                      requestLocation();
                      setLocationRequested(true);
                    }}
                    className="text-sm text-blue-600 hover:text-blue-800 mt-2 underline"
                  >
                    📍 Enable location for better geotagging
                  </button>
                )}
              </div>
            )}

            <div className="flex gap-4">
              <Button
                type="button"
                onClick={() => router.push("/designs")}
                variant="secondary"
                size="lg"
                className="flex-1"
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="flex-1"
                disabled={!imageFile}
                loading={loading}
              >
                {loading ? "Creating..." : "Create Design"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
