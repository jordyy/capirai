import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import {
  Form,
  useLoaderData,
  useNavigate,
  useNavigation,
} from "@remix-run/react";
import React from "react";
import { eq } from "drizzle-orm";
import { deckCards, cards, decks } from "../../db/schema";
import { z } from "zod";
import { drizzle } from "../utils/db.server";

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const deckCardContents = await drizzle
    .select()
    .from(deckCards)
    .innerJoin(cards, eq(deckCards.cardID, cards.id))
    .where(eq(deckCards.deckID, Number(params.deckId)));

  const deck = await drizzle
    .select()
    .from(decks)
    .where(eq(decks.id, Number(params.deckId)));

  if (!deckCardContents || deckCardContents.length === 0) {
    return json({ deckCardContens: [], deck });
  }

  const firstCard = deckCardContents[0];

  return json({ deckCardContents, firstCard, deck });
};

const deckCardSchema = z.object({
  front: z.string(),
  back: z.string(),
});

export const action = async ({ params, request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const front = formData.get("front");
  const back = formData.get("back");
  const cardId = z.coerce.number().parse(formData.get("cardId"));

  const parsedInput = deckCardSchema.safeParse({
    front: front,
    back: back,
  });

  if (!parsedInput.success) {
    return json({ error: parsedInput.error }, { status: 400 });
  }

  // compare the ID from the cards table to the cardID from the deckCards table
  // the id in params is the deckCard.id, but what I NEED is the deckCard.cardID

  try {
    await drizzle
      .update(cards)
      .set({
        front: parsedInput.data?.front,
        back: parsedInput.data?.back,
      })
      .where(eq(cards.id, cardId));
    return json({ status: "success" });
  } catch (error) {
    console.log({ deck_edit_error: error });
    return json({ status: "error" });
  }
};

export default function EditDeckCards({}) {
  const { deckCardContents, firstCard, deck } = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const navigate = useNavigate();
  const isSaving = navigation.formAction === `/cards/${deckCards.cardID}/edit`;

  console.log({ deckCardContents, deck });

  return (
    <Form method="post" action={`cards/${deckCards.cardID}/edit`}>
      <input type="hidden" name="cardId" value={`${deckCards.cardID}`} />
      <div className="edit-deckCard">Front</div>
      <input
        defaultValue={`${firstCard.front}`}
        aria-label="front of card"
        name="front"
        type="text"
        placeholder="Front of Card"
      />
      <div className="edit-deckCard">Back</div>
      <input
        defaultValue={`${deckCardContents.back}`}
        aria-label="back of card"
        name="back"
        type="text"
        placeholder="Back of Card"
      />

      <button type="submit">
        {isSaving ? "Saving changes..." : "Save changes"}
      </button>
      <button onClick={() => navigate(-1)} type="button">
        Cancel
      </button>
    </Form>
  );
}
