import {
  LoaderFunctionArgs,
  ActionFunctionArgs,
  redirect,
  json,
} from "@remix-run/node";
import { useLoaderData, Outlet, Form } from "@remix-run/react";
import { deckCards, decks, cards } from "../../db/schema";
import { eq } from "drizzle-orm";

import { drizzle } from "../utils/db.server";
import { Link } from "@remix-run/react";
import { z } from "zod";
import React from "react";
import { db } from "../../db/index";
import { useFetcher } from "@remix-run/react";

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const allDeckCards = await drizzle
      .select()
      .from(deckCards)
      .innerJoin(decks, eq(deckCards.deckID, decks.id))
      .innerJoin(cards, eq(deckCards.cardID, cards.id));
    return json(allDeckCards);
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

  try {
    await db.delete(deckCards).where(eq(deckCards.cardID, deckCardId));
    return redirect(`/deckCards`);
  } catch (error) {
    return json({ status: "error" });
  }
};

export default function DeckCards() {
  const allDeckCards = useLoaderData<typeof loader>();
  const fetcher = useFetcher();

  if (!allDeckCards || allDeckCards.length === 0) {
    return <div>Decks not found.</div>;
  }

  return (
    <div id="all-decks">
      <h1>All Deck Cards</h1>
      <Outlet />
      {allDeckCards.map((card) => (
        <div className="card-container" key={card.cards.id}>
          <div>{card.decks.name}</div>
          <div>{card.cards.front}</div>
          <div>{card.cards.back}</div>
          <div className="button-container">
            <Link
              className="button"
              to={`/deckcards/${card.cards.id}/edit`}
              reloadDocument
            >
              Edit
            </Link>
            <fetcher.Form
              method="post"
              action={`/cards/${card.cards.id}/delete`}
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
            </fetcher.Form>
          </div>
        </div>
      ))}
    </div>
  );
}
