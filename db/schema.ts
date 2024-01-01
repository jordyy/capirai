import {
  pgTable,
  pgEnum,
  serial,
  text,
  integer,
  real,
  boolean,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  userName: text("username").unique(),
  email: text("email").unique(),
});

export const userPasswords = pgTable("userPasswords", {
  userID: integer("user_ID").references(() => users.id),
  hashedPass: text("password"),
});

export const userPasswordsRelations = relations(userPasswords, ({ one }) => ({
  user: one(users, {
    fields: [userPasswords.userID],
    references: [users.id],
  }),
}));

export const usersRelations = relations(users, ({ many, one }) => ({
  userCards: many(userCards),
  userDeckSubscriptions: many(userDeckSubscriptions),
  userPassword: one(userPasswords, {
    fields: [users.id],
    references: [userPasswords.userID],
  }),
}));

export const CEFRlevelEnum = pgEnum("CEFR_level", [
  "A1",
  "A2",
  "B1",
  "B2",
  "C1",
  "C2",
]);

export const cardTypeEnum = pgEnum("type", [
  "vocabulary",
  "sentence",
  "verb conjugation",
]);

export const cards = pgTable("cards", {
  id: serial("id").primaryKey(),
  front: text("front_side"),
  back: text("back_side"),
  frequency: real("frequency").default(0),
  language: text("language"),
  CEFR_level: text("CEFR_level"),
  type: text("type"),
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
    user: one(users, {
      fields: [userDeckSubscriptions.userID],
      references: [users.id],
    }),
    deck: one(decks, {
      fields: [userDeckSubscriptions.deckID],
      references: [decks.id],
    }),
  })
);

export const deckCards = pgTable("deckCards", {
  id: serial("id").primaryKey(),
  deckID: integer("deck_id")
    .references(() => decks.id)
    .notNull(),
  cardID: integer("card_id")
    .references(() => cards.id)
    .notNull(),
});

export const deckCardsRelations = relations(deckCards, ({ many }) => ({
  cards: many(cards),
  decks: many(decks),
}));
