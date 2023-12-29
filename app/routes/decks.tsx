import {
  LoaderFunctionArgs,
  ActionFunctionArgs,
  json,
  redirect,
} from "@remix-run/node";
import { useLoaderData, Outlet, Form } from "@remix-run/react";
import { decks } from "../../db/schema";
import { db } from "../../db/index";
import { z } from "zod";
import React from "react";
import { eq } from "drizzle-orm";
import { drizzle } from "../utils/db.server";
import { Link } from "@remix-run/react";
import { useFetcher } from "@remix-run/react";

export async function loader({ request }: LoaderFunctionArgs) {
  const allDecks = await drizzle.select().from(decks);
  return json([allDecks]);
}

export const action = async ({ params }: ActionFunctionArgs) => {
  const deckId = z.coerce.number().parse(params.deckId);
  console.log({ deck_delete_error: params.error });

  try {
    await db.delete(decks).where(eq(decks.id, deckId));
    return redirect(`/decks`);
  } catch (error) {
    return json({ status: "error" });
  }
};

export default function Decks() {
  const decks = useLoaderData<typeof loader>();
  const fetcher = useFetcher();

  const decksArray = Object.entries(decks[0]).map(([key, value]) => {
    return { key, value };
  });

  if (!decksArray) {
    return <div>Decks not found.</div>;
  }

  return (
    <div id="all-decks">
      <h1>All Decks</h1>
      <Outlet />

      {decksArray.map((deck) => (
        <div className="card-container" key={deck.value.id}>
          {deck.value.name}
          <div className="button-container">
            <Link
              className="button"
              to={`/decks/${deck.value.id}/edit`}
              reloadDocument
            >
              Edit
            </Link>
            <fetcher.Form
              method="post"
              action={`/decks/${deck.value.id}/delete`}
              onSubmit={(event) => {
                const response = confirm(
                  "Please confirm you want to delete this deck."
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
