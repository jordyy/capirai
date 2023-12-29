import { LoaderFunctionArgs, redirect } from "@remix-run/node";
import { authCookie } from "~/auth";

export async function loader({ request }: LoaderFunctionArgs) {
  let cookieString = request.headers.get("Cookie");
  let userId = await authCookie.parse(cookieString);
  if (userId) {
    throw redirect("/home");
  }
  return null;
}

export default function Index() {
  return (
    <p id="index-page">
      This is a demo for Remix.
      <br />
      Check out <a href="https://remix.run">the docs at remix.run</a>.
    </p>
  );
}

// it is common to put dashboards, stats, feeds, etc. at the index route
