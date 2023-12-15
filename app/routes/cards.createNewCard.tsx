import { json, redirect } from "@remix-run/node";
import type { ActionFunctionArgs } from "@remix-run/node";
import { Form, useActionData, useNavigation } from "@remix-run/react";
import { db } from "db/index";
import { z } from "zod";
import { cards } from "db/schema";

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const cardFront = formData.get("front");
  const cardBack = formData.get("back");
  const parsedInput = cardSchema.safeParse({
    front: cardFront,
    back: cardBack,
  });

  if (parsedInput.success) {
    const user = await db
      .insert(cards)
      .values({
        front: parsedInput.data.front,
        back: parsedInput.data.back,
      })
      .returning();
    return redirect(`/cards`);
  } else {
    console.log({ parsedInputerror: parsedInput.error });
    return json({
      status: "error",
      message: parsedInput.error.message,
    } as const);
  }
};

export default function CreateUserAccount() {
  const data = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.formAction === "/cards/createNewCard";

  const errorMessage = data?.status === "error" ? data.message : null;

  return (
    <Form method="post">
      {errorMessage ? errorMessage : null}
      <label>
        front: <input name="front" />
      </label>
      <label>
        back: <input name="back" />
      </label>
      <button type="submit">
        {isSubmitting ? "Saving new card..." : "Add card"}
      </button>
    </Form>
  );
}

const cardSchema = z.object({
  front: z.string(),
  back: z.string(),
});
