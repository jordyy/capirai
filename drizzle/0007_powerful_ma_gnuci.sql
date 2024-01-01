DO $$ BEGIN
 CREATE TYPE "type" AS ENUM('vocabulary', 'sentence', 'verb conjugation');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "cards" ADD COLUMN "type" text;