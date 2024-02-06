import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { eq, and } from "drizzle-orm";
import { deckCards } from "../../db/schema";
import { z } from "zod";
import { drizzle } from "../utils/db.server";

export async function loader() {
  const allDeckCards = await drizzle.select().from(deckCards);
  return json([allDeckCards]);
}

export const action = async ({ params, request }: ActionFunctionArgs) => {
  const deckId = z.coerce.number().parse(params.deckId);

  if (!deckId) {
    throw new Error("Invalid deck ID");
  }

  const formData = await request.formData();
  const rawDeckCardId = formData.get("deckCardId");

  if (!rawDeckCardId || isNaN(Number(rawDeckCardId))) {
    return json({ error: "Invalid deck card id" }, { status: 400 });
  }

  const deckCardId = parseInt(rawDeckCardId as string, 10);
  if (isNaN(deckCardId))
    return json({ error: "Invalid deck card id" }, { status: 400 });
  console.log({ deck_card_delete_error: Error });

  try {
    await drizzle
      .delete(deckCards)
      .where(and(eq(deckCards.deckID, deckId), eq(deckCards.id, deckCardId)));
    return redirect(`/decks/${deckId}`);
  } catch (error) {
    return json({ status: "error" });
  }
};
