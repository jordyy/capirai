import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { eq } from "drizzle-orm";
import { cards } from "../../db/schema";
import { z } from "zod";
import { drizzle } from "../utils/db.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const allCards = await drizzle.select().from(cards);
  return json([allCards]);
}

export const action = async ({ params }: ActionFunctionArgs) => {
  const cardId = z.coerce.number().parse(params.cardId);
  console.log({ card_delete_error: params.error });

  try {
    await drizzle.delete(cards).where(eq(cards.id, cardId));
    return redirect(`/cards`);
  } catch (error) {
    return json({ status: "error" });
  }
};
