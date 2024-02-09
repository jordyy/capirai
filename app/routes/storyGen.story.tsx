import { json } from "@remix-run/node";
import type { ActionFunctionArgs } from "@remix-run/node";
import { useActionData } from "@remix-run/react";
import React from "react";
import { GenerateStory } from "../../openai-story-generator.mjs";

// export async function loader({ request }: LoaderFunctionArgs) {}

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const storyLength = formData.get("storyLength");
  const genre = formData.get("genre");
  const cefrLevel = formData.get("cefrLevel");

  try {
    const storyResponse = await GenerateStory({
      storyLength,
      genre,
      cefrLevel,
    });

    return json(storyResponse);
  } catch (error) {
    console.error("Error generating story:", error);
    return json({ error: "Failed to generate story" }, { status: 500 });
  }
};

export default function Story() {
  const storyResponse = useActionData<typeof action>();
  console.log({ storyResponse });
  return (
    <>
      <h1>Story Time!</h1>
      {typeof storyResponse === "string" ? (
        <p>{storyResponse}</p>
      ) : (
        storyResponse?.error && <p>{storyResponse.error}</p>
      )}
    </>
  );
}
