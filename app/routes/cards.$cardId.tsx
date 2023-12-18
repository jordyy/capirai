import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { eq } from "drizzle-orm";
import { Form, useLoaderData } from "@remix-run/react";
import { Link } from "@remix-run/react";

import { db } from "db/index";
import { cards } from "db/schema";
import { z } from "zod";

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const card = await db
    .select()
    .from(cards)
    .where(eq(cards.id, Number(params.cardId)));

  const front = card[0]?.front;
  const back = card[0]?.back;

  if (!card) {
    throw new Response("Not Found", { status: 404 });
  }
  return json({ card, front, back });
};

const cardIdSchema = z.string();

export const action = async ({ params }: ActionFunctionArgs) => {
  const parsedParams = cardIdSchema.safeParse(params.cardId);

  if (!parsedParams.success) {
    return json({ error: parsedParams.error }, { status: 400 });
  }
  try {
    await db.delete(cards).where(eq(cards.id, Number(parsedParams.data)));
    return redirect(`/cards`);
  } catch (error) {
    console.log({ card_delete_error: error });
    return json({ status: "error" });
  }
};

export default function Cards({}) {
  const { card } = useLoaderData<typeof loader>();
  const cardData = card[0];

  return (
    <div id="Contact">
      <h1>front: {cardData.front}</h1>
      <h1>back: {cardData.back}</h1>
      <Link to={`/cards/${cardData.id}/edit`}>Edit</Link>
      <Form
        method="post"
        onSubmit={(event) => {
          const response = confirm(
            "Please confirm you want to delete this record."
          );
          if (!response) {
            event.preventDefault();
          }
        }}
      >
        <button type="submit">Delete</button>
      </Form>
    </div>
  );
}
