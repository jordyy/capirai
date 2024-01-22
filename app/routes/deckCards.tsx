import { LoaderFunctionArgs, ActionFunctionArgs, json } from "@remix-run/node";
import { useLoaderData, Outlet } from "@remix-run/react";
import {
  deckCards,
  decks,
  cards,
  userCards,
  understandingEnum,
} from "../../db/schema";
import { eq } from "drizzle-orm";

import { drizzle } from "../utils/db.server";
import { Link } from "@remix-run/react";
import { z } from "zod";
import React from "react";
import { useFetcher } from "@remix-run/react";

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const allDeckCards = await drizzle
      .select()
      .from(deckCards)
      .innerJoin(decks, eq(deckCards.deckID, decks.id))
      .innerJoin(cards, eq(deckCards.cardID, cards.id))
      .leftJoin(userCards, eq(userCards.cardID, deckCards.cardID));

    return json({ allDeckCards });
  } catch (error) {
    console.error("Loader error:", error);
    throw new Response("Error loading deck cards", { status: 500 });
  }
}

export const action = async ({ params }: ActionFunctionArgs) => {
  const deckCardId = z.coerce.number().parse(params.deckCardId);
  console.log({ cardz_delete_error: params.error });

  if (!deckCardId) {
    return json({ error: "No deck card id provided" }, { status: 400 });
  }
};

export default function DeckCards() {
  const { allDeckCards } = useLoaderData<typeof loader>();
  const fetcher = useFetcher();

  if (!allDeckCards || allDeckCards.length === 0) {
    return <div>Decks not found.</div>;
  }

  return (
    <div id="all-decks">
      <Outlet />
      {allDeckCards.map((card) => (
        <div className="card-container" key={card.cards.id}>
          <div>{card.decks.name}</div>
          <div>{card.cards.front}</div>
          <div>{card.cards.back}</div>
          <div className="button-container">
            <Link
              className="button"
              to={`/cards/${card.cards.id}/edit`}
              reloadDocument
            >
              Edit
            </Link>
            <fetcher.Form
              method="post"
              action={`/deckCards/${deckCards.cardID}/remove`}
            >
              <button type="submit">Remove</button>
            </fetcher.Form>
          </div>
        </div>
      ))}
    </div>
  );
}
