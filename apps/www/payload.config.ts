import { buildConfig } from "payload";
import { vercelPostgresAdapter } from "@payloadcms/db-vercel-postgres";

import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { vercelBlobStorage } from "@payloadcms/storage-vercel-blob";
import path from "path";
import { fileURLToPath } from "url";
import { PostcardDesign } from "./src/collections/PostcardDesign";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

export default buildConfig({
  admin: {
    user: "users",
  },
  collections: [
    PostcardDesign,
    {
      slug: "users",
      auth: true,
      access: {
        create: () => true,
        read: () => true,
        update: ({ req: { user } }) => !!user,
        delete: ({ req: { user } }) => !!user,
      },
      fields: [
        {
          name: "role",
          type: "select",
          options: [
            { label: "Admin", value: "admin" },
            { label: "User", value: "user" },
          ],
          defaultValue: "user",
          required: true,
        },
      ],
    },
    {
      slug: "postcards",
      admin: {
        useAsTitle: "title",
      },
      access: {
        read: () => true,
      },
      fields: [
        {
          name: "title",
          type: "text",
          required: true,
        },
        {
          name: "message",
          type: "richText",
          editor: lexicalEditor({}),
        },
        {
          name: "recipientName",
          type: "text",
          required: true,
        },
        {
          name: "recipientAddress",
          type: "textarea",
          required: true,
        },
        {
          name: "senderName",
          type: "text",
          required: true,
        },
        {
          name: "image",
          type: "upload",
          relationTo: "media",
          required: true,
        },
        {
          name: "status",
          type: "select",
          options: [
            { label: "Draft", value: "draft" },
            { label: "Sent", value: "sent" },
            { label: "Delivered", value: "delivered" },
          ],
          defaultValue: "draft",
        },
        {
          name: "aiGenerated",
          type: "checkbox",
          defaultValue: false,
        },
        {
          name: "createdBy",
          type: "relationship",
          relationTo: "users",
          required: true,
        },
      ],
    },
    {
      slug: "media",
      upload: true,
      fields: [
        {
          name: "alt",
          type: "text",
        },
      ],
    },
    {
      slug: "templates",
      admin: {
        useAsTitle: "name",
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
          name: "templateImage",
          type: "upload",
          relationTo: "media",
        },
        {
          name: "defaultMessage",
          type: "richText",
          editor: lexicalEditor({}),
        },
        {
          name: "isActive",
          type: "checkbox",
          defaultValue: true,
        },
      ],
    },
  ],
  editor: lexicalEditor({}),
  secret: process.env.PAYLOAD_SECRET || "YOUR_SECRET_HERE",
  typescript: {
    outputFile: path.resolve(dirname, "payload-types.ts"),
  },
  db: vercelPostgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI || "",
    },
  }),
  plugins: [
    vercelBlobStorage({
      enabled: true,
      collections: {
        media: true,
      },
      token: process.env.BLOB_READ_WRITE_TOKEN || "",
    }),
  ],
});
