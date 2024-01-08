import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { eq } from "drizzle-orm";
import { Form, useLoaderData, Link, useFetcher } from "@remix-run/react";
import React from "react";

import { drizzle } from "../utils/db.server";
import { deckCards, decks, cards, userCards } from "../../db/schema";
import { z } from "zod";

export async function loader({ params }: LoaderFunctionArgs) {
  if (!params.deckCardId || isNaN(Number(params.deckCardId))) {
    return json({ error: "Invalid deck card id" }, { status: 400 });
  }
  const deckCardId = Number(params.deckCardId);

  console.log(deckCardId);
  console.log("does this do anything");

  try {
    const singleDeckCard = await drizzle
      .select()
      .from(deckCards)
      .innerJoin(decks, eq(deckCards.deckID, decks.id))
      .innerJoin(cards, eq(deckCards.cardID, cards.id))
      .innerJoin(userCards, eq(cards.id, userCards.cardID))
      .where(eq(deckCards.id, deckCardId));
    return json(singleDeckCard);
  } catch (error) {
    console.error("Loader error:", error);
    throw new Response("Error loading deck cards", { status: 500 });
  }
}

const deckCardIdSchema = z.object({
  deckCardId: z.string(),
});

export const action = async ({ params }: ActionFunctionArgs) => {
  const parsedDeckCardId = deckCardIdSchema.safeParse(params.deckCardId);

  console.log({ cardz_delete_error: params.error });

  if (!parsedDeckCardId.success) {
    return json({ error: "No deck card id provided" }, { status: 400 });
  }

  try {
    await drizzle
      .delete(deckCards)
      .where(eq(deckCards.cardID, Number(parsedDeckCardId)));
    return redirect(`/deckCards`);
  } catch (error) {
    return json({ status: "error" });
  }
};

export default function SingleDeckCard() {
  const singleDeckCard = useLoaderData<typeof loader>();
  {
    console.log(singleDeckCard);
  }
  if (Array.isArray(singleDeckCard) && singleDeckCard.length === 0) {
    return <div>Card does not exist.</div>;
  }

  return (
    <div id="deck">
      <h1>Single Card View</h1>
      <div className="single-card-container">
        {singleDeckCard.map((item) => {
          const card = item.cards;
          if (!card) return null;

          return (
            <div key={card.id} className="card-box">
              <div className="single-card">
                <h2>{card.front}</h2>
                <h2>{card.back}</h2>
                <h2>{card.CEFR_level}</h2>
                <h2>{card.frequency}</h2>
              </div>
              <Link to={`/cards/${card.id}/edit`}>Edit</Link>
              <Form
                method="post"
                action={`/deckCards/${singleDeckCard[0].deckCards.id}/remove`}
              >
                <input
                  type="hidden"
                  name="deckCardId"
                  value={singleDeckCard[0].deckCards.id}
                />
                <button type="submit">Remove</button>
              </Form>
            </div>
          );
        })}
      </div>
    </div>
  );
}
