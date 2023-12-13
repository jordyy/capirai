import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { eq } from "drizzle-orm";
import { users } from "db/schema";
import { useLoaderData, Form } from "@remix-run/react";
import { db } from "db/index";
import { z } from "zod";

export async function loader({ request }: LoaderFunctionArgs) {}

export default function DeleteUser() {
  // const { users } = useLoaderData<typeof loader>();

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

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();

  const parsedId = z.coerce.number().safeParse(formData.get("id"));
  if (!parsedId.success) {
    return json({ status: "error" });
  }

  try {
    const userRecord = await db
      .delete(users)
      .where(eq(users.id, parsedId.data));
    return json({ status: "success" });
  } catch (error) {
    return json({ status: "error" });
  }
  return redirect("/");
};
