import { Outlet, Form } from "@remix-run/react";
import React from "react";

export default function StoryGenerator() {
  return (
    <>
      <h1 className="nav-container">Story Time!</h1>
      <Outlet />
      <Form method="post" className="create-form" action={"/storyGen/story"}>
        <div className="create-form-section">
          <label htmlFor="storyLength" className="create-story-label">
            Story Length
          </label>
          <select name="storyLength" className="create-form">
            <option value="">Story Length</option>
            <option value="short">Short Read</option>
            <option value="medium">Medium Read</option>
            <option value="long">Long Read</option>
          </select>
        </div>

        <div className="create-form-section">
          <label htmlFor="genre" className="create-story-label">
            Genre
          </label>
          <select name="genre" className="create-form">
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
            <option value="Realistic Fiction">Realistic Fiction</option>
            <option value="Tall Tale">Tall Tale</option>
            <option value="Biographical">Biographical</option>
            <option value="Coming-of-age">Coming-of-age</option>
            <option value="Science Fiction">Science Fiction</option>
          </select>
        </div>

        <div className="create-form-section">
          <label htmlFor="cefrLevel" className="create-story-label">
            Level
          </label>
          <select name="cefrLevel" className="create-form">
            <option value="">CEFR Level</option>
            <option value="A1">A1</option>
            <option value="A2">A2</option>
            <option value="B1">B1</option>
            <option value="B2">B2</option>
            <option value="C1">C1</option>
            <option value="C2">C2</option>
          </select>
        </div>

        <button className="button generate-button" type="submit">
          Generate Story
        </button>
      </Form>
    </>
  );
}
