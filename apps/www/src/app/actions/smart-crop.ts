"use server";

import { getSmartCropHints, performSmartCrop } from "@/lib/smart-crop";
import type { CropHints, ManualAdjustment } from "@/lib/smart-crop-types";

/**
 * Server action to get crop hints for an image
 */
export async function getCropHints(imageUrl: string): Promise<CropHints> {
  try {
    return await getSmartCropHints(imageUrl);
  } catch (error) {
    console.error("Error getting crop hints:", error);
    throw new Error("Failed to analyze image for cropping");
  }
}

/**
 * Server action to apply smart crop to an image
 */
export async function applySmartCrop(
  imageUrl: string,
  manualAdjustment?: ManualAdjustment,
): Promise<CropHints> {
  try {
    // Get the hints with the adjustment applied visually
    const hints = await getSmartCropHints(imageUrl);

    // If there's manual adjustment, we return modified hints for preview
    if (manualAdjustment) {
      return {
        ...hints,
        focalPoint: {
          x: Math.min(
            1,
            Math.max(0, hints.focalPoint.x + manualAdjustment.x * 0.3),
          ),
          y: Math.min(
            1,
            Math.max(0, hints.focalPoint.y + manualAdjustment.y * 0.3),
          ),
        },
      };
    }

    return hints;
  } catch (error) {
    console.error("Error applying smart crop:", error);
    throw new Error("Failed to apply smart crop to image");
  }
}

/**
 * Server action to crop image and return as base64
 */
export async function cropImageAndGetFile(
  mediaId: string,
  manualAdjustment?: ManualAdjustment,
): Promise<string> {
  try {
    const croppedBuffer = await performSmartCrop(mediaId, manualAdjustment);

    // Convert buffer to base64 data URL
    const base64 = croppedBuffer.toString("base64");
    return `data:image/jpeg;base64,${base64}`;
  } catch (error) {
    console.error("Error cropping image:", error);
    throw new Error("Failed to crop image");
  }
}
