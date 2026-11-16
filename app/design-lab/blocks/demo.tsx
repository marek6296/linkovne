"use client";
import { useState } from "react";
import { BlockList } from "@/components/blocks/render";
import { ContentStyle } from "@/components/editor/content-style";
import { resolveTheme } from "@/lib/design";
import type { Block } from "@/lib/blocks";
const initial: Block[] = [
  {
    id: "event",
    type: "countdown",
    position: 0,
    is_active: true,
    config: {
      title: "Design nights · live session",
      target: "2027-02-01T18:00:00Z",
      src: "/templates/cobalt-glass.webp",
      href: "https://example.com/event",
      buttonLabel: "See the event",
      countdownStyle: "tiles",
    },
  },
  {
    id: "faq",
    type: "faq",
    position: 1,
    is_active: true,
    config: {
      faqs: [
        {
          q: "Can we work together?",
          a: "Tell me about your idea using the form below.\nI’ll get back to you by email.",
        },
        { q: "Where are you based?", a: "Bratislava · available worldwide." },
      ],
    },
  },
  {
    id: "divider",
    type: "divider",
    position: 2,
    is_active: true,
    config: {
      dividerStyle: "dashed",
      dividerWidth: "medium",
      blockSpacing: "airy",
    },
  },
  {
    id: "form",
    type: "form",
    position: 3,
    is_active: true,
    config: { title: "Let’s work together", buttonLabel: "Send enquiry" },
  },
];
export default function Demo() {
  const [blocks, setBlocks] = useState(initial);
  const [dark, setDark] = useState(false);
  return (
    <main className="min-h-screen bg-[#f7f7f8] p-6">
      <h1 className="text-2xl font-semibold">Content block preview</h1>
      <p className="my-3">Local preview only. Nothing is saved or sent.</p>
      <label>
        <input
          type="checkbox"
          checked={dark}
          onChange={(e) => setDark(e.target.checked)}
        />{" "}
        Dark theme
      </label>
      <div className="mt-6 grid items-start gap-8 md:grid-cols-2">
        <div className="space-y-5">
          {blocks
            .filter((b) => b.type !== "form")
            .map((block) => (
              <section key={block.id} className="rounded-xl bg-white p-5">
                <h2 className="mb-4 font-semibold capitalize">{block.type}</h2>
                <ContentStyle
                  type={block.type}
                  config={block.config}
                  onChange={(patch) =>
                    setBlocks((old) =>
                      old.map((b) =>
                        b.id === block.id
                          ? { ...b, config: { ...b.config, ...patch } }
                          : b,
                      ),
                    )
                  }
                />
              </section>
            ))}
        </div>
        <div
          className="mx-auto w-full max-w-[390px] rounded-3xl p-5"
          style={{
            background: dark ? "#202027" : "#fffaf5",
            color: dark ? "#fff" : "#202027",
          }}
        >
          <BlockList
            blocks={blocks}
            profileId="demo"
            preview
            premium
            theme={resolveTheme("classic", {
              btnBg: dark ? "#30303a" : "#ffffff",
              btnText: dark ? "#ffffff" : "#202027",
              textColor: dark ? "#ffffff" : "#202027",
            })}
          />
        </div>
      </div>
    </main>
  );
}
