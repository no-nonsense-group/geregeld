CREATE TABLE "booking_hours_date_exception" (
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"date" date NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "booking_hours_date_exception_date_limit_check" CHECK ("booking_hours_date_exception"."date" <= DATE '2099-12-31')
);
--> statement-breakpoint
CREATE TABLE "booking_hours_date_exception_window" (
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid() NOT NULL,
	"exception_id" uuid NOT NULL,
	"start_minute" integer NOT NULL,
	"end_minute" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "booking_hours_date_exception_window_start_minute_check" CHECK ("booking_hours_date_exception_window"."start_minute" >= 0 AND "booking_hours_date_exception_window"."start_minute" < 1440),
	CONSTRAINT "booking_hours_date_exception_window_end_minute_check" CHECK ("booking_hours_date_exception_window"."end_minute" > 0 AND "booking_hours_date_exception_window"."end_minute" <= 1440),
	CONSTRAINT "booking_hours_date_exception_window_order_check" CHECK ("booking_hours_date_exception_window"."start_minute" < "booking_hours_date_exception_window"."end_minute")
);
--> statement-breakpoint
CREATE TABLE "booking_hours_window" (
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"day_of_week" integer NOT NULL,
	"start_minute" integer NOT NULL,
	"end_minute" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "booking_hours_window_day_of_week_check" CHECK ("booking_hours_window"."day_of_week" >= 0 AND "booking_hours_window"."day_of_week" <= 6),
	CONSTRAINT "booking_hours_window_start_minute_check" CHECK ("booking_hours_window"."start_minute" >= 0 AND "booking_hours_window"."start_minute" < 1440),
	CONSTRAINT "booking_hours_window_end_minute_check" CHECK ("booking_hours_window"."end_minute" > 0 AND "booking_hours_window"."end_minute" <= 1440),
	CONSTRAINT "booking_hours_window_order_check" CHECK ("booking_hours_window"."start_minute" < "booking_hours_window"."end_minute")
);
--> statement-breakpoint
INSERT INTO "booking_hours_date_exception" (
	"organization_id",
	"date",
	"created_at",
	"updated_at"
)
SELECT
	"organization_id",
	"date",
	MIN("created_at"),
	MAX("updated_at")
FROM "availability_period"
GROUP BY "organization_id", "date";
--> statement-breakpoint
INSERT INTO "booking_hours_date_exception_window" (
	"exception_id",
	"start_minute",
	"end_minute",
	"created_at",
	"updated_at"
)
SELECT
	"booking_hours_date_exception"."id",
	"availability_period"."start_minute",
	"availability_period"."end_minute",
	"availability_period"."created_at",
	"availability_period"."updated_at"
FROM "availability_period"
INNER JOIN "booking_hours_date_exception"
	ON "booking_hours_date_exception"."organization_id" = "availability_period"."organization_id"
	AND "booking_hours_date_exception"."date" = "availability_period"."date";
--> statement-breakpoint
DROP TABLE "availability_period" CASCADE;--> statement-breakpoint
ALTER TABLE "booking_hours_date_exception" ADD CONSTRAINT "booking_hours_date_exception_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_hours_date_exception_window" ADD CONSTRAINT "booking_hours_date_exception_window_exception_id_booking_hours_date_exception_id_fk" FOREIGN KEY ("exception_id") REFERENCES "public"."booking_hours_date_exception"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_hours_window" ADD CONSTRAINT "booking_hours_window_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "booking_hours_date_exception_organization_date_uidx" ON "booking_hours_date_exception" USING btree ("organization_id","date");--> statement-breakpoint
CREATE INDEX "booking_hours_date_exception_window_exception_idx" ON "booking_hours_date_exception_window" USING btree ("exception_id");--> statement-breakpoint
CREATE INDEX "booking_hours_window_organization_day_idx" ON "booking_hours_window" USING btree ("organization_id","day_of_week");--> statement-breakpoint
CREATE UNIQUE INDEX "booking_hours_window_unique" ON "booking_hours_window" USING btree ("organization_id","day_of_week","start_minute","end_minute");--> statement-breakpoint
ALTER TABLE "organization" DROP COLUMN "default_availability_period_minutes";
