import { json } from "@remix-run/node";
import type { ActionFunctionArgs } from "@remix-run/node";
import { Form, useActionData, useNavigation } from "@remix-run/react";
import { db } from "db/index";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { users, userPasswords } from "db/schema";

type ErrorRecord = {
  email?: string;
  password?: string;
};

export async function action({ request }: ActionFunctionArgs) {
  // get all the formData and assign their values to variables
  const formData = await request.formData();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const errors: ErrorRecord = {};

  // form validation
  if (typeof email !== "string" || !email) {
    errors.email = "Email is required";
  } else if (!email.includes("@")) {
    errors.email = "Please enter a valid email address";
  }
  if (typeof password !== "string" || !password) {
    errors.password = "Password is required";
  } else if (password.length < 8) {
    errors.password = "Password must be at least 8 characters";
  }

  if (Object.keys(errors).length) {
    return json({ status: "error", errors });
  }

  // parse login formData to ensure type safety
  const userInputSchema = z.object({
    email: z.string(),
});
  const parsedInput = userInputSchema.safeParse({ email });
  if (!parsedInput.success) {
    return json({
      status: "error",
      error: parsedInput.error,
      message: parsedInput.error.message,
    });
  } 

//get user data from db
  const user = await db
  .select()
  .from(users)
  .where(
    sql`${users.email} = ${parsedInput.data.email}`
  )
  .execute();

  if(!user || user.length === 0) {
    return json({
        status: "error",
        message: "User not found",
    });
}

const userData = user[0];

//get hashed password from db where password table userId = user.id
  const userHashedPassRecord = await db 
    .select().from(userPasswords).where(sql`${userPasswords.userID} = ${userData.id}`).execute();
    
      if (!userHashedPassRecord || userHashedPassRecord.length === 0) {
        return json({
          status: "error",
          message: "User not found",
        });
    }

    const userHashedPass = userHashedPassRecord.hashedPass;
    const bcrypt = require("bcrypt");
    const isPasswordCorrect = await bcrypt.compare(password, userHashedPass)

    if (!isPasswordCorrect) {
      return json({
        status: "error",
        message: "Incorrect password",
      });
    }

    return json({
        status: "success",
        userID: userData.id,
    })

export default function LoginForm() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const emailError = actionData?.errors?.email;
  const passwordError = actionData?.errors?.password;

  const errorMessage =
    actionData?.status === "error" ? actionData.message : null;

  return (
    <>
      <Form method="post">
        {errorMessage ? errorMessage : null}
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
        <button type="submit">{"login"}</button>
      </Form>
    </>
  );
}
