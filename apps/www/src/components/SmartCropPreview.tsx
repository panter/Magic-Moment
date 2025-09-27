"use client";

import { useState, useCallback, useEffect } from "react";
import { Button } from "@repo/ui";
import { getCropHints, applySmartCrop } from "@/app/actions/smart-crop";
import type { CropHints, ManualAdjustment } from "@/lib/smart-crop-types";

interface SmartCropPreviewProps {
  imageUrl: string | null;
  onCropApplied?: (adjustment: ManualAdjustment) => void;
}

export function SmartCropPreview({
  imageUrl,
  onCropApplied,
}: SmartCropPreviewProps) {
  const [cropHints, setCropHints] = useState<CropHints | null>(null);
  const [manualAdjustment, setManualAdjustment] = useState<ManualAdjustment>({
    x: 0,
    y: 0,
  });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showOverlay, setShowOverlay] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [error, setError] = useState<string | null>(null);

  // Analyze image when URL changes
  useEffect(() => {
    if (imageUrl) {
      analyzeImage();
    }
  }, [imageUrl]);

  const analyzeImage = async () => {
    if (!imageUrl) return;

    setIsAnalyzing(true);
    setError(null);
    setManualAdjustment({ x: 0, y: 0 }); // Reset adjustment on re-analyze

    try {
      const hints = await getCropHints(imageUrl);
      setCropHints(hints);
    } catch (err) {
      console.error("Failed to analyze image:", err);
      setError("Failed to analyze image for smart cropping");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging) return;

      // Invert the direction for more intuitive dragging
      // (dragging right should move the image right, showing content from the left)
      const deltaX = -(e.clientX - dragStart.x) / 200; // Scale movement and invert
      const deltaY = -(e.clientY - dragStart.y) / 200;

      setManualAdjustment((prev) => ({
        x: Math.max(-1, Math.min(1, prev.x + deltaX)),
        y: Math.max(-1, Math.min(1, prev.y + deltaY)),
      }));

      setDragStart({ x: e.clientX, y: e.clientY });
    },
    [isDragging, dragStart],
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const step = 0.05;
    switch (e.key) {
      case "ArrowLeft":
        e.preventDefault();
        setManualAdjustment((prev) => ({
          ...prev,
          x: Math.min(1, prev.x + step), // Inverted: left arrow moves view left
        }));
        break;
      case "ArrowRight":
        e.preventDefault();
        setManualAdjustment((prev) => ({
          ...prev,
          x: Math.max(-1, prev.x - step), // Inverted: right arrow moves view right
        }));
        break;
      case "ArrowUp":
        e.preventDefault();
        setManualAdjustment((prev) => ({
          ...prev,
          y: Math.min(1, prev.y + step), // Inverted: up arrow moves view up
        }));
        break;
      case "ArrowDown":
        e.preventDefault();
        setManualAdjustment((prev) => ({
          ...prev,
          y: Math.max(-1, prev.y - step), // Inverted: down arrow moves view down
        }));
        break;
    }
  }, []);

  const applyCrop = () => {
    if (onCropApplied) {
      onCropApplied(manualAdjustment);
    }
  };

  if (!imageUrl) return null;

  // Calculate display position based on crop hints and manual adjustment
  const getImageTransform = () => {
    if (!cropHints) return "scale(2)";

    // Scale image to 200% to allow viewing the entire image
    const scale = 2;

    // Calculate how much extra content we have (100% extra on 200% scale)
    const extraContent = (scale - 1) * 100; // 100%

    // Manual adjustment can move within the entire extra content area
    // Allow full range movement to see all parts of the image
    const offsetX = manualAdjustment.x * (extraContent / 2); // Can move 50% in each direction
    const offsetY = manualAdjustment.y * (extraContent / 2);

    // Center on focal point with manual adjustment
    // Focal point is normalized (0-1), need to convert to percentage offset from center
    // The focal point offset needs to move the image in the opposite direction
    const focalX = -(cropHints.focalPoint.x - 0.5) * 100;
    const focalY = -(cropHints.focalPoint.y - 0.5) * 100;

    // Combine focal point centering with manual adjustment
    return `scale(${scale}) translate(${focalX + offsetX}%, ${focalY + offsetY}%)`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold text-gray-900">
          Smart Image Cropping
        </h3>
        <div className="flex gap-2">
          <Button
            type="button"
            onClick={() => setShowOverlay(!showOverlay)}
            variant="secondary"
            size="sm"
          >
            {showOverlay ? "Hide" : "Show"} AI Detection
          </Button>
          <Button
            type="button"
            onClick={analyzeImage}
            variant="secondary"
            size="sm"
            loading={isAnalyzing}
            disabled={isAnalyzing}
          >
            Re-analyze
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div
        className="relative bg-gray-100 rounded-lg overflow-hidden cursor-move"
        style={{ aspectRatio: "3/2" }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onKeyDown={handleKeyDown}
        tabIndex={0}
      >
        {/* Cropped preview */}
        <div className="absolute inset-0 overflow-hidden">
          <img
            src={imageUrl}
            alt="Crop preview"
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-100"
            style={{
              transform: getImageTransform(),
              transformOrigin: "center",
            }}
            draggable={false}
          />
        </div>

        {/* Overlay visualization */}
        {showOverlay && cropHints && (
          <div className="absolute inset-0 pointer-events-none">
            {/* Transform container to match image transform */}
            <div
              className="absolute inset-0"
              style={{
                transform: getImageTransform(),
                transformOrigin: "center",
              }}
            >
              {/* Primary subject bounding box */}
              <div
                className="absolute border-2 border-yellow-400 bg-yellow-200 bg-opacity-20"
                style={{
                  left: `${cropHints.primarySubject.box.x * 100}%`,
                  top: `${cropHints.primarySubject.box.y * 100}%`,
                  width: `${cropHints.primarySubject.box.w * 100}%`,
                  height: `${cropHints.primarySubject.box.h * 100}%`,
                }}
              >
                <span className="absolute -top-6 left-0 text-xs bg-yellow-400 text-black px-1 rounded">
                  PRIMARY: {cropHints.primarySubject.type}
                </span>
              </div>

              {/* All detected regions */}
              {cropHints.regions.map((region, index) => {
                // Color code by type and importance
                let borderColor = "border-gray-400";
                let bgColor = "bg-gray-200";
                if (region.type === "face" || region.type === "eyes") {
                  borderColor = "border-green-500";
                  bgColor = "bg-green-200";
                } else if (region.type === "upper_body") {
                  borderColor = "border-cyan-500";
                  bgColor = "bg-cyan-200";
                } else if (region.importance >= 7) {
                  borderColor = "border-orange-400";
                  bgColor = "bg-orange-200";
                }

                return (
                  <div
                    key={index}
                    className={`absolute border ${borderColor} ${bgColor} bg-opacity-20`}
                    style={{
                      left: `${region.box.x * 100}%`,
                      top: `${region.box.y * 100}%`,
                      width: `${region.box.w * 100}%`,
                      height: `${region.box.h * 100}%`,
                    }}
                  >
                    <span className={`absolute -top-5 left-0 text-xs ${bgColor} text-black px-1 rounded text-[10px]`}>
                      {region.label} ({region.importance}/10)
                    </span>
                  </div>
                );
              })}

              {/* Focal point indicator at actual position */}
              <div
                className="absolute w-4 h-4 bg-red-500 rounded-full border-2 border-white"
                style={{
                  left: `${cropHints.focalPoint.x * 100}%`,
                  top: `${cropHints.focalPoint.y * 100}%`,
                  transform: "translate(-50%, -50%)",
                }}
              >
                <span className="absolute top-5 left-1/2 transform -translate-x-1/2 text-xs bg-red-500 text-white px-1 rounded whitespace-nowrap">
                  FOCAL
                </span>
              </div>
            </div>

            {/* Crop frame border (fixed position) */}
            <div className="absolute inset-0 border-2 border-blue-500 border-dashed opacity-50" />

            {/* Center crosshair (fixed position) */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div className="w-8 h-0.5 bg-blue-500 absolute -left-4 top-0" />
              <div className="w-0.5 h-8 bg-blue-500 absolute left-0 -top-4" />
            </div>

            {/* Debug info: Show focal point coordinates */}
            <div className="absolute top-2 left-2 bg-black bg-opacity-70 text-white text-xs p-2 rounded">
              Focal: {(cropHints.focalPoint.x * 100).toFixed(0)}%, {(cropHints.focalPoint.y * 100).toFixed(0)}%
              <br />
              Adjustment: X:{(manualAdjustment.x * 100).toFixed(0)}%, Y:{(manualAdjustment.y * 100).toFixed(0)}%
            </div>
          </div>
        )}

        {/* Loading overlay */}
        {isAnalyzing && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white rounded-lg px-4 py-3">
              <div className="animate-pulse text-sm">Analyzing image...</div>
            </div>
          </div>
        )}
      </div>

      {/* Manual adjustment controls */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-gray-700">Manual Adjustment</p>
          <div className="flex gap-2">
            <Button
              type="button"
              onClick={() => setManualAdjustment({ x: 0, y: 0 })}
              variant="ghost"
              size="sm"
            >
              Reset
            </Button>
            {onCropApplied && (
              <Button
                type="button"
                onClick={applyCrop}
                variant="primary"
                size="sm"
              >
                Apply Crop
              </Button>
            )}
          </div>
        </div>
        <p className="text-xs text-gray-600 mb-2">
          Use arrow keys or drag the image to adjust the crop position
        </p>
        <div className="text-xs text-gray-500">
          X: {(manualAdjustment.x * 100).toFixed(0)}% | Y:{" "}
          {(manualAdjustment.y * 100).toFixed(0)}%
        </div>
      </div>

      {/* Detected regions list */}
      {cropHints && showOverlay && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            Detected Regions
          </h4>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="font-medium">
                Primary: {cropHints.primarySubject.type}
              </span>
              <span>
                Confidence:{" "}
                {(cropHints.primarySubject.confidence * 10).toFixed(0)}%
              </span>
            </div>
            {cropHints.regions.slice(0, 5).map((region, i) => (
              <div key={i} className="flex justify-between text-gray-600">
                <span>
                  {region.label} ({region.type})
                </span>
                <span>Importance: {region.importance}/10</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
