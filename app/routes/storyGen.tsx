import { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { Outlet, useLoaderData, Form } from "@remix-run/react";
import React from "react";
import { eq } from "drizzle-orm";
import { drizzle } from "../utils/db.server";
import { stories } from "../../db/schema";
import { json } from "@remix-run/node";

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const existingStories = await drizzle.select().from(stories);
    return json(existingStories);
  } catch (error) {
    console.log({ story_loader_error: error });
    return json({ status: "error" });
  }
}

export default function StoryGenerator() {
  const existingStories = useLoaderData<typeof loader>();

  console.log({ existingStories });

  return (
    <>
      <h1>Story Time!</h1>
      <Outlet />
      <Form method="post" className="create-form" action={"/storyGen/story"}>
        <label htmlFor="storyLength">Story Length</label>
        <select name="storyLength">
          <option value="">Story Length</option>
          <option value="short">Short Read</option>
          <option value="medium">Medium Read</option>
          <option value="long">Long Read</option>
        </select>

        <label htmlFor="genre">Genre</label>
        <select name="genre">
          <option value="">Genre</option>
          <option value="Mystery">Mystery</option>
          <option value="Historical Fiction">Historical Fiction</option>
          <option value="Romance">Romance</option>
          <option value="Humor">Humor</option>
          <option value="True Crime">True Crime</option>
          <option value="Adventure">Adventure</option>
          <option value="Fantasy">Fantasy</option>
          <option value="Folklore">Folklore</option>
          <option value="Fable">Fable</option>
          <option value="Fairy Tale">Fairy Tale</option>
          <option value="Drama">Drama</option>
          <option value="Western">Western</option>
          <option value="Dystopian Fiction">Dystopian Fiction</option>
          <option value="Legend">Legend</option>
          <option value="Realistic Fiction">Realistic Fition</option>
          <option value="Tall Tale">Tall Tale</option>
          <option value="Biographical">Biographical</option>
          <option value="Coming-of-age">Coming-of-age</option>
          <option value="Science Fiction">Science Fiction</option>
        </select>

        <label htmlFor="cefrLevel">Level</label>
        <select name="cefrLevel">
          <option value="">CEFR Level</option>
          <option value="A1">A1</option>
          <option value="A2">A2</option>
          <option value="B1">B1</option>
          <option value="B2">B2</option>
          <option value="C1">C1</option>
          <option value="C2">C2</option>
        </select>

        <button type="submit">Generate Story</button>
      </Form>
    </>
  );
}
