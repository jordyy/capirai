import { pgTable, serial, text, integer } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  userName: text("user_name"),
  deckID: integer("deck_subscription").references(() => decks.id),
});

export const decks = pgTable("decks", {
  id: serial("id").primaryKey(),
  name: text("deck_name"),
});

export const deckcards = pgTable("deckcards", {
  id: serial("id").primaryKey(),
  front: text("front_side"),
  back: text("back_side"),
  understanding: integer("understanding_level").default(0),
  deckID: integer("deck_id").references(() => decks.id),
  cardOwnerUserId: integer("card_owner_user_id").references(() => users.id),
});
