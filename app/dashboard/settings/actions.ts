"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { planOf } from "@/lib/plans";

export type SettingsState = { error?: string; ok?: string } | undefined;

const HOST_RE = /^(?!-)[a-z0-9-]{1,63}(\.[a-z0-9-]{1,63})+$/;

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}

async function ownsProfile(profileId: string) {
  const { supabase, user } = await requireUser();
  const { data } = await supabase
    .from("profiles")
    .select("id, owner_id, username")
    .eq("id", profileId)
    .maybeSingle();
  if (!data || data.owner_id !== user.id) redirect("/dashboard");
  return { supabase, user, profile: data };
}

// ---------------------------------------------------------------- domains

export async function addDomain(
  profileId: string,
  _prev: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  const { supabase, user } = await ownsProfile(profileId);

  const host = String(formData.get("host") ?? "")
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "");

  if (!HOST_RE.test(host)) {
    return { error: "That doesn't look like a domain (e.g. links.yoursite.com)." };
  }

  const { data: account } = await supabase
    .from("accounts")
    .select("plan")
    .eq("id", user.id)
    .maybeSingle();

  if (!planOf(account?.plan).customDomains) {
    return { error: "Custom domains need the Business plan." };
  }

  // Zaregistrujeme domenu vo Verceli, aby sa nan dal nasmerovat provoz
  const token = process.env.VERCEL_TOKEN;
  const projectId = process.env.VERCEL_PROJECT_ID;

  let verification: unknown = null;
  if (token && projectId) {
    const teamQs = process.env.VERCEL_TEAM_ID
      ? `?teamId=${process.env.VERCEL_TEAM_ID}`
      : "";
    const res = await fetch(
      `https://api.vercel.com/v10/projects/${projectId}/domains${teamQs}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: host }),
      },
    );
    const json = await res.json();
    if (!res.ok && json?.error?.code !== "domain_already_exists") {
      return { error: json?.error?.message ?? "Couldn't register the domain." };
    }
    verification = json?.verification ?? null;
  }

  const { error } = await supabase.from("domains").insert({
    profile_id: profileId,
    host,
    status: "pending",
    verification,
  });

  if (error) {
    if (error.code === "23505") return { error: "That domain is already in use." };
    return { error: "Couldn't save the domain." };
  }

  revalidatePath("/dashboard/settings");
  return { ok: "Domain added — now point your DNS at us." };
}

export async function checkDomain(domainId: string) {
  const { supabase, user } = await requireUser();

  const { data: domain } = await supabase
    .from("domains")
    .select("id, host, profile_id")
    .eq("id", domainId)
    .maybeSingle();
  if (!domain) redirect("/dashboard/settings");

  // RLS uz overila vlastnictvo, toto je len pre istotu pri zmene politiky
  const { data: profile } = await supabase
    .from("profiles")
    .select("owner_id")
    .eq("id", domain.profile_id)
    .maybeSingle();
  if (!profile || profile.owner_id !== user.id) redirect("/dashboard");

  const token = process.env.VERCEL_TOKEN;
  const projectId = process.env.VERCEL_PROJECT_ID;

  if (!token || !projectId) {
    await supabase
      .from("domains")
      .update({
        status: "error",
        error: "Domains are not configured on this deployment yet.",
        checked_at: new Date().toISOString(),
      })
      .eq("id", domainId);
    revalidatePath("/dashboard/settings");
    return;
  }

  const teamQs = process.env.VERCEL_TEAM_ID
    ? `?teamId=${process.env.VERCEL_TEAM_ID}`
    : "";
  const res = await fetch(
    `https://api.vercel.com/v9/projects/${projectId}/domains/${domain.host}${teamQs}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  const json = await res.json();

  const verified = res.ok && json?.verified === true;
  await supabase
    .from("domains")
    .update({
      status: verified ? "active" : "pending",
      verification: json?.verification ?? null,
      error: verified ? null : "DNS not pointing at us yet.",
      checked_at: new Date().toISOString(),
    })
    .eq("id", domainId);

  revalidatePath("/dashboard/settings");
}

export async function promoteDomain(domainId: string) {
  const { supabase } = await requireUser();
  // Vlastnictvo overuje samotna funkcia cez auth.uid()
  await supabase.rpc("promote_domain", { p_domain_id: domainId });
  revalidatePath("/dashboard/settings");
}

export async function removeDomain(domainId: string) {
  const { supabase } = await requireUser();

  const { data: domain } = await supabase
    .from("domains")
    .select("host")
    .eq("id", domainId)
    .maybeSingle();

  // RLS pusti mazanie len vlastnikovi
  await supabase.from("domains").delete().eq("id", domainId);

  const token = process.env.VERCEL_TOKEN;
  const projectId = process.env.VERCEL_PROJECT_ID;
  if (domain && token && projectId) {
    const teamQs = process.env.VERCEL_TEAM_ID
      ? `?teamId=${process.env.VERCEL_TEAM_ID}`
      : "";
    await fetch(
      `https://api.vercel.com/v9/projects/${projectId}/domains/${domain.host}${teamQs}`,
      { method: "DELETE", headers: { Authorization: `Bearer ${token}` } },
    ).catch(() => undefined);
  }

  revalidatePath("/dashboard/settings");
}

// ---------------------------------------------------------------- danger zone

export async function deleteProfile(profileId: string) {
  const { supabase } = await ownsProfile(profileId);
  await supabase.from("profiles").delete().eq("id", profileId);
  revalidatePath("/dashboard");
  redirect("/dashboard");
}

/**
 * Maze LEN Linkovne data. Prihlasovaci ucet zostava, lebo je zdielany
 * s ostatnymi nasimi webmi — zmazat ho by cloveka odstrihlo aj od nich.
 */
export async function deleteAccountData(): Promise<SettingsState> {
  const { supabase, user } = await requireUser();
  const { error } = await supabase.from("accounts").delete().eq("id", user.id);
  if (error) return { error: "Couldn't delete your data." };
  await supabase.auth.signOut();
  redirect("/");
}
