import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { eq } from "drizzle-orm";
import { Form, useLoaderData } from "@remix-run/react";
import { Link } from "@remix-run/react";
import React from "react";

import { db } from "../../db/index";
import { users } from "../../db/schema";
import { z } from "zod";

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const user = await db
    .select()
    .from(users)
    .where(eq(users.id, Number(params.userId)));

  const userName = user[0]?.userName;
  const email = user[0]?.email;

  if (!user) {
    throw new Response("Not Found", { status: 404 });
  }
  return json({ user, userName, email });
};

const userIdSchema = z.string();

export const action = async ({ params }: ActionFunctionArgs) => {
  const parsedParams = userIdSchema.safeParse(params.userId);

  if (!parsedParams.success) {
    return json({ error: parsedParams.error }, { status: 400 });
  }
  try {
    await db.delete(users).where(eq(users.id, Number(parsedParams.data)));
    return redirect(`/users`);
  } catch (error) {
    console.log({ user_delete_error: error });
    return json({ status: "error" });
  }
};

export default function Users({}) {
  const { user } = useLoaderData<typeof loader>();
  const userData = user[0];

  return (
    <>
      <div className="story-page-top">
        <h1 className="page-heading">Profile</h1>
      </div>
      <div className="account-settings">
        <div className="user-container">
          <div className="inner-user-container">
            <h3>Username</h3>
            <p>{userData.userName}</p>
          </div>
          <Link className="button" to={`/users/${userData.id}/editUser`}>
            Edit
          </Link>
        </div>

        <div className="email-container">
          <div className="inner-email-container">
            <h3>Email</h3>
            <p>{userData.email}</p>
          </div>
          <Link className="button" to={`/users/${userData.id}/editEmail`}>
            Edit
          </Link>
        </div>
        <div className="profile-button-container">
          <Form method="post" action="/logout">
            <button className="logout-button">Logout</button>
          </Form>
          <Form
            method="post"
            onSubmit={(event) => {
              const response = confirm(
                "Please confirm you want to delete your account."
              );
              if (!response) {
                event.preventDefault();
              }
            }}
          >
            <button
              className="delete-button delete-account-button"
              type="submit"
            >
              Delete My Account
            </button>
          </Form>
        </div>
      </div>
    </>
  );
}
