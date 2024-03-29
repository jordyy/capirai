import {
  LoaderFunctionArgs,
  ActionFunctionArgs,
  json,
  redirect,
} from "@remix-run/node";
import {
  useLoaderData,
  Outlet,
  useActionData,
  useNavigation,
} from "@remix-run/react";
import {
  decks,
  userDeckSubscriptions,
  deckCards,
  userCards,
} from "../../db/schema";
import React, { useEffect } from "react";
import { z } from "zod";
import { eq, and, asc } from "drizzle-orm";
import { drizzle } from "../utils/db.server";
import { Link, Form } from "@remix-run/react";
import { useFetcher } from "@remix-run/react";
import { getAuthCookie, requireAuthCookie } from "../auth";
import AddCircleOutlineRounded from "@mui/icons-material/AddCircleOutlineRounded";
import HighlightOffRoundedIcon from "@mui/icons-material/HighlightOffRounded";

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await getAuthCookie(request);

  if (userId === null || !userId) {
    throw redirect("/login");
  }

  const allDecks = await drizzle
    .select()
    .from(decks)
    .leftJoin(
      userDeckSubscriptions,
      and(
        eq(decks.id, userDeckSubscriptions.deckID),
        eq(userDeckSubscriptions.userID, userId)
      )
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

  const userSubscriptions = await drizzle
    .select()
    .from(userDeckSubscriptions)
    .where(eq(userDeckSubscriptions.userID, userId));

  return json({
    allDecks,
    cardQuantity,
    isAuth: true,
    userSubscriptions,
  } as const);
}

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const userId = await requireAuthCookie(request);
  const formData = await request.formData();
  const deckIdString = z.coerce.number().parse(formData.get("deckId"));
  const subscribeString = formData.get("subscribe");

  if (!deckIdString || isNaN(Number(deckIdString))) {
    return json({ status: "error", error: "Invalid deckId" });
  }

  const deckId = Number(deckIdString);
  const isSubscribeAction = formData.has("subscribe");

  const firstCard = await drizzle
    .select({ cardID: deckCards.cardID })
    .from(deckCards)
    .where(eq(deckCards.deckID, deckId))
    .orderBy(asc(deckCards.cardID))
    .limit(1);

  try {
    if (isSubscribeAction) {
      const subscribe = Boolean(z.coerce.number().parse(subscribeString));
      const [existingSubscription] = await drizzle
        .select()
        .from(userDeckSubscriptions)
        .where(
          and(
            eq(userDeckSubscriptions.deckID, deckId),
            eq(userDeckSubscriptions.userID, userId)
          )
        )
        .limit(1);

      if (firstCard[0]?.cardID) {
        await drizzle
          .insert(userCards)
          .values({ userID: userId, cardID: firstCard[0]?.cardID })
          .onConflictDoNothing({
            target: [userCards.userID, userCards.cardID],
          });
      }

      if (existingSubscription) {
        await drizzle
          .update(userDeckSubscriptions)
          .set({ subscribed: subscribe })
          .where(eq(userDeckSubscriptions.id, existingSubscription.id));
      } else {
        await drizzle
          .insert(userDeckSubscriptions)
          .values({ userID: userId, deckID: deckId, subscribed: subscribe });
      }
      return null;
    } else if (!isSubscribeAction) {
      await drizzle.delete(decks).where(eq(decks.id, deckId));
      return redirect(`/decks`);
    }
  } catch (error) {
    console.log({ deck_delete_error: error });
    return json({ status: "error" });
  }
};

export default function DeckIndex() {
  const { allDecks, cardQuantity, userSubscriptions, isAuth } =
    useLoaderData<typeof loader>();
  const fetcher = useFetcher();
  const navigation = useNavigation();
  const isSubmitting = navigation.formData?.get("intent") === "createNewdeck";
  const [createDeckIsOpen, setCreateDeckIsOpen] = React.useState(false);
  const createDeckFormRef = React.useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!isSubmitting) {
      createDeckFormRef.current?.reset();
    }
  }, [isSubmitting]);

  if (!allDecks) {
    return <div>Decks not found.</div>;
  }

  return (
    <>
      <div className="deck-page">
        {!isAuth ? (
          <>
            <div className="nav-container">
              <Form ref={createDeckFormRef} method="post" action="/login">
                <button>Login</button>
              </Form>
              <Form method="post" action="/signup">
                <button>Signup</button>
              </Form>
            </div>
          </>
        ) : (
          <>
            <div className="library-page-top">
              <h1 className="page-heading">Deck Library</h1>
              {!createDeckIsOpen ? (
                <button
                  className="add-deck"
                  onClick={() => setCreateDeckIsOpen(!createDeckIsOpen)}
                >
                  <AddCircleOutlineRounded />
                </button>
              ) : (
                <button
                  className="add-deck"
                  onClick={() => setCreateDeckIsOpen(!createDeckIsOpen)}
                >
                  <HighlightOffRoundedIcon />
                </button>
              )}
            </div>
            {createDeckIsOpen ? (
              <>
                <Form
                  className="create-form create-deck-form"
                  method="post"
                  action={`/decks/createNewDeck`}
                >
                  <div className="form-header">Deck Name</div>
                  <label>
                    <input className="deckname-input" name="deckName" />
                  </label>
                  <button type="submit" className="save-button">
                    <input
                      type="hidden"
                      className="deckname-input"
                      name="intent"
                      value="createNewDeck"
                    />
                    {isSubmitting ? "Saving new deck..." : "Save Deck"}
                  </button>
                </Form>
              </>
            ) : null}
          </>
        )}
        <div className="deck-container">
          {allDecks.map((deck) => {
            const cardsInDeck = cardQuantity?.filter(
              (card) => card?.deckCards.deckID === deck.decks.id
            ).length;
            const isSubscribed =
              Number(fetcher.formData?.get("deckId")) === deck.decks.id
                ? Boolean(fetcher.formData?.get("subscribe"))
                : userSubscriptions?.find(
                    (subscription) => subscription.deckID === deck.decks.id
                  )?.subscribed;
            return (
              <div className="deck-box" key={deck.decks.id}>
                <Link
                  to={`/decks/${deck.decks.id}`}
                  className="deck-text deck-header"
                >
                  {deck.decks.name}
                </Link>
                <div className="deck-qty">
                  {cardsInDeck
                    ? `${cardsInDeck} cards`
                    : "No cards in this deck."}
                </div>
                <div className="button-container">
                  {isAuth ? (
                    <fetcher.Form method="POST">
                      <input
                        type="hidden"
                        name="deckId"
                        value={deck.decks.id}
                      />
                      <button
                        aria-label="Toggle Subscription"
                        className={
                          isSubscribed
                            ? "unsubscribe-button"
                            : "subscribe-button"
                        }
                        name="subscribe"
                        value={isSubscribed ? 0 : 1}
                      >
                        {isSubscribed ? "Unsubscribe" : "Subscribe"}
                      </button>
                    </fetcher.Form>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
