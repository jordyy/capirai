import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { eq } from "drizzle-orm";
import { decks } from "../../db/schema";
import { z } from "zod";
import { db } from "../../db/index";
import { drizzle } from "../utils/db.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const allDecks = await drizzle.select().from(decks);
  return json([allDecks]);
}

export const action = async ({ params }: ActionFunctionArgs) => {
  const deckId = z.coerce.number().parse(params.deckId);
  console.log({ deck_delete_error: params.error });

  try {
    await db.delete(decks).where(eq(decks.id, deckId));
    return redirect(`/decks`);
  } catch (error) {
    return json({ status: "error" });
  }
};
