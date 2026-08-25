CREATE TABLE "availability_period" (
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
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
ALTER TABLE "organization" ADD COLUMN "default_availability_period_minutes" integer DEFAULT 30 NOT NULL;--> statement-breakpoint
ALTER TABLE "organization" ADD COLUMN "availability_configured_at" timestamp;--> statement-breakpoint
ALTER TABLE "availability_period" ADD CONSTRAINT "availability_period_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "availability_period_organization_date_idx" ON "availability_period" USING btree ("organization_id","date");