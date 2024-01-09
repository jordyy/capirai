import { LoaderFunctionArgs, ActionFunctionArgs, json } from "@remix-run/node";
import { useLoaderData, Outlet } from "@remix-run/react";
import { deckCards, decks, cards, userCards } from "../../db/schema";
import { eq } from "drizzle-orm";

import { drizzle } from "../utils/db.server";
import { Link } from "@remix-run/react";
import { z } from "zod";
import React from "react";
import { useFetcher } from "@remix-run/react";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const parsedUserId = z.coerce.number().parse(params.userId);
  try {
    const allUserCards = await drizzle
      .select()
      .from(userCards)
      .where(eq(userCards.userID, parsedUserId));
    return json(allUserCards);
  } catch (error) {
    console.error("Loader error:", error);
    throw new Response("Error loading deck cards", { status: 500 });
  }
}

export const action = async ({ params }: ActionFunctionArgs) => {
  const userCardId = z.coerce.number().parse(params.deckCardId);
  console.log({ cardz_delete_error: params.error });

  if (!userCardId) {
    return json({ error: "No deck card id provided" }, { status: 400 });
  }
};

export default function UserCards() {
  const allUserCards = useLoaderData<typeof loader>();
  const fetcher = useFetcher();

  if (!allUserCards || allUserCards.length === 0) {
    return <div>Decks not found.</div>;
  }

  console.log({ allUserCards: allUserCards });

  //   return (
  //     <div id="all-decks">
  //       <h1>All Deck Cards</h1>
  //       <Outlet />
  //       {allUserCards.map((card) => (
  //         <div className="card-container" key={card.cards.id}>
  //           <div>{card.decks.name}</div>
  //           <div>{card.cards.front}</div>
  //           <div>{card.cards.back}</div>
  //           <div className="button-container">
  //             <Link
  //               className="button"
  //               to={`/cards/${card.cards.id}/edit`}
  //               reloadDocument
  //             >
  //               Edit
  //             </Link>
  //             <fetcher.Form
  //               method="post"
  //               action={`/deckCards/${deckCards.cardID}/remove`}
  //             >
  //               {/* <input type="hidden" name="userCardID" value={userCards.cardID} /> */}
  //               <button type="submit">Remove</button>
  //             </fetcher.Form>
  //           </div>
  //         </div>
  //       ))}
  //     </div>
  //   );
}
