import { json } from "@remix-run/node";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, useActionData } from "@remix-run/react";
import React from "react";
import { GenerateStory } from "../../openai-story-generator.mjs";
import { stories } from "../../db/schema";
import { drizzle } from "../utils/db.server";
import { eq, and } from "drizzle-orm";

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const storyLength = formData.get("storyLength");
  const genre = formData.get("genre");
  const cefrLevel = formData.get("cefrLevel");

  if (!storyLength || !genre || !cefrLevel) {
    return json(
      { error: "Invalid form data, each criterion must be selected" },
      { status: 400 }
    );
  }

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
    const searchStories = await drizzle
      .select()
      .from(stories)
      .where(
        and(
          eq(stories.length, storyLength.toString()),
          eq(
            stories.genre,
            genre as
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
              | "Science Fiction"
          ),
          eq(
            stories.CEFR_level,
            cefrLevel as "A1" | "A2" | "B1" | "B2" | "C1" | "C2"
          )
        )
      );

    let response;

    if (searchStories.length === 0) {
      const storyResponseString = await GenerateStory({
        storyLength: storyLength,
        genre: genre,
        cefrLevel: cefrLevel,
      });

      if (storyResponseString) {
        const storyResponse = JSON.parse(storyResponseString) as StoryResponse;

        const [story] = await drizzle
          .insert(stories)
          .values({
            story: storyResponse.story,
            length: storyResponse.storyLength,
            genre: storyResponse.genre,
            CEFR_level: storyResponse.cefrLevel,
          })
          .returning();
        response = { data: storyResponse, error: null };
      }
    } else {
      response = { data: searchStories, error: null };
    }
    return json(response);
  } catch (error) {
    console.error("Error generating story:", error);
    return json({ data: null, error: "Failed to generate story" } as const, {
      status: 500,
    });
  }
};

export default function Story() {
  const { data, error } = useActionData<typeof action>() || {};

  const mappedStories =
    data.length > 1 ? data?.map((story) => story.story) : null;

  return (
    <>
      {!error ? (
        <>
          {data && data.length > 1 ? (
            mappedStories.map((story) => (
              <div key={story} className="story-box">
                {story}
              </div>
            ))
          ) : (
            <div className="story-box">{data?.story}</div>
          )}
        </>
      ) : (
        <div>Failed to generate story</div>
      )}
    </>
  );
}
