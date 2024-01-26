import { json, redirect } from "@remix-run/node";
import type {
  ActionFunction,
  ActionFunctionArgs,
  LinksFunction,
  LoaderFunctionArgs,
} from "@remix-run/node";
import {
  Form,
  NavLink,
  Link,
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from "@remix-run/react";
import React from "react";
import { db } from "../db/index";
import { z } from "zod";
import { users } from "../db/schema";

import appStylesHref from "./app.css";
import { authCookie } from "./auth";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const cookieString = request.headers.get("Cookie");
  const userID = await authCookie.parse(cookieString);
  return { userID };
};

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: appStylesHref },
];

export default function App() {
  const { userID } = useLoaderData<typeof loader>();

  return (
    <html lang="en" className="container">
      <head>
        <title>Learn Italian</title>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {userID ? (
          <div className="nav-container">
            <Link to={`/home`}>
              <button type="submit">My Decks</button>
            </Link>
            <Link className="button" to={`/decks`}>
              Library
            </Link>
            <div className="nav-container">
              <div className="profile-logout-button-group">
                <Link className="profile-button" to={`/users/${userID}`}>
                  Profile
                </Link>
                <Form method="post" action="/logout">
                  <button>Logout</button>
                </Form>
              </div>
            </div>
          </div>
        ) : (
          <Link to="/signup"></Link>
        )}
        <div className="outlet-container">
          <Outlet />
        </div>

        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();

  const parsedInput = userSchema.safeParse(formData);

  if (parsedInput.success) {
    const user = await db.insert(users).values({
      userName: parsedInput.data.userName,
      email: parsedInput.data.email,
    });
    return redirect(`/users/${users.id}/edit`);
  } else {
    return json({ status: "error" });
  }
};

const userSchema = z.object({
  userName: z.string(),
  email: z.string(),
});
