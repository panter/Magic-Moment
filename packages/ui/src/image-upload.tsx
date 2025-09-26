import type { ChangeEvent } from "react";
import { useState, useId } from "react";

interface ImageUploadProps {
  label?: string;
  value?: File | null;
  preview?: string | null;
  onChange: (file: File | null) => void;
  accept?: string;
  maxSize?: string;
  disabled?: boolean;
  className?: string;
}

export function ImageUpload({
  label = "Upload Image",
  value: _value,
  preview: externalPreview,
  onChange,
  accept = "image/*",
  maxSize = "10MB",
  disabled = false,
  className = "",
}: ImageUploadProps) {
  const [internalPreview, setInternalPreview] = useState<string | null>(null);
  const preview = externalPreview ?? internalPreview;
  const inputId = useId();

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onChange(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setInternalPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
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
      <div className="space-y-4">
        {preview ? (
          <div className="relative">
            <img
              src={preview}
              alt="Preview"
              className="w-full max-w-md mx-auto rounded-lg shadow-lg"
            />
            <button
              type="button"
              onClick={handleRemove}
              className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-full hover:bg-red-700 transition"
              disabled={disabled}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ) : (
          <label
            htmlFor={inputId}
            className={`w-full h-64 border-2 border-dashed border-gray-300 rounded-lg hover:border-[#ffcc02] transition cursor-pointer flex flex-col items-center justify-center ${
              disabled ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            <svg className="w-12 h-12 text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-gray-600 text-sm">Click to upload image</p>
            <p className="text-gray-400 text-xs mt-1">PNG, JPG up to {maxSize}</p>
          </label>
        )}
        <input
          type="file"
          id={inputId}
          accept={accept}
          onChange={handleFileChange}
          className="hidden"
          disabled={disabled}
        />
      </div>
    </div>
  );
}