DO $$ BEGIN
 CREATE TYPE "CEFR_level" AS ENUM('A1', 'A2', 'B1', 'B2', 'C1', 'C2');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "deckCards" ALTER COLUMN "deck_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "deckCards" ALTER COLUMN "card_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "cards" ADD COLUMN "frequency" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "cards" ADD COLUMN "language" text;--> statement-breakpoint
ALTER TABLE "cards" ADD COLUMN "CEFR_level" text;