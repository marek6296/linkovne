"use client";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { BLOCK_META, BLOCK_ORDER, type BlockType } from "@/lib/blocks";
import { allowsBlock, PLANS, type PlanFeatures } from "@/lib/plans";
import { BlockGlyph } from "./block-glyph";

const GROUPS = [
  { name: "Links & social", types: ["link", "socials", "tip"] },
  { name: "Media & content", types: ["image", "video", "headline", "text"] },
  { name: "More", types: ["faq", "countdown", "divider", "form"] },
];
export function ContentPicker({
  plan,
  onPick,
  onSection,
  onClose,
}: {
  plan: PlanFeatures;
  onPick: (type: BlockType) => void;
  onSection: () => void;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const search = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog.current?.showModal();
    search.current?.focus();
    return () => {
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, []);
  const matches = BLOCK_ORDER.filter((type) =>
    `${BLOCK_META[type].label} ${BLOCK_META[type].hint}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  return createPortal(
    <dialog
      ref={dialog}
      className="studio-dialog"
      aria-labelledby="content-picker-title"
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <header>
        <div>
          <h2 id="content-picker-title">Add to your page</h2>
          <p>Choose what you want your visitors to see.</p>
        </div>
        <button
          className="studio-icon-button"
          onClick={onClose}
          aria-label="Close content picker"
        >
          ×
        </button>
      </header>
      <input
        ref={search}
        autoFocus
        className="field"
        placeholder="Search links, photos, social icons…"
        aria-label="Search content types"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {GROUPS.map((group) => {
        const types = matches.filter((type) => group.types.includes(type));
        return types.length ? (
          <section key={group.name}>
            <h3>{group.name}</h3>
            <div className="studio-content-options">
              {types.map((type) => (
                <button
                  key={type}
                  disabled={!allowsBlock(plan, type)}
                  onClick={() => {
                    onPick(type);
                    onClose();
                  }}
                >
                  <span className="studio-content-icon">
                    <BlockGlyph type={type} />
                  </span>
                  <span>
                    <strong>{BLOCK_META[type].label}</strong>
                    <small>{BLOCK_META[type].hint}</small>
                  </span>
                  {!allowsBlock(PLANS.free, type) && <em>Pro</em>}
                </button>
              ))}
            </div>
          </section>
        ) : null;
      })}
      {!matches.length && (
        <p className="py-6 text-sm text-soft">
          No matches. Try “link”, “photo” or “social”.
        </p>
      )}
      {!query && (
        <button
          className="studio-section-choice"
          disabled={!plan.sections}
          onClick={() => {
            onSection();
            onClose();
          }}
        >
          Group content into a section{" "}
          <span>Pro</span>
        </button>
      )}
    </dialog>,
    document.body,
  );
}
