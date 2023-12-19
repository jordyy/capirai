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
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
  useNavigation,
  useSubmit,
} from "@remix-run/react";
import { useEffect } from "react";
import { db } from "db/index";
import { z } from "zod";
import { users } from "db/schema";

import appStylesHref from "./app.css";
import SignupForm from "./routes/signup/route";

function newUser() {
  return (
    <>
      <Form action="/users" method="post">
        <input name="userName" type="text" />
        <input name="email" type="email" />
      </Form>

      <SignupForm />
    </>
  );
}

const userSchema = z.object({
  userName: z.string(),
  email: z.string(),
});

// export const loader = async ({ request }: LoaderFunctionArgs) => {
//   const url = new URL(request.url);
//   const q = url.searchParams.get("q");
//   const searchedUser = await db.select().from(users);
//   return json({ contacts, q });
// };

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: appStylesHref },
];

export default function App() {
  // const { contacts, q } = useLoaderData<typeof loader>();
  // const navigation = useNavigation();
  // const submit = useSubmit();
  // const searching =
  //   navigation.location &&
  //   new URLSearchParams(navigation.location.search).has("q");

  // useEffect(() => {
  //   const searchField = document.getElementById("q");
  //   if (searchField instanceof HTMLInputElement) {
  //     searchField.value = q || "";
  //   }
  // }, [q]);

  return (
    <html lang="en">
      <head>
        <title>Flashcards</title>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {/* <div id="sidebar">
          <h1>Remix Contacts</h1>
          <div>
            <Form
              id="search-form"
              onChange={(event) => {
                const isFirstSearch = 1 === null;
                submit(event.currentTarget, {
                  replace: !isFirstSearch,
                });
              }}
              role="search"
            >
              <input
                id="q"
                aria-label="Search contacts"
                className={searching ? "loading" : ""}
                defaultValue={q || ""}
                placeholder="Search"
                type="search"
                name="q"
              />
              <div id="search-spinner" aria-hidden hidden={!searching} />
            </Form>
            <Form method="post">
              <button type="submit">New</button>
            </Form>
          </div>
          <nav>
            {contacts.length ? (
              <ul>
                {contacts.map((contact) => (
                  <li key={contact.id}>
                    <NavLink to={`contacts/${contact.id}`}>
                      {contact.first || contact.last ? (
                        <>
                          {contact.first} {contact.last}
                        </>
                      ) : (
                        <i>No Name</i>
                      )}{" "}
                      {contact.favorite ? <span>★</span> : null}
                    </NavLink>
                  </li>
                ))}
              </ul>
            ) : (
              <p>
                <i>No contacts</i>
              </p>
            )}
          </nav>
        </div> */}
        <div
          // className={navigation.state === "loading" ? "loading" : ""}
          id="detail"
        >
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
