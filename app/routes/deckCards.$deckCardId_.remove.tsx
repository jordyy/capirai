import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { eq } from "drizzle-orm";
import { deckCards } from "../../db/schema";
import { z } from "zod";
import { drizzle } from "../utils/db.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const allDeckCards = await drizzle.select().from(deckCards);
  return json([allDeckCards]);
}

export const action = async ({ params }: ActionFunctionArgs) => {
  if (!params.deckCardId || isNaN(Number(params.deckCardId))) {
    return json({ error: "Invalid deck card id" }, { status: 400 });
  }
  const deckCardId = z.coerce.number().parse(params.deckCardId);
  console.log({ deck_card_delete_error: params.error });

  try {
    await drizzle.delete(deckCards).where(eq(deckCards.id, deckCardId));
    return redirect(`/deckCards`);
  } catch (error) {
    return json({ status: "error" });
  }
};
