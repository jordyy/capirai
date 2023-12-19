import { json, redirect } from "@remix-run/node";
import type { ActionFunctionArgs } from "@remix-run/node";
import { Form, useActionData, useNavigation } from "@remix-run/react";
import { db } from "db/index";
import { z } from "zod";
import { users, userPasswords } from "db/schema";

export const action = async ({ request }: ActionFunctionArgs) => {
  // get all the formData and assign their values to variables
  const formData = await request.formData();
  const userName = formData.get("userName") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const errors: { [key: string]: string } = {};

  // form validation
  if (!email) {
    errors.email = "Email is required";
  } else if (!email.includes("@")) {
    errors.email = "Please enter a valid email address";
  }
  if (!password) {
    errors.password = "Password is required";
  } else if (password.length < 8) {
    errors.password = "Password must be at least 8 characters";
  }
  if (!userName) {
    errors.userName = "You must create a username";
  }
  if (Object.keys(errors).length) {
    return json({ status: "error", errors });
  }

  // parse userName formData to ensure type safety
  const parsedInput = userSchema.safeParse({ userName, email });
  if (!parsedInput.success) {
    return json({
      status: "error",
      error: parsedInput.error,
      message: parsedInput.error.message,
    });
  }
  const newUser = await db
    .insert(users)
    .values({
      userName: parsedInput.data.userName,
      email: parsedInput.data.email,
    })
    .returning({ id: users.id });

  if (newUser && newUser[0].id) {
    const bcrypt = require("bcrypt");
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // add hashedPass to db
    const newUserPass = await db
      .insert(userPasswords)
      .values({ userID: newUser[0].id, hashedPass: hashedPassword });
  }
  return redirect(`/users/${newUser[0].id}/edit`);
};

export default function SignupForm() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.formAction === "/users/createUserAccount";
  const userNameError = actionData?.errors?.userName;
  const emailError = actionData?.errors?.email;
  const passwordError = actionData?.errors?.password;

  const errorMessage =
    actionData?.status === "error" ? actionData.message : null;

  return (
    <>
      <Form method="post">
        {errorMessage ? errorMessage : null}
        <label>
          username: <input name="userName" type="text" id="userName" required />
          {userNameError && (
            <span role="alert" className="error">
              {userNameError}
            </span>
          )}
        </label>
        <label>
          email:{" "}
          <input
            name="email"
            type="email"
            id="email"
            autoComplete="email"
            required
          />
          {emailError && (
            <span role="alert" className="error">
              {emailError}
            </span>
          )}
        </label>
        <label>
          password:{" "}
          <input name="password" type="password" id="password" required />
          {passwordError && (
            <span role="alert" className="error">
              {passwordError}
            </span>
          )}
        </label>
        <button type="submit">
          {isSubmitting ? "Creating new account..." : "Create Account"}
        </button>
      </Form>
    </>
  );
}

const userSchema = z.object({
  userName: z.string(),
  email: z.string(),
});
