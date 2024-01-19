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
import { db } from "../../db/index";
import { deckCards, decks, cards, userCards } from "../../db/schema";
import { z } from "zod";
import { getAuthCookie, requireAuthCookie } from "../auth";

export async function loader({ params }: LoaderFunctionArgs) {
  const parsedDeckCardId = z.coerce.number().parse(params.deckCardId);

  try {
    const singleDeckCard = await drizzle
      .select()
      .from(deckCards)
      .innerJoin(decks, eq(deckCards.deckID, decks.id))
      .innerJoin(cards, eq(deckCards.cardID, cards.id))
      .leftJoin(userCards, eq(userCards.cardID, deckCards.cardID))
      .where(eq(deckCards.id, parsedDeckCardId))
      .orderBy(deckCards.cardID);

    const understandingEnumValues = await db.execute(
      sql.raw(`
        SELECT enumlabel
        FROM pg_enum
        WHERE enumtypid = (
          SELECT oid
          FROM pg_type
          WHERE typname = 'understanding'
        )
      `)
    );
    const understandingValues = understandingEnumValues.rows.map(
      (row: any) => row.enumlabel
    );

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
  const deckIdString = z.coerce.number().parse(formData.get("deckId"));

  const currentCard = await drizzle
    .select({ cardID: deckCards.cardID, deckCardId: deckCards.id })
    .from(deckCards)
    .innerJoin(decks, eq(deckCards.deckID, decks.id))
    .innerJoin(cards, eq(deckCards.cardID, cards.id))
    .where(eq(deckCards.id, parsedDeckCardId))
    .orderBy(deckCards.cardID);

  if (!deckIdString || isNaN(Number(deckIdString))) {
    return json({ status: "error", error: "Invalid deckId" });
  }

  const deckId = Number(deckIdString);

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
      await db
        .insert(userCards)
        .values({ userID: userId, cardID: nextCardId })
        .onConflictDoNothing();
    }
  }
};

export default function SingleDeckCard() {
  const fetcher = useFetcher();
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
    <div id="deck">
      <h1 className="single-card-container">Single Card View</h1>
      {singleDeckCard.map((card) => {
        return (
          <div key={card.cards.id} onClick={handleCardFlip}>
            <div className="card-box">
              <div className="single-card">
                <h2 className="single-card-text">
                  {isViewingBack ? card.cards.back : card.cards.front}
                </h2>
                <h2>{card.cards.CEFR_level}</h2>
                <h2>{card.cards.frequency}</h2>
              </div>

              <ul className="understanding-container">
                {isViewingBack &&
                  understandingValues.map((value) => (
                    <li key={value}>
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
                              ? "current-understanding-button"
                              : "understanding-buttons"
                          }
                          type="submit"
                        >
                          {value}
                        </button>
                      </Form>
                    </li>
                  ))}
              </ul>
            </div>
          </div>
        );
      })}
    </div>
  );
}
