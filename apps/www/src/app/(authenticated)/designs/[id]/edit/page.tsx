"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { getDesign, updateDesign } from "@/app/actions/designs";
import { uploadImage } from "@/app/actions/upload";
import { Button, Input, Textarea, ErrorMessage, ImageUpload, PostcardPreview } from "@repo/ui";

export default function EditDesignPage() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [currentImageId, setCurrentImageId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingDesign, setLoadingDesign] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  useEffect(() => {
    async function loadDesign() {
      try {
        const design = await getDesign(id);
        if (!design) {
          setError("Design not found");
          return;
        }
        setName(design.name);
        setDescription(design.description || "");
        setMessage(design.defaultMessage || "Greetings from Switzerland!\n\nHaving a wonderful time exploring the beautiful Swiss Alps. The views are breathtaking and the chocolate is delicious!\n\nWish you were here!");
        setCurrentImageId(design.frontImage);
        // If design has an image, set it as preview
        if (design.frontImageUrl) {
          setImagePreview(design.frontImageUrl);
        }
      } catch (err) {
        console.error("Error loading design:", err);
        setError("Failed to load design");
      } finally {
        setLoadingDesign(false);
      }
    }
    loadDesign();
  }, [id]);

  const handleImageChange = (file: File | null) => {
    setImageFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      // If removing new image, restore original if it exists
      if (currentImageId) {
        // Keep the existing preview
      } else {
        setImagePreview(null);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      setError("Name is required");
      return;
    }

    setLoading(true);
    setError("");

    try {
      let imageId = currentImageId;

      // If a new image was selected, upload it
      if (imageFile) {
        const formData = new FormData();
        formData.append("file", imageFile);
        const uploadedImage = await uploadImage(formData);
        imageId = uploadedImage.id;
      }

      // Update the design
      await updateDesign(id, {
        name,
        description,
        defaultMessage: message,
        frontImage: imageId || "",
      });

      router.push("/designs");
      router.refresh();
    } catch (err) {
      console.error("Error updating design:", err);
      setError("Failed to update design");
      setLoading(false);
    }
  };

  if (loadingDesign) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-amber-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/3 mb-8"></div>
              <div className="space-y-6">
                <div className="h-10 bg-gray-200 rounded"></div>
                <div className="h-20 bg-gray-200 rounded"></div>
                <div className="h-64 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-amber-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
          Edit Design
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form Section */}
          <div className="bg-white rounded-2xl shadow-xl p-8">

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

            <Textarea
              label="Default Message"
              id="message"
              value={message}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setMessage(e.target.value)
              }
              rows={5}
              disabled={loading}
              placeholder="Write your postcard message here..."
            />

            <ImageUpload
              label="Postcard Image"
              value={imageFile}
              preview={imagePreview}
              onChange={handleImageChange}
              disabled={loading}
            />
            {!imageFile && currentImageId && (
              <p className="text-sm text-gray-600 -mt-4">
                Current image will be kept if no new image is selected
              </p>
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
                disabled={!name}
                loading={loading}
              >
                {loading ? "Updating..." : "Update Design"}
              </Button>
            </div>
          </form>
          </div>

          {/* Preview Section */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Preview
            </h2>
            <PostcardPreview
              frontImage={imagePreview}
              message={message || "Your message will appear here..."}
              recipientName="Jane Smith"
              recipientAddress="456 Oak Avenue\n8002 Zurich\nSwitzerland"
            />
          </div>
        </div>
      </div>
    </div>
  );
}