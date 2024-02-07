import { json, redirect } from "@remix-run/node";
import type { ActionFunctionArgs } from "@remix-run/node";
import { Form, useNavigation } from "@remix-run/react";
import React from "react";
import { db } from "../../db/index";
import { z } from "zod";
import { decks } from "../../db/schema";

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const deckName = formData.get("deckName");

  if (typeof deckName !== "string" || !deckName) {
    return json({ status: "error", message: "Deck name is required" });
  }

  const parsedInput = deckSchema.safeParse({
    name: deckName,
  });

  if (!parsedInput.success) {
    return json({ error: parsedInput.error }, { status: 400 });
  }

  try {
    const deck = await db
      .insert(decks)
      .values({
        name: parsedInput.data.name,
      })
      .returning({ insertedDeckId: decks.id });
    const insertedDeckId = deck[0].insertedDeckId;
    return redirect(`/decks/${insertedDeckId}`);
  } catch (error) {
    console.error(error);
    return json({ status: "error", message: "Failed to create deck" });
  }
};

const deckSchema = z.object({
  name: z.string(),
});
