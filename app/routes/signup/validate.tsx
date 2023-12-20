export async function validate(
  userName: string,
  email: string,
  password: string
) {
  const errors: { userName?: string; email?: string; password?: string } = {};
  if (!email) {
    errors.email = "Email is required";
  } else if (!email.includes("@")) {
    errors.email = "Please enter a valid email address";
  } else if (!password) {
    errors.password = "Password is required";
  } else if (password.length < 8) {
    errors.password = "Password must be at least 8 characters";
  } else if (!userName) {
    errors.userName = "You must create a username";
  }
  return Object.keys(errors).length ? errors : null;
}
