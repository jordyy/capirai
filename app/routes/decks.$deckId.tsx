import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { eq } from "drizzle-orm";
import { Form, useLoaderData } from "@remix-run/react";
import { Link } from "@remix-run/react";
import React from "react";

import { db } from "../../db/index";
import { decks } from "../../db/schema";
import { z } from "zod";

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const deck = await db
    .select()
    .from(decks)
    .where(eq(decks.id, Number(params.deckId)));

  if (!deck || deck.length === 0) {
    throw new Response("Not Found", { status: 404 });
  }
  const name = deck[0]?.name;

  return json({ deck });
};

export const action = async ({ params }: ActionFunctionArgs) => {
  const deckId = z.coerce.number().parse(params.deckId);

  try {
    await db.delete(decks).where(eq(decks.id, deckId));
    return redirect(`/decks`);
  } catch (error) {
    console.log({ deck_delete_error: error });
    return json({ status: "error" });
  }
};

export default function Deck({}) {
  const { deck } = useLoaderData<typeof loader>();
  const deckData = deck[0];

  if (!deckData) {
    return <div>Deck not found.</div>;
  }

  return (
    <div id="deck">
      <h1>{deckData.name}</h1>

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
