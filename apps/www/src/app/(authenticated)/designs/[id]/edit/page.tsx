"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  getDesign,
  updateDesign,
  generatePostcardMessage,
  createVariant,
} from "@/app/actions/designs";
import { MESSAGE_CHAR_LIMIT } from "@/lib/constants";
import { uploadImage } from "@/app/actions/upload";
import {
  Button,
  Input,
  Textarea,
  ErrorMessage,
  ImageUpload,
  PostcardPreview,
} from "@repo/ui";

export default function EditDesignPage() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [currentImageId, setCurrentImageId] = useState<string | null>(null);
  const [imageOriginalId, setImageOriginalId] = useState<string | null>(null);
  const [imageOriginalUrl, setImageOriginalUrl] = useState<string | null>(null);
  const [imageVariants, setImageVariants] = useState<any[]>([]);
  const [selectedImageType, setSelectedImageType] = useState<
    "original" | "variant"
  >("original");
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [loadingDesign, setLoadingDesign] = useState(true);
  const [generatingMessage, setGeneratingMessage] = useState(false);
  const [generatingVariant, setGeneratingVariant] = useState(false);
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
        setMessage(design.defaultMessage || "");
        setCurrentImageId(design.frontImage);
        setImageOriginalId(design.imageOriginal);

        // Store original image URL separately
        if (design.imageOriginalUrl) {
          setImageOriginalUrl(design.imageOriginalUrl);
        }

        // Load image variants
        if (design.imageVariantsData && design.imageVariantsData.length > 0) {
          setImageVariants(design.imageVariantsData);
          // Check if current frontImage is a variant
          const currentIsVariant = design.imageVariantsData.find(
            (v: any) =>
              v.id === design.frontImage?.id || v.id === design.frontImage
          );
          if (currentIsVariant) {
            setSelectedImageType("variant");
            setSelectedVariantId(currentIsVariant.id);
            setImagePreview(currentIsVariant.url);
          } else if (design.imageOriginalUrl) {
            setImagePreview(design.imageOriginalUrl);
          }
        } else if (design.imageOriginalUrl) {
          setImagePreview(design.imageOriginalUrl);
        } else if (design.frontImageUrl) {
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

  const generateMessage = async () => {
    setGeneratingMessage(true);
    setError("");
    try {
      const result = await generatePostcardMessage(
        id,
        message,
        imageFile ? undefined : currentImageId || undefined
      );
      setMessage(result.message);
    } catch (err) {
      console.error("Error generating message:", err);
      setError("Failed to generate message");
    } finally {
      setGeneratingMessage(false);
    }
  };

  const handleGenerateVariant = async () => {
    setGeneratingVariant(true);
    setError("");
    try {
      const result = await createVariant(id);
      // Reload the design to get the new variant
      const updatedDesign = await getDesign(id);
      if (updatedDesign.imageVariantsData) {
        setImageVariants(updatedDesign.imageVariantsData);
        // Select the new variant (it should be the last one)
        const newVariant =
          updatedDesign.imageVariantsData[
            updatedDesign.imageVariantsData.length - 1
          ];
        if (newVariant) {
          setSelectedImageType("variant");
          setSelectedVariantId(newVariant.id);
          setImagePreview(newVariant.url);
          setCurrentImageId(newVariant.id);
        }
      }
    } catch (err) {
      console.error("Error generating variant:", err);
      setError("Failed to generate variant");
    } finally {
      setGeneratingVariant(false);
    }
  };

  const handleImageChange = (file: File | null) => {
    setImageFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      // When a new file is uploaded, reset selection
      setSelectedImageType("original");
      setSelectedVariantId(null);
    } else {
      // If removing new image, restore original if it exists
      if (currentImageId) {
        // Keep the existing preview
      } else {
        setImagePreview(null);
      }
    }
  };

  const handleImageSelection = (
    type: "original" | "variant",
    variantId?: string
  ) => {
    setSelectedImageType(type);

    if (type === "original") {
      // Use stored original image URL
      if (imageOriginalUrl) {
        setImagePreview(imageOriginalUrl);
        setCurrentImageId(imageOriginalId);
      }
      setSelectedVariantId(null);
    } else if (type === "variant" && variantId) {
      // Load variant image
      const variant = imageVariants.find((v) => v.id === variantId);
      if (variant) {
        setImagePreview(variant.url);
        setCurrentImageId(variant.id);
        setSelectedVariantId(variantId);
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
        imageId = uploadedImage.id as string;

        // Update both imageOriginal and frontImage for new uploads
        await updateDesign(id, {
          name,
          description,
          defaultMessage: message,
          imageOriginal: imageId,
          frontImage: imageId,
        });
      } else {
        // Update with the selected image
        await updateDesign(id, {
          name,
          description,
          defaultMessage: message,
          frontImage: imageId || "",
        });
      }

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
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Edit Design
          </h1>
          <a
            href={`/designs/${id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-colors"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
            Preview Landing Page
            <svg
              className="w-3 h-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
          </a>
        </div>

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

              <div>
                <div className="flex items-end justify-between mb-2">
                  <div className="flex items-end gap-2">
                    <label
                      htmlFor="message"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Message
                    </label>
                    <Button
                      type="button"
                      onClick={generateMessage}
                      variant="secondary"
                      size="sm"
                      disabled={loading || generatingMessage}
                      loading={generatingMessage}
                    >
                      {generatingMessage ? "Generating..." : "✨ Generate"}
                    </Button>
                  </div>
                  <span
                    className={`text-sm ${
                      message.length > MESSAGE_CHAR_LIMIT
                        ? "text-red-600 font-semibold"
                        : message.length > MESSAGE_CHAR_LIMIT * 0.9
                        ? "text-amber-600"
                        : "text-gray-500"
                    }`}
                  >
                    {message.length}/{MESSAGE_CHAR_LIMIT}
                  </span>
                </div>
                <Textarea
                  id="message"
                  value={message}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                    const newValue = e.target.value;
                    if (newValue.length <= MESSAGE_CHAR_LIMIT) {
                      setMessage(newValue);
                    }
                  }}
                  rows={5}
                  disabled={loading || generatingMessage}
                  placeholder="Write your postcard message here..."
                />
                {message.length >= MESSAGE_CHAR_LIMIT && (
                  <p className="text-xs text-red-600 mt-1">
                    Maximum character limit reached
                  </p>
                )}
              </div>

              {/* Image Selection Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-gray-700">
                    Postcard Image
                  </label>
                  <Button
                    type="button"
                    onClick={handleGenerateVariant}
                    variant="primary"
                    size="sm"
                    disabled={loading || generatingVariant || !imageOriginalId}
                    loading={generatingVariant}
                  >
                    {generatingVariant
                      ? "Creating Magic..."
                      : "🎨 Create Variant"}
                  </Button>
                </div>

                {/* Image Variant Selector */}
                {(imageVariants.length > 0 || imageOriginalId) &&
                  !imageFile && (
                    <div className="border border-gray-200 rounded-lg p-4">
                      <p className="text-sm text-gray-600 mb-3">
                        Select image version:
                      </p>
                      <div className="grid grid-cols-3 gap-2">
                        {/* Original Image */}
                        {imageOriginalId && (
                          <button
                            type="button"
                            onClick={() => handleImageSelection("original")}
                            className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                              selectedImageType === "original" &&
                              !selectedVariantId
                                ? "border-yellow-500 ring-2 ring-yellow-200"
                                : "border-gray-200 hover:border-gray-300"
                            }`}
                          >
                            <img
                              src={imageOriginalUrl || ""}
                              alt="Original"
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs py-1 px-2">
                              Original
                            </div>
                          </button>
                        )}

                        {/* Variant Images */}
                        {imageVariants.map((variant, index) => (
                          <button
                            key={variant.id}
                            type="button"
                            onClick={() =>
                              handleImageSelection("variant", variant.id)
                            }
                            className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                              selectedVariantId === variant.id
                                ? "border-yellow-500 ring-2 ring-yellow-200"
                                : "border-gray-200 hover:border-gray-300"
                            }`}
                          >
                            <img
                              src={variant.url}
                              alt={variant.alt || `Variant ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs py-1 px-2">
                              Variant {index + 1}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                <ImageUpload
                  label="Upload New Image"
                  value={imageFile}
                  preview={imageFile ? imagePreview : null}
                  onChange={handleImageChange}
                  disabled={loading}
                />
                {imageFile && (
                  <p className="text-sm text-amber-600 -mt-2">
                    New image will replace the current selection
                  </p>
                )}
              </div>

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
              designId={id}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
