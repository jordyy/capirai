import bcrypt from "bcrypt";
export { bcrypt };

// export const function ({ }) {

// }

// //get hashed password from db where password table userId = user table user.id
// const userHashedPassRecord = await db
// .select()
// .from(userPasswords)
// .where(sql`${userPasswords.userID} = ${userData.id}`);

// if (!userHashedPassRecord || userHashedPassRecord.length === 0) {
// return json({
//   status: "error",
//   message: "User not found",
// });
// }

// const userHashedPass = userHashedPassRecord[0].hashedPass as string;

// //compare hashed password from db to password from form
// const isPasswordCorrect = await bcrypt.compare(password, userHashedPass);

// if (!isPasswordCorrect) {
// return json({
//   status: "error",
//   message: "Incorrect password",
// });
// }
