"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  getDesign,
  updateDesign,
  generatePostcardMessage,
  createVariant,
} from "@/app/actions/designs";
import { generateOverlayText } from "@/app/actions/generateOverlayText";
import { MESSAGE_CHAR_LIMIT, NEXT_PUBLIC_URL } from "@/lib/constants";
import { uploadImage } from "@/app/actions/upload";
import { SmartCropPreview } from "@/components/SmartCropPreview";
import {
  Button,
  Input,
  Textarea,
  ErrorMessage,
  ImageUpload,
  PostcardPreview,
  Modal,
  OverlayEditor,
  type Overlay,
  Tabs,
  TabPanel,
  type Tab,
} from "@repo/ui";

export default function EditDesignPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [recipientAddress, setRecipientAddress] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
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
  const [overlays, setOverlays] = useState<Overlay[]>([]);
  const [locationName, setLocationName] = useState<string | null>(null);
  const [selectedOverlayId, setSelectedOverlayId] = useState<string | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [loadingDesign, setLoadingDesign] = useState(true);
  const [generatingMessage, setGeneratingMessage] = useState(false);
  const [generatingVariant, setGeneratingVariant] = useState(false);
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [variantPrompt, setVariantPrompt] = useState("");
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [currentVideoId, setCurrentVideoId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [autoSaving, setAutoSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout>(null);

  // Debounced auto-save function for overlays
  const debouncedAutoSave = useCallback(
    async (newOverlays: Overlay[]) => {
      // Clear existing timeout
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }

      // Set new timeout for auto-save
      autoSaveTimeoutRef.current = setTimeout(async () => {
        try {
          setAutoSaving(true);
          await updateDesign(id, { overlays: newOverlays });
          console.log("Overlays auto-saved");
        } catch (err) {
          console.error("Failed to auto-save overlays:", err);
        } finally {
          setAutoSaving(false);
        }
      }, 1000); // Auto-save after 1 second of no changes
    },
    [id]
  );

  // Update overlays with auto-save
  const updateOverlaysWithSave = useCallback(
    (newOverlays: Overlay[]) => {
      setOverlays(newOverlays);
      debouncedAutoSave(newOverlays);
    },
    [debouncedAutoSave]
  );

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
        setVideoUrl(design.videoUrl || null);
        setCurrentVideoId(design.videoId || null);

        // Load overlays
        if (design.overlays) {
          setOverlays(design.overlays);
        }

        // Load location
        if (design.locationName) {
          setLocationName(design.locationName);
        }

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

      // Save the generated message immediately
      await updateDesign(id, {
        defaultMessage: result.message,
        // Also save description if it was generated
        ...(result.description && !description
          ? { description: result.description }
          : {}),
      });

      setMessage(result.message);

      // Refresh the page to show the updated data
      router.refresh();
    } catch (err) {
      console.error("Error generating message:", err);
      setError("Failed to generate message");
    } finally {
      setGeneratingMessage(false);
    }
  };

  const handleGenerateVariant = async (promptText?: string) => {
    setGeneratingVariant(true);
    setShowPromptModal(false);
    setError("");
    try {
      const result = await createVariant(id, promptText || undefined);
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
      // Clear the prompt after successful generation
      setVariantPrompt("");
    } catch (err) {
      console.error("Error generating variant:", err);
      setError("Failed to generate variant");
    } finally {
      setGeneratingVariant(false);
    }
  };

  const examplePrompts = [
    "Make it comic book style with bold colors",
    "Transform into watercolor painting",
    "Add vibrant neon colors and cyberpunk aesthetic",
    "Make it look vintage and nostalgic",
    "Apply impressionist art style",
    "Create a minimalist black and white version",
    "Add magical fairy tale elements",
    "Make it look like a retro travel poster",
  ];

  const handleImageChange = async (file: File | null) => {
    setImageFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        setImagePreview(reader.result as string);
        // Auto-save the image immediately
        try {
          setAutoSaving(true);
          setUploadProgress(0);

          // Upload directly to Cloudinary
          const cloudinaryResult = await uploadToCloudinary(file, (progress) =>
            setUploadProgress(progress)
          );

          // Save URL to backend
          const uploadedImage = await uploadFromUrl({
            url: cloudinaryResult.url,
            filename: file.name,
            mimeType: file.type,
            isVideo: false,
          });
          const imageId = uploadedImage.id as string;

          // Update both imageOriginal and frontImage
          await updateDesign(id, {
            imageOriginal: imageId,
            frontImage: imageId,
          });

          setCurrentImageId(imageId);
          setImageOriginalId(imageId);
          setImageOriginalUrl(reader.result as string);
          setImageFile(null); // Clear the file since it's been uploaded
        } catch (err) {
          console.error("Failed to upload image:", err);
          setError("Failed to upload image");
        } finally {
          setAutoSaving(false);
        }
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

  const handleVideoChange = async (file: File | null) => {
    setVideoFile(file);
    if (file) {
      // Create preview URL for video
      const url = URL.createObjectURL(file);
      setVideoPreview(url);

      // Auto-save the video immediately
      try {
        setAutoSaving(true);
        const formData = new FormData();
        formData.append("file", file);
        const uploadedVideo = await uploadImage(formData);

        // Update video URL in design
        await updateDesign(id, {
          videoUrl: uploadedVideo.url,
        });

        setVideoUrl(uploadedVideo.url);
        setVideoFile(null); // Clear the file since it's been uploaded
      } catch (err) {
        console.error("Failed to upload video:", err);
        setError("Failed to upload video");
      } finally {
        setAutoSaving(false);
      }
    } else {
      setVideoPreview(null);
      if (!videoUrl) {
        // If there's no existing video, clear the preview
        setVideoUrl(null);
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
      // Since we're auto-saving images/videos, just save the other fields
      await updateDesign(id, {
        name,
        description,
        defaultMessage: message,
        frontImage: currentImageId || "",
        overlays,
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

  const tabs: Tab[] = [
    {
      id: "video",
      label: "Video Source",
      icon: (
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
            d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
          />
        </svg>
      ),
    },
    {
      id: "image",
      label: "Image",
      icon: (
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
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      ),
    },
    {
      id: "overlay",
      label: "Overlay",
      icon: (
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
            d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a6 6 0 00-12 0v4a2 2 0 002 2z"
          />
        </svg>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-amber-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Edit Design</h1>
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

        {/* Desktop Layout: Side by side, Mobile Layout: Stacked */}
        <div className="lg:flex lg:gap-8">
          {/* Preview Section - Shows on top on mobile, right side on desktop */}
          <div className="w-full lg:max-w-md lg:order-2 mb-8 lg:mb-0">
            <div className="lg:sticky lg:top-8 bg-white rounded-2xl shadow-xl p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Preview
              </h2>

              <PostcardPreview
                frontImage={imagePreview}
                message={message || "Your message will appear here..."}
                recipientName="Jane Smith"
                recipientAddress="456 Oak Avenue\n8002 Zurich\nSwitzerland"
                designId={id}
                overlays={overlays}
                selectedOverlayId={selectedOverlayId}
                onOverlayUpdate={(overlayId, updates) => {
                  const updatedOverlays = overlays.map((overlay) =>
                    overlay.id === overlayId
                      ? { ...overlay, ...updates }
                      : overlay,
                  );
                  updateOverlaysWithSave(updatedOverlays);
                }}
                onOverlaySelect={setSelectedOverlayId}
              />
            </div>
          </div>

          {/* Control Panel with Tabs - Shows below preview on mobile, left side on desktop */}
          <div className="bg-white rounded-2xl shadow-xl p-6 flex-1 lg:order-1">
            <form onSubmit={handleSubmit}>
              {error && <ErrorMessage>{error}</ErrorMessage>}

              <div className="mb-6">
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
              </div>

              <div className="mb-6">
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
                  rows={4}
                  disabled={loading || generatingMessage}
                  placeholder="Write your postcard message here..."
                />
                {message.length >= MESSAGE_CHAR_LIMIT && (
                  <p className="text-xs text-red-600 mt-1">
                    Maximum character limit reached
                  </p>
                )}
              </div>

              <Tabs
                tabs={tabs}
                defaultTab="image"
                orientation="horizontal"
                className="mb-6"
              >
                {/* Video Source Tab */}
                <TabPanel tabId="video">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Video Source
                    </h3>
                    <ImageUpload
                      label="Upload Video"
                      value={videoFile}
                      preview={null}
                      onChange={handleVideoChange}
                      acceptVideo={true}
                      acceptImage={false}
                      maxSize="100MB"
                      disabled={loading || autoSaving}
                    />
                    {videoFile && (
                      <p className="text-sm text-amber-600">
                        Video is being uploaded...
                      </p>
                    )}

                    {/* Video Preview if video exists */}
                    {(videoPreview || videoUrl) && (
                      <div className="mt-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-3">
                          Current Video
                        </h4>
                        <div className="relative rounded-lg overflow-hidden shadow-lg bg-black">
                          <video
                            src={videoPreview || videoUrl}
                            controls
                            className="w-full"
                            style={{ maxHeight: "300px" }}
                          >
                            Your browser does not support the video tag.
                          </video>
                        </div>
                      </div>
                    )}

                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-600">
                        Upload a video to create an animated postcard. Supported
                        formats: MP4, MOV.
                      </p>
                    </div>
                  </div>
                </TabPanel>

                {/* Image Tab */}
                <TabPanel tabId="image">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Postcard Image
                      </h3>
                      <Button
                        type="button"
                        onClick={() => setShowPromptModal(true)}
                        variant="primary"
                        size="sm"
                        disabled={
                          loading || generatingVariant || !imageOriginalId
                        }
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
                      acceptVideo={false}
                      maxSize="100MB"
                      disabled={loading || autoSaving}
                    />
                    {imageFile && (
                      <p className="text-sm text-amber-600">
                        New image will replace the current selection
                      </p>
                    )}

                    {/* Smart Crop Preview for selected/uploaded image */}
                    {imagePreview && (
                      <SmartCropPreview
                        imageUrl={imagePreview}
                        onCropApplied={(adjustment) => {
                          console.log("Crop adjustment applied:", adjustment);
                          // Note: In edit mode, images are already cropped from creation
                          // This is for reference/future manual adjustments
                        }}
                      />
                    )}
                  </div>
                </TabPanel>

                {/* Overlay Tab */}
                <TabPanel tabId="overlay">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Text Overlays
                    </h3>
                    <div className="relative">
                      <OverlayEditor
                        overlays={overlays}
                        onChange={updateOverlaysWithSave}
                        locationName={locationName || undefined}
                        description={description}
                        message={message}
                        selectedOverlayId={selectedOverlayId}
                        onSelectOverlay={setSelectedOverlayId}
                        onGenerateText={generateOverlayText}
                      />
                      {autoSaving && (
                        <div className="absolute top-2 right-2 bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full animate-pulse">
                          Saving overlays...
                        </div>
                      )}
                    </div>
                  </div>
                </TabPanel>
              </Tabs>

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

              <div className="flex gap-4 mt-6">
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
        </div>
      </div>

      {/* Variant Prompt Modal */}
      <Modal
        isOpen={showPromptModal}
        onClose={() => setShowPromptModal(false)}
        title="Create a Variant"
        size="lg"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Describe how you'd like to transform your postcard design. Be
            creative!
          </p>

          <Textarea
            label="Style Prompt"
            id="variantPrompt"
            value={variantPrompt}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              setVariantPrompt(e.target.value)
            }
            rows={3}
            placeholder="e.g., Make it look like a vintage travel poster with warm sunset colors"
          />

          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">
              Need inspiration? Try these examples:
            </p>
            <div className="flex flex-wrap gap-2">
              {examplePrompts.map((prompt, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setVariantPrompt(prompt)}
                  className="text-xs px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-700 transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              onClick={() => setShowPromptModal(false)}
              variant="secondary"
              size="md"
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => handleGenerateVariant(variantPrompt)}
              variant="primary"
              size="md"
              className="flex-1"
              disabled={generatingVariant}
              loading={generatingVariant}
            >
              {generatingVariant ? "Creating..." : "Create Variant"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
