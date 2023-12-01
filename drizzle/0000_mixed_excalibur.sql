DO $$ BEGIN
 CREATE TYPE "understanding" AS ENUM('I have never seen it', 'I have seen it, but not sure what it means', 'I know what it means', 'I can use it');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "cards" (
	"id" serial PRIMARY KEY NOT NULL,
	"front_side" text,
	"back_side" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "deckCards" (
	"id" serial PRIMARY KEY NOT NULL,
	"deck_id" integer,
	"card_id" integer
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "decks" (
	"id" serial PRIMARY KEY NOT NULL,
	"deck_name" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "userCards" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_ID" integer,
	"understanding" "understanding" DEFAULT 'I have never seen it',
	"card_ID" integer
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "userDeckSubcriptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_ID" integer,
	"deck_ID" integer,
	"completion_status" integer DEFAULT 0,
	"subscribed_status" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_name" text,
	CONSTRAINT "users_user_name_unique" UNIQUE("user_name")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "deckCards" ADD CONSTRAINT "deckCards_deck_id_decks_id_fk" FOREIGN KEY ("deck_id") REFERENCES "decks"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "deckCards" ADD CONSTRAINT "deckCards_card_id_cards_id_fk" FOREIGN KEY ("card_id") REFERENCES "cards"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "userCards" ADD CONSTRAINT "userCards_user_ID_users_id_fk" FOREIGN KEY ("user_ID") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "userCards" ADD CONSTRAINT "userCards_card_ID_cards_id_fk" FOREIGN KEY ("card_ID") REFERENCES "cards"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "userDeckSubcriptions" ADD CONSTRAINT "userDeckSubcriptions_user_ID_users_id_fk" FOREIGN KEY ("user_ID") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "userDeckSubcriptions" ADD CONSTRAINT "userDeckSubcriptions_deck_ID_decks_id_fk" FOREIGN KEY ("deck_ID") REFERENCES "decks"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
