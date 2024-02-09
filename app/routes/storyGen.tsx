import { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { Outlet, useLoaderData, Form } from "@remix-run/react";
import React from "react";
import {
  decks,
  userDeckSubscriptions,
  deckCards,
  cards,
} from "../../db/schema";
import { eq } from "drizzle-orm";
import { drizzle } from "../utils/db.server";
import { json } from "@remix-run/node";

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const userSubscribedDeckCards = await drizzle
      .select({
        cardContent: cards.front,
        deckID: decks.id,
        deckName: decks.name,
      })
      .from(cards)
      .innerJoin(deckCards, eq(cards.id, deckCards.cardID))
      .innerJoin(decks, eq(deckCards.deckID, decks.id))
      .innerJoin(
        userDeckSubscriptions,
        eq(decks.id, userDeckSubscriptions.deckID)
      );

    return json({
      userSubscribedDeckCards,
    } as const);
  } catch (error) {
    console.error("Loader error:", error);
    throw new Response("Error loading deck", { status: 500 });
  }
}

export default function StoryGenerator() {
  // const userSubscribedDeckCards = useLoaderData<typeof loader>();

  return (
    <>
      <h1>Storytime</h1>
      <Outlet />
      <Form method="post" className="create-form" action={"/storyGen/story"}>
        <label htmlFor="storyLength">Story Length</label>
        <select name="storyLength">
          <option value="">Story Length</option>
          <option value="short">Short Read</option>
          <option value="medium">Medium Read</option>
          <option value="long">Long Read</option>
        </select>

        <label htmlFor="genre">Genre</label>
        <select name="genre">
          <option value="">Genre</option>
          <option value="mystery">Mystery</option>
          <option value="historical fiction">Historical Fiction</option>
          <option value="romance">Romance</option>
          <option value="humor">Humore</option>
          <option value="true crime">True Crime</option>
          <option value="adventure">Adventure</option>
          <option value="fantasy">Fantasy</option>
          <option value="folklore">Folklore</option>
          <option value="fable">Fable</option>
          <option value="fairy tale">Fairy Tale</option>
          <option value="drama">Drama</option>
          <option value="western">Western</option>
          <option value="dystopian fiction">Dystopian Fiction</option>
          <option value="legend">Legend</option>
          <option value="realistic fiction">Realistic Fition</option>
          <option value="tall tale">Tall Tale</option>
          <option value="biographical about an Italian cultural figure">
            Biographical
          </option>
          <option value="coming-of-age">Coming-of-age</option>
          <option value="science fiction">Science Fiction</option>
        </select>

        <label htmlFor="cefrLevel">Level</label>
        <select name="cefrLevel">
          <option value="">CEFR Level</option>
          <option value="A1">A1</option>
          <option value="A2">A2</option>
          <option value="B1">B1</option>
          <option value="B2">B2</option>
          <option value="C1">C1</option>
          <option value="C2">C2</option>
        </select>

        <button type="submit">Generate Story</button>
      </Form>
    </>
  );
}
