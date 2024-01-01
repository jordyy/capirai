import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { eq } from "drizzle-orm";
import { Form, useLoaderData } from "@remix-run/react";
import { Link } from "@remix-run/react";
import React from "react";

import { drizzle } from "../utils/db.server";
import { decks, deckCards, cards } from "../../db/schema";
import { z } from "zod";

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const deck = await drizzle
    .select()
    .from(decks)
    .where(eq(decks.id, Number(params.deckId)));

  const allDeckCards = await drizzle
    .select()
    .from(deckCards)
    .innerJoin(decks, eq(deckCards.deckID, decks.id));

  const thisDeckCards = await drizzle
    .select()
    .from(cards)
    .innerJoin(deckCards, eq(cards.id, deckCards.cardID))
    .where(eq(deckCards.deckID, Number(params.deckId)));

  if (!deck || deck.length === 0) {
    throw new Response("Not Found", { status: 404 });
  }
  if (!allDeckCards || allDeckCards.length === 0) {
    throw new Response("No cards in this deck");
  }

  const name = deck[0]?.name;

  return json({ deck, allDeckCards, name, thisDeckCards });
};

export const action = async ({ params }: ActionFunctionArgs) => {
  const deckId = z.coerce.number().parse(params.deckId);

  try {
    await drizzle.delete(decks).where(eq(decks.id, deckId));
    return redirect(`/decks`);
  } catch (error) {
    console.log({ deck_delete_error: error });
    return json({ status: "error" });
  }
};

export default function Deck({}) {
  const { deck, thisDeckCards } = useLoaderData<typeof loader>();
  const deckData = deck[0];
  console.log({ thisDeckCards: thisDeckCards[0].cards.id });

  if (!deckData) {
    return <div>Deck not found.</div>;
  }
  if (!thisDeckCards) {
    return <div>No cards in this deck.</div>;
  }

  return (
    <div id="deck">
      <h1>{deckData.name}</h1>
      {thisDeckCards.map((card) => {
        return (
          <div key={card.cards.id} className="single-card-container">
            <div className="card-box">
              <h2>{card.cards.front}</h2>
              <h2>{card.cards.back}</h2>
              <h2>{card.cards.CEFR_level}</h2>
              <h2>{card.cards.frequency}</h2>
            </div>
          </div>
        );
      })}

      <Link to={`/decks/${deckData.id}/edit`}>Edit</Link>
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
}
