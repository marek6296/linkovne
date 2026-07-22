import { NextResponse, type NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { planOf } from "@/lib/plans";
import { THEME_KEYS } from "@/lib/themes";
import { FONT_KEYS } from "@/lib/design";
import { ICON_KEYS } from "@/components/blocks/icon";
import { SOCIAL_PLATFORMS } from "@/lib/blocks";

// Beh moze trvat desiatky sekund
export const maxDuration = 60;

const DRAFT_SCHEMA = {
  type: "object",
  properties: {
    display_name: { type: "string" },
    bio: { type: "string" },
    theme: { type: "string", enum: THEME_KEYS },
    font: { type: "string", enum: FONT_KEYS },
    font_heading: { type: "string", enum: FONT_KEYS },
    blocks: {
      type: "array",
      items: {
        type: "object",
        properties: {
          type: {
            type: "string",
            enum: ["link", "headline", "text", "socials"],
          },
          title: { type: "string" },
          url: { type: "string" },
          icon: { type: "string", enum: ["", ...ICON_KEYS] },
          featured: { type: "boolean" },
          text: { type: "string" },
          socials: {
            type: "array",
            items: {
              type: "object",
              properties: {
                platform: { type: "string", enum: SOCIAL_PLATFORMS },
                url: { type: "string" },
              },
              required: ["platform", "url"],
              additionalProperties: false,
            },
          },
        },
        required: [
          "type",
          "title",
          "url",
          "icon",
          "featured",
          "text",
          "socials",
        ],
        additionalProperties: false,
      },
    },
  },
  required: ["display_name", "bio", "theme", "font", "font_heading", "blocks"],
  additionalProperties: false,
} as const;

const SYSTEM = `You design link-in-bio pages for creators.

Given a short self-description and a list of links, produce a complete page draft.

Rules:
- Write the bio in the same language the user wrote their description in.
- Keep the bio under 120 characters. No hashtags, no emoji spam, at most one emoji.
- Use only URLs the user actually provided. Never invent, guess, or complete a URL.
  If they name a platform without a URL, add the link with an empty url so they can fill it in.
- Order blocks by what earns the most: the thing they most want clicked goes first
  and gets featured: true. Exactly one block may be featured.
- Use a headline block only when there are enough links that grouping genuinely helps.
- Add one socials block at the end if they mentioned social profiles.
- Pick an icon for each link from the allowed list; use "" when nothing fits.
- Choose a theme and fonts that match their field. Do not default to the same
  combination every time.
- Leave every field you are not using as an empty string or empty array.`;

export async function POST(request: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "AI is not configured." },
      { status: 503 },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const { data: account } = await supabase
    .from("accounts")
    .select("plan")
    .eq("id", user.id)
    .maybeSingle();

  const plan = planOf(account?.plan);
  if (!plan.ai) {
    return NextResponse.json(
      { error: "The AI page builder needs a paid plan." },
      { status: 402 },
    );
  }

  // Rate limit — bez neho by jeden ucet vycerpal cely kredit.
  // Explicitny filter na ucet (nespolieha sa len na RLS).
  const since = new Date(Date.now() - 864e5).toISOString();
  const { count } = await supabase
    .from("ai_runs")
    .select("id", { count: "exact", head: true })
    .eq("account_id", user.id)
    .gte("created_at", since);

  if ((count ?? 0) >= plan.aiPerDay) {
    return NextResponse.json(
      { error: `You've used all ${plan.aiPerDay} AI drafts for today.` },
      { status: 429 },
    );
  }

  let body: { description?: string; links?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Bad request." }, { status: 400 });
  }

  const description = String(body.description ?? "").trim().slice(0, 2000);
  const links = String(body.links ?? "").trim().slice(0, 2000);

  if (description.length < 10) {
    return NextResponse.json(
      { error: "Tell us a bit more about yourself first." },
      { status: 400 },
    );
  }

  const client = new Anthropic({ apiKey });

  try {
    const response = await client.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 4000,
      system: SYSTEM,
      thinking: { type: "adaptive" },
      output_config: {
        effort: "medium",
        format: { type: "json_schema", schema: DRAFT_SCHEMA },
      },
      messages: [
        {
          role: "user",
          content: `About me:\n${description}\n\nMy links:\n${links || "(none given)"}`,
        },
      ],
    });

    if (response.stop_reason === "refusal") {
      return NextResponse.json(
        { error: "Couldn't generate a page from that description." },
        { status: 422 },
      );
    }

    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return NextResponse.json(
        { error: "Empty response from the model." },
        { status: 502 },
      );
    }

    const draft = JSON.parse(textBlock.text);

    // Zapocitame az uspesny beh
    await supabase.from("ai_runs").insert({ account_id: user.id });

    return NextResponse.json({ draft });
  } catch (err) {
    if (err instanceof Anthropic.RateLimitError) {
      return NextResponse.json(
        { error: "Busy right now — try again in a minute." },
        { status: 429 },
      );
    }
    if (err instanceof Anthropic.APIError) {
      // Detail modelu von neposielame
      console.error("AI draft failed", err.status, err.message);
      return NextResponse.json(
        { error: "Couldn't generate a draft. Try again." },
        { status: 502 },
      );
    }
    console.error("AI draft failed", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
