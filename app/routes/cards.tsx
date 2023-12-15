import { LoaderFunctionArgs, json } from "@remix-run/node";
import { useLoaderData, Outlet } from "@remix-run/react";
import { cards } from "db/schema";
import { drizzle } from "~/utils/db.server";

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
        <div key={card.value.id}>
          {card.value.front} | {card.value.back}
        </div>
      ))}
    </>
  );
}
