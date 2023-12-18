import { LoaderFunctionArgs, json } from "@remix-run/node";
import { useLoaderData, Outlet, Form } from "@remix-run/react";
import { cards } from "db/schema";
import { drizzle } from "~/utils/db.server";
import { Link } from "@remix-run/react";

export async function loader({ request }: LoaderFunctionArgs) {
  const allCards = await drizzle.select().from(cards);
  return json([allCards]);
}

export default function Cards() {
  const cards = useLoaderData<typeof loader>();
  const cardsArray = Object.entries(cards[0]).map(([key, value]) => {
    return { key, value };
  });

  return (
    <>
      <h1>Cards</h1>
      <Outlet />
      {cardsArray.map((card) => (
        <div className="card-container" key={card.value.id}>
          {card.value.front} ||| {card.value.back}
          <div className="button-container">
            <Link
              className="button"
              to={`/cards/${card.value.id}/edit`}
              reloadDocument
            >
              Edit
            </Link>
            <Form
              method="post"
              onSubmit={(event) => {
                const response = confirm(
                  "Please confirm you want to delete this record."
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
