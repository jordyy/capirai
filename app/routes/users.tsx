import { LoaderFunctionArgs, json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { users } from "db/schema";
import { db } from "db";

export async function loader({ request }: LoaderFunctionArgs) {
  const allUsers = await db.select().from(users);
  return json({ allUsers });
}

export default function Users() {
  const data = useLoaderData<typeof loader>();
  console.log(data);
  return <div>asdf</div>;
}
