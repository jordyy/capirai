import { Pool } from "pg";

const pool = new Pool();

export async function getEnumValues() {
  const query = `
    SELECT enumlabel
    FROM pg_enum
    WHERE enumtypid = (
      SELECT oid 
      FROM pg_type 
      WHERE typname = 'understanding'
    );
  `;

  try {
    const res = await pool.query(query);
    return res.rows.map((row) => row.enumlabel);
  } catch (err) {
    console.error(err);
    return [];
  }
}

getEnumValues().then((values) => {
  console.log(values);
});

export default getEnumValues;
