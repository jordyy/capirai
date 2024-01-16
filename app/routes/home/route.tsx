import {
  LoaderFunctionArgs,
  ActionFunctionArgs,
  json,
  redirect,
} from "@remix-run/node";
import { useLoaderData, useActionData, useNavigation } from "@remix-run/react";
import { decks, deckCards } from "../../../db/schema";
import { db } from "../../../db/index";
import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { drizzle } from "../../utils/db.server";
import { Link } from "@remix-run/react";
import { useFetcher } from "@remix-run/react";
import { userDeckSubscriptions } from "../../../db/schema";
import { getAuthCookie, requireAuthCookie } from "../../auth";

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await getAuthCookie(request);
  const myDecks = await drizzle
    .select()
    .from(decks)
    .innerJoin(
      userDeckSubscriptions,
      eq(decks.id, userDeckSubscriptions.deckID)
    );

  const myDeckCardIds = await drizzle
    .select({ cardID: deckCards.id })
    .from(deckCards)
    .innerJoin(decks, eq(deckCards.deckID, decks.id))
    .innerJoin(
      userDeckSubscriptions,
      eq(decks.id, userDeckSubscriptions.deckID)
    )
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
    .where(eq(userDeckSubscriptions.userID, userId));
  return json({
    myDecks,
    isAuth: true,
    userSubscriptions,
    myDeckCardIds,
  } as const);
}

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const userId = await requireAuthCookie(request);
  const formData = await request.formData();
  const deckId = z.coerce.number().parse(formData.get("deckId"));
  const isSubscribeAction = formData.has("subscribe");

  try {
    if (isSubscribeAction) {
      const subscribe = Boolean(
        z.coerce.number().parse(formData.get("subscribe"))
      );
      const [existingSubscription] = await db
        .select()
        .from(userDeckSubscriptions)
        .where(
          and(
            eq(userDeckSubscriptions.deckID, deckId),
            eq(userDeckSubscriptions.userID, userId)
          )
        )
        .limit(1);

      if (existingSubscription) {
        await db
          .update(userDeckSubscriptions)
          .set({ subscribed: subscribe })
          .where(eq(userDeckSubscriptions.id, existingSubscription.id));
      } else {
        await db
          .insert(userDeckSubscriptions)
          .values({ userID: userId, deckID: deckId, subscribed: subscribe });
      }
      return null;
    } else if (!isSubscribeAction) {
      await db.delete(decks).where(eq(decks.id, deckId));
      return redirect(`/decks`);
    }
  } catch (error) {
    console.log({ deck_delete_error: params.error });
    return null;
  }
};

export default function myDecks() {
  const { myDecks, userSubscriptions, isAuth, myDeckCardIds } =
    useLoaderData<typeof loader>();
  const subscribe = useActionData<typeof loader>();
  const fetcher = useFetcher();
  const navigation = useNavigation();

  return (
    <>
      <h1>{isAuth ? "My Decks" : "Deck Library"}</h1>
      {!isAuth ? (
        redirect("/decks")
      ) : (
        <div className="deck-container">
          {myDecks.map((deck) => {
            const isSubscribed =
              Number(fetcher.formData?.get("deckId")) === deck.decks.id
                ? Boolean(fetcher.formData?.get("subscribe"))
                : userSubscriptions?.find(
                    (subscription) => subscription.deckID === deck.decks.id
                  )?.subscribed;
            return (
              <div key={deck.decks.id}>
                {isSubscribed ? (
                  <div key={deck.decks.id} className="deck-box">
                    <Link to={`/decks/${deck.decks.id}`}>
                      <button type="submit" className="deck-name">
                        {navigation.formAction === `/decks/${deck.decks.id}`
                          ? "Loading..."
                          : `${deck.decks.name}`}
                      </button>
                    </Link>{" "}
                    <Link to={`/deckcards/${myDeckCardIds[0].cardID}`}>
                      Review
                    </Link>
                    <br />
                    completion - {deck.userDeckSubcriptions.completion} <br />
                    <fetcher.Form method="POST">
                      <input
                        type="hidden"
                        name="deckId"
                        value={deck.decks.id}
                      />
                      <button
                        aria-label="Toggle Subscription"
                        className="subscribed"
                        name="subscribe"
                        value={isSubscribed ? 0 : 1}
                      >
                        {isSubscribed ? "Unsubscribe" : "Subscribe"}
                      </button>
                    </fetcher.Form>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
