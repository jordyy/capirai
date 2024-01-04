import {
  LoaderFunctionArgs,
  ActionFunctionArgs,
  redirect,
  json,
} from "@remix-run/node";
import { useLoaderData, Outlet, Form } from "@remix-run/react";
import { cards } from "../../db/schema";
import { drizzle } from "../utils/db.server";
import { Link } from "@remix-run/react";
import { z } from "zod";
import React from "react";
import { eq } from "drizzle-orm";
import { db } from "../../db/index";
import { useFetcher } from "@remix-run/react";

// if a card has a language that is italian, CEFR_level that is A1, and is a vocabulary type, it belongs in the A1 Italian word deck

export async function loader({ request }: LoaderFunctionArgs) {
  const allCards = await drizzle.select().from(cards);
  return json([allCards]);
}

export const action = async ({ params }: ActionFunctionArgs) => {
  const cardId = z.coerce.number().parse(params.cardId);
  console.log({ cardz_delete_error: params.error });

  try {
    await db.delete(cards).where(eq(cards.id, cardId));
    return redirect(`/cards`);
  } catch (error) {
    return json({ status: "error" });
  }
};

export default function Cards() {
  const cards = useLoaderData<typeof loader>();
  const fetcher = useFetcher();

  const cardsArray = Object.entries(cards[0]).map(([key, value]) => {
    return { key, value };
  });

  return (
    <>
      <h1>All Cards</h1>
      <Outlet />
      {cardsArray.map((card) => (
        <div className="card-container" key={card.value.id}>
          {card.value.front} ||| {card.value.back}
          <div className="button-container">
            <Link
              className="button"
              to={`/cards/${card.value.id}/edit`}
              reloadDocument
            >
              Edit
            </Link>
            <fetcher.Form
              method="post"
              action={`/cards/${card.value.id}/delete`}
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
            </fetcher.Form>
          </div>
        </div>
      ))}
    </>
  );
}
