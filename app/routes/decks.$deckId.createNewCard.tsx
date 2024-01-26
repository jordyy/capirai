import { json, redirect } from "@remix-run/node";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import React from "react";
import {
  Form,
  useActionData,
  useNavigation,
  useLoaderData,
} from "@remix-run/react";
import { eq } from "drizzle-orm";
import { db } from "../../db/index";
import { drizzle } from "../utils/db.server";
import { z } from "zod";
import { deckCards, decks } from "../../db/schema";
import { cards, userCards } from "../../db/schema";
import { authCookie } from "../auth";

export async function loader({ request }: LoaderFunctionArgs) {
  const allDecks = await drizzle.select().from(decks);
  return json(allDecks);
}

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const cardDeck = formData.get("deck");
  const cardFront = formData.get("front");
  const cardBack = formData.get("back");
  const cookieString = request.headers.get("Cookie");
  const userID = await authCookie.parse(cookieString);
  const deckId = z.coerce.number().parse(params.deckId);

  if (!deckId) {
    throw new Response("Not Found", { status: 404 });
  }

  const parsedInput = cardSchema.safeParse({
    deckId: Number(cardDeck),
    front: cardFront,
    back: cardBack,
  });

  if (parsedInput.success) {
    const [card] = await db
      .insert(cards)
      .values({
        front: parsedInput.data.front,
        back: parsedInput.data.back,
      })
      .returning();

    await db.insert(deckCards).values({ deckID: deckId, cardID: card.id });

    await db.insert(userCards).values({ userID: userID, cardID: card.id });

    return null;
  } else {
    console.log({ parsedInputerror: parsedInput.error });
    return json({
      status: "error",
      message: parsedInput.error.message,
    } as const);
  }
};

export default function CreateNewCard() {
  const data = useActionData<typeof action>();
  const decks = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const isSubmitting = navigation.formData?.get("intent") === "createCard";
  const errorMessage = data?.status === "error" ? data.message : null;

  return (
    <Form method="post" className="create-form">
      {errorMessage ? errorMessage : null}
      <label>
        front: <input name="front" />
      </label>
      <label>
        back: <input name="back" />
      </label>
      <button type="submit">
        <input type="hidden" name="intent" value="createCard" />
        {isSubmitting ? "Saving new card..." : "Add card"}
      </button>
    </Form>
  );
}

const cardSchema = z.object({
  deckId: z.number(),
  front: z.string(),
  back: z.string(),
});
