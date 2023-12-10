import {
  bigint,
  pgTable,
  pgEnum,
  serial,
  text,
  integer,
  boolean,
  PgColumn,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  userName: text("username").unique(),
  email: text("email").unique(),
});

export const usersRelations = relations(users, ({ many }) => ({
  userCards: many(userCards),
  userDeckSubscriptions: many(userDeckSubscriptions),
}));

export const cards = pgTable("cards", {
  id: serial("id").primaryKey(),
  front: text("front_side"),
  back: text("back_side"),
});

export const cardsRelations = relations(cards, ({ many }) => ({
  userCards: many(userCards, { relationName: "userCards" }),
  decks: many(decks, { relationName: "decks" }),
}));

export const understandingEnum = pgEnum("understanding", [
  "I have never seen it",
  "I have seen it, but not sure what it means",
  "I know what it means",
  "I can use it",
]);
export const userCards = pgTable("userCards", {
  id: serial("id").primaryKey(),
  userID: integer("user_ID").references(() => users.id),
  cardID: integer("card_ID").references(() => cards.id),
  understanding: understandingEnum("understanding").default(
    "I have never seen it"
  ),
});

export const userCardsRelations = relations(userCards, ({ one }) => ({
  card: one(cards, {
    fields: [userCards.cardID],
    references: [cards.id],
  }),
  user: one(users, {
    fields: [userCards.userID],
    references: [users.id],
  }),
}));

export const decks = pgTable("decks", {
  id: serial("id").primaryKey(),
  name: text("deck_name"),
});

export const decksRelations = relations(decks, ({ many }) => ({
  cards: many(cards, { relationName: "cards" }),
  users: many(users, { relationName: "users" }),
}));

export const userDeckSubscriptions = pgTable("userDeckSubcriptions", {
  id: serial("id").primaryKey(),
  userID: integer("user_ID").references(() => users.id),
  deckID: integer("deck_ID").references(() => decks.id),
  completion: integer("completion_status").default(0),
  subscribed: boolean("subscribed_status").default(false),
});

export const userDeckSubcriptionsRelations = relations(
  userDeckSubscriptions,
  ({ one }) => ({
    users: one(users, {
      fields: [userDeckSubscriptions.id],
      references: [users.id],
    }),
  })
);

export const deckCards = pgTable("deckCards", {
  id: serial("id").primaryKey(),
  deckID: integer("deck_id").references(() => decks.id),
  cardID: integer("card_id").references(() => cards.id),
});

export const deckCardsRelations = relations(deckCards, ({ many }) => ({
  cards: many(cards),
  decks: many(decks),
}));
