CREATE TABLE `booking_hours_date_exception` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`date` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organization`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "booking_hours_date_exception_date_limit_check" CHECK("booking_hours_date_exception"."date" <= '2099-12-31')
);
--> statement-breakpoint
CREATE UNIQUE INDEX `booking_hours_date_exception_organization_date_uidx` ON `booking_hours_date_exception` (`organization_id`,`date`);--> statement-breakpoint
CREATE TABLE `booking_hours_date_exception_window` (
	`id` text PRIMARY KEY NOT NULL,
	`exception_id` text NOT NULL,
	`start_minute` integer NOT NULL,
	`end_minute` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`exception_id`) REFERENCES `booking_hours_date_exception`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "booking_hours_date_exception_window_start_minute_check" CHECK("booking_hours_date_exception_window"."start_minute" >= 0 AND "booking_hours_date_exception_window"."start_minute" < 1440),
	CONSTRAINT "booking_hours_date_exception_window_end_minute_check" CHECK("booking_hours_date_exception_window"."end_minute" > 0 AND "booking_hours_date_exception_window"."end_minute" <= 1440),
	CONSTRAINT "booking_hours_date_exception_window_order_check" CHECK("booking_hours_date_exception_window"."start_minute" < "booking_hours_date_exception_window"."end_minute")
);
--> statement-breakpoint
CREATE INDEX `booking_hours_date_exception_window_exception_idx` ON `booking_hours_date_exception_window` (`exception_id`);--> statement-breakpoint
CREATE TABLE `booking_hours_window` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`day_of_week` integer NOT NULL,
	`start_minute` integer NOT NULL,
	`end_minute` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organization`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "booking_hours_window_day_of_week_check" CHECK("booking_hours_window"."day_of_week" >= 0 AND "booking_hours_window"."day_of_week" <= 6),
	CONSTRAINT "booking_hours_window_start_minute_check" CHECK("booking_hours_window"."start_minute" >= 0 AND "booking_hours_window"."start_minute" < 1440),
	CONSTRAINT "booking_hours_window_end_minute_check" CHECK("booking_hours_window"."end_minute" > 0 AND "booking_hours_window"."end_minute" <= 1440),
	CONSTRAINT "booking_hours_window_order_check" CHECK("booking_hours_window"."start_minute" < "booking_hours_window"."end_minute")
);
--> statement-breakpoint
CREATE INDEX `booking_hours_window_organization_day_idx` ON `booking_hours_window` (`organization_id`,`day_of_week`);--> statement-breakpoint
CREATE UNIQUE INDEX `booking_hours_window_unique` ON `booking_hours_window` (`organization_id`,`day_of_week`,`start_minute`,`end_minute`);--> statement-breakpoint
INSERT INTO `booking_hours_date_exception` (
	`id`,
	`organization_id`,
	`date`,
	`created_at`,
	`updated_at`
)
SELECT
	MIN(`id`),
	`organization_id`,
	`date`,
	MIN(`created_at`),
	MAX(`updated_at`)
FROM `availability_period`
GROUP BY `organization_id`, `date`;--> statement-breakpoint
INSERT INTO `booking_hours_date_exception_window` (
	`id`,
	`exception_id`,
	`start_minute`,
	`end_minute`,
	`created_at`,
	`updated_at`
)
SELECT
	`availability_period`.`id`,
	`booking_hours_date_exception`.`id`,
	`availability_period`.`start_minute`,
	`availability_period`.`end_minute`,
	`availability_period`.`created_at`,
	`availability_period`.`updated_at`
FROM `availability_period`
INNER JOIN `booking_hours_date_exception`
	ON `booking_hours_date_exception`.`organization_id` = `availability_period`.`organization_id`
	AND `booking_hours_date_exception`.`date` = `availability_period`.`date`;--> statement-breakpoint
DROP TABLE `availability_period`;--> statement-breakpoint
ALTER TABLE `organization` DROP COLUMN `default_availability_period_minutes`;
