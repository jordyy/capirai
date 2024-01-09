import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import {
  Form,
  useLoaderData,
  useNavigate,
  useNavigation,
} from "@remix-run/react";
import { eq } from "drizzle-orm";
import { userCards, deckCards } from "../../db/schema";
import { z } from "zod";
import React from "react";
import { db } from "../../db/index";

export const loader = async ({ params }: LoaderFunctionArgs) => {
  if (!params.userCardId || isNaN(Number(params.userCardId))) {
    throw new Response("No user card id provided", { status: 400 });
  }

  const userCardId = Number(params.userCardId);

  const userCard = await db
    .select()
    .from(userCards)
    .where(eq(userCards.id, userCardId));

  if (!userCard) {
    throw new Response("No card found", { status: 404 });
  }
  const understanding = userCard[0]?.understanding;

  return json({ understanding, userCardId, userCard });
};

const cardSchema = z.object({
  understanding: z.string(),
});

export const action = async ({ params, request }: ActionFunctionArgs) => {
  if (!params.userCardId || isNaN(Number(params.userCardId))) {
    throw new Response("No user card id provided", { status: 400 });
  }
  const formData = await request.formData();
  const understanding = formData.get("understanding");
  const deckCardId = formData.get("deckCardId");

  const parsedInput = cardSchema.safeParse({
    understanding: understanding,
  });

  if (!parsedInput.success) {
    return json({ error: parsedInput.error }, { status: 400 });
  }

  try {
    await db
      .update(userCards)
      .set({
        understanding: parsedInput.data.understanding as
          | "I have never seen it"
          | "I have seen it, but not sure what it means"
          | "I know what it means"
          | "I can use it"
          | null
          | undefined,
      })
      .where(eq(userCards.id, Number(params.userCardId)));
    return redirect(`/deckCards/${deckCardId}`);
  } catch (error) {
    console.log({ card_edit_error: error });
    return json({ status: "error" });
  }
};

export default function UpdateUserCard({}) {
  const { understanding, userCardId, userCard } =
    useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const navigate = useNavigate();
  const isSaving = navigation.formAction === `/userCards/${userCards.id}/edit`;

  console.log({ understanding, userCardId, userCard });
  return (
    <Form method="post">
      <p>
        <div className="edit-userCard-input-label">Understanding:</div>
        <input
          defaultValue={`${understanding}`}
          aria-label="understanding"
          name="understanding"
          type="text"
          placeholder="understanding"
          id="understanding"
        />
      </p>
      <p>
        <button type="submit">
          {isSaving ? "Saving changes..." : "Save changes"}
        </button>
        <button onClick={() => navigate(-1)} type="button">
          Cancel
        </button>
      </p>
    </Form>
  );
}
