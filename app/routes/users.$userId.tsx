import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { eq } from "drizzle-orm";
import { Form, useFetcher, useLoaderData } from "@remix-run/react";

import { db } from "db/index";
import { users } from "db/schema";
import { z } from "zod";

export const loader = async ({ params }: ActionFunctionArgs) => {
  console.log({ user_edit_params: params });
  return params;
  // const user = await db
  //   .select()
  //   .from(users)
  //   .where(eq(users.id, (params.userId)));

  //   const userName = user[0]?.userName;
  //   const email = user[0]?.email;

  //   if (!user) {
  //     throw new Response("Not Found", { status: 404 });
  //   }
  //   return json({ user, userName, email });
  // };

  // const userSchema = z.object({
  //   userName: z.string(),
  //   email: z.string(),
  // });
};

export default function Users() {
  const { thisUser } = useLoaderData<typeof loader>();
  {
    console.log({ user_edit_thisUser: thisUser });
  }

  // return (
  //   <div id="user">
  //     <div>
  //       {user ? (
  //         <img
  //           alt={contact ? `${contact.first} ${contact.last} avatar` : ``}
  //           key={contact.avatar}
  //           src={contact.avatar}
  //         />
  //       ) : (
  //         `this contact does not exist`
  //       )}
  //     </div>

  //          <Form action="edit">
  //           <button type="submit">Edit</button>
  //         </Form>

  //         <DeleteUser />
  //       </div>
  //     </div>
  //   </div>
  // )
}
