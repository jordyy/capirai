import {
  LoaderFunctionArgs,
  ActionFunctionArgs,
  redirect,
  json,
} from "@remix-run/node";
import { useLoaderData, Outlet, Form } from "@remix-run/react";
import { deckCards } from "../db/schema";
import { eq } from "drizzle-orm";

import { drizzle } from "./utils/db.server";
import { Link } from "@remix-run/react";
import { z } from "zod";
import React from "react";
import { db } from "../db/index";
import { useFetcher } from "@remix-run/react";

export async function loader({ request }: LoaderFunctionArgs) {
  const allDeckCards = await drizzle.select().from(deckCards);
  return json([allDeckCards]);
}

export const action = async ({ params }: ActionFunctionArgs) => {
  const deckCardId = z.coerce.number().parse(params.deckCardId);
  console.log({ cardz_delete_error: params.error });

  try {
    await db.delete(deckCards).where(eq(deckCards.cardID, deckCardId));
    return redirect(`/allDeckCards`);
  } catch (error) {
    return json({ status: "error" });
  }
};

export default function AllDeckCards() {
  const allDeckCards = useLoaderData<typeof loader>();
  const fetcher = useFetcher();

  const cardsArray = Object.entries(allDeckCards[0]).map(([key, value]) => {
    return { key, value };
  });

  if (!cardsArray) {
    return <div>Decks not found.</div>;
  }

  return (
    <div id="all-decks">
      <h1>All Deck Cards</h1>
      <Outlet />
      {/* {cardsArray.map((card) => (
        <div className="card-container" key={deckCard.value.id}>
          {card.value.front} ||| {card.value.back}
          <div className="button-container">
            <Link
              className="button"
              to={`/cards/${card.value.id}/edit`}
              reloadDocument
            >
              Edit
            </Link>
            <fetcher.Form
              method="post"
              action={`/cards/${card.value.id}/delete`}
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
      ))} */}
    </div>
  );
}
