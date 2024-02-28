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
import { db } from "../db/index";
import { z } from "zod";
import { users } from "../db/schema";
import React from "react";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import ImportRoundedIcon from "@mui/icons-material/ImportContactsRounded";
import PermIdentityRoundedIcon from "@mui/icons-material/PermIdentityRounded";
import LibraryBooksRoundedIcon from "@mui/icons-material/LibraryBooksRounded";

import appStylesHref from "../app/app.css";
import { authCookie } from "./auth";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const cookieString = request.headers.get("Cookie");
  const userID = await authCookie.parse(cookieString);
  return { userID };
};

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: appStylesHref },
];

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

export default function App() {
  const { userID } = useLoaderData<typeof loader>();

  return (
    <html lang="en" className="container">
      <head>
        <title>capirai</title>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {userID ? (
          <div className="nav-container">
            <Link className="nav-button" to={`/home`}>
              <HomeRoundedIcon fontSize="large" />
            </Link>
            <Link className="nav-button" to={`/decks`}>
              <LibraryBooksRoundedIcon fontSize="large" />
            </Link>
            <Link className="nav-button" to={`/storyGen`}>
              <ImportRoundedIcon fontSize="large" />
            </Link>
            <div className="profile-logout-button-group">
              <Link className="nav-button" to={`/users/${userID}`}>
                <PermIdentityRoundedIcon fontSize="large" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="nav-container">
            <Link to="/signup"></Link>
          </div>
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

const userSchema = z.object({
  userName: z.string(),
  email: z.string(),
});
