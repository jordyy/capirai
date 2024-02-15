import {
  LoaderFunctionArgs,
  ActionFunctionArgs,
  json,
  redirect,
} from "@remix-run/node";
import { useLoaderData, useActionData, useNavigation } from "@remix-run/react";
import {
  decks,
  deckCards,
  userDeckSubcriptionsRelations,
  users,
} from "../../../db/schema";
import { db } from "../../../db/index";
import { z } from "zod";
import { eq, and } from "drizzle-orm";
import React from "react";
import { drizzle } from "../../utils/db.server";
import { Link } from "@remix-run/react";
import { useFetcher } from "@remix-run/react";
import { userDeckSubscriptions } from "../../../db/schema";
import { getAuthCookie, requireAuthCookie } from "../../auth";
import BorderColorRoundedIcon from "@mui/icons-material/BorderColorRounded";
import AddCircleRoundedIcon from "@mui/icons-material/AddCircleRounded";
import DoubleArrowRoundedIcon from "@mui/icons-material/DoubleArrowRounded";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const userId = await getAuthCookie(request);

  const myDeckCardIds = await drizzle
    .select({ deckCardID: deckCards.id, deckId: deckCards.deckID })
    .from(deckCards)
    .innerJoin(decks, eq(deckCards.deckID, decks.id))
    .innerJoin(
      userDeckSubscriptions,
      eq(decks.id, userDeckSubscriptions.deckID)
    )
    .where(eq(deckCards.deckID, decks.id))
    .orderBy(deckCards.id)
    .limit(1);

  if (!userId) {
    return json({
      myDecks,
      userSubscriptions: null,
      isAuth: false,
      myDeckCardIds,
    } as const);
  }

  const userSubscriptions = await drizzle
    .select()
    .from(userDeckSubscriptions)
    .where(eq(userDeckSubscriptions.userID, userId))
    .innerJoin(decks, eq(decks.id, userDeckSubscriptions.deckID));
  return json({
    myDecks,
    isAuth: true,
    userSubscriptions,
    myDeckCardIds,
  } as const);
}

export default function myDecks() {
  const { userSubscriptions, isAuth, myDeckCardIds } =
    useLoaderData<typeof loader>();
  const fetcher = useFetcher();

  return (
    <>
      <div className="nav-container">
        <h1>{isAuth ? "Decks" : "Library"}</h1>
      </div>
      {!isAuth ? (
        redirect("/decks")
      ) : (
        <div>
          <div className="deck-container">
            {userSubscriptions.map((deck) => {
              const isSubscribed = userSubscriptions
                ? userSubscriptions.map(
                    (userSubscription) =>
                      userSubscription.userDeckSubcriptions.subscribed
                  )
                : null;
              return (
                <div key={deck.decks.id}>
                  {isSubscribed ? (
                    <div key={deck.decks.id} className="deck-box">
                      <Link
                        to={`/decks/${deck.decks.id}`}
                        className="deck-header"
                      >
                        {deck.decks.name}
                      </Link>{" "}
                      {deck.decks.id === myDeckCardIds[0].deckId ? (
                        <Link
                          to={`/deckcards/${deck.decks.id}/${myDeckCardIds[0].deckCardID}`}
                          className="study-deck"
                        >
                          Study deck{" "}
                          {<DoubleArrowRoundedIcon sx={{ fontSize: 30 }} />}
                        </Link>
                      ) : (
                        <div>This deck has no cards.</div>
                      )}
                      {/* <br />
                      completion - {deck.userDeckSubcriptions.completion} <br /> */}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}
