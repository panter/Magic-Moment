import { CollectionConfig } from "payload";

export const PostcardDesign: CollectionConfig = {
  slug: "postcard-designs",
  admin: {
    useAsTitle: "name",
  },
  access: {
    create: ({ req: { user } }) => !!user,
    read: () => true,
    update: ({ req: { user } }) => {
      if (!user) return false;
      return {
        createdBy: {
          equals: user.id,
        },
      };
    },
    delete: ({ req: { user } }) => {
      if (!user) return false;
      return {
        createdBy: {
          equals: user.id,
        },
      };
    },
  },
  fields: [
    {
      name: "name",
      type: "text",
      required: true,
    },
    {
      name: "description",
      type: "textarea",
    },
    {
      name: "latitude",
      type: "number",
      admin: {
        description: "GPS latitude coordinate extracted from image EXIF",
      },
    },
    {
      name: "longitude",
      type: "number",
      admin: {
        description: "GPS longitude coordinate extracted from image EXIF",
      },
    },
    {
      name: "locationName",
      type: "text",
      admin: {
        description: "Location name based on GPS coordinates",
      },
    },
    {
      name: "imageOriginal",
      type: "upload",
      relationTo: "media",
      required: true,
      admin: {
        description: "The original uploaded image",
      },
    },
    {
      name: "frontImage",
      type: "upload",
      relationTo: "media",
      required: true,
      admin: {
        description: "The image that will be printed on the card",
      },
    },
    {
      name: "imageVariants",
      type: "relationship",
      relationTo: "media",
      hasMany: true,
      admin: {
        description: "AI-generated variants of the original image",
      },
    },
    {
      name: "videoUrl",
      type: "text",
      admin: {
        description: "URL of the video if the original upload was a video",
      },
    },
    {
      name: "backgroundColor",
      type: "text",
      defaultValue: "#ffffff",
    },
    {
      name: "textColor",
      type: "text",
      defaultValue: "#000000",
    },
    {
      name: "font",
      type: "select",
      options: [
        { label: "Sans Serif", value: "sans" },
        { label: "Serif", value: "serif" },
        { label: "Handwritten", value: "handwritten" },
        { label: "Decorative", value: "decorative" },
      ],
      defaultValue: "sans",
    },
    {
      name: "layout",
      type: "select",
      options: [
        { label: "Full Image", value: "full-image" },
        { label: "Split Horizontal", value: "split-horizontal" },
        { label: "Split Vertical", value: "split-vertical" },
        { label: "Border Frame", value: "border-frame" },
      ],
      defaultValue: "full-image",
    },
    {
      name: "defaultMessage",
      type: "textarea",
    },
    {
      name: "overlays",
      type: "array",
      admin: {
        description: "Text overlays to display on the postcard",
      },
      fields: [
        {
          name: "id",
          type: "text",
          required: true,
          admin: {
            hidden: true,
          },
        },
        {
          name: "text",
          type: "text",
          required: true,
        },
        {
          name: "fontSize",
          type: "number",
          defaultValue: 24,
        },
        {
          name: "fontFamily",
          type: "select",
          options: [
            { label: "Sans Serif", value: "sans-serif" },
            { label: "Serif", value: "serif" },
            { label: "Cursive", value: "cursive" },
            { label: "Display", value: "display" },
          ],
          defaultValue: "sans-serif",
        },
        {
          name: "color",
          type: "text",
          defaultValue: "#ffffff",
        },
        {
          name: "strokeColor",
          type: "text",
          defaultValue: "#000000",
        },
        {
          name: "strokeWidth",
          type: "number",
          defaultValue: 2,
        },
        {
          name: "x",
          type: "number",
          defaultValue: 50,
          admin: {
            description: "X position as percentage (0-100)",
          },
        },
        {
          name: "y",
          type: "number",
          defaultValue: 50,
          admin: {
            description: "Y position as percentage (0-100)",
          },
        },
        {
          name: "rotation",
          type: "number",
          defaultValue: 0,
          admin: {
            description: "Rotation in degrees",
          },
        },
        {
          name: "opacity",
          type: "number",
          defaultValue: 1,
          min: 0,
          max: 1,
        },
        {
          name: "textAlign",
          type: "select",
          options: [
            { label: "Left", value: "left" },
            { label: "Center", value: "center" },
            { label: "Right", value: "right" },
          ],
          defaultValue: "center",
        },
      ],
    },
    {
      name: "isPublic",
      type: "checkbox",
      defaultValue: false,
    },
    {
      name: "createdBy",
      type: "relationship",
      relationTo: "users",
      required: true,
      admin: {
        condition: () => false,
      },
      hooks: {
        beforeChange: [
          ({ req, operation, data }) => {
            if (operation === "create" && req.user && data) {
              data.createdBy = req.user.id;
              return data;
            }
          },
        ],
      },
    },
  ],
  hooks: {
    beforeChange: [
      ({ req, operation, data }) => {
        if (operation === "create" && req.user && data) {
          console.log("PostcardDesign beforeChange hook - geo fields:", {
            latitude: data.latitude,
            longitude: data.longitude,
            locationName: data.locationName,
          });
          data.createdBy = req.user.id;
          // If no frontImage is specified, use the imageOriginal
          if (!data.frontImage && data.imageOriginal) {
            data.frontImage = data.imageOriginal;
          }
        }
        return data;
      },
    ],
  },
};
