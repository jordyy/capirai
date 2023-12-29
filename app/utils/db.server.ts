import { db } from "../../db";

export const drizzle = singleton("db", () => db);

// Ensures that for a given name, the `value` function is only ever called once, and that values is then stored and returned on any subsequent calls.
export function singleton<Value>(name: string, value: () => Value): Value {
  // yolo references the global object
  const yolo = global as any;
  // if yolo.__singletons is undefined, set it to an empty object
  yolo.__singletons ??= {};
  // if the singleton with the given name is undefined, call the value function and set it to the result
  yolo.__singletons[name] ??= value();
  // return the singleton with the given name
  return yolo.__singletons[name];
}
