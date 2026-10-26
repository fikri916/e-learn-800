"use client";
import { signIn, signOut } from "next-auth/react";

export async function loginWithCredentials(email: string, password: string) {
  const res = await signIn("credentials", {
    email,
    password,
    redirect: false,
  });
  return res;
}

export async function logout() {
  await signOut({ redirect: false });
}
