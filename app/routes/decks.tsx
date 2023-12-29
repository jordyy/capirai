import {
  LoaderFunctionArgs,
  ActionFunctionArgs,
  json,
  redirect,
} from "@remix-run/node";
import { useLoaderData, useActionData, Outlet, Form } from "@remix-run/react";
import { decks } from "../../db/schema";
import { db } from "../../db/index";
import { z } from "zod";
import React from "react";
import { eq, and } from "drizzle-orm";
import { drizzle } from "../utils/db.server";
import { Link } from "@remix-run/react";
import { useFetcher } from "@remix-run/react";
import { userDeckSubscriptions } from "../../db/schema";

export async function loader({ request }: LoaderFunctionArgs) {
  const allDecks = await drizzle.select().from(decks);
  return json(allDecks);
}

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const deckId = z.coerce.number().parse(params.deckId);
  const userId = z.coerce.number().parse(formData.get("userId"));
  const isSubscribeAction = formData.has("subscribe");

  try {
    if (isSubscribeAction) {
      const subscribe = formData.get("subscribe") === "true";

      const existingSubscription = await db
        .select()
        .from(userDeckSubscriptions)
        .where(
          and(
            eq(userDeckSubscriptions.deckID, deckId),
            eq(userDeckSubscriptions.userID, userId)
          )
        );
      if (existingSubscription) {
        await db
          .update(userDeckSubscriptions)
          .set({ subscribed: true })
          .where(eq(userDeckSubscriptions.deckID, deckId))
          .returning();
      } else {
        await db
          .insert(userDeckSubscriptions)
          .values({ userID: userId, deckID: deckId, subscribed: true });
      }
      return redirect(`/decks`);
    } else if (!isSubscribeAction) {
      await db.delete(decks).where(eq(decks.id, deckId));
      return redirect(`/decks`);
    }
  } catch (error) {
    console.log({ deck_delete_error: params.error });
  }
};

export default function Decks() {
  const decks = useLoaderData<typeof loader>();
  const subscribe = useActionData<typeof loader>();
  const fetcher = useFetcher();

  return (
    <div id="all-decks">
      <h1>All Decks</h1>
      <Outlet />

      {decks.map((deck) => (
        <div className="card-container" key={deck.id}>
          {deck.name}
          <div className="button-container">
            <Link
              className="button"
              to={`/decks/${deck.id}/edit`}
              reloadDocument
            >
              Edit
            </Link>
            <fetcher.Form
              method="post"
              action={`/decks/${deck.id}/delete`}
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
            <fetcher.Form method="POST" action={`/decks/${deck.id}`}>
              <button
                aria-label="Toggle Subscription"
                name="subscribe"
                value={userDeckSubscriptions.subscribed ? "false" : "true"}
              >
                {userDeckSubscriptions.subscribed ? "Unsubscribe" : "Subscribe"}
              </button>
            </fetcher.Form>
          </div>
        </div>
      ))}
    </div>
  );
}
