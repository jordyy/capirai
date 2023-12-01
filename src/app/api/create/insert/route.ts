import { db } from "../../../../db";
import { users } from "../../../../db/schema";

export async function POST() {
  const newUsers = await db
    .insert(users)
    .values({
      userName: "TestUserName",
    })
    .returning();

  return new Response(JSON.stringify(newUsers));
}
