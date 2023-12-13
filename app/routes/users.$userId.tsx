import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import invariant from "tiny-invariant";
import { json } from "@remix-run/node";
import { Form, useFetcher, useLoaderData } from "@remix-run/react";
import type { FunctionComponent } from "react";
import DeleteUser from "./users.$userId.destroy";

import { getContact, updateContact, ContactRecord } from "../data";
import { db } from "db/index";
import { users } from "db/schema";
import { z } from "zod";

export const action = async ({ params, request }: ActionFunctionArgs) => {
  invariant(params.contactId, "Missing contactId param");
  const formData = await request.formData();
};

export const loader = async ({}: LoaderFunctionArgs) => {
  const user = await db.select().from(users);

  const parsedUsers = z.safeParse(users.get());

  if (!users) {
    throw new Response("Not Found", { status: 404 });
  }
  return json({
    userName: users.userName,
    email: users.email,
  });
};

export default function Contact() {
  const { usersTest } = useLoaderData<typeof loader>();

  return (
    <div id="user">
      {/* <div>
        {user ? (
          <img
            alt={contact ? `${contact.first} ${contact.last} avatar` : ``}
            key={contact.avatar}
            src={contact.avatar}
          />
        ) : (
          `this contact does not exist`
        )}
      </div> */}

      <div>
        <h1>
          {users?.first || users?.last ? (
            <>
              {users?.first} {users?.last}
            </>
          ) : (
            <i>No Name</i>
          )}{" "}
        </h1>

        {users.notes ? <p>{users.notes}</p> : null}

        <div>
          <Form action="edit">
            <button type="submit">Edit</button>
          </Form>

          <DeleteUser />
        </div>
      </div>
    </div>
  );
}

// const Favorite: FunctionComponent<{
//   contact: Pick<userRecord, "favorite">;
// }> = ({ contact }) => {
//   const fetcher = useFetcher();
//   const favorite = fetcher.formData
//     ? fetcher.formData.get("favorite") === "true"
//     : contact.favorite;

//   return (
//     <fetcher.Form method="post">
//       <button
//         aria-label={favorite ? "Remove from favorites" : "Add to favorites"}
//         name="favorite"
//         value={favorite ? "false" : "true"}
//       >
//         {favorite ? "★" : "☆"}
//       </button>
//     </fetcher.Form>
//   );
// };
