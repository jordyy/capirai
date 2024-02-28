import { json, redirect } from "@remix-run/node";
import type { ActionFunctionArgs } from "@remix-run/node";
import { Form, useActionData, useNavigation } from "@remix-run/react";
import { db } from "../../../db/index";
import React from "react";
import { z } from "zod";
import { users, userPasswords } from "../../../db/schema";
import { authCookie } from "../../auth";

type ErrorRecord = {
  email?: string;
  password?: string;
  userName?: string;
};

export async function action({ request }: ActionFunctionArgs) {
  // get all the formData and assign their values to variables
  const formData = await request.formData();
  const userName = formData.get("userName") as string;
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
  if (typeof userName !== "string" || !userName) {
    errors.userName = "You must create a username";
  }
  if (Object.keys(errors).length) {
    return json({
      status: "error",
      errorMessage: {
        email: errors?.email,
        password: errors?.password,
        userName: errors?.userName,
      },
    });
  }

  // parse userName formData to ensure type safety
  const parsedInput = userSchema.safeParse({ userName, email });
  if (!parsedInput.success) {
    return json({
      status: "error",
      message: "Invalid username or email",
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
    return redirect("/", {
      headers: {
        "Set-Cookie": await authCookie.serialize(newUser[0].id),
      },
    });
  }
}

export default function SignupForm() {
  const actionData = useActionData<{
    status: string;
    errorMessage?: {
      userName: string;
      email: string;
      password: string;
    };
    message?: string;
  }>();
  const navigation = useNavigation();
  const isSubmitting = navigation.formAction === "/users/createUserAccount";
  const userNameError = actionData?.errorMessage?.userName;
  const emailError = actionData?.errorMessage?.email;
  const passwordError = actionData?.errorMessage?.password;

  const errorMessage =
    actionData?.status === "error" ? actionData?.message : null;

  console.log({
    // errorMessage,
    userNameError,
    emailError,
    passwordError,
  });

  return (
    <>
      <div className="story-page-top">
        <h1 className="page-heading">Create An Account</h1>
      </div>
      <Form method="post" className="signup-form">
        {errorMessage ? <div className="error">{errorMessage}</div> : null}
        <div className="top-of-login">Create Account</div>
        <label>
          <input
            aria-label="username"
            placeholder="username"
            name="userName"
            type="text"
            id="userName"
            required
          />
          {userNameError && (
            <span role="alert" className="error">
              {userNameError}
            </span>
          )}
        </label>
        <label>
          <input
            name="email"
            type="email"
            id="email"
            aria-label="email"
            placeholder="email@domain.com"
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
          <input
            name="password"
            aria-label="password"
            placeholder="password"
            type="password"
            id="password"
            required
          />
          {passwordError && (
            <span role="alert" className="error">
              {passwordError}
            </span>
          )}
        </label>
        <div className="login-group">
          <button type="submit" className="signup-active-button">
            {isSubmitting ? "Creating new account..." : "Create Account"}
          </button>
          <a href="/login" className="login-secondary-button">
            Login
          </a>
        </div>
      </Form>
    </>
  );
}

const userSchema = z.object({
  userName: z.string(),
  email: z.string(),
});
