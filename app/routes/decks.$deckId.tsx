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
import { useFetcher, Outlet } from "@remix-run/react";

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

  console.log({ deck, deckData, thisDeckCard });

  const userCardData = thisDeckCard.map((data) => data.userCards);

  const userReviewed = userCardData.map((data) => Boolean(data?.timesReviewed));

  let numReviewed = 0;
  for (let i = 0; i < userReviewed.length; i++) {
    if (userReviewed[i] === true) {
      numReviewed++;
    }
  }

  if (!deckData) {
    return <div>Deck not found.</div>;
  }
  if (!thisDeckCard) {
    return <div>No cards in this deck.</div>;
  }

  return (
    <div id="deck">
      <Outlet />
      <h1 className="deck-name-edit">
        {deckData.name}{" "}
        <Link to={`/decks/${deckData.id}/edit`} reloadDocument>
          <BorderColorRoundedIcon />
        </Link>
      </h1>
      <p>
        {`This deck has ${thisDeckCard.length} cards. You have reviewed ${numReviewed}/${thisDeckCard.length} cards.`}
      </p>
      <div className="deck-setting-section">
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
          <button type="submit" className="delete-button">
            Delete Deck
          </button>
        </fetcher.Form>
        <Link
          to={`/decks/${deckData.id}/createNewCard`}
          className="button add-button"
        >
          Add Card to Deck
        </Link>

        {thisDeckCard.length > 0 && (
          <Link
            to={`/deckcards/${deckData.id}/${thisDeckCard[0].deckCards.id}`}
            className="button"
          >
            Study deck
          </Link>
        )}
      </div>
      <div>
        {thisDeckCard.length === 0 ? (
          <div>This deck has no cards.</div>
        ) : (
          thisDeckCard.map((card) => {
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
                    <BorderColorRoundedIcon />
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
                      <DeleteRoundedIcon />
                    </button>
                  </Form>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
