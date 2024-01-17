ALTER TABLE "decks" ADD COLUMN "is_private" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "userCards" ADD COLUMN "times_reviewed" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "userCards" ADD COLUMN "last_reviewed" timestamp DEFAULT now();