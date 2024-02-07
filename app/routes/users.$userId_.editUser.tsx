import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import {
  Form,
  useLoaderData,
  useNavigate,
  useNavigation,
} from "@remix-run/react";
import React from "react";
import { eq } from "drizzle-orm";
import { users } from "../../db/schema";
import { z } from "zod";
import { db } from "../../db/index";

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const user = await db
    .select()
    .from(users)
    .where(eq(users.id, Number(params.userId)));

  const userName = user[0]?.userName;

  if (!user) {
    throw new Response("Not Found", { status: 404 });
  }
  return json({ user, userName });
};

const userSchema = z.object({
  userName: z.string(),
});

export const action = async ({ params, request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const userName = formData.get("userName");

  const parsedInput = userSchema.safeParse({
    userName: userName,
  });

  if (!parsedInput.success) {
    return json({ error: parsedInput.error }, { status: 400 });
  }

  try {
    await db
      .update(users)
      .set({
        userName: parsedInput.data.userName,
      })
      .where(eq(users.id, Number(params.userId)));
    return redirect(`/users/${params.userId}`);
  } catch (error) {
    console.log({ user_edit_error: error });
    return json({ status: "error" });
  }
};

export default function EditUser({}) {
  const { userName } = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const navigate = useNavigate();
  const isSaving = navigation.formAction === `/users/${users.id}/editUser`;

  return (
    <Form id="contact-form" method="post">
      <p>
        <input
          aria-label="userName"
          defaultValue={`${userName}`}
          name="userName"
          placeholder="userName"
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
