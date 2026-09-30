CREATE TYPE "public"."booking_mode" AS ENUM('appointments', 'tables', 'rooms');--> statement-breakpoint
CREATE TYPE "public"."organization_membership_role" AS ENUM('owner');--> statement-breakpoint
CREATE TYPE "public"."resource_kind" AS ENUM('tables', 'rooms');--> statement-breakpoint
CREATE TABLE "availability_period" (
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"resource_id" uuid,
	"date" date NOT NULL,
	"start_minute" integer NOT NULL,
	"end_minute" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "availability_period_start_minute_check" CHECK ("availability_period"."start_minute" >= 0 AND "availability_period"."start_minute" < 1440),
	CONSTRAINT "availability_period_end_minute_check" CHECK ("availability_period"."end_minute" > 0 AND "availability_period"."end_minute" <= 1440),
	CONSTRAINT "availability_period_order_check" CHECK ("availability_period"."start_minute" < "availability_period"."end_minute"),
	CONSTRAINT "availability_period_date_limit_check" CHECK ("availability_period"."date" <= DATE '2099-12-31')
);
--> statement-breakpoint
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
CREATE TABLE "identity_login_challenge" (
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"code_hash" text NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "identity_login_challenge_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "identity_registration_challenge" (
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"code_hash" text NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "identity_registration_challenge_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "identity_session" (
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid() NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token_hash" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"user_id" uuid NOT NULL,
	CONSTRAINT "identity_session_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "identity_user" (
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"terms_accepted_at" timestamp,
	"terms_version" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "identity_user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "organization" (
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"booking_mode" "booking_mode",
	"time_zone" text NOT NULL,
	"default_availability_period_minutes" integer DEFAULT 30 NOT NULL,
	"availability_configured_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organization_membership" (
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid() NOT NULL,
	"role" "organization_membership_role" DEFAULT 'owner' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"organization_id" uuid NOT NULL,
	"user_id" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "availability_period" ADD CONSTRAINT "availability_period_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "availability_period" ADD CONSTRAINT "availability_period_resource_id_bookable_resource_id_fk" FOREIGN KEY ("resource_id") REFERENCES "public"."bookable_resource"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookable_resource" ADD CONSTRAINT "bookable_resource_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookable_service" ADD CONSTRAINT "bookable_service_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "identity_session" ADD CONSTRAINT "identity_session_user_id_identity_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."identity_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_membership" ADD CONSTRAINT "organization_membership_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_membership" ADD CONSTRAINT "organization_membership_user_id_identity_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."identity_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "availability_period_organization_date_idx" ON "availability_period" USING btree ("organization_id","date");--> statement-breakpoint
CREATE INDEX "bookable_resource_org_idx" ON "bookable_resource" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "bookable_service_org_idx" ON "bookable_service" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "identity_session_userId_idx" ON "identity_session" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "organization_membership_userId_uidx" ON "organization_membership" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "organization_membership_ownerOrganizationId_uidx" ON "organization_membership" USING btree ("organization_id") WHERE "organization_membership"."role" = 'owner';