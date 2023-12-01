import React from "react";
import { db } from "./db";
import { users } from "./db/schema";

export default async function home() {
  const allUsers = await db.select().from(users);
  return <div>{JSON.stringify(users)}</div>;
}
