import {
  pgTable,
  pgEnum,
  serial,
  text,
  timestamp,
  integer,
  real,
  boolean,
  uniqueIndex,
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
  "☁️",
  "🌥️",
  "🌤️",
  "☀️",
]);
export const userCards = pgTable(
  "userCards",
  {
    id: serial("id").primaryKey(),
    userID: integer("user_ID").references(() => users.id),
    cardID: integer("card_ID").references(() => cards.id),
    timesReviewed: integer("times_reviewed").default(0),
    lastReviewed: timestamp("last_reviewed").defaultNow(),
    understanding: understandingEnum("understanding").default("☁️"),
  },
  (table) => {
    return {
      userIDCardIDIdx: uniqueIndex("user_id_card_id_idx").on(
        table.userID,
        table.cardID
      ),
    };
  }
);

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
  isPrivate: boolean("is_private").default(false),
});

export const decksRelations = relations(decks, ({ many }) => ({
  cards: many(cards, { relationName: "cards" }),
  users: many(users, { relationName: "users" }),
}));

export const userDeckSubscriptions = pgTable(
  "userDeckSubcriptions",
  {
    id: serial("id").primaryKey(),
    userID: integer("user_ID").references(() => users.id),
    deckID: integer("deck_ID").references(() => decks.id, {
      onDelete: "cascade",
    }),
    completion: integer("completion_status").default(0),
    subscribed: boolean("subscribed_status").default(false),
  },
  (table) => {
    return {
      userIDDeckIDIdx: uniqueIndex("user_id_deck_id_idx").on(
        table.userID,
        table.deckID
      ),
    };
  }
);

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

export const storyGenreEnum = pgEnum("genre", [
  "Mystery",
  "Historical Fiction",
  "Romance",
  "Humor",
  "True Crime",
  "Adventure",
  "Fantasy",
  "Folklore",
  "Fable",
  "Fairy Tale",
  "Drama",
  "Western",
  "Dystopian Fiction",
  "Legend",
  "Realistic Fiction",
  "Tall Tale",
  "Biographical",
  "Coming-of-age",
  "Science Fiction",
]);

export const stories = pgTable("stories", {
  id: serial("id").primaryKey(),
  story: text("story"),
  length: text("length"),
  genre: storyGenreEnum("genre"),
  CEFR_level: CEFRlevelEnum("CEFR_level"),
  type: text("type"),
});

export const userStories = pgTable(
  "userStories",
  {
    id: serial("id").primaryKey(),
    userID: integer("user_ID").references(() => users.id),
    storiesID: integer("stories_ID").references(() => stories.id),
  },
  (table) => {
    return {
      userIDStoriesIDIdx: uniqueIndex("user_id_stories_id_idx").on(
        table.userID,
        table.storiesID
      ),
    };
  }
);

export const userStoriesRelations = relations(userStories, ({ one }) => ({
  card: one(stories, {
    fields: [userStories.storiesID],
    references: [stories.id],
  }),
  user: one(users, {
    fields: [userStories.storiesID],
    references: [users.id],
  }),
}));
