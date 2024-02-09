import { json } from "@remix-run/node";
import type { ActionFunctionArgs } from "@remix-run/node";
import { useActionData } from "@remix-run/react";
import React from "react";
import { GenerateStory } from "../../openai-story-generator.mjs";
import { stories } from "../../db/schema";
import { drizzle } from "../utils/db.server";

// export async function loader({ request }: LoaderFunctionArgs) {}

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const storyLength = formData.get("storyLength");
  const genre = formData.get("genre");
  const cefrLevel = formData.get("cefrLevel");

  interface StoryResponse {
    story: string;
    storyLength: string;
    genre:
      | "Mystery"
      | "Historical Fiction"
      | "Romance"
      | "Humor"
      | "True Crime"
      | "Adventure"
      | "Fantasy"
      | "Folklore"
      | "Fable"
      | "Fairy Tale"
      | "Drama"
      | "Western"
      | "Dystopian Fiction"
      | "Legend"
      | "Realistic Fiction"
      | "Tall Tale"
      | "Biographical"
      | "Coming-of-age"
      | "Science Fiction";
    cefrLevel: "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
  }

  try {
    const storyResponseString = await GenerateStory({
      storyLength,
      genre,
      cefrLevel,
    });

    const storyResponse = JSON.parse(
      storyResponseString ? storyResponseString : "null"
    ) as StoryResponse;

    const [story] = await drizzle
      .insert(stories)
      .values({
        story: storyResponse.story,
        length: storyResponse.storyLength,
        genre: storyResponse.genre,
        CEFR_level: storyResponse.cefrLevel,
      })
      .returning();

    return json({ story: story, error: null } as const);
  } catch (error) {
    console.error("Error generating story:", error);
    return json({ story: null, error: "Failed to generate story" } as const, {
      status: 500,
    });
  }
};

export default function Story() {
  const storyResponse = useActionData<typeof action>();
  console.log({ storyResponse });
  return (
    <>
      {storyResponse?.story && (
        <p className="story-box">{storyResponse?.story.story}</p>
      )}

      {storyResponse?.error && <p>Failed to generate story</p>}
    </>
  );
}
