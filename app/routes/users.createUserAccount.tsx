import { json, redirect } from "@remix-run/node";
import type { ActionFunctionArgs } from "@remix-run/node";
import {
  Form,
  useActionData,
  useNavigation,
  useSubmit,
} from "@remix-run/react";
import { db } from "db/index";
import { z } from "zod";
import { users, userPasswords } from "db/schema";

import appStylesHref from "./app.css";

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const userName = formData.get("userName");
  const email = formData.get("email");
  const parsedInput = userSchema.safeParse({
    userName: userName,
    email: email,
  });
  //   const errors = parsedInput.success ? parsedInput.;

  if (parsedInput.success) {
    const user = await db
      .insert(users)
      .values({
        userName: parsedInput.data.userName,
        email: parsedInput.data.email,
      })
      .returning();
    return redirect(`/users/${user[0].id}/edit`);
  } else {
    console.log({ parsed_input_error: parsedInput.error });
    return json({
      status: "error",
      message: parsedInput.error.message,
    } as const);
  }
};

export default function CreateUserAccount() {
  const data = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.formAction === "/users/createUserAccount";

  const errorMessage = data?.status === "error" ? data.message : null;

  return (
    <Form method="post">
      {errorMessage ? errorMessage : null}
      <label>
        username: <input name="userName" />
      </label>
      <label>
        email: <input name="email" />
      </label>
      <button type="submit">
        {isSubmitting ? "Creating new account..." : "Create Account"}
      </button>
    </Form>
  );
}

const userSchema = z.object({
  userName: z.string(),
  email: z.string(),
});
