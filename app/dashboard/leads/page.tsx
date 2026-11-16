import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ p?: string; page?: string }>;
}) {
  const { p, page } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id,username,display_name")
    .eq("owner_id", user.id);
  const owned = profiles ?? [];
  const selected = owned.find((profile) => profile.id === p);
  const pageNumber = Math.max(
    1,
    Math.min(10000, Number.parseInt(page ?? "1", 10) || 1),
  );
  const ids = selected ? [selected.id] : owned.map((profile) => profile.id);
  const result = ids.length
    ? await supabase
        .from("leads")
        .select("id,profile_id,name,email,message,created_at", {
          count: "exact",
        })
        .in("profile_id", ids)
        .order("created_at", { ascending: false })
        .range((pageNumber - 1) * 20, pageNumber * 20 - 1)
    : { data: [], count: 0, error: null };
  const href = (n: number) =>
    `/dashboard/leads?${selected ? `p=${selected.id}&` : ""}page=${n}`;
  return (
    <section className="mx-auto max-w-4xl space-y-6">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Inbox</h1>
        <p className="mt-2 text-soft">
          Messages sent through your profile contact forms.
        </p>
      </header>
      <nav
        aria-label="Filter messages by profile"
        className="flex flex-wrap gap-2"
      >
        <Link
          className={`rounded-full border px-4 py-2 text-sm ${!selected ? "bg-ink text-white" : "border-line"}`}
          href="/dashboard/leads"
        >
          All profiles
        </Link>
        {owned.map((profile) => (
          <Link
            key={profile.id}
            className={`rounded-full border px-4 py-2 text-sm ${selected?.id === profile.id ? "bg-ink text-white" : "border-line"}`}
            href={`/dashboard/leads?p=${profile.id}`}
          >
            @{profile.username}
          </Link>
        ))}
      </nav>
      {result.error || profilesError ? (
        <p role="alert" className="card p-6">
          Messages could not be loaded. Please refresh to try again.
        </p>
      ) : !result.data?.length ? (
        <div className="card p-10 text-center">
          <h2 className="text-lg font-semibold">No messages yet</h2>
          <p className="mt-2 text-sm text-soft">
            Add a Contact form to your page and publish it. New enquiries will
            appear here with the visitor’s name, email and message.
          </p>
          <Link
            className="btn-ink mt-5 inline-flex px-5 py-3"
            href={selected ? `/dashboard?p=${selected.id}` : "/dashboard"}
          >
            Open editor
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {result.data.map((lead) => (
            <article key={lead.id} className="card p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold">{lead.name}</h2>
                  <p className="mt-1 text-sm text-soft break-all">
                    {lead.email}
                  </p>
                </div>
                <time className="text-xs text-soft" dateTime={lead.created_at}>
                  {new Date(lead.created_at).toLocaleString("en-GB", {
                    timeZone: "UTC",
                  })}{" "}
                  UTC
                </time>
              </div>
              <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-relaxed">
                {lead.message || "No message provided."}
              </p>
              <footer className="mt-5 flex items-center justify-between border-t border-line pt-4">
                <span className="text-xs text-soft">
                  @
                  {
                    owned.find((profile) => profile.id === lead.profile_id)
                      ?.username
                  }
                </span>
                <a
                  href={`mailto:${encodeURIComponent(lead.email)}`}
                  className="text-sm font-semibold underline underline-offset-4"
                >
                  Reply by email
                </a>
              </footer>
            </article>
          ))}
        </div>
      )}
      <nav aria-label="Inbox pages" className="flex justify-between text-sm">
        {pageNumber > 1 ? (
          <Link href={href(pageNumber - 1)}>← Newer</Link>
        ) : (
          <span />
        )}
        {(result.count ?? 0) > pageNumber * 20 && (
          <Link href={href(pageNumber + 1)}>Older →</Link>
        )}
      </nav>
    </section>
  );
}
