import { LoaderFunctionArgs, json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { decks, userDeckSubscriptions, deckCards } from "../../db/schema";
import { eq } from "drizzle-orm";
import { drizzle } from "../utils/db.server";
import { Link, Form } from "@remix-run/react";
import { getAuthCookie } from "../auth";

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await getAuthCookie(request);
  const allDecks = await drizzle
    .select()
    .from(decks)
    .leftJoin(
      userDeckSubscriptions,
      eq(decks.id, userDeckSubscriptions.deckID)
    );

  if (!userId) {
    return json({
      allDecks,
      cardQuantity: null,
      userSubscriptions: null,
      isAuth: false,
    } as const);
  }

  const cardQuantity = await drizzle
    .select()
    .from(deckCards)
    .innerJoin(decks, eq(deckCards.deckID, decks.id))
    .where(eq(deckCards.deckID, decks.id));

  if (cardQuantity.length === 0) {
    return json({
      allDecks,
      userSubscriptions: null,
      isAuth: userId ? true : false,
      cardQuantity: null,
    } as const);
  }

  return json({
    allDecks,
    cardQuantity,
    isAuth: true,
  } as const);
}

export default function DeckIndex() {
  const { allDecks, cardQuantity, isAuth } = useLoaderData<typeof loader>();

  if (!allDecks) {
    return <div>Decks not found.</div>;
  }

  return (
    <div>
      <div className="nav-container">
        <h1>Deck Library</h1>
      </div>
      {!isAuth ? (
        <>
          <Form method="post" action="/login">
            <button>Login</button>
          </Form>
          <Form method="post" action="/signup">
            <button>Signup</button>
          </Form>
        </>
      ) : (
        <Link to="/decks/createNewDeck" className="button create-deck">
          Create New Deck
        </Link>
      )}
      <div className="deck-container">
        {allDecks.map((deck) => {
          const cardsInDeck = cardQuantity?.filter(
            (card) => card?.deckCards.deckID === deck.decks.id
          ).length;
          return (
            <div className="deck-box" key={deck.decks.id}>
              <div className="deck-qty">
                {cardsInDeck
                  ? `${cardsInDeck} cards`
                  : "No cards in this deck."}
              </div>
              <Link
                to={`/decks/${deck.decks.id}`}
                className="deck-text deck-header"
              >
                {deck.decks.name}
              </Link>
              <div className="button-container"></div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
