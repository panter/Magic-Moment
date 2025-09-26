"use client";

import { useState, useEffect } from "react";
import { Button } from "./button";

export interface Overlay {
  id: string;
  text: string;
  fontSize: number;
  fontFamily: "sans-serif" | "serif" | "cursive" | "display";
  color: string;
  strokeColor: string;
  strokeWidth: number;
  x: number;
  y: number;
  rotation: number;
  opacity: number;
  textAlign?: "left" | "center" | "right";
}

interface OverlayEditorProps {
  overlays: Overlay[];
  onChange: (overlays: Overlay[]) => void;
  locationName?: string;
  description?: string;
  message?: string;
  selectedOverlayId?: string | null;
  onSelectOverlay?: (overlayId: string | null) => void;
  onGenerateText?: (params: {
    locationName?: string;
    message?: string;
    description?: string;
  }) => Promise<string>;
}

const overlayPresets = [
  {
    text: "Greetings from {location}",
    fontSize: 36,
    fontFamily: "cursive" as const,
    color: "#ffffff",
    strokeColor: "#000000",
    strokeWidth: 3,
    x: 50,
    y: 20,
    rotation: -5,
    opacity: 0.9,
  },
  {
    text: "Wish you were here!",
    fontSize: 28,
    fontFamily: "sans-serif" as const,
    color: "#ffcc02",
    strokeColor: "#000000",
    strokeWidth: 2,
    x: 50,
    y: 85,
    rotation: 0,
    opacity: 0.95,
  },
  {
    text: "Having a great time!",
    fontSize: 32,
    fontFamily: "display" as const,
    color: "#ffffff",
    strokeColor: "#ff0000",
    strokeWidth: 2.5,
    x: 50,
    y: 50,
    rotation: 10,
    opacity: 1,
  },
  {
    text: "Memories from {location}",
    fontSize: 24,
    fontFamily: "serif" as const,
    color: "#000000",
    strokeColor: "#ffffff",
    strokeWidth: 3,
    x: 50,
    y: 90,
    rotation: 0,
    opacity: 0.85,
  },
  {
    text: "Hello from {location}!",
    fontSize: 40,
    fontFamily: "cursive" as const,
    color: "#ff69b4",
    strokeColor: "#ffffff",
    strokeWidth: 4,
    x: 50,
    y: 15,
    rotation: -8,
    opacity: 0.9,
  },
];

