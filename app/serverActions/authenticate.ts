"use server";
import { signIn } from "../../auth";
import { AuthError, type CredentialsSignin } from "next-auth";
import { redirect } from "next/navigation";
import { PENDING_APPROVAL_CODE, RATE_LIMITED_CODE } from "app/lib/authErrors";

export async function authenticate(
  prevState: string | undefined,
  formData: FormData
) {
  try {
    const payload = Object.fromEntries(formData);
    console.log("DEBUG authenticate payload", payload);
    await signIn("credentials", {
      ...payload,
      redirect: false,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin": {
          const code = (error as CredentialsSignin).code;
          // Right password, account not approved yet. Distinct on purpose:
          // "invalid credentials" here sends people off to register again.
          if (code === PENDING_APPROVAL_CODE) {
            return "Your account is waiting for a teacher to approve it. Try again once they have.";
          }
          if (code === RATE_LIMITED_CODE) {
            return "Too many attempts. Wait a few minutes and try again.";
          }
          return "Invalid credentials.";
        }
        default:
          return "Something went wrong.";
      }
    }
    throw error;
  }
  redirect("/LMS/dashboard");
}
