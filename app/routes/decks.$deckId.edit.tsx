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
import { decks } from "../../db/schema";
import { z } from "zod";
import { db } from "../../db/index";

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const deck = await db
    .select()
    .from(decks)
    .where(eq(decks.id, Number(params.deckId)));

  if (!deck || deck.length === 0) {
    throw new Response("Not Found", { status: 404 });
  }

  const name = deck[0]?.name;
  return json({ deck, name });
};

const deckSchema = z.object({
  name: z.string(),
});

export const action = async ({ params, request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const name = formData.get("name");

  const parsedInput = deckSchema.safeParse({
    name: name,
  });

  if (!parsedInput.success) {
    return json({ error: parsedInput.error }, { status: 400 });
  }

  try {
    await db
      .update(decks)
      .set({
        name: parsedInput.data.name,
      })
      .where(eq(decks.id, Number(params.deckId)));
    return redirect(`/decks/${params.deckId}`);
  } catch (error) {
    console.log({ deck_edit_error: error });
    return json({ status: "error" });
  }
};
