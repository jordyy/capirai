import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { eq } from "drizzle-orm";
import { users } from "db/schema";
import { useLoaderData, Form } from "@remix-run/react";
import { db } from "db/index";
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

export const action = async ({ params }: ActionFunctionArgs) => {
  const parsedInput = userSchema.safeParse({
    email: params.email,
    id: params.id,
    userName: params.userName,
  });

  if (!parsedInput.success) {
    return json({ error: parsedInput.error }, { status: 400 });
  }
  try {
    await db.delete(users).where(eq(users.id, Number(params.userId)));
    return redirect(`/users`);
  } catch (error) {
    console.log({ user_delete_error: error });
    return json({ status: "error" });
  }
};

export default function DeleteUser() {
  const { user } = useLoaderData<typeof loader>();

  return (
    <div>
      <Form
        action="destroy"
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
