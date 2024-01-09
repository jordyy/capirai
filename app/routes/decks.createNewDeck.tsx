import { json, redirect } from "@remix-run/node";
import type { ActionFunctionArgs } from "@remix-run/node";
import { Form, useActionData, useNavigation } from "@remix-run/react";
import { db } from "../../db/index";
import React from "react";
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
      .returning();
    return redirect(`/decks/${deck[0].id}`);
  } catch (error) {
    console.error(error);
    return json({ status: "error", message: "Failed to create deck" });
  }
};

export default function CreateNewDeck() {
  const navigation = useNavigation();
  const isSubmitting = navigation.formAction === "/decks/createNewdeck";

  return (
    <Form method="post">
      <label>
        deckName: <input name="deckName" />
      </label>
      <button type="submit">
        {isSubmitting ? "Saving new deck..." : "Create new deck"}
      </button>
    </Form>
  );
}

const deckSchema = z.object({
  name: z.string(),
});
