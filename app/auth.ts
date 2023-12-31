import { createCookie } from "@remix-run/node";
import { redirect } from "react-router";
import { z } from "zod";

let secret = process.env.COOKIE_SECRET || "default";
if (secret === "default") {
  console.warn("No COOKIE_SECRET set, the app is insecure.");
  secret = "default-secret";
}

export const authCookie = createCookie("auth", {
  httpOnly: true,
  path: "/",
  sameSite: "lax",
  secrets: [secret],
  secure: process.env.NODE_ENV === "production",
  maxAge: 60 * 60 * 24 * 30, //30 days
});

export async function getAuthCookie(request: Request) {
  const userId = await authCookie.parse(request.headers.get("Cookie"));
  return z.number().optional().parse(userId);
}

export async function requireAuthCookie(request: Request) {
  const userId = await getAuthCookie(request);

  if (!userId) {
    throw redirect("/login", {
      headers: {
        "Set-Cookie": await authCookie.serialize("", {
          maxAge: 0,
        }),
      },
    });
  }
  return userId;
}
