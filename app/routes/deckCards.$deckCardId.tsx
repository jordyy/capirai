import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { eq, is, sql } from "drizzle-orm";
import { Form, useLoaderData, Link, useFetcher } from "@remix-run/react";
import React, { useState } from "react";

import { drizzle } from "../utils/db.server";
import { db } from "../../db/index";
import { deckCards, decks, cards, userCards } from "../../db/schema";
import { z } from "zod";

export async function loader({ params }: LoaderFunctionArgs) {
  const parsedDeckCardId = z.coerce.number().parse(params.deckCardId);

  try {
    const singleDeckCard = await drizzle
      .select()
      .from(deckCards)
      .innerJoin(decks, eq(deckCards.deckID, decks.id))
      .innerJoin(cards, eq(deckCards.cardID, cards.id))
      .leftJoin(userCards, eq(userCards.cardID, deckCards.cardID))
      .where(eq(deckCards.id, parsedDeckCardId));

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

const deckCardIdSchema = z.object({
  deckCardId: z.string(),
});

export const action = async ({ params }: ActionFunctionArgs) => {
  const parsedDeckCardId = deckCardIdSchema.safeParse(params.deckCardId);

  if (!parsedDeckCardId.success) {
    return json({ error: "No deck card id provided" }, { status: 400 });
  }
};

export default function SingleDeckCard(params) {
  const fetcher = useFetcher();
  const [isViewingBack, setIsViewingBack] = useState(false);
  const { singleDeckCard, understandingValues } =
    useLoaderData<typeof loader>();

  if (!singleDeckCard || singleDeckCard.length === 0) {
    return <div>Card does not exist.</div>;
  }

  const handleCardFlip = (event) => {
    if (event.target.form) {
      return;
    }
    setIsViewingBack((prevState) => !prevState);
  };

  const handleUnderstandingUpdate = (value, card) => {
    const formData = new FormData();
    formData.append("understanding", value);
    formData.append("deckCardId", card.deckCards.id);

    fetcher.submit(formData, {
      method: "post",
      action: `/userCards/${card?.userCards?.id}/update`,
    });
  };

  return (
    <div id="deck">
      <h1 className="single-card-container">Single Card View</h1>
      {singleDeckCard.map((card) => {
        return (
          <div onClick={handleCardFlip}>
            <div key={card.cards.id} className="card-box">
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
                        <button
                          onClick={() => handleUnderstandingUpdate(value, card)}
                          name="understanding"
                          className={
                            value === card?.userCards?.understanding
                              ? "current-understanding-button"
                              : "understanding-buttons"
                          }
                          value={value}
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
