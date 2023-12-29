import {
  LoaderFunctionArgs,
  ActionFunctionArgs,
  redirect,
  json,
} from "@remix-run/node";
import { useActionData, useLoaderData } from "@remix-run/react";
import { decks } from "db/schema";
import { db } from "db/index";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { userDeckSubcriptions } from "drizzle/schema";
import { requireAuthCookie } from "~/auth";
import CreateNewDeck from "../decks.createNewDeck";

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await requireAuthCookie(request);

  const userDecks = await db
    .select()
    .from(userDeckSubcriptions)
    .where(eq(userDeckSubcriptions.userId, userId));
  return [userDecks];
}

// export async function action({ request }: ActionFunctionArgs) {
//   const userId = await requireAuthCookie(request);
//   const formData = await request.formData();
//   const deckName = formData.get("deckName");

//   return formData;
// }

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const deckName = formData.get("deckName");

  if (typeof deckName !== "string" || !deckName) {
    return json({ status: "error", message: "Deck name is required" });
  }

  const parsedInput = deckSchema.safeParse({
    name: deckName,
  });

  if (!parsedInput.success) {
    return json({ error: parsedInput.error }, { status: 400 });
  }

  try {
    const deck = await db
      .insert(decks)
      .values({
        name: parsedInput.data.name,
      })
      .returning();
    return redirect(`/decks/${deck[0].id}`);
  } catch (error) {
    console.error(error);
    return json({ status: "error", message: "Failed to create deck" });
  }
};

export default function Home() {
  const userDecks = useLoaderData<typeof loader>();

  const userDecksArray = Object.entries(userDecks[0]).map(([key, value]) => {
    return { key, value };
  });

  if (!userDecksArray) {
    return <div>You've not subscribed to any decks.</div>;
  }

  return (
    <>
      <h1>Your Decks</h1>
      <CreateNewDeck />
      <div>//TODO: map over User's subscribed decks</div>
    </>
  );
}

function userDecks() {
  //all the decks that this user is subscribed to
  return <div></div>;
}

const deckSchema = z.object({
  name: z.string(),
});
