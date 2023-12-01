ALTER TABLE "users" RENAME COLUMN "user_name" TO "username";--> statement-breakpoint
ALTER TABLE "users" DROP CONSTRAINT "users_user_name_unique";--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "email" text;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_username_unique" UNIQUE("username");--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_email_unique" UNIQUE("email");