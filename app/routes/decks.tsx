import { LoaderFunctionArgs, json } from "@remix-run/node";
import { useLoaderData, Outlet, Form } from "@remix-run/react";
import { decks } from "db/schema";
import { drizzle } from "~/utils/db.server";
import { Link } from "@remix-run/react";

export async function loader({ request }: LoaderFunctionArgs) {
  const allDecks = await drizzle.select().from(decks);
  return json([allDecks]);
}

export default function Decks() {
  const decks = useLoaderData<typeof loader>();
  const decksArray = Object.entries(decks[0]).map(([key, value]) => {
    return { key, value };
  });

  return (
    <>
      <h1>All Decks</h1>
      <Outlet />
      {decksArray.map((deck) => (
        <div className="card-container" key={deck.value.id}>
          {deck.value.name}
          <div className="button-container">
            <Link
              className="button"
              to={`/decks/${deck.value.id}/edit`}
              reloadDocument
            >
              Edit
            </Link>
            <Form
              method="post"
              onSubmit={(event) => {
                const response = confirm(
                  "Please confirm you want to delete this deck."
                );
                if (!response) {
                  event.preventDefault();
                }
              }}
            >
              <button type="submit">Delete</button>
            </Form>
          </div>
        </div>
      ))}
    </>
  );
}
