import { createCookie } from "@remix-run/node";
import { randomBytes } from "crypto";

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
