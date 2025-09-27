import type { ChangeEvent } from "react";
import { useState, useId } from "react";

interface ImageUploadProps {
  label?: string;
  value?: File | null;
  preview?: string | null;
  onChange: (file: File | null) => void;
  accept?: string;
  acceptVideo?: boolean;
  acceptImage?: boolean;
  maxSize?: string;
  disabled?: boolean;
  className?: string;
}

export function ImageUpload({
  label = "Upload Image",
  value: _value,
  preview: externalPreview,
  onChange,
  accept,
  acceptVideo = false,
  acceptImage = true,
  maxSize = "10MB",
  disabled = false,
  className = "",
}: ImageUploadProps) {
  const [internalPreview, setInternalPreview] = useState<string | null>(null);
  const preview = externalPreview ?? internalPreview;
  const hasFile = _value !== null && _value !== undefined;
  const inputId = useId();

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onChange(file);

      // Only create internal preview for images when external preview is not provided
      if (!externalPreview && file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setInternalPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleRemove = () => {
    onChange(null);
    setInternalPreview(null);
  };

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}
      <div className="space-y-2">
        {preview && acceptImage ? (
          <div className="relative">
            <img
              src={preview}
              alt="Preview"
              className="w-full max-h-48 object-contain mx-auto rounded-lg shadow"
            />
            <button
              type="button"
              onClick={handleRemove}
              className="absolute top-2 right-2 bg-red-600 text-white p-1.5 rounded-full hover:bg-red-700 transition"
              disabled={disabled}
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        ) : hasFile && _value?.type?.startsWith("video/") ? (
          <div className="relative bg-gray-100 p-3 rounded-lg">
            <div className="flex items-center gap-2">
              <svg
                className="w-6 h-6 text-gray-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-700 font-medium truncate">
                  {_value.name}
                </p>
                <p className="text-xs text-gray-500">
                  {(_value.size / 1024 / 1024).toFixed(1)} MB
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleRemove}
              className="absolute top-2 right-2 bg-red-600 text-white p-1.5 rounded-full hover:bg-red-700 transition"
              disabled={disabled}
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        ) : (
          <label
            htmlFor={inputId}
            className={`w-full h-32 border-2 border-dashed border-gray-300 rounded-lg hover:border-[#ffcc02] transition cursor-pointer flex flex-col items-center justify-center ${
              disabled ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            <svg
              className="w-8 h-8 text-gray-400 mb-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <p className="text-gray-600 text-xs">
              Click to upload{" "}
              {acceptVideo && acceptImage
                ? "image or video"
                : acceptVideo && !acceptImage
                  ? "video"
                  : "image"}
            </p>
            <p className="text-gray-400 text-xs">
              {acceptVideo && acceptImage
                ? "PNG, JPG, HEIC, MP4, MOV"
                : acceptVideo && !acceptImage
                  ? "MP4, MOV"
                  : "PNG, JPG, HEIC"}{" "}
              up to {maxSize}
            </p>
          </label>
        )}
        <input
          type="file"
          id={inputId}
          accept={
            accept ||
            (acceptVideo && acceptImage
              ? "image/*,video/*,.heic,.heif"
              : acceptVideo && !acceptImage
                ? "video/*"
                : "image/*,.heic,.heif")
          }
          onChange={handleFileChange}
          className="hidden"
          disabled={disabled}
        />
      </div>
    </div>
  );
}
