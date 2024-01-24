import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { eq } from "drizzle-orm";
import { Form, useLoaderData, Link } from "@remix-run/react";
import React from "react";

import { drizzle } from "../utils/db.server";
import { decks, deckCards, cards, userCards } from "../../db/schema";
import { z } from "zod";
import BorderColorRoundedIcon from "@mui/icons-material/BorderColorRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import { useFetcher } from "@remix-run/react";

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const deck = await drizzle
    .select()
    .from(decks)
    .where(eq(decks.id, Number(params.deckId)));

  const allDeckCards = await drizzle
    .select()
    .from(deckCards)
    .innerJoin(decks, eq(deckCards.deckID, decks.id));

  const thisDeckCard = await drizzle
    .select()
    .from(cards)
    .innerJoin(deckCards, eq(cards.id, deckCards.cardID))
    .leftJoin(userCards, eq(cards.id, userCards.cardID))
    .where(eq(deckCards.deckID, Number(params.deckId)));

  if (!deck || deck.length === 0) {
    throw new Response("Not Found", { status: 404 });
  }
  if (!allDeckCards || allDeckCards.length === 0) {
    throw new Response("No cards in this deck");
  }

  const name = deck[0]?.name;

  return json({ deck, allDeckCards, name, thisDeckCard });
};

export const action = async ({ params }: ActionFunctionArgs) => {
  const deckId = z.coerce.number().parse(params.deckId);

  try {
    await drizzle.delete(decks).where(eq(decks.id, deckId));
    return redirect(`/decks`);
  } catch (error) {
    console.log({ deck_delete_error: error });
    return json({ status: "error" });
  }
};

export default function Deck({}) {
  const { deck, thisDeckCard } = useLoaderData<typeof loader>();
  const deckData = deck[0];
  const fetcher = useFetcher();

  if (!deckData) {
    return <div>Deck not found.</div>;
  }
  if (!thisDeckCard) {
    return <div>No cards in this deck.</div>;
  }

  return (
    <div id="deck">
      <h1>
        {deckData.name}{" "}
        <Link
          className="button"
          to={`/decks/${deckData.id}/edit`}
          reloadDocument
        >
          <BorderColorRoundedIcon sx={{ fontSize: 15 }} />
        </Link>
      </h1>
      <div className="button-container">
        <fetcher.Form
          method="post"
          action={`/decks/${deckData.id}/delete`}
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
      <Link
        to={`/deckcards/${thisDeckCard[0].deckCards.id}`}
        className="button"
      >
        Study deck
      </Link>
      <div>
        {thisDeckCard.map((card) => {
          return (
            <div key={card.cards.id} className="card-box">
              <div className="single-card-contents">
                <h4>{card.cards.front}</h4>
                <p className="card-back-text">{card.cards.back}</p>
              </div>
              <div className="deck-button-container">
                <Link
                  className="deck-button"
                  to={`/cards/${card?.cards.id}/edit`}
                >
                  <BorderColorRoundedIcon sx={{ fontSize: 20 }} />
                </Link>
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
                  <button className="deck-button" type="submit">
                    <DeleteRoundedIcon sx={{ fontSize: 20 }} />
                  </button>
                </Form>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
