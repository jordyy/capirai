import {
  LoaderFunctionArgs,
  ActionFunctionArgs,
  redirect,
  json,
} from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { decks } from "../../../db/schema";
import { db } from "../../../db/index";
import React from "react";
import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { drizzle } from "../../utils/db.server";
import { userDeckSubscriptions } from "../../../db/schema";
import { getAuthCookie, requireAuthCookie } from "../../auth";

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await getAuthCookie(request);
  const myDecks = await drizzle
    .select()
    .from(decks)
    .innerJoin(
      userDeckSubscriptions,
      eq(decks.id, userDeckSubscriptions.deckID)
    );

  if (!userId) {
    return json({ myDecks, userSubscriptions: null, isAuth: false } as const);
  }

  const userSubscriptions = await drizzle
    .select()
    .from(userDeckSubscriptions)
    .where(eq(userDeckSubscriptions.userID, userId));
  return json({ myDecks, isAuth: true, userSubscriptions } as const);
}

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const userId = await requireAuthCookie(request);
  const formData = await request.formData();
  const deckId = z.coerce.number().parse(formData.get("deckId"));
  const isSubscribeAction = formData.has("subscribe");

  try {
    if (isSubscribeAction) {
      const subscribe = Boolean(
        z.coerce.number().parse(formData.get("subscribe"))
      );
      console.log({ subscribe });
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
    return null;
  }
};

export default function Home() {
  const data = useLoaderData<typeof loader>();

  const dataArray = data.myDecks;
  console.log({
    dataArray: dataArray.map((deck) => deck.userDeckSubcriptions.subscribed),
  });

  return (
    <>
      <h1>Your Decks</h1>
      <div className="deck-container">
        {dataArray.map((deck) => (
          <div className="deck-box">
            <h2>{deck.decks.name}</h2> <br />
            completion - {deck.userDeckSubcriptions.completion} <br />
            <p className="subscribed">
              {deck.userDeckSubcriptions.subscribed ? "SUBSCRIBED" : null}
            </p>
          </div>
        ))}
      </div>
    </>
  );
}
