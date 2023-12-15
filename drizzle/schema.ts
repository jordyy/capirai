import { pgTable, unique, pgEnum, serial, text, foreignKey, integer, boolean } from "drizzle-orm/pg-core"
  import { sql } from "drizzle-orm"

export const understanding = pgEnum("understanding", ['I can use it', 'I know what it means', 'I have seen it, but not sure what it means', 'I have never seen it'])


export const users = pgTable("users", {
	id: serial("id").primaryKey().notNull(),
	username: text("username"),
	email: text("email"),
},
(table) => {
	return {
		usersUsernameUnique: unique("users_username_unique").on(table.username),
		usersEmailUnique: unique("users_email_unique").on(table.email),
	}
});

export const cards = pgTable("cards", {
	id: serial("id").primaryKey().notNull(),
	frontSide: text("front_side"),
	backSide: text("back_side"),
});

export const userCards = pgTable("userCards", {
	id: serial("id").primaryKey().notNull(),
	userId: integer("user_ID").references(() => users.id),
	cardId: integer("card_ID").references(() => cards.id),
	understanding: understanding("understanding").default('I have never seen it'),
});

export const userDeckSubcriptions = pgTable("userDeckSubcriptions", {
	id: serial("id").primaryKey().notNull(),
	userId: integer("user_ID").references(() => users.id),
	deckId: integer("deck_ID").references(() => decks.id),
	completionStatus: integer("completion_status").default(0),
	subscribedStatus: boolean("subscribed_status").default(false),
});

export const decks = pgTable("decks", {
	id: serial("id").primaryKey().notNull(),
	deckName: text("deck_name"),
});

export const passwords = pgTable("passwords", {
	userId: integer("user_ID").references(() => users.id),
	password: text("password"),
});

export const deckCards = pgTable("deckCards", {
	id: serial("id").primaryKey().notNull(),
	deckId: integer("deck_id").references(() => decks.id),
	cardId: integer("card_id").references(() => cards.id),
});