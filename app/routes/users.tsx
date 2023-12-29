import { LoaderFunctionArgs, json } from "@remix-run/node";
import { useLoaderData, Outlet } from "@remix-run/react";
import React from "react";
import { users } from "../../db/schema";
import { drizzle } from "../utils/db.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const allUsers = await drizzle.select().from(users);
  return json([allUsers]);
}

export default function Users() {
  const users = useLoaderData<typeof loader>();
  const usersArray = Object.entries(users[0]).map(([key, value]) => {
    return { key, value };
  });

  return (
    <>
      <h1>this is in the users route</h1>
      <Outlet />
      {usersArray.map((user) => (
        <div key={user.value.id}>
          {user.value.userName} | {user.value.email}
        </div>
      ))}
    </>
  );
}
