import {
  LoaderFunctionArgs,
  ActionFunctionArgs,
  json,
  redirect,
} from "@remix-run/node";
import { useLoaderData, Outlet, useActionData } from "@remix-run/react";
import { decks, userDeckSubscriptions } from "../../db/schema";
import { db } from "../../db/index";
import React from "react";
import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { drizzle } from "../utils/db.server";
import { Link, Form } from "@remix-run/react";
import { useFetcher } from "@remix-run/react";
import { getAuthCookie, requireAuthCookie } from "../auth";

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await getAuthCookie(request);

  const allDecks = await drizzle
    .select()
    .from(decks)
    .leftJoin(
      userDeckSubscriptions,
      eq(decks.id, userDeckSubscriptions.deckID)
    );

  if (!userId) {
    return json({ allDecks, userSubscriptions: null, isAuth: false } as const);
  }

  const userSubscriptions = await drizzle
    .select()
    .from(userDeckSubscriptions)
    .where(eq(userDeckSubscriptions.userID, userId));
  return json({ allDecks, isAuth: true, userSubscriptions } as const);
}

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const userId = await requireAuthCookie(request);
  const formData = await request.formData();
  const deckIdString = params.deckId;
  const subscribeString = formData.get("subscribe");

  if (!deckIdString || isNaN(Number(deckIdString))) {
    return json({ status: "error", error: "Invalid deckId" });
  }

  const deckId = Number(deckIdString);
  const isSubscribeAction = formData.has("subscribe");

  try {
    if (isSubscribeAction) {
      const subscribe = subscribeString === "1";
      const [existingSubscription] = await db
        .select()
        .from(userDeckSubscriptions)
        .where(
          and(
            eq(userDeckSubscriptions.deckID, deckId),
            eq(userDeckSubscriptions.userID, userId)
          )
        )
        .limit(1);

      if (existingSubscription) {
        await db
          .update(userDeckSubscriptions)
          .set({ subscribed: subscribe })
          .where(eq(userDeckSubscriptions.id, existingSubscription.id));
      } else {
        await db
          .insert(userDeckSubscriptions)
          .values({ userID: userId, deckID: deckId, subscribed: subscribe });
      }
      return null;
    } else if (!isSubscribeAction) {
      await db.delete(decks).where(eq(decks.id, deckId));
      return redirect(`/decks`);
    }
  } catch (error) {
    console.log({ deck_delete_error: params.error });
    return json({ status: "error" });
  }
};

export default function Decks() {
  const { allDecks, userSubscriptions, isAuth } =
    useLoaderData<typeof loader>();
  const subscribe = useActionData<typeof loader>();
  const fetcher = useFetcher();

  if (!allDecks) {
    return <div>Decks not found.</div>;
  }

  return (
    <div id="all-decks">
      {!isAuth ? (
        <Form method="post" action="/login">
          <button>Login</button>
        </Form>
      ) : null}

      <h1>All Decks</h1>
      <Outlet />
      {allDecks.map((deck) => {
        const isSubscribed =
          Number(fetcher.formData?.get("deckId")) === deck.decks.id
            ? Boolean(fetcher.formData?.get("subscribe"))
            : userSubscriptions?.find(
                (subscription) => subscription.deckID === deck.decks.id
              )?.subscribed;
        return (
          <div className="card-container" key={deck.decks.id}>
            {deck.decks.name}
            <div className="button-container">
              <Link
                className="button"
                to={`/decks/${deck.decks.id}/edit`}
                reloadDocument
              >
                Edit
              </Link>
              <fetcher.Form
                method="post"
                action={`/decks/${deck.decks.id}/delete`}
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

              {isAuth ? (
                <fetcher.Form method="POST">
                  <input type="hidden" name="deckId" value={deck.decks.id} />
                  <button
                    aria-label="Toggle Subscription"
                    name="subscribe"
                    value={isSubscribed ? 0 : 1}
                  >
                    {isSubscribed ? "Unsubscribe" : "Subscribe"}
                  </button>
                </fetcher.Form>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
