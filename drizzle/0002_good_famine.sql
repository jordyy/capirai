CREATE TABLE IF NOT EXISTS "userPasswords" (
	"user_ID" integer,
	"password" text
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "userPasswords" ADD CONSTRAINT "userPasswords_user_ID_users_id_fk" FOREIGN KEY ("user_ID") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
