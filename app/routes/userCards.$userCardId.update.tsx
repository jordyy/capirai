import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, useLoaderData, useNavigation } from "@remix-run/react";
import { eq, and, sql } from "drizzle-orm";
import { userCards, cards, deckCards } from "../../db/schema";
import { z } from "zod";
import React from "react";
import { db } from "../../db/index";
import { getAuthCookie, requireAuthCookie } from "../auth";
import { drizzle } from "../utils/db.server";
import { timestamp } from "drizzle-orm/mysql-core";

export const loader = async ({ params }: LoaderFunctionArgs) => {
  if (!params.userCardId || isNaN(Number(params.userCardId))) {
    throw new Response("No user card id provided", { status: 400 });
  }

  const userCardId = Number(params.userCardId);

  const userCard = await db
    .select()
    .from(userCards)
    .where(eq(userCards.id, userCardId))
    .orderBy(userCards.id);

  if (!userCard) {
    throw new Response("No card found", { status: 404 });
  }
  const understanding = userCard[0]?.understanding;

  return json({ understanding, userCardId, userCard });
};

const cardSchema = z.object({
  understanding: z.string(),
});

export const action = async ({ params, request }: ActionFunctionArgs) => {
  const userId = await getAuthCookie(request);
  const formData = await request.formData();
  const deckId = formData.get("deckId");
  const deckCardId = formData.get("deckCardId");

  console.log({ deckId, deckCardId });

  if (!deckId || isNaN(Number(deckId))) {
    throw new Error("Invalid or missing DeckID");
  }

  if (!deckCardId || isNaN(Number(deckCardId))) {
    throw new Error("Invalid or missing DeckCardID");
  }

  const userCardIds = await db
    .select({
      userCardID: userCards.id,
      deckCardID: deckCards.id,
      cardID: deckCards.cardID,
      deckId: deckCards.deckID,
    })
    .from(userCards)
    .innerJoin(deckCards, eq(userCards.cardID, deckCards.cardID))
    // .innerJoin(cards, eq(userCards.cardID, cards.id))
    .where(eq(deckCards.deckID, Number(deckId)))
    .orderBy(userCards.id);

  if (!userCardIds) {
    throw new Response("No cards to review", { status: 404 });
  }

  const currentIndex = userCardIds.findIndex(
    (card) => card.userCardID === Number(params.userCardId)
  );

  if (!params.userCardId || isNaN(Number(params.userCardId))) {
    throw new Response("No user card id provided", { status: 400 });
  }

  if (!params.userCardId || isNaN(Number(params.userCardId))) {
    throw new Response("No user card id provided", { status: 400 });
  }

  const understanding = formData.get("understanding");

  const parsedInput = cardSchema.safeParse({
    understanding: understanding,
  });

  if (!parsedInput.success) {
    return json({ error: parsedInput.error }, { status: 400 });
  }

  const allCardIds = await db
    .select({ deckCardID: deckCards?.id, cardID: deckCards?.cardID })
    .from(deckCards)
    .where(eq(deckCards.deckID, Number(deckId)));

  const currentCardIndex = allCardIds.findIndex(
    (card) => card.deckCardID === Number(deckCardId)
  );

  const nextDeckCardId = allCardIds[currentCardIndex + 1]?.deckCardID;
  const nextCardId = allCardIds[currentCardIndex + 1]?.cardID;

  if (nextDeckCardId) {
    const nextUserCardExists = await db
      .select()
      .from(userCards)
      .where(eq(userCards.cardID, nextCardId));

    if (nextUserCardExists.length === 0) {
      await db
        .insert(userCards)
        .values({ userID: userId, cardID: nextCardId })
        .onConflictDoNothing();
    }
    if (nextDeckCardId === null) {
      return redirect(`/decks/${deckId}`);
    }
  }

  try {
    await drizzle
      .update(userCards)
      .set({
        understanding: parsedInput.data.understanding as
          | "I have never seen it"
          | "I have seen it, but not sure what it means"
          | "I know what it means"
          | "I can use it"
          | null
          | undefined,
        timesReviewed: sql.raw("times_reviewed + 1"),
        lastReviewed: sql.raw("CURRENT_TIMESTAMP"),
      })
      .where(eq(userCards.id, Number(params.userCardId)));

    return redirect(`/deckCards/${deckId}/${nextDeckCardId}`);
  } catch (error) {
    console.log({ card_edit_error: error });
    return json({ status: "error" });
  }
};

export default function UpdateUserCard({}) {
  const { understanding, userCardId, userCard } =
    useLoaderData<typeof loader>();

  return (
    <Form method="post">
      <p>
        <div className="edit-userCard-input-label">Understanding:</div>
        <input
          defaultValue={`${understanding}`}
          aria-label="understanding"
          name="understanding"
          type="submit"
          placeholder="understanding"
          id="understanding"
        />
      </p>
    </Form>
  );
}
