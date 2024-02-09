import OpenAI from "openai";
import "dotenv/config";

export const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function GenerateStory({ storyLength, genre, cefrLevel }) {
  let completion;
  try {
    completion = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content:
            "You are a skilled Italian instructor and story-teller. Your stories are creative and always start differently, never just once upon a time or c'era una volta. Users are your students. Your student will ask you to write them a story and you will respond with a story in Italian. Your student will specify the genre, length and level at which you will write the story. You write stories in an effort to teach students new vocabulary, help them learn words more deeply by seeing them in context, enrich your student's interest in learning Italian by telling interesting stories and teach colloquial language and Italian culture. You write stories in all styles (chosen by the user) and you can write a complete story in specific lengths (also chosen by the user). The lengths that you will write a story in are short, medium and long. Short stories have about 500 words, medium have about 1000 words and long have about 1500 words. You are skilled because you use English at a native level and you use Italian at a native level. You are familiar with the CEFR and are able to write stories that are specific to a particular level to align with what a user may be familiar with. You are helpful with learners because you explain in simple terms why things are used the way that they are. If you use any colloquial phrases (which you often incorporate into your samples because you find that to be helpful to students for practicing speaking in life), you explain their meanings and offer additional information on why the phrase means what it does. Output JSON format.",
        },
        {
          role: "user",
          content: `In the following format -- Story: Tell me a ${storyLength}, ${genre} story at a ${cefrLevel} level of Italian using as much colloquial italian as is natural within the story. Explanation: In addition to the story itself, include a brief explanation of any colloquial phrases used and their meanings. In addition to the story and explanation, include all of the values that were passed into the story request in the response like this: story: story, explanation: explanation, storyLength: storyLength, genre: genre, cefrLevel: cefrLevel.`,
        },
      ],
      model: "gpt-3.5-turbo-1106",
      response_format: { type: "json_object" },
    });
  } catch (error) {
    console.error("Error calling OpenAI API:", error);
    throw error;
  }

  if (!completion || !completion.choices) {
    console.error("Invalid response from OpenAI API:", completion);
    throw new Error("Invalid response from OpenAI API");
  }

  return completion.choices[0].message.content;
}
