import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-vercel-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_postcard_designs_overlays_font_family" AS ENUM('sans-serif', 'serif', 'cursive', 'display');
  CREATE TYPE "public"."enum_postcard_designs_overlays_text_align" AS ENUM('left', 'center', 'right');
  CREATE TYPE "public"."enum_postcard_designs_font" AS ENUM('sans', 'serif', 'handwritten', 'decorative');
  CREATE TYPE "public"."enum_postcard_designs_layout" AS ENUM('full-image', 'split-horizontal', 'split-vertical', 'border-frame');
  CREATE TYPE "public"."enum_postcard_designs_category" AS ENUM('holiday', 'birthday', 'thankyou', 'greeting', 'travel', 'custom');
  CREATE TYPE "public"."enum_users_role" AS ENUM('admin', 'user');
  CREATE TYPE "public"."enum_postcards_status" AS ENUM('draft', 'sent', 'delivered');
  CREATE TYPE "public"."enum_templates_category" AS ENUM('holiday', 'birthday', 'thankyou', 'greeting', 'travel');
  CREATE TABLE "postcard_designs_overlays" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar NOT NULL,
  	"font_size" numeric DEFAULT 24,
  	"font_family" "enum_postcard_designs_overlays_font_family" DEFAULT 'sans-serif',
  	"color" varchar DEFAULT '#ffffff',
  	"stroke_color" varchar DEFAULT '#000000',
  	"stroke_width" numeric DEFAULT 2,
  	"x" numeric DEFAULT 50,
  	"y" numeric DEFAULT 50,
  	"rotation" numeric DEFAULT 0,
  	"opacity" numeric DEFAULT 1,
  	"text_align" "enum_postcard_designs_overlays_text_align" DEFAULT 'center'
  );
  
  CREATE TABLE "postcard_designs" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"description" varchar,
  	"latitude" numeric,
  	"longitude" numeric,
  	"location_name" varchar,
  	"image_original_id" integer NOT NULL,
  	"front_image_id" integer NOT NULL,
  	"video_url" varchar,
  	"background_color" varchar DEFAULT '#ffffff',
  	"text_color" varchar DEFAULT '#000000',
  	"font" "enum_postcard_designs_font" DEFAULT 'sans',
  	"layout" "enum_postcard_designs_layout" DEFAULT 'full-image',
  	"default_message" varchar,
  	"category" "enum_postcard_designs_category" DEFAULT 'custom',
  	"is_public" boolean DEFAULT false,
  	"created_by_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "postcard_designs_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"media_id" integer
  );
  
  CREATE TABLE "users_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "users" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"role" "enum_users_role" DEFAULT 'user' NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE "postcards" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"message" jsonb,
  	"recipient_name" varchar NOT NULL,
  	"recipient_address" varchar NOT NULL,
  	"sender_name" varchar NOT NULL,
  	"image_id" integer NOT NULL,
  	"status" "enum_postcards_status" DEFAULT 'draft',
  	"ai_generated" boolean DEFAULT false,
  	"created_by_id" integer NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "media" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"alt" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric
  );
  
  CREATE TABLE "templates" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"description" varchar,
  	"category" "enum_templates_category",
  	"template_image_id" integer,
  	"default_message" jsonb,
  	"is_active" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"global_slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"postcard_designs_id" integer,
  	"users_id" integer,
  	"postcards_id" integer,
  	"media_id" integer,
  	"templates_id" integer
  );
  
  CREATE TABLE "payload_preferences" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"value" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_preferences_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer
  );
  
  CREATE TABLE "payload_migrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"batch" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "postcard_designs_overlays" ADD CONSTRAINT "postcard_designs_overlays_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."postcard_designs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "postcard_designs" ADD CONSTRAINT "postcard_designs_image_original_id_media_id_fk" FOREIGN KEY ("image_original_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "postcard_designs" ADD CONSTRAINT "postcard_designs_front_image_id_media_id_fk" FOREIGN KEY ("front_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "postcard_designs" ADD CONSTRAINT "postcard_designs_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "postcard_designs_rels" ADD CONSTRAINT "postcard_designs_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."postcard_designs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "postcard_designs_rels" ADD CONSTRAINT "postcard_designs_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "users_sessions" ADD CONSTRAINT "users_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "postcards" ADD CONSTRAINT "postcards_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "postcards" ADD CONSTRAINT "postcards_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "templates" ADD CONSTRAINT "templates_template_image_id_media_id_fk" FOREIGN KEY ("template_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_postcard_designs_fk" FOREIGN KEY ("postcard_designs_id") REFERENCES "public"."postcard_designs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_postcards_fk" FOREIGN KEY ("postcards_id") REFERENCES "public"."postcards"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_templates_fk" FOREIGN KEY ("templates_id") REFERENCES "public"."templates"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "postcard_designs_overlays_order_idx" ON "postcard_designs_overlays" USING btree ("_order");
  CREATE INDEX "postcard_designs_overlays_parent_id_idx" ON "postcard_designs_overlays" USING btree ("_parent_id");
  CREATE INDEX "postcard_designs_image_original_idx" ON "postcard_designs" USING btree ("image_original_id");
  CREATE INDEX "postcard_designs_front_image_idx" ON "postcard_designs" USING btree ("front_image_id");
  CREATE INDEX "postcard_designs_created_by_idx" ON "postcard_designs" USING btree ("created_by_id");
  CREATE INDEX "postcard_designs_updated_at_idx" ON "postcard_designs" USING btree ("updated_at");
  CREATE INDEX "postcard_designs_created_at_idx" ON "postcard_designs" USING btree ("created_at");
  CREATE INDEX "postcard_designs_rels_order_idx" ON "postcard_designs_rels" USING btree ("order");
  CREATE INDEX "postcard_designs_rels_parent_idx" ON "postcard_designs_rels" USING btree ("parent_id");
  CREATE INDEX "postcard_designs_rels_path_idx" ON "postcard_designs_rels" USING btree ("path");
  CREATE INDEX "postcard_designs_rels_media_id_idx" ON "postcard_designs_rels" USING btree ("media_id");
  CREATE INDEX "users_sessions_order_idx" ON "users_sessions" USING btree ("_order");
  CREATE INDEX "users_sessions_parent_id_idx" ON "users_sessions" USING btree ("_parent_id");
  CREATE INDEX "users_updated_at_idx" ON "users" USING btree ("updated_at");
  CREATE INDEX "users_created_at_idx" ON "users" USING btree ("created_at");
  CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");
  CREATE INDEX "postcards_image_idx" ON "postcards" USING btree ("image_id");
  CREATE INDEX "postcards_created_by_idx" ON "postcards" USING btree ("created_by_id");
  CREATE INDEX "postcards_updated_at_idx" ON "postcards" USING btree ("updated_at");
  CREATE INDEX "postcards_created_at_idx" ON "postcards" USING btree ("created_at");
  CREATE INDEX "media_updated_at_idx" ON "media" USING btree ("updated_at");
  CREATE INDEX "media_created_at_idx" ON "media" USING btree ("created_at");
  CREATE UNIQUE INDEX "media_filename_idx" ON "media" USING btree ("filename");
  CREATE INDEX "templates_template_image_idx" ON "templates" USING btree ("template_image_id");
  CREATE INDEX "templates_updated_at_idx" ON "templates" USING btree ("updated_at");
  CREATE INDEX "templates_created_at_idx" ON "templates" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_global_slug_idx" ON "payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX "payload_locked_documents_updated_at_idx" ON "payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX "payload_locked_documents_created_at_idx" ON "payload_locked_documents" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_order_idx" ON "payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX "payload_locked_documents_rels_parent_idx" ON "payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX "payload_locked_documents_rels_path_idx" ON "payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX "payload_locked_documents_rels_postcard_designs_id_idx" ON "payload_locked_documents_rels" USING btree ("postcard_designs_id");
  CREATE INDEX "payload_locked_documents_rels_users_id_idx" ON "payload_locked_documents_rels" USING btree ("users_id");
  CREATE INDEX "payload_locked_documents_rels_postcards_id_idx" ON "payload_locked_documents_rels" USING btree ("postcards_id");
  CREATE INDEX "payload_locked_documents_rels_media_id_idx" ON "payload_locked_documents_rels" USING btree ("media_id");
  CREATE INDEX "payload_locked_documents_rels_templates_id_idx" ON "payload_locked_documents_rels" USING btree ("templates_id");
  CREATE INDEX "payload_preferences_key_idx" ON "payload_preferences" USING btree ("key");
  CREATE INDEX "payload_preferences_updated_at_idx" ON "payload_preferences" USING btree ("updated_at");
  CREATE INDEX "payload_preferences_created_at_idx" ON "payload_preferences" USING btree ("created_at");
  CREATE INDEX "payload_preferences_rels_order_idx" ON "payload_preferences_rels" USING btree ("order");
  CREATE INDEX "payload_preferences_rels_parent_idx" ON "payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX "payload_preferences_rels_path_idx" ON "payload_preferences_rels" USING btree ("path");
  CREATE INDEX "payload_preferences_rels_users_id_idx" ON "payload_preferences_rels" USING btree ("users_id");
  CREATE INDEX "payload_migrations_updated_at_idx" ON "payload_migrations" USING btree ("updated_at");
  CREATE INDEX "payload_migrations_created_at_idx" ON "payload_migrations" USING btree ("created_at");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "postcard_designs_overlays" CASCADE;
  DROP TABLE "postcard_designs" CASCADE;
  DROP TABLE "postcard_designs_rels" CASCADE;
  DROP TABLE "users_sessions" CASCADE;
  DROP TABLE "users" CASCADE;
  DROP TABLE "postcards" CASCADE;
  DROP TABLE "media" CASCADE;
  DROP TABLE "templates" CASCADE;
  DROP TABLE "payload_locked_documents" CASCADE;
  DROP TABLE "payload_locked_documents_rels" CASCADE;
  DROP TABLE "payload_preferences" CASCADE;
  DROP TABLE "payload_preferences_rels" CASCADE;
  DROP TABLE "payload_migrations" CASCADE;
  DROP TYPE "public"."enum_postcard_designs_overlays_font_family";
  DROP TYPE "public"."enum_postcard_designs_overlays_text_align";
  DROP TYPE "public"."enum_postcard_designs_font";
  DROP TYPE "public"."enum_postcard_designs_layout";
  DROP TYPE "public"."enum_postcard_designs_category";
  DROP TYPE "public"."enum_users_role";
  DROP TYPE "public"."enum_postcards_status";
  DROP TYPE "public"."enum_templates_category";`)
}
