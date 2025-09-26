"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createDesign } from "@/app/actions/designs";
import { uploadImage } from "@/app/actions/upload";
import { Button, ErrorMessage, ImageUpload } from "@repo/ui";

export default function NewDesignPage() {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleImageChange = (file: File | null) => {
    setImageFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
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
      const design = await createDesign({
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
      });

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
            Upload an image and we'll automatically generate a name and description for your postcard design.
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
                  Description will be generated automatically from the image content
                </p>
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