export function OverlayEditor({
  overlays,
  onChange,
  locationName,
  description,
  message,
  selectedOverlayId,
  onSelectOverlay,
  onGenerateText,
}: OverlayEditorProps) {
  const [editingOverlay, setEditingOverlay] = useState<Overlay | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Open editor for specific overlay when selected from preview
  useEffect(() => {
    if (selectedOverlayId) {
      const overlay = overlays.find((o) => o.id === selectedOverlayId);
      if (
        overlay &&
        (!editingOverlay || editingOverlay.id !== selectedOverlayId)
      ) {
        setEditingOverlay(overlay);
      }
    }
  }, [selectedOverlayId, overlays]);

  const generateId = () => Math.random().toString(36).substring(2, 11);

  // Sync editingOverlay with the overlays array when it changes
  useEffect(() => {
    if (editingOverlay) {
      const currentOverlay = overlays.find((o) => o.id === editingOverlay.id);
      if (currentOverlay) {
        setEditingOverlay(currentOverlay);
      } else {
        // Overlay was deleted
        setEditingOverlay(null);
      }
    }
  }, [overlays, editingOverlay?.id]);

  const generateSmartOverlayText = async () => {
    if (onGenerateText) {
      setIsGenerating(true);
      try {
        const text = await onGenerateText({
          locationName,
          message,
          description,
        });
        return text;
      } catch (error) {
        console.error("Error generating text:", error);
        // Fallback
        if (locationName) {
          const cityName = locationName.split(",")[0].trim();
          return cityName;
        }
        return new Date().toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        });
      } finally {
        setIsGenerating(false);
      }
    }

    // Fallback if no generator provided
    if (locationName) {
      const cityName = locationName.split(",")[0].trim();
      return cityName;
    }
    return new Date().toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleAddOverlay = async () => {
    // Generate smart text based on context
    const smartText = await generateSmartOverlayText();

    // Randomly select a style preset
    const randomPreset =
      overlayPresets[Math.floor(Math.random() * overlayPresets.length)];

    // Create new overlay with smart text and random styling
    const newOverlay: Overlay = {
      id: generateId(),
      text: smartText,
      fontSize: randomPreset.fontSize,
      fontFamily: randomPreset.fontFamily,
      color: randomPreset.color,
      strokeColor: randomPreset.strokeColor,
      strokeWidth: randomPreset.strokeWidth,
      x: 50 + (Math.random() - 0.5) * 30, // Random position around center
      y: 20 + Math.random() * 60, // Random Y between 20-80
      rotation: (Math.random() - 0.5) * 20, // Random rotation -10 to 10
      opacity: randomPreset.opacity,
      textAlign: "center" as const,
    };

    onChange([...overlays, newOverlay]);
    setEditingOverlay(newOverlay);
    if (onSelectOverlay) {
      onSelectOverlay(newOverlay.id);
    }
  };

  const regenerateOverlayText = async () => {
    if (!editingOverlay) return;

    const newText = await generateSmartOverlayText();
    handleUpdateOverlay(editingOverlay.id, { text: newText });
  };

  const handleUpdateOverlay = (id: string, updates: Partial<Overlay>) => {
    const updatedOverlays = overlays.map((overlay) =>
      overlay.id === id ? { ...overlay, ...updates } : overlay,
    );
    onChange(updatedOverlays);

    // Update the editing overlay if it's the one being edited
    if (editingOverlay?.id === id) {
      const updatedOverlay = updatedOverlays.find((o) => o.id === id);
      if (updatedOverlay) {
        setEditingOverlay(updatedOverlay);
      }
    }
  };

  const handleDeleteOverlay = (id: string) => {
    onChange(overlays.filter((overlay) => overlay.id !== id));
    if (editingOverlay?.id === id) {
      setEditingOverlay(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          Overlays
        </label>
        <Button
          type="button"
          onClick={handleAddOverlay}
          variant="primary"
          size="sm"
          disabled={isGenerating}
        >
          {isGenerating ? "Generating..." : "+ Add Overlay"}
        </Button>
      </div>

      {overlays.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs text-gray-500 italic">
            💡 Tip: Click an overlay to edit it, or drag it directly on the
            preview to reposition
          </p>
          <div className="border border-gray-200 rounded-lg p-4 space-y-3">
            {overlays.map((overlay) => (
              <div
                key={overlay.id}
                className={`p-3 border rounded-lg cursor-pointer transition-all ${
                  editingOverlay?.id === overlay.id ||
                  selectedOverlayId === overlay.id
                    ? "border-yellow-500 bg-yellow-50 ring-2 ring-yellow-200"
                    : "border-gray-200 hover:border-gray-300"
                }`}
                onClick={() => {
                  // Toggle editing - if clicking the same overlay, close it
                  if (editingOverlay?.id === overlay.id) {
                    setEditingOverlay(null);
                    if (onSelectOverlay) {
                      onSelectOverlay(null);
                    }
                  } else {
                    // Get the fresh overlay from the array
                    const currentOverlay = overlays.find(
                      (o) => o.id === overlay.id,
                    );
                    if (currentOverlay) {
                      setEditingOverlay(currentOverlay);
                      if (onSelectOverlay) {
                        onSelectOverlay(currentOverlay.id);
                      }
                    }
                  }
                }}
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-start gap-2 flex-1">
                    {/* Expand/Collapse indicator */}
                    <svg
                      className={`w-4 h-4 mt-1 text-gray-400 transition-transform ${
                        editingOverlay?.id === overlay.id ? "rotate-90" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">
                        {overlay.text}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {overlay.fontSize}px · {overlay.fontFamily} · Position:{" "}
                        {overlay.x}%, {overlay.y}%
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteOverlay(overlay.id);
                    }}
                    className="text-red-500 hover:text-red-700 ml-2"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
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
              </div>
            ))}
          </div>
        </div>
      )}

      {editingOverlay && (
        <div className="border border-yellow-500 rounded-lg p-4 bg-yellow-50 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-gray-900">Edit Overlay</h4>
            <button
              type="button"
              onClick={() => {
                setEditingOverlay(null);
                if (onSelectOverlay) {
                  onSelectOverlay(null);
                }
              }}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
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

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-gray-700">
                Text
              </label>
              <button
                type="button"
                onClick={regenerateOverlayText}
                className="p-1 text-gray-500 hover:text-yellow-600 transition-colors disabled:opacity-50"
                title="Generate new text"
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <svg
                    className="w-4 h-4 animate-spin"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                ) : (
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
                      d="M20 11A8.1 8.1 0 004.5 9M4 5v4h4m-4 4a8.1 8.1 0 0015.5 2m.5 4v-4h-4"
                    />
                  </svg>
                )}
              </button>
            </div>
            <textarea
              value={editingOverlay.text}
              onChange={(e) =>
                handleUpdateOverlay(editingOverlay.id, { text: e.target.value })
              }
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent resize-none"
              placeholder="Enter overlay text... (Press Enter for new line)"
            />
            <p className="text-xs text-gray-500 mt-1">
              Tip: Press Enter to add line breaks
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Text Alignment
            </label>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() =>
                  handleUpdateOverlay(editingOverlay.id, { textAlign: "left" })
                }
                className={`flex-1 px-3 py-2 border rounded-l-lg transition-colors ${
                  (editingOverlay.textAlign || "center") === "left"
                    ? "bg-yellow-100 border-yellow-500 text-yellow-900"
                    : "bg-white border-gray-300 hover:bg-gray-50"
                }`}
                title="Align Left"
              >
                <svg
                  className="w-4 h-4 mx-auto"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 6h18M3 10h12M3 14h18M3 18h12"
                  />
                </svg>
              </button>
              <button
                type="button"
                onClick={() =>
                  handleUpdateOverlay(editingOverlay.id, {
                    textAlign: "center",
                  })
                }
                className={`flex-1 px-3 py-2 border-t border-b transition-colors ${
                  (editingOverlay.textAlign || "center") === "center"
                    ? "bg-yellow-100 border-yellow-500 text-yellow-900"
                    : "bg-white border-gray-300 hover:bg-gray-50"
                }`}
                title="Align Center"
              >
                <svg
                  className="w-4 h-4 mx-auto"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M6 10h12M4 14h16M6 18h12"
                  />
                </svg>
              </button>
              <button
                type="button"
                onClick={() =>
                  handleUpdateOverlay(editingOverlay.id, { textAlign: "right" })
                }
                className={`flex-1 px-3 py-2 border rounded-r-lg transition-colors ${
                  (editingOverlay.textAlign || "center") === "right"
                    ? "bg-yellow-100 border-yellow-500 text-yellow-900"
                    : "bg-white border-gray-300 hover:bg-gray-50"
                }`}
                title="Align Right"
              >
                <svg
                  className="w-4 h-4 mx-auto"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 6h18M9 10h12M3 14h18M9 18h12"
                  />
                </svg>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Font Size
              </label>
              <input
                type="range"
                min="12"
                max="72"
                value={editingOverlay.fontSize}
                onChange={(e) =>
                  handleUpdateOverlay(editingOverlay.id, {
                    fontSize: parseInt(e.target.value),
                  })
                }
                className="w-full"
              />
              <span className="text-xs text-gray-500">
                {editingOverlay.fontSize}px
              </span>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Font Family
              </label>
              <select
                value={editingOverlay.fontFamily}
                onChange={(e) =>
                  handleUpdateOverlay(editingOverlay.id, {
                    fontFamily: e.target.value as Overlay["fontFamily"],
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="sans-serif">Sans Serif</option>
                <option value="serif">Serif</option>
                <option value="cursive">Cursive</option>
                <option value="display">Display</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Text Color
              </label>
              <input
                type="color"
                value={editingOverlay.color}
                onChange={(e) =>
                  handleUpdateOverlay(editingOverlay.id, {
                    color: e.target.value,
                  })
                }
                className="w-full h-10 rounded cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Stroke Color
              </label>
              <input
                type="color"
                value={editingOverlay.strokeColor}
                onChange={(e) =>
                  handleUpdateOverlay(editingOverlay.id, {
                    strokeColor: e.target.value,
                  })
                }
                className="w-full h-10 rounded cursor-pointer"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                X Position (%)
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={editingOverlay.x}
                onChange={(e) =>
                  handleUpdateOverlay(editingOverlay.id, {
                    x: parseInt(e.target.value),
                  })
                }
                className="w-full"
              />
              <span className="text-xs text-gray-500">{editingOverlay.x}%</span>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Y Position (%)
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={editingOverlay.y}
                onChange={(e) =>
                  handleUpdateOverlay(editingOverlay.id, {
                    y: parseInt(e.target.value),
                  })
                }
                className="w-full"
              />
              <span className="text-xs text-gray-500">{editingOverlay.y}%</span>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rotation (°)
              </label>
              <input
                type="range"
                min="-45"
                max="45"
                value={editingOverlay.rotation}
                onChange={(e) =>
                  handleUpdateOverlay(editingOverlay.id, {
                    rotation: parseInt(e.target.value),
                  })
                }
                className="w-full"
              />
              <span className="text-xs text-gray-500">
                {editingOverlay.rotation}°
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Stroke Width
              </label>
              <input
                type="range"
                min="0"
                max="10"
                step="0.5"
                value={editingOverlay.strokeWidth}
                onChange={(e) =>
                  handleUpdateOverlay(editingOverlay.id, {
                    strokeWidth: parseFloat(e.target.value),
                  })
                }
                className="w-full"
              />
              <span className="text-xs text-gray-500">
                {editingOverlay.strokeWidth}px
              </span>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Opacity
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={editingOverlay.opacity}
                onChange={(e) =>
                  handleUpdateOverlay(editingOverlay.id, {
                    opacity: parseFloat(e.target.value),
                  })
                }
                className="w-full"
              />
              <span className="text-xs text-gray-500">
                {Math.round(editingOverlay.opacity * 100)}%
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
