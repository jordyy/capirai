import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, useLoaderData, useNavigation } from "@remix-run/react";
import { eq, and } from "drizzle-orm";
import { userCards, cards, deckCards } from "../../db/schema";
import { z } from "zod";
import React from "react";
import { db } from "../../db/index";
import { getAuthCookie, requireAuthCookie } from "../auth";

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

  const userCardIds = await db
    .select({
      userCardID: userCards.id,
      deckCardID: deckCards.id,
      cardID: cards.id,
      deckId: deckCards.deckID,
    })
    .from(userCards)
    .innerJoin(deckCards, eq(userCards.cardID, deckCards.cardID))
    .innerJoin(cards, eq(userCards.cardID, cards.id))
    .orderBy(userCards.id);

  const deckId = userCardIds[0]?.deckId;
  if (!userCardIds) {
    throw new Response("No cards to review", { status: 404 });
  }

  const currentIndex = userCardIds.findIndex(
    (card) => card.userCardID === Number(params.userCardId)
  );
  const nextCard = userCardIds[currentIndex + 1] || null;

  if (nextCard === null) {
    return redirect(`/decks/${userCardIds[0].deckId}`);
  }

  if (!params.userCardId || isNaN(Number(params.userCardId))) {
    throw new Response("No user card id provided", { status: 400 });
  }

  if (!params.userCardId || isNaN(Number(params.userCardId))) {
    throw new Response("No user card id provided", { status: 400 });
  }
  const formData = await request.formData();
  const understanding = formData.get("understanding");

  const parsedInput = cardSchema.safeParse({
    understanding: understanding,
  });

  if (!parsedInput.success) {
    return json({ error: parsedInput.error }, { status: 400 });
  }

  const allCardIds = await db
    .select({ cardID: deckCards?.cardID })
    .from(deckCards)
    .where(eq(deckCards.deckID, deckId));

  const currentCardIndex = allCardIds.findIndex(
    (card) => card.cardID === userCardIds[currentIndex]?.cardID
  );

  const nextCardId = allCardIds[currentCardIndex + 1]?.cardID;

  if (nextCardId) {
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
  }

  try {
    await db
      .update(userCards)
      .set({
        understanding: parsedInput.data.understanding as
          | "I have never seen it"
          | "I have seen it, but not sure what it means"
          | "I know what it means"
          | "I can use it"
          | null
          | undefined,
      })
      .where(eq(userCards.id, Number(params.userCardId)));

    return redirect(`/deckCards/${nextCard?.deckCardID}`);
  } catch (error) {
    console.log({ card_edit_error: error });
    return json({ status: "error" });
  }
};

export default function UpdateUserCard({}) {
  const { understanding, userCardId, userCard } =
    useLoaderData<typeof loader>();

  console.log({ understanding, userCardId, userCard });
  return (
    <Form method="post">
      <p>
        <div className="edit-userCard-input-label">Understanding:</div>
        <input
          defaultValue={`${understanding}`}
          aria-label="understanding"
          name="understanding"
          type="text"
          placeholder="understanding"
          id="understanding"
        />
      </p>
    </Form>
  );
}
