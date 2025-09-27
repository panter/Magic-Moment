import { z } from "zod";

// Zod schema for OpenAI response
export const CropHintsSchema = z.object({
  focalPoint: z
    .object({
      x: z.number().min(0).max(1),
      y: z.number().min(0).max(1),
    })
    .describe("Primary focal point for centering the crop"),

  primarySubject: z
    .object({
      type: z.string(),
      confidence: z.number().min(0).max(10),
      box: z.object({
        x: z.number().min(0).max(1),
        y: z.number().min(0).max(1),
        w: z.number().min(0).max(1),
        h: z.number().min(0).max(1),
      }),
    })
    .describe("Main subject detection"),

  regions: z
    .array(
      z.object({
        label: z.string(),
        type: z.enum([
          "face",
          "eyes",
          "upper_body",
          "full_body",
          "object",
          "text",
          "logo",
          "landmark",
        ]),
        importance: z.number().min(0).max(10),
        confidence: z.number().min(0).max(10),
        box: z.object({
          x: z.number().min(0).max(1),
          y: z.number().min(0).max(1),
          w: z.number().min(0).max(1),
          h: z.number().min(0).max(1),
        }),
      }),
    )
    .max(10)
    .describe("Detected regions with importance ratings"),
});

export type CropHints = z.infer<typeof CropHintsSchema>;

// Postcard aspect ratio (3:2)
export const POSTCARD_ASPECT_RATIO = 3 / 2;

// Crop rect interface
export interface CropRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

// Manual adjustment interface
export interface ManualAdjustment {
  x: number; // -1 to 1, representing percentage offset
  y: number; // -1 to 1, representing percentage offset
}
