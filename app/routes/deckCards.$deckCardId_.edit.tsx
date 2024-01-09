import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import {
  Form,
  Link,
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
    return json({ deckCardContents: [], deck });
  }

  return json({ deckCardContents, deck });
};

const deckCardSchema = z.object({
  cardId: z.string(),
  front: z.string(),
  back: z.string(),
});

export const action = async ({ params, request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const cardId = formData.get("cardId");
  const front = formData.get("front");
  const back = formData.get("back");

  const parsedInput = deckCardSchema.safeParse({
    cardId: cardId,
    front: front,
    back: back,
  });

  if (!parsedInput.success) {
    return json({ error: parsedInput.error }, { status: 400 });
  }

  try {
    await drizzle
      .update(cards)
      .set({
        front: parsedInput.data?.front,
        back: parsedInput.data?.back,
      })
      .where(eq(cards.id, Number(cardId)));
    return json({ status: "success" });
  } catch (error) {
    console.log({ deck_edit_error: error });
    return json({ status: "error" });
  }
};

export default function EditDeckCard({}) {
  const { deckCardContents, deck } = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const navigate = useNavigate();
  const isSaving = navigation.state === "submitting";

  if (!deckCardContents || deckCardContents.length === 0) {
    return <div>Deck not found.</div>;
  }

  const firstCard = deckCardContents[0];

  return (
    <Form method="post">
      <Link to={`/cards/${deckCardContents[0].cards.id}/edit`}>Edit</Link>
      <button type="submit">
        {isSaving ? "Saving changes..." : "Save changes"}
      </button>
      <button onClick={() => navigate(-1)} type="button">
        Cancel
      </button>
    </Form>
  );
}
