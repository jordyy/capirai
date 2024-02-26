import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { eq, is, sql, and, asc } from "drizzle-orm";
import {
  Form,
  useLoaderData,
  useActionData,
  Link,
  useFetcher,
} from "@remix-run/react";
import React, { useState } from "react";

import { drizzle } from "../utils/db.server";
import { deckCards, decks, cards, userCards } from "../../db/schema";
import { z } from "zod";
import { getAuthCookie, requireAuthCookie } from "../auth";

export async function loader({ params, request }: LoaderFunctionArgs) {
  const parsedDeckCardId = z.coerce.number().parse(params.deckCardId);
  const userId = await requireAuthCookie(request);

  try {
    const singleDeckCard = await drizzle
      .select()
      .from(deckCards)
      .innerJoin(decks, eq(deckCards.deckID, decks.id))
      .innerJoin(cards, eq(deckCards.cardID, cards.id))
      .leftJoin(userCards, eq(userCards.cardID, deckCards.cardID))
      .where(
        and(eq(userCards.userID, userId), eq(deckCards.id, parsedDeckCardId))
      )
      .orderBy(deckCards.cardID);

    const understandingValues = userCards.understanding.enumValues;

    return json({ singleDeckCard, understandingValues });
  } catch (error) {
    console.error("Loader error:", error);
    throw new Response("Error loading deck cards", { status: 500 });
  }
}

export const action = async ({ params, request }: ActionFunctionArgs) => {
  const userId = await requireAuthCookie(request);
  const formData = await request.formData();
  const currentDeckCardId = Number(formData.get("deckCardId"));
  const parsedDeckCardId = z.coerce.number().parse(params.deckCardId);
  const deckId = z.coerce.number().parse(params.deckId);

  const currentCard = await drizzle
    .select({ cardID: deckCards.cardID, deckCardId: deckCards.id })
    .from(deckCards)
    .innerJoin(decks, eq(deckCards.deckID, decks.id))
    .innerJoin(cards, eq(deckCards.cardID, cards.id))
    .where(eq(deckCards.id, parsedDeckCardId))
    .orderBy(deckCards.cardID);

  if (!deckId || isNaN(Number(deckId))) {
    return json({ status: "error", error: "Invalid deckId" });
  }

  const currentCardIndex = currentCard.findIndex(
    (card) => card.deckCardId === currentDeckCardId
  );

  const nextCardId = currentCard[currentCardIndex + 1]?.cardID;

  if (nextCardId) {
    const nextUserCardExists = await drizzle
      .select()
      .from(userCards)
      .where(
        and(eq(userCards.userID, userId), eq(userCards.cardID, nextCardId))
      );

    if (nextUserCardExists.length === 0) {
      await drizzle
        .insert(userCards)
        .values({ userID: userId, cardID: nextCardId })
        .onConflictDoNothing();
    }
  }
};

export default function SingleDeckCard() {
  const [isViewingBack, setIsViewingBack] = useState(false);
  const { singleDeckCard, understandingValues } =
    useLoaderData<typeof loader>();

  if (!singleDeckCard || singleDeckCard.length === 0) {
    return <div>Card does not exist.</div>;
  }

  interface CardType {
    cards: {
      CEFR_level: string;
      back: string;
      frequency: number;
      front: string;
      id: number;
      language: string;
      type: string;
    };
    deckCards: {
      cardID: number;
      deckID: number;
      id: number;
    };
    decks: {
      id: number;
      isPrivate: boolean;
      name: string;
    };
    userCards?: {
      id: number;
      understanding?: string;
    };
  }

  const handleCardFlip = (event: React.MouseEvent<HTMLDivElement>) => {
    const target = event.target as HTMLInputElement;
    if (target.form) {
      return;
    }
    setIsViewingBack((prevState) => !prevState);
  };

  return (
    <>
      <div className="story-page-top">
        <h1 className="page-heading">{singleDeckCard[0].decks.name}</h1>
      </div>
      <div id="deck">
        {singleDeckCard.map((card) => {
          return (
            <div key={card.cards.id} onClick={handleCardFlip}>
              <div className="review-body">
                <div className="card-review-container">
                  {isViewingBack ? (
                    <h2 className="card-review-text card-back">
                      {card.cards.front}
                    </h2>
                  ) : (
                    <h2 className="card-review-text card-front">
                      {card.cards.back}
                    </h2>
                  )}

                  <div className="understanding-container">
                    {isViewingBack &&
                      understandingValues.map((value) => (
                        <div key={value}>
                          <Form
                            method="post"
                            action={`/userCards/${card?.userCards?.id}/update`}
                          >
                            <input
                              type="hidden"
                              name="deckCardId"
                              value={card.deckCards.id}
                            />
                            <input
                              type="hidden"
                              name="deckId"
                              value={card.deckCards.deckID}
                            />
                            <input
                              type="hidden"
                              name="understanding"
                              value={value}
                            />
                            <button
                              name="understanding"
                              className={
                                value === card?.userCards?.understanding
                                  ? "understanding-buttons current-understanding-button"
                                  : "understanding-buttons"
                              }
                              type="submit"
                            >
                              {value}
                            </button>
                          </Form>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
