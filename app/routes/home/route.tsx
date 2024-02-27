import {
  LoaderFunctionArgs,
  ActionFunctionArgs,
  json,
  redirect,
} from "@remix-run/node";
import { useLoaderData, useNavigation, Form } from "@remix-run/react";
import { decks, deckCards } from "../../../db/schema";
import { eq, and } from "drizzle-orm";
import React from "react";
import { drizzle } from "../../utils/db.server";
import { Link } from "@remix-run/react";
import { useFetcher } from "@remix-run/react";
import { userDeckSubscriptions } from "../../../db/schema";
import { getAuthCookie, requireAuthCookie } from "../../auth";
import DoubleArrowRoundedIcon from "@mui/icons-material/DoubleArrowRounded";
import AddCircleOutlineRounded from "@mui/icons-material/AddCircleOutlineRounded";
import HighlightOffRoundedIcon from "@mui/icons-material/HighlightOffRounded";

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
  const navigation = useNavigation();
  const isSubmitting = navigation.formData?.get("intent") === "createNewdeck";
  const [createDeckIsOpen, setCreateDeckIsOpen] = React.useState(false);
  const createDeckFormRef = React.useRef<HTMLFormElement>(null);

  return (
    <>
      <div className="library-page-top">
        <h1 className="page-heading">My Decks</h1>
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
      {createDeckIsOpen && (
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
            <button type="submit">
              <input type="hidden" name="intent" value="createNewDeck" />
              {isSubmitting ? "Saving new deck..." : "Save Deck"}
            </button>
          </Form>
        </>
      )}

      {!isAuth ? (
        redirect("/decks")
      ) : (
        <div>
          <div>
            {userSubscriptions.map((deck) => {
              const isSubscribed = userSubscriptions
                ? userSubscriptions.map(
                    (userSubscription) =>
                      userSubscription.userDeckSubcriptions.subscribed
                  )
                : null;
              return (
                <div key={deck.decks.id} className="deck-container">
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
                          {<DoubleArrowRoundedIcon sx={{ fontSize: 16 }} />}
                        </Link>
                      ) : (
                        <div>This deck has no cards.</div>
                      )}
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
