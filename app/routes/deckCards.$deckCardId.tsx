import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { eq } from "drizzle-orm";
import { Form, useLoaderData, Link, useFetcher } from "@remix-run/react";
import React from "react";

import { drizzle } from "../utils/db.server";
import { deckCards, decks, cards, userCards } from "../../db/schema";
import { z } from "zod";

export async function loader({ params }: LoaderFunctionArgs) {
  const parsedDeckCardId = z.coerce.number().parse(params.deckCardId);

  try {
    const singleDeckCard = await drizzle
      .select()
      .from(deckCards)
      .innerJoin(decks, eq(deckCards.deckID, decks.id))
      .innerJoin(cards, eq(deckCards.cardID, cards.id))
      .innerJoin(userCards, eq(cards.id, userCards.cardID))
      .where(eq(deckCards.id, parsedDeckCardId));
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
  const fetcher = useFetcher();

  if (!singleDeckCard || singleDeckCard.length === 0) {
    return <div>Card does not exist.</div>;
  }

  console.log({ singleDeckCard });

  return (
    <div id="deck">
      <h1>Single Card View</h1>
      <div className="single-card-container">
        {singleDeckCard.map((card) => {
          return (
            <div key={card.cards.id} className="card-box">
              <div className="single-card">
                <h2>{card.cards.front}</h2>
                <h2>{card.cards.back}</h2>
                <h2>{card.cards.CEFR_level}</h2>
                <h2>{card.cards.frequency}</h2>
              </div>
              <Link to={`/cards/${singleDeckCard[0].cards.id}/edit`}>Edit</Link>
              <Form
                method="post"
                onSubmit={(event) => {
                  const response = confirm(
                    "Please confirm you want to delete this record."
                  );
                  if (!response) {
                    event.preventDefault();
                  }
                }}
              >
                <button type="submit">Delete</button>
              </Form>
            </div>
          );
        })}
      </div>
    </div>
  );
}
