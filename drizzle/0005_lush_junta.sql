CREATE TYPE "public"."booking_mode" AS ENUM('appointments', 'tables', 'rooms');--> statement-breakpoint
CREATE TYPE "public"."resource_kind" AS ENUM('tables', 'rooms');--> statement-breakpoint
CREATE TABLE "bookable_resource" (
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" text NOT NULL,
	"kind" "resource_kind" NOT NULL,
	"capacity" integer NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"default_duration_minutes" integer DEFAULT 60 NOT NULL,
	"availability_configured_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "resource_capacity_check" CHECK ("bookable_resource"."capacity" BETWEEN 1 AND 1000)
);
--> statement-breakpoint
CREATE TABLE "bookable_service" (
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" text NOT NULL,
	"duration_minutes" integer NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "service_duration_check" CHECK ("bookable_service"."duration_minutes" BETWEEN 1 AND 1440)
);
--> statement-breakpoint
ALTER TABLE "availability_period" ADD COLUMN "resource_id" uuid;--> statement-breakpoint
ALTER TABLE "organization" ADD COLUMN "booking_mode" "booking_mode";--> statement-breakpoint
ALTER TABLE "bookable_resource" ADD CONSTRAINT "bookable_resource_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookable_service" ADD CONSTRAINT "bookable_service_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "bookable_resource_org_idx" ON "bookable_resource" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "bookable_service_org_idx" ON "bookable_service" USING btree ("organization_id");--> statement-breakpoint
ALTER TABLE "availability_period" ADD CONSTRAINT "availability_period_resource_id_bookable_resource_id_fk" FOREIGN KEY ("resource_id") REFERENCES "public"."bookable_resource"("id") ON DELETE restrict ON UPDATE no action;