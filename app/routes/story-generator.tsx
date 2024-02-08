import { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { Outlet, useLoaderData } from "@remix-run/react";
import React from "react";
import { main, openai } from "../../openai-story-generator.mjs";
import {
  decks,
  userDeckSubscriptions,
  deckCards,
  userCards,
} from "../../db/schema";
import { eq } from "drizzle-orm";
import { drizzle } from "../utils/db.server";
import { json } from "@remix-run/node";

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const userSubscribedDeckCards = await drizzle
      .select()
      .from(decks)
      .innerJoin(
        userDeckSubscriptions,
        eq(decks.id, userDeckSubscriptions.deckID)
      )
      .innerJoin(deckCards, eq(decks.id, deckCards.deckID))
      .leftJoin(userCards, eq(deckCards.cardID, userCards.id));

    return json(userSubscribedDeckCards);
  } catch (error) {
    console.error("Loader error:", error);
    throw new Response("Error loading deck", { status: 500 });
  }
}

export const action = async ({ params }: ActionFunctionArgs) => {};

export default function StoryGenerator() {
  const userSubscribedDeckCards = useLoaderData<typeof loader>();
  console.log(userSubscribedDeckCards);

  return (
    <>
      <h1>Storytime</h1>
      <Outlet />
      <div className="card-container"></div>
    </>
  );
}
