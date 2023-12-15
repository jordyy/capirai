import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import {
  Form,
  useLoaderData,
  useNavigate,
  useNavigation,
} from "@remix-run/react";
import { eq } from "drizzle-orm";
import { users } from "db/schema";
import { z } from "zod";
import { db } from "db/index";

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const user = await db
    .select()
    .from(users)
    .where(eq(users.id, Number(params.userId)));

  const userName = user[0]?.userName;
  const email = user[0]?.email;

  console.log({
    userName: userName,
    email: email,
    user: user,
    userId: params.userId,
  });

  if (!user) {
    throw new Response("Not Found", { status: 404 });
  }
  return json({ user, userName, email });
};

const userSchema = z.object({
  userName: z.string(),
  email: z.string(),
});

export const action = async ({ params, request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const userName = formData.get("userName");
  const email = formData.get("email");
  const parsedInput = userSchema.safeParse({
    userName: userName,
    email: email,
  });
  const parsedId = z.number().safeParse(params.id);

  if (!parsedId.success) {
    return json({ status: "error" });
  }
  try {
    await db
      .update(users)
      .set({
        userName: parsedInput.data.userName,
        email: parsedInput.data.email,
      })
      .where(eq(users.id, Number(params.userId)));
    return redirect("/");
  } catch (error) {
    console.log(error);
    return json({ status: "error" });
  }
};

export default function EditUser() {
  const { userName, email } = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const navigate = useNavigate();
  const isSaving = navigation.formAction === `/users/${users.id}/edit`;

  return (
    <Form id="contact-form" method="post">
      <p>
        <span>username</span>
        <input
          defaultValue={`${userName}`}
          aria-label="userName"
          name="userName"
          type="text"
          placeholder="username"
        />
        <input
          aria-label="email"
          defaultValue={`${email}`}
          name="email"
          placeholder="email"
          type="text"
        />
      </p>
      <p>
        <button type="submit">
          {isSaving ? "Saving changes..." : "Save changes"}
        </button>
        <button onClick={() => navigate(-1)} type="button">
          Cancel
        </button>
      </p>
    </Form>
  );
}
