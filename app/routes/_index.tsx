import { LoaderFunctionArgs, redirect } from "@remix-run/node";
import { authCookie } from "../auth";

export async function loader({ request }: LoaderFunctionArgs) {
  let cookieString = request.headers.get("Cookie");
  let userId = await authCookie.parse(cookieString);
  if (userId) {
    throw redirect("/home");
  }
  return redirect("/decks");
}
