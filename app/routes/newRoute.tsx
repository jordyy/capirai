// import { json } from "@remix-run/node";
// import { useLoaderData } from "@remix-run/react";
// import { pool } from "../../db.server";

// export const loader = async () => {
//   const client = await pool.connect();

//   try {
//     const response = await client.query("SELECT version()");
//     console.log(response.rows[0]);
//     return json({ data: response.rows[0] });
//   } finally {
//     client.release();
//   }
// };

// export default function Page() {
//   const data = useLoaderData();
// }
