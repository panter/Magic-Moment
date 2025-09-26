export interface OverlayData {
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
}

export interface CreateDesignInput {
  name: string;
  description?: string;
  category: "holiday" | "birthday" | "thankyou" | "greeting" | "travel" | "custom";
  imageOriginal: string;
  frontImage?: string;
  backgroundColor?: string;
  textColor?: string;
  font?: "sans" | "serif" | "handwritten" | "decorative";
  layout?: "full-image" | "split-horizontal" | "split-vertical" | "border-frame";
  isPublic?: boolean;
  defaultMessage?: string;
  overlays?: OverlayData[];

  // Optional geo data from existing design
  latitude?: number;
  longitude?: number;
  locationName?: string;

  // Browser location fallback (temporary, not stored)
  browserLatitude?: number;
  browserLongitude?: number;
}

export interface UpdateDesignInput {
  name?: string;
  description?: string;
  category?: "holiday" | "birthday" | "thankyou" | "greeting" | "travel" | "custom";
  backgroundColor?: string;
  textColor?: string;
  font?: "sans" | "serif" | "handwritten" | "decorative";
  layout?: "full-image" | "split-horizontal" | "split-vertical" | "border-frame";
  isPublic?: boolean;
  defaultMessage?: string;
  frontImage?: string;
  imageVariants?: string[];
  overlays?: OverlayData[];
  latitude?: number;
  longitude?: number;
  locationName?: string;
  imageOriginal?: string;
}