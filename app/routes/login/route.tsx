import { json, redirect } from "@remix-run/node";
import type { ActionFunctionArgs } from "@remix-run/node";
import { Form, useActionData, useNavigation } from "@remix-run/react";
import React from "react";
import { db } from "../../../db/index";
import { sql } from "drizzle-orm";
import { z } from "zod";
import { users, userPasswords } from "../../../db/schema";
import { bcrypt } from "../../utils/auth.server";
import { authCookie } from "../../auth";

type ErrorRecord = {
  email?: string;
  password?: string;
};

export async function action({ request }: ActionFunctionArgs) {
  // get all the formData and assign their values to variables
  const formData = await request.formData();
  const email = String(formData.get("email"));
  const password = String(formData.get("password"));

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
    .where(sql`${users.email} = ${parsedInput?.data?.email}`);

  if (!user || user.length === 0) {
    return json({
      status: "error",
      message: "User not found",
    });
  }

  const userData = user[0];

  //get hashed password from db where password table userId = user table user.id
  const userHashedPassRecord = await db
    .select()
    .from(userPasswords)
    .where(sql`${userPasswords.userID} = ${userData.id}`);

  if (!userHashedPassRecord || userHashedPassRecord.length === 0) {
    return json({
      status: "error",
      message: "User not found",
    });
  }

  const userHashedPass = userHashedPassRecord[0].hashedPass;

  if (typeof userHashedPass !== "string") {
    return json({
      status: "error",
      message: "User not found",
    });
  }

  //compare hashed password from db to password from form
  const isCorrectPassword = await bcrypt.compare(password, userHashedPass);

  if (!isCorrectPassword) {
    return json({
      status: "error",
      message: "Incorrect password",
    });
  }

  const cookieHeader = await authCookie.serialize(userData.id);
  return new Response("", {
    status: 302,
    headers: {
      "Set-Cookie": cookieHeader,
      Location: "/",
    },
  });
}

export default function LoginForm() {
  const actionData = useActionData<typeof action>();
  const emailError = actionData?.errors?.email;
  const passwordError = actionData?.errors?.password;

  const errorMessage =
    actionData?.status === "error" ? actionData.message : null;

  return (
    <div className="story-page-container">
      <div className="story-page-top">
        <h1 className="page-heading">Login</h1>
      </div>
      <Form method="post" className="login-form">
        {errorMessage ? <div className="error">{errorMessage}</div> : null}

        {emailError && (
          <span role="alert" className="error">
            {emailError}
          </span>
        )}

        <h1 className="top-of-login">Login</h1>

        <input
          name="email"
          className="login-input"
          placeholder="you@email.com"
          type="email"
          id="email"
          aria-label="Email"
          autoComplete="email"
          required
        />

        {passwordError && (
          <span role="alert" className="error">
            {passwordError}
          </span>
        )}

        <input
          placeholder="password"
          aria-label="password"
          name="password"
          type="password"
          id="password"
          className="login-input"
          required
        />

        <div className="login-group">
          <button className="login-active-button" type="submit">
            Login
          </button>
          <a href="/signup" className="login-secondary-button">
            Create Account
          </a>
        </div>
      </Form>
    </div>
  );
}
