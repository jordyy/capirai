import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { eq } from "drizzle-orm";
import { Form, useLoaderData } from "@remix-run/react";
import EditUser from "./users.$userId_.edit";
import DeleteUser from "./users.$userId.destroy";
import { Link } from "@remix-run/react";

import { db } from "db/index";
import { users } from "db/schema";
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
    <div id="Contact">
      <h1>Hi, {userData.userName}</h1>
      <h1>Email: {userData.email}</h1>
      <Link to={`/users/${userData.id}/edit`}>Edit</Link>
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
  );
}
