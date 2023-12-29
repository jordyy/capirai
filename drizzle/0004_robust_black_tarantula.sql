ALTER TABLE "cards" DROP CONSTRAINT "cards_deck_id_decks_id_fk";
--> statement-breakpoint
ALTER TABLE "cards" DROP COLUMN IF EXISTS "deck_id";