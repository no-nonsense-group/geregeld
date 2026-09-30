CREATE TABLE `availability_period` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`resource_id` text,
	`date` text NOT NULL,
	`start_minute` integer NOT NULL,
	`end_minute` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organization`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`resource_id`) REFERENCES `bookable_resource`(`id`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT "availability_period_start_minute_check" CHECK("availability_period"."start_minute" >= 0 AND "availability_period"."start_minute" < 1440),
	CONSTRAINT "availability_period_end_minute_check" CHECK("availability_period"."end_minute" > 0 AND "availability_period"."end_minute" <= 1440),
	CONSTRAINT "availability_period_order_check" CHECK("availability_period"."start_minute" < "availability_period"."end_minute"),
	CONSTRAINT "availability_period_date_limit_check" CHECK("availability_period"."date" <= '2099-12-31')
);
--> statement-breakpoint
CREATE INDEX `availability_period_organization_date_idx` ON `availability_period` (`organization_id`,`date`);--> statement-breakpoint
CREATE TABLE `bookable_resource` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`name` text NOT NULL,
	`kind` text NOT NULL,
	`capacity` integer NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`default_duration_minutes` integer DEFAULT 60 NOT NULL,
	`availability_configured_at` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organization`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "resource_capacity_check" CHECK("bookable_resource"."capacity" BETWEEN 1 AND 1000)
);
--> statement-breakpoint
CREATE INDEX `bookable_resource_org_idx` ON `bookable_resource` (`organization_id`);--> statement-breakpoint
CREATE TABLE `bookable_service` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`name` text NOT NULL,
	`duration_minutes` integer NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organization`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "service_duration_check" CHECK("bookable_service"."duration_minutes" BETWEEN 1 AND 1440)
);
--> statement-breakpoint
CREATE INDEX `bookable_service_org_idx` ON `bookable_service` (`organization_id`);--> statement-breakpoint
CREATE TABLE `identity_login_challenge` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`code_hash` text NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `identity_login_challenge_email_unique` ON `identity_login_challenge` (`email`);--> statement-breakpoint
CREATE TABLE `identity_registration_challenge` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`code_hash` text NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `identity_registration_challenge_email_unique` ON `identity_registration_challenge` (`email`);--> statement-breakpoint
CREATE TABLE `identity_session` (
	`id` text PRIMARY KEY NOT NULL,
	`expires_at` integer NOT NULL,
	`token_hash` text NOT NULL,
	`created_at` integer NOT NULL,
	`user_id` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `identity_user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `identity_session_token_hash_unique` ON `identity_session` (`token_hash`);--> statement-breakpoint
CREATE INDEX `identity_session_userId_idx` ON `identity_session` (`user_id`);--> statement-breakpoint
CREATE TABLE `identity_user` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`email_verified` integer DEFAULT false NOT NULL,
	`terms_accepted_at` integer,
	`terms_version` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `identity_user_email_unique` ON `identity_user` (`email`);--> statement-breakpoint
CREATE TABLE `organization` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`booking_mode` text,
	`time_zone` text NOT NULL,
	`default_availability_period_minutes` integer DEFAULT 30 NOT NULL,
	`availability_configured_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `organization_membership` (
	`id` text PRIMARY KEY NOT NULL,
	`role` text DEFAULT 'owner' NOT NULL,
	`created_at` integer NOT NULL,
	`organization_id` text NOT NULL,
	`user_id` text NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organization`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `identity_user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `organization_membership_userId_uidx` ON `organization_membership` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `organization_membership_ownerOrganizationId_uidx` ON `organization_membership` (`organization_id`) WHERE "organization_membership"."role" = 'owner';