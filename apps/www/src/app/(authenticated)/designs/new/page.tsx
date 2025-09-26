"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createDesign } from "@/app/actions/designs";
import { uploadImage } from "@/app/actions/upload";
import { Button, Input, Textarea, ErrorMessage, ImageUpload } from "@repo/ui";

export default function NewDesignPage() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
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
    if (!name || !imageFile) {
      setError("Name and image are required");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Upload the image first
      const formData = new FormData();
      formData.append("file", imageFile);
      const uploadedImage = await uploadImage(formData);

      // Create the design with the uploaded image
      await createDesign({
        name,
        description,
        category: "custom",
        frontImage: uploadedImage.id,
        backgroundColor: "#ffffff",
        textColor: "#000000",
        font: "sans",
        layout: "full-image",
        isPublic: false,
      });

      router.push("/designs");
      router.refresh();
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
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            Create New Design
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && <ErrorMessage>{error}</ErrorMessage>}

            <Input
              label="Design Name"
              id="name"
              type="text"
              value={name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setName(e.target.value)
              }
              required
              disabled={loading}
              placeholder="My Swiss Postcard"
            />

            <Textarea
              label="Description (optional)"
              id="description"
              value={description}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setDescription(e.target.value)
              }
              rows={3}
              disabled={loading}
              placeholder="A beautiful postcard design..."
            />

            <ImageUpload
              label="Postcard Image"
              value={imageFile}
              preview={imagePreview}
              onChange={handleImageChange}
              disabled={loading}
            />

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
                disabled={!imageFile || !name}
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
