"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export type AuthState = { error?: string; ok?: string } | undefined;

/** Povolí len internú cestu (napr. /redeem/<code>) — bráni open-redirectu. */
function safeNext(raw: unknown): string {
  const s = String(raw ?? "");
  return /^\/[a-z0-9/_-]*$/i.test(s) ? s : "";
}

export async function signIn(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = safeNext(formData.get("next"));

  if (!email || !password) return { error: "Fill in both email and password." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  // Deliberately not revealing whether the email or the password was wrong —
  // otherwise anyone could probe who is registered. For our audience that matters.
  if (error) return { error: "Incorrect email or password." };

  revalidatePath("/", "layout");
  redirect(next || "/dashboard");
}

export async function signUp(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = safeNext(formData.get("next"));

  if (!email || !password) return { error: "Fill in both email and password." };
  if (password.length < 10)
    return { error: "Password must be at least 10 characters." };

  // Po potvrdeni emailu ide callback na `next` (ak je) — inak default.
  const callback = next
    ? `${SITE}/auth/callback?next=${encodeURIComponent(next)}`
    : `${SITE}/auth/callback`;

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: callback },
  });

  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  // S promo linkom (next) preskocime rovno tam (redeem), onboarding pockat moze.
  redirect(next || "/onboarding");
}

export async function signInWithGoogle(formData: FormData) {
  const safe = safeNext(formData.get("next"));
  const redirectTo = safe
    ? `${SITE}/auth/callback?next=${encodeURIComponent(safe)}`
    : `${SITE}/auth/callback`;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo },
  });

  if (error || !data.url) redirect("/login?error=google");
  redirect(data.url);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}

/**
 * Odpoved je vzdy rovnaka, aj ked email neexistuje — inak by sa cez tento
 * formular dalo zistovat, kto je registrovany.
 */
export async function requestPasswordReset(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return { error: "Enter your email." };

  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${SITE}/auth/callback?next=/reset`,
  });

  return {
    ok: "If that email has an account, a reset link is on its way.",
  };
}

export async function changePassword(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  const next = String(formData.get("next") ?? "");

  if (password.length < 10)
    return { error: "Password must be at least 10 characters." };
  if (password !== confirm) return { error: "The passwords don't match." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  redirect(next || "/dashboard");
}
