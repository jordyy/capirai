import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import {
  Form,
  useLoaderData,
  useNavigate,
  useNavigation,
} from "@remix-run/react";
import { eq } from "drizzle-orm";
import { userCards } from "../../../db/schema";
import { z } from "zod";
import React from "react";
import { db } from "../../../db/index";

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const parsedUserCardId = z.coerce.number().parse(params.userCardId);
  const userCard = await db
    .select()
    .from(userCards)
    .where(eq(userCards.id, parsedUserCardId));

  const understanding = userCard[0]?.understanding;

  if (!userCard) {
    throw new Response("Not Found", { status: 404 });
  }
  return json({ understanding });
};

const cardSchema = z.object({
  understanding: z.string(),
});

export const action = async ({ params, request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const understanding = formData.get("understanding");

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
        understanding: parsedInput.data.understanding,
      })
      .where(eq(userCards.id, Number(params.userCardId)));
    return null;
  } catch (error) {
    console.log({ card_edit_error: error });
    return json({ status: "error" });
  }
};

export default function EditUser({}) {
  const { understanding } = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const navigate = useNavigate();
  const isSaving = navigation.formAction === `/userCards/${userCards.id}/edit`;

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
