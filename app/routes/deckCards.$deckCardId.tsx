import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { eq } from "drizzle-orm";
import { Form, useLoaderData, Link } from "@remix-run/react";
import React from "react";

import { drizzle } from "../utils/db.server";
import { deckCards } from "../../db/schema";
import { z } from "zod";

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const allDeckCards = await drizzle.select().from(deckCards);

  if (!allDeckCards || allDeckCards.length === 0) {
    throw new Response("No cards in this deck");
  }

  const name = deckCards[0]?.name;

  return json({ allDeckCards, name });
};

export const action = async ({ params }: ActionFunctionArgs) => {
  const deckCardId = z.coerce.number().parse(params.deckCardId);

  try {
    await drizzle.delete(deckCards).where(eq(deckCards.id, deckCardId));
    return redirect(`/deckCards`);
  } catch (error) {
    console.log({ deck_delete_error: error });
    return json({ status: "error" });
  }
};

export default function Deck({}) {
  const { allDeckCards } = useLoaderData<typeof loader>();
  const deckData = allDeckCards[0];

  if (!deckData) {
    return <div>Deck not found.</div>;
  }
  if (!allDeckCards) {
    return <div>No cards in this deck.</div>;
  }

  return (
    <div id="deck">
      <h1>{deckData.id}</h1>
      <div className="single-card-container">
        {allDeckCards.map((card) => {
          return (
            <div key={card.id} className="card-box">
              <div className="single-card"></div>
              <Link to={`/deckCards/${deckData.id}/edit`}>Edit</Link>
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
