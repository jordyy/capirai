import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
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

const userSchema = z.object({
  email: z.string(),
  id: z.number(),
  userName: z.string(),
});

export default function Users({}) {
  const { user } = useLoaderData<typeof loader>();
  const userData = user[0];

  console.log({ userData });

  return (
    <div id="Contact">
      <h1>Hi, {userData.userName}</h1>
      <h1>Email: {userData.email}</h1>
      <Link to={`/users/${userData.id}/edit`}>Edit</Link>

      {/* <Link to=`/users/${userData.id}.destroy`> DeleteUser /> */}
    </div>
  );
}
