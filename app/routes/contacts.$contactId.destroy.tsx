import { ActionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import invariant from "node_modules/tiny-invariant/dist/tiny-invariant";

import { deleteContact } from "~/data";

export const action = async ({ params }: ActionArgs) => {
    invariant(params.contactId, "Missing contactId param");
    await deleteContact(params.contactId);
    return redirect("/");
};