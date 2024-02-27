import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { eq, asc, and, orderBy } from "drizzle-orm";
import {
  Form,
  useLoaderData,
  Link,
  useNavigate,
  useNavigation,
} from "@remix-run/react";
import React, { useState, useRef, useEffect } from "react";

import { drizzle } from "../utils/db.server";
import {
  decks,
  deckCards,
  cards,
  userCards,
  userDeckSubscriptions,
} from "../../db/schema";
import { z } from "zod";
import BorderColorRoundedIcon from "@mui/icons-material/BorderColorRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import { useFetcher, Outlet } from "@remix-run/react";
import { getAuthCookie, requireAuthCookie } from "../auth";
import HighlightOffRoundedIcon from "@mui/icons-material/HighlightOffRounded";

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
  const deckId = z.coerce.number().parse(params.deckId);

  if (!deckId) {
    throw new Error("Invalid deck ID");
  }
  const userId = await getAuthCookie(request);

  const deck = await drizzle
    .select()
    .from(decks)
    .where(eq(decks.id, Number(params.deckId)));

  const allDeckCards = await drizzle
    .select()
    .from(deckCards)
    .innerJoin(decks, eq(deckCards.deckID, decks.id))
    .orderBy(deckCards.id);

  const deckCardArr = await drizzle
    .select()
    .from(cards)
    .innerJoin(deckCards, eq(cards.id, deckCards.cardID))
    .leftJoin(userCards, eq(cards.id, userCards.cardID))
    .where(
      and(
        eq(userCards.userID, Number(userId)),
        eq(deckCards.deckID, Number(params.deckId))
      )
    )
    .orderBy(deckCards.id);

  const userCardData = deckCardArr.map((data) => data.userCards);
  const userReviewed = userCardData.map((data) => Boolean(data?.timesReviewed));

  let numReviewed = 0;
  for (let i = 0; i < userReviewed.length; i++) {
    if (userReviewed[i] === true) {
      numReviewed++;
    }
  }

  if (!userId) {
    return json({
      deckId,
      deck,
      allDeckCards,
      deckCardArr,
      isAuth: false,
      userSubscriptions: null,
      numReviewed,
    } as const);
  }
  const userSubscriptions = await drizzle
    .select()
    .from(userDeckSubscriptions)
    .where(eq(userDeckSubscriptions.userID, userId));

  if (!deck || deck.length === 0) {
    throw new Response("Not Found", { status: 404 });
  }

  const name = deck[0]?.name;

  return json({
    deckId,
    deck,
    allDeckCards,
    name,
    deckCardArr,
    userSubscriptions,
    numReviewed,
  });
};

export const action = async ({ params, request }: ActionFunctionArgs) => {
  const userId = await requireAuthCookie(request);
  const deckId = z.coerce.number().parse(params.deckId);
  const formData = await request.formData();
  const subscribeString = formData.get("subscribe");

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

export default function Deck({}) {
  const { deckId, deck, deckCardArr, userSubscriptions, numReviewed } =
    useLoaderData<typeof loader>();
  const [isEditing, setIsEditing] = React.useState(false);
  const [editDeckName, setEditDeckName] = useState(deck[0]?.name);
  const [editDeckIsOpen, setEditDeckIsOpen] = React.useState(false);
  const [addCardIsOpen, setAddCardIsOpen] = React.useState(true);
  const deckData = deck[0];
  const fetcher = useFetcher();
  const deckName = deckData.name;
  const navigation = useNavigation();
  const navigate = useNavigate();
  const isSaving = navigation.formData?.get("intent") === "save";

  const handleEditClick = () => {
    setIsEditing(true);
    setEditDeckIsOpen(!editDeckIsOpen);
  };

  const isSubscribed =
    Number(fetcher.formData?.get("deckId")) === deckId
      ? Boolean(fetcher.formData?.get("subscribe"))
      : userSubscriptions?.find(
          (subscription) => subscription.deckID === deckId
        )?.subscribed;

  if (!deckData || !deckName) {
    return <div>No Cards in this Deck.</div>;
  }

  return (
    <>
      <div className="deck-page">
        <div className="library-page-top">
          <h1 className="page-heading">{editDeckName}</h1>
          <div>
            {!editDeckIsOpen ? (
              <Link
                className="edit-button edit-toggle"
                to={`/decks/${deckData.id}/edit`}
                onClick={handleEditClick}
              >
                <BorderColorRoundedIcon />
              </Link>
            ) : (
              <button
                className="edit-toggle"
                onClick={() => setEditDeckIsOpen(!editDeckIsOpen)}
              >
                <HighlightOffRoundedIcon />
              </button>
            )}
          </div>
        </div>
        {isEditing && editDeckIsOpen ? (
          <>
            <Form
              className="deck-name-edit add-card-form"
              method="post"
              action={`/decks/${deckId}/edit`}
            >
              <div className="form-header">Edit Deck Name</div>
              <input
                type="text"
                className="deckname-input"
                name="name"
                value={editDeckName || deckName}
                aria-label="Deck Name"
                onChange={(e) => setEditDeckName(e.target.value)}
              />
              <div className="save-cancel-button-container">
                <button
                  type="submit"
                  onClick={() => setIsEditing(false)}
                  className="save-button"
                >
                  <input type="hidden" name="intent" value="save" />
                  {isSaving ? "Saving..." : "Save"}
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="cancel-button"
                >
                  Cancel
                </button>
              </div>
            </Form>
          </>
        ) : null}

        <div id="deck">
          <Outlet />

          <p className="card-review-data">{`You have reviewed ${numReviewed}/${deckCardArr.length} cards.`}</p>

          <div className="deck-setting-section">
            <div className="deck-button-container">
              <fetcher.Form method="POST">
                <button
                  aria-label="Toggle Subscription"
                  className={
                    isSubscribed ? "unsubscribe-button" : "subscribe-button"
                  }
                  name="subscribe"
                  value={isSubscribed ? 0 : 1}
                >
                  {isSubscribed ? "Unsubscribe" : "Subscribe"}
                </button>
              </fetcher.Form>
              <Link
                to={
                  addCardIsOpen
                    ? `/decks/${deckData.id}/createNewCard`
                    : `/decks/${deckData.id}`
                }
                className="button add-button"
                onClick={() => setAddCardIsOpen(!addCardIsOpen)}
              >
                Add Card
              </Link>

              {deckCardArr.length > 0 && (
                <Link
                  to={`/deckcards/${deckData.id}/${deckCardArr[0].deckCards.id}`}
                  className="button study-button"
                >
                  Study deck
                </Link>
              )}
            </div>
          </div>
          <div>
            {deckCardArr.length === 0 ? (
              <div className="card-review-data">This deck has no cards.</div>
            ) : (
              deckCardArr.map((card) => {
                return (
                  <div key={card.cards.id} className="card-box">
                    <div className="single-card-contents">
                      <h4>{card.cards.front}</h4>
                      <p className="card-back-text">{card.cards.back}</p>
                    </div>

                    <fetcher.Form
                      method="post"
                      action={`/deckCards/${card.deckCards.deckID}/${card.deckCards.id}/remove`}
                    >
                      <input
                        type="hidden"
                        name="deckCardId"
                        value={card.deckCards.id}
                      />
                    </fetcher.Form>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </>
  );
}
