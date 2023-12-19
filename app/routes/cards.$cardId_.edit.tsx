import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import {
  Form,
  useLoaderData,
  useNavigate,
  useNavigation,
} from "@remix-run/react";
import { eq } from "drizzle-orm";
import { cards } from "db/schema";
import { z } from "zod";
import { db } from "db/index";

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const card = await db
    .select()
    .from(cards)
    .where(eq(cards.id, Number(params.cardId)));

  const front = card[0]?.front;
  const back = card[0]?.back;

  if (!card) {
    throw new Response("Not Found", { status: 404 });
  }
  return json({ card, front, back });
};

const cardSchema = z.object({
  front: z.string(),
  back: z.string(),
});

export const action = async ({ params, request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const front = formData.get("front");
  const back = formData.get("back");

  const parsedInput = cardSchema.safeParse({
    front: front,
    back: back,
  });

  if (!parsedInput.success) {
    return json({ error: parsedInput.error }, { status: 400 });
  }

  try {
    await db
      .update(cards)
      .set({
        front: parsedInput.data.front,
        back: parsedInput.data.back,
      })
      .where(eq(cards.id, Number(params.cardId)));
    return redirect(`/cards/${params.cardId}`);
  } catch (error) {
    console.log({ card_edit_error: error });
    return json({ status: "error" });
  }
};

export default function EditUser({}) {
  const { front, back } = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const navigate = useNavigate();
  const isSaving = navigation.formAction === `/cards/${cards.id}/edit`;

  return (
    <Form id="contact-form" method="post">
      <p>
        <div className="edit-card-input-label">Front:</div>
        <input
          defaultValue={`${front}`}
          aria-label="front"
          name="front"
          type="text"
          placeholder="front"
        />
        <div className="edit-card-input-label">Back:</div>
        <input
          aria-label="back"
          defaultValue={`${back}`}
          name="back"
          placeholder="back"
          type="text"
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
