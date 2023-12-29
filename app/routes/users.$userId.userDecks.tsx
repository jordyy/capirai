import { LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import React from "react";
import { drizzle } from "../utils/db.server";
import { decks, userDeckSubscriptions } from "../../db/schema";
import { json } from "@remix-run/node";

export async function loader({ request }: LoaderFunctionArgs) {
  const userDecks = await drizzle.select().from(userDeckSubscriptions);
  return json(userDecks);
}

export default function UserDecks() {
  const userDecks = useLoaderData<typeof loader>();

  console.log(userDecks);

  return (
    <div>
      <h1>My Decks</h1>
      {/* <div>
        {userDecks.map((deck) => (
          <div key={deck.id}>{deck.name}</div>
        ))}
      </div> */}
    </div>
  );
}
