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
  latitude?: number;
  longitude?: number;
  locationName?: string;
}