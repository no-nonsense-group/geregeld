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
ALTER TABLE "identity_account" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "identity_verification" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "identity_account" CASCADE;--> statement-breakpoint
DROP TABLE "identity_verification" CASCADE;--> statement-breakpoint
DELETE FROM "identity_session";--> statement-breakpoint
ALTER TABLE "identity_session" RENAME COLUMN "token" TO "token_hash";--> statement-breakpoint
ALTER TABLE "identity_session" DROP CONSTRAINT "identity_session_token_unique";--> statement-breakpoint
ALTER TABLE "identity_session" DROP COLUMN "updated_at";--> statement-breakpoint
ALTER TABLE "identity_session" DROP COLUMN "ip_address";--> statement-breakpoint
ALTER TABLE "identity_session" DROP COLUMN "user_agent";--> statement-breakpoint
ALTER TABLE "identity_user" DROP COLUMN "name";--> statement-breakpoint
ALTER TABLE "identity_user" DROP COLUMN "image";--> statement-breakpoint
ALTER TABLE "identity_session" ADD CONSTRAINT "identity_session_token_hash_unique" UNIQUE("token_hash");
