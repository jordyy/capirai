CREATE TABLE IF NOT EXISTS "deckcards" (
	"id" serial PRIMARY KEY NOT NULL,
	"front_side" text,
	"back_side" text,
	"understanding_level" integer DEFAULT 0,
	"deck_id" integer,
	"card_owner_user_id" integer
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "decks" (
	"id" serial PRIMARY KEY NOT NULL,
	"deck_name" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_name" text,
	"deck_subscription" integer
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "deckcards" ADD CONSTRAINT "deckcards_deck_id_decks_id_fk" FOREIGN KEY ("deck_id") REFERENCES "decks"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "deckcards" ADD CONSTRAINT "deckcards_card_owner_user_id_users_id_fk" FOREIGN KEY ("card_owner_user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "users" ADD CONSTRAINT "users_deck_subscription_decks_id_fk" FOREIGN KEY ("deck_subscription") REFERENCES "decks"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
