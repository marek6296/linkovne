"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  BLOCK_META,
  BLOCK_ORDER,
  defaultConfig,
  type Block,
  type BlockType,
} from "@/lib/blocks";
import { THEMES, THEME_KEYS } from "@/lib/themes";
import { resolveTheme, type Design } from "@/lib/design";
import { allowsBlock, allowsTheme, type PlanFeatures } from "@/lib/plans";
import {
  deleteBlock,
  saveBlocks,
  saveProfile,
  setLinkShield,
  setEscapeInApp,
} from "@/app/dashboard/actions";
import { uploadImage } from "@/lib/upload";
import { AiDraft } from "@/components/editor/ai-draft";
import { BlockCard } from "@/components/editor/block-card";
import { ImportPanel } from "@/components/editor/import-panel";
import { TemplateGrid } from "@/components/editor/template-picker";
import { templateBlocks, type Template } from "@/lib/templates";
import { DesignPanel } from "@/components/editor/design-panel";
import { Preview } from "@/components/editor/preview";
import { Collapse, Chevron } from "@/components/editor/collapse";
import { BlockGlyph } from "@/components/editor/block-glyph";

type ProfileState = {
  id: string;
  username: string;
  display_name: string;
  bio: string;
  avatar_url: string | null;
  theme: string;
  design: Design;
  link_shield: boolean;
  escape_inapp: boolean;
};

type SaveStatus = "idle" | "saving" | "saved" | "error";

function StatusPill({ status }: { status: SaveStatus }) {
  const map: Record<SaveStatus, string> = {
    idle: "",
    saving: "Saving…",
    saved: "All changes saved",
    error: "Couldn't save",
  };
  if (!map[status]) return null;
  return (
    <span
      className={`text-xs ${status === "error" ? "text-danger" : "text-faint"}`}
    >
      {map[status]}
    </span>
  );
}

function Lock() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

/**
 * Jednotna rozklikavacia karta. Cely editor je poskladany z tychto sekcii,
 * takze klient vidi prehladny zoznam „Profile · Design · Blocks…" namiesto
 * jednej dlhej steny nastaveni. Profile a Blocks su otvorene, zvysok zbaleny.
 */
function Section({
  title,
  subtitle,
  defaultOpen = false,
  badge,
  delay = 0,
  children,
  open: controlledOpen,
  onOpenChange,
}: {
  title: string;
  subtitle?: string;
  defaultOpen?: boolean;
  badge?: React.ReactNode;
  /** Poradove oneskorenie nabehu karty pri nacitani (ms). */
  delay?: number;
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [innerOpen, setInnerOpen] = useState(defaultOpen);
  const open = controlledOpen ?? innerOpen;
  const setOpen = (next: boolean) => {
    if (controlledOpen === undefined) setInnerOpen(next);
    onOpenChange?.(next);
  };
  return (
    <section
      className="lk-section-in card overflow-hidden"
      style={{ animationDelay: `${delay}ms` }}
    >
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left transition hover:bg-surface"
      >
        <span className="flex items-baseline gap-2">
          <span className="text-sm font-semibold">{title}</span>
          {subtitle && (
            <span className="hidden text-xs text-soft sm:inline">
              {subtitle}
            </span>
          )}
        </span>
        <span className="flex items-center gap-2.5">
          {badge}
          <Chevron open={open} />
        </span>
      </button>
      <Collapse open={open}>
        <div className="border-t border-line px-5 py-5">{children}</div>
      </Collapse>
    </section>
  );
}

function Switch({
  on,
  onToggle,
  busy,
}: {
  on: boolean;
  onToggle: (next: boolean) => void;
  busy?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      disabled={busy}
      onClick={() => onToggle(!on)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition disabled:opacity-50 ${
        on ? "bg-ink" : "bg-line"
      }`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-paper transition-all ${
          on ? "left-[22px]" : "left-0.5"
        }`}
      />
    </button>
  );
}

export function Editor({
  initialProfile,
  initialBlocks,
  brokenLinks = [],
  plan,
  userId,
}: {
  initialProfile: ProfileState;
  initialBlocks: Block[];
  brokenLinks?: string[];
  plan: PlanFeatures;
  userId: string;
}) {
  const broken = new Set(brokenLinks);
  const [profile, setProfile] = useState(initialProfile);
  const [blocks, setBlocks] = useState<Block[]>(initialBlocks);
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [tab, setTab] = useState<"edit" | "preview">("edit");
  const [notice, setNotice] = useState<string | null>(null);
  const [designOpen, setDesignOpen] = useState(false);
  const [tplOpen, setTplOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [shieldBusy, setShieldBusy] = useState(false);
  const [escapeBusy, setEscapeBusy] = useState(false);
  const [profileOpen, setProfileOpen] = useState(true);
  const [blocksOpen, setBlocksOpen] = useState(true);
  const [openBlockId, setOpenBlockId] = useState<string | null>(null);
  const [pendingTemplate, setPendingTemplate] = useState<Template | null>(null);

  // Bez tychto flagov by autosave vystrelil hned po mounte a prepisoval by
  // server tym istym, co z neho prislo.
  const blocksDirty = useRef(false);
  const profileDirty = useRef(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  useEffect(() => {
    if (!blocksDirty.current) return;
    setStatus("saving");
    const t = setTimeout(async () => {
      const res = await saveBlocks(profile.id, blocks);
      blocksDirty.current = false;
      setStatus(res?.error ? "error" : "saved");
      if (res?.error) setNotice(res.error);
    }, 700);
    return () => clearTimeout(t);
  }, [blocks, profile.id]);

  useEffect(() => {
    if (!profileDirty.current) return;
    setStatus("saving");
    const t = setTimeout(async () => {
      const res = await saveProfile(profile.id, {
        display_name: profile.display_name,
        bio: profile.bio,
        avatar_url: profile.avatar_url,
        theme: profile.theme,
        ...(plan.customDesign ? { design: profile.design } : {}),
      });
      profileDirty.current = false;
      setStatus(res?.error ? "error" : "saved");
      if (res?.error) setNotice(res.error);
    }, 700);
    return () => clearTimeout(t);
  }, [profile, plan.customDesign]);

  function patchProfile(patch: Partial<ProfileState>) {
    profileDirty.current = true;
    setProfile((p) => ({ ...p, ...patch }));
  }

  /**
   * Vyber temy zahodi FAREBNE prepisy z designu (pozadie, farby tlacidiel,
   * styl), aby zvolena tema naozaj bola vidno. Ponecha typografiu a tvar —
   * to su preferencie, nie farby konkretnej temy. Bez toho by farby zo
   * sablony maskovali kazdu novo zvolenu temu.
   */
  function pickTheme(key: string) {
    profileDirty.current = true;
    setProfile((p) => ({
      ...p,
      theme: key,
      design: {
        font: p.design.font,
        fontHeading: p.design.fontHeading,
        btnShape: p.design.btnShape,
        btnSize: p.design.btnSize,
        btnShadow: p.design.btnShadow,
        btnBorder: p.design.btnBorder,
        btnSpacing: p.design.btnSpacing,
        btnWeight: p.design.btnWeight,
        btnAnimation: p.design.btnAnimation,
        avatarShape: p.design.avatarShape,
        avatarSize: p.design.avatarSize,
        avatarAspect: p.design.avatarAspect,
        avatarFrame: p.design.avatarFrame,
        avatarFit: p.design.avatarFit,
        avatarPosition: p.design.avatarPosition,
        avatarRingColor: p.design.avatarRingColor,
      },
    }));
  }

  function patchBlocks(fn: (prev: Block[]) => Block[]) {
    blocksDirty.current = true;
    setBlocks(fn);
  }

  /**
   * Link Shield sa uklada samostatnou akciou (nie cez debounced autosave) a
   * plati okamzite. Preto NEnastavujeme profileDirty — autosave sa nespusti.
   */
  async function toggleShield(next: boolean) {
    setShieldBusy(true);
    setProfile((p) => ({ ...p, link_shield: next }));
    const res = await setLinkShield(profile.id, next);
    if (res?.error) {
      setProfile((p) => ({ ...p, link_shield: !next })); // vratit spat
      setNotice(res.error);
    }
    setShieldBusy(false);
  }

  async function toggleEscape(next: boolean) {
    setEscapeBusy(true);
    setProfile((p) => ({ ...p, escape_inapp: next }));
    const res = await setEscapeInApp(profile.id, next);
    if (res?.error) {
      setProfile((p) => ({ ...p, escape_inapp: !next }));
      setNotice(res.error);
    }
    setEscapeBusy(false);
  }

  function addBlock(type: BlockType) {
    if (!allowsBlock(plan, type)) {
      setNotice(`The ${BLOCK_META[type].label} block needs a paid plan.`);
      return;
    }
    if (plan.maxBlocks !== null && blocks.length >= plan.maxBlocks) {
      setNotice(
        `Your plan is limited to ${plan.maxBlocks} blocks. Upgrade for unlimited.`,
      );
      return;
    }
    setNotice(null);
    patchBlocks((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        type,
        config: defaultConfig(type),
        position: prev.length,
        is_active: true,
      },
    ]);
    setPaletteOpen(false);
  }

  function addSection() {
    if (!plan.sections) {
      setNotice("Page sections need Pro.");
      return;
    }
    if (plan.maxBlocks !== null && blocks.length >= plan.maxBlocks) {
      setNotice(`Your plan is limited to ${plan.maxBlocks} blocks.`);
      return;
    }
    patchBlocks((prev) => [...prev, { id: crypto.randomUUID(), type: "headline", config: { text: "New section", isSection: true, sectionBg: "#ffffff", sectionText: "#191813", sectionBorder: "#e7e4dc", sectionRadius: "rounded", sectionLayout: "stack" }, position: prev.length, is_active: true }]);
    setPaletteOpen(false);
  }

  async function removeBlock(id: string) {
    const previous = blocks;
    setBlocks((prev) => prev.filter((b) => b.id !== id));
    setStatus("saving");
    const result = await deleteBlock(profile.id, id);
    if (result?.error) {
      setBlocks(previous);
      setNotice(result.error);
      setStatus("error");
      return;
    }
    setStatus("saved");
  }

  function duplicateBlock(id: string) {
    if (plan.maxBlocks !== null && blocks.length >= plan.maxBlocks) {
      setNotice(`Your plan is limited to ${plan.maxBlocks} blocks.`);
      return;
    }
    patchBlocks((prev) => {
      const idx = prev.findIndex((b) => b.id === id);
      if (idx < 0) return prev;
      const src = prev[idx];
      const copy: Block = {
        ...src,
        id: crypto.randomUUID(),
        config: { ...src.config },
      };
      const next = [...prev];
      next.splice(idx + 1, 0, copy);
      return next;
    });
  }

  function addHalfPartner(id: string) {
    if (plan.maxBlocks !== null && blocks.length >= plan.maxBlocks) {
      setNotice(`Your plan is limited to ${plan.maxBlocks} blocks.`);
      return;
    }
    setNotice(null);
    patchBlocks((prev) => {
      const idx = prev.findIndex((b) => b.id === id);
      if (idx < 0) return prev;
      const existing = prev[idx + 1];
      if (
        existing?.type === "link" &&
        existing.config.width === "half" &&
        existing.is_active
      ) {
        return prev;
      }
      const partner: Block = {
        id: crypto.randomUUID(),
        type: "link",
        config: {
          ...defaultConfig("link"),
          title: "New link",
          width: "half",
        },
        position: idx + 1,
        is_active: true,
      };
      const next = [...prev];
      next.splice(idx + 1, 0, partner);
      return next;
    });
  }

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    patchBlocks((prev) => {
      const from = prev.findIndex((b) => b.id === active.id);
      const to = prev.findIndex((b) => b.id === over.id);
      return arrayMove(prev, from, to);
    });
  }

  function selectFromPreview(target: { kind: "profile" } | { kind: "block"; id: string }) {
    setTab("edit");
    if (target.kind === "profile") {
      setProfileOpen(true);
      requestAnimationFrame(() => document.getElementById("editor-profile")?.scrollIntoView({ behavior: "smooth", block: "start" }));
      return;
    }
    setBlocksOpen(true);
    setOpenBlockId(target.id);
    requestAnimationFrame(() => document.getElementById(`block-editor-${target.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" }));
  }

  function applyTemplate(template: Template, withBlocks: boolean) {
    profileDirty.current = true;
    setProfile((p) => ({ ...p, theme: template.theme, design: template.design }));
    if (withBlocks) {
      blocksDirty.current = true;
      setBlocks(templateBlocks(template));
    }
    setPendingTemplate(null);
    setNotice(withBlocks ? "Template design and demo blocks applied." : "Template design applied. Your blocks were kept.");
  }

  const theme = resolveTheme(
    profile.theme,
    plan.customDesign ? profile.design : {},
  );
  return (
    <div>
      {/* Mobile tabs */}
      <div className="mb-6 flex gap-1 rounded-full border border-line bg-surface p-1 lg:hidden">
        {(["edit", "preview"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 rounded-full py-2 text-sm font-medium capitalize transition ${
              tab === t ? "bg-ink text-paper" : "text-soft"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="grid gap-10 lg:grid-cols-[1fr_340px]">
        {/* ---------- Editor column ---------- */}
        <div className={tab === "edit" ? "" : "hidden lg:block"}>
          <div className="flex items-center justify-between">
            <h1 className="font-grotesk font-bold text-2xl tracking-tight">Your page</h1>
            <StatusPill status={status} />
          </div>

          {notice && (
            <div className="alert-error mt-4 flex flex-wrap items-center justify-between gap-3">
              <span>{notice}</span>
              <Link href="/#pricing" className="underline underline-offset-2">
                See plans
              </Link>
            </div>
          )}

          <div className="mt-5 space-y-3">
            {/* 1 — Quick start: AI + import (zbalene) */}
            <Section
              title="Quick start"
              subtitle="build with AI · import links"
              delay={0}
            >
              <div className="space-y-3">
                <AiDraft
                  bare
                  enabled={plan.ai}
                  onApply={(draft) => {
                    // Jeden zapis do oboch stavov — autosave sa postara o zvysok
                    profileDirty.current = true;
                    blocksDirty.current = true;
                    setProfile((p) => ({
                      ...p,
                      display_name: draft.display_name || p.display_name,
                      bio: draft.bio || p.bio,
                      theme: allowsTheme(plan, draft.theme)
                        ? draft.theme
                        : p.theme,
                      design: plan.customDesign
                        ? { ...p.design, ...draft.design }
                        : p.design,
                    }));
                    setBlocks(
                      plan.maxBlocks === null
                        ? draft.blocks
                        : draft.blocks.slice(0, plan.maxBlocks),
                    );
                    setNotice(null);
                  }}
                />

                <ImportPanel
                  bare
                  onApply={(result) => {
                    profileDirty.current = true;
                    blocksDirty.current = true;
                    setProfile((p) => ({
                      ...p,
                      display_name: result.display_name || p.display_name,
                      bio: result.bio || p.bio,
                      avatar_url: result.avatar_url || p.avatar_url,
                    }));
                    setBlocks(
                      plan.maxBlocks === null
                        ? result.blocks
                        : result.blocks.slice(0, plan.maxBlocks),
                    );
                    setNotice(
                      plan.maxBlocks !== null &&
                        result.blocks.length > plan.maxBlocks
                        ? `Imported the first ${plan.maxBlocks} links — upgrade to keep the rest.`
                        : null,
                    );
                  }}
                />
              </div>
            </Section>

            {/* 2 — Profile (otvorene) */}
            <Section
              title="Profile"
              subtitle="photo, name, bio"
              open={profileOpen}
              onOpenChange={setProfileOpen}
              delay={60}
            >
              <div id="editor-profile" className="scroll-mt-24 space-y-4">
                <AvatarRow
                  url={profile.avatar_url}
                  userId={userId}
                  onChange={(avatar_url) => patchProfile({ avatar_url })}
                />
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-soft">
                    Display name
                  </span>
                  <input
                    value={profile.display_name}
                    maxLength={60}
                    onChange={(e) =>
                      patchProfile({ display_name: e.target.value })
                    }
                    className="field py-2.5"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-soft">
                    Bio
                  </span>
                  <textarea
                    rows={2}
                    maxLength={300}
                    value={profile.bio}
                    placeholder="Photographer · Prague"
                    onChange={(e) => patchProfile({ bio: e.target.value })}
                    className="field py-2.5"
                  />
                </label>
              </div>
            </Section>

            {/* 3 — Design: tema + sablony + customizacia (zbalene) */}
            <Section
              title="Design"
              subtitle="theme, template, colours"
              delay={120}
            >
              {/* Tema — pre free usera (bez Customise) zostava hned viditelna.
                  Pre Pro sa presuva do Customise ako prvy tab (nizsie). */}
              {!plan.customDesign && (
                <>
                  <p className="text-[11px] font-semibold tracking-wide text-faint uppercase">
                    Theme
                  </p>
                  <div className="mt-2.5 flex flex-wrap gap-2">
                    {THEME_KEYS.map((key) => {
                      const locked = !allowsTheme(plan, key);
                      return (
                        <button
                          key={key}
                          onClick={() =>
                            locked
                              ? setNotice("That theme needs a paid plan.")
                              : pickTheme(key)
                          }
                          className={`flex items-center gap-2 rounded-full border px-3 py-2 text-sm transition ${
                            profile.theme === key
                              ? "border-ink"
                              : "border-line hover:border-soft"
                          } ${locked ? "opacity-55" : ""}`}
                        >
                          <span
                            className="h-4 w-4 rounded-full border border-line"
                            style={{ background: THEMES[key].swatch }}
                          />
                          {THEMES[key].label}
                          {locked && <Lock />}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}

              {/* Druha skupina — hlbsie upravy vzhladu (sablony + customizacia).
                  Oddelovac hore len ked je nad nim Theme blok (free plan). */}
              <p
                className={`text-[11px] font-semibold tracking-wide text-faint uppercase ${
                  plan.customDesign ? "" : "mt-6 border-t border-line pt-4"
                }`}
              >
                Make it yours
              </p>

              {/* Templates — cely vzhlad na jeden klik */}
              {plan.customDesign && (
                <div className="mt-2.5">
                  <button
                    type="button"
                    onClick={() => setTplOpen((v) => !v)}
                    className="flex w-full items-center justify-between rounded-xl border border-line bg-surface px-4 py-3 text-sm transition hover:border-soft"
                  >
                    <span>
                      <span className="font-medium">Start from a template</span>
                      <span className="ml-2 text-soft">
                        a full look in one click
                      </span>
                    </span>
                    <Chevron open={tplOpen} />
                  </button>
                  <Collapse open={tplOpen}>
                    <div className="mt-3">
                      <TemplateGrid
                        onPick={(t) => {
                          setPendingTemplate(t);
                        }}
                      />
                    </div>
                  </Collapse>
                </div>
              )}

              {/* Customise */}
              {plan.customDesign ? (
                <div className="mt-2.5">
                  <button
                    type="button"
                    onClick={() => setDesignOpen((v) => !v)}
                    className="flex w-full items-center justify-between rounded-xl border border-line bg-surface px-4 py-3 text-sm transition hover:border-soft"
                  >
                    <span>
                      <span className="font-medium">Customise</span>
                      <span className="ml-2 text-soft">
                        themes, photo, frames, buttons, fonts
                      </span>
                    </span>
                    <Chevron open={designOpen} />
                  </button>

                  <Collapse open={designOpen}>
                    <div className="mt-3">
                      <DesignPanel
                        design={profile.design}
                        userId={userId}
                        activeTheme={profile.theme}
                        themes={THEME_KEYS.map((key) => ({
                          key,
                          label: THEMES[key].label,
                          swatch: THEMES[key].swatch,
                          page: THEMES[key].page,
                          text: THEMES[key].text,
                          button: THEMES[key].btnBg,
                          locked: !allowsTheme(plan, key),
                        }))}
                        onPickTheme={(key) =>
                          allowsTheme(plan, key as (typeof THEME_KEYS)[number])
                            ? pickTheme(key as (typeof THEME_KEYS)[number])
                            : setNotice("That theme needs a paid plan.")
                        }
                        onChange={(patch) =>
                          patchProfile({
                            design: { ...profile.design, ...patch },
                          })
                        }
                        onReset={() => patchProfile({ design: {} })}
                      />
                    </div>
                  </Collapse>
                </div>
              ) : (
                <div className="mt-2.5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed border-line px-4 py-3 text-sm">
                  <span className="flex items-center gap-2 text-soft">
                    <Lock />
                    Templates, custom background, buttons &amp; fonts
                  </span>
                  <Link href="/#pricing" className="btn-ink px-4 py-2 text-sm">
                    Upgrade
                  </Link>
                </div>
              )}
            </Section>

            {/* Protection — Link Shield + escape z in-app prehliadaca v JEDNEJ
                karte: obe su ochranne prepinace, patria k sebe. Dva symetricke
                riadky (nazov + popis + Switch), oddelene ciarou. */}
            <Section
              title="Protection"
              subtitle="link privacy · real browser"
              delay={180}
              badge={(() => {
                if (!plan.linkShield && !plan.escapeInApp) return <Lock />;
                const n =
                  (plan.linkShield && profile.link_shield ? 1 : 0) +
                  (plan.escapeInApp && profile.escape_inapp ? 1 : 0);
                return n > 0 ? (
                  <span className="rounded-full bg-ink px-2 py-0.5 text-[11px] font-medium text-paper">
                    {n} on
                  </span>
                ) : undefined;
              })()}
            >
              {plan.linkShield || plan.escapeInApp ? (
                <div className="divide-y divide-line">
                  {/* Link Shield */}
                  <div className="flex items-start justify-between gap-4 pb-5">
                    <div className="min-w-0">
                      <p className="text-sm font-medium">Link Shield</p>
                      <p className="mt-1 max-w-md text-xs leading-relaxed text-soft">
                        A neutral confirmation step (with an optional 18+ check)
                        before sensitive links. The destination stays out of
                        your page&apos;s code and previews, so it can&apos;t be
                        scraped. Always follow each platform&apos;s own rules.
                      </p>
                    </div>
                    <Switch
                      on={profile.link_shield}
                      busy={shieldBusy}
                      onToggle={toggleShield}
                    />
                  </div>

                  {/* Open externally */}
                  <div className="flex items-start justify-between gap-4 pt-5">
                    <div className="min-w-0">
                      <p className="text-sm font-medium">Open externally</p>
                      <p className="mt-1 max-w-md text-xs leading-relaxed text-soft">
                        Jumps out of Instagram&apos;s / TikTok&apos;s in-app
                        browser into real Safari or Chrome — where logins and
                        payments actually work. Reliable on Android; on iOS
                        visitors get a one-tap &ldquo;Open in browser&rdquo;
                        prompt.
                      </p>
                    </div>
                    <Switch
                      on={profile.escape_inapp}
                      busy={escapeBusy}
                      onToggle={toggleEscape}
                    />
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="space-y-2 text-sm text-soft">
                    <p className="flex items-center gap-2">
                      <Lock />
                      Link Shield — gate sensitive links behind a confirmation
                    </p>
                    <p className="flex items-center gap-2">
                      <Lock />
                      Open externally — leave the in-app browser
                    </p>
                  </div>
                  <Link href="/#pricing" className="btn-ink px-4 py-2 text-sm">
                    Upgrade
                  </Link>
                </div>
              )}
            </Section>

            {/* 4 — Blocks (otvorene) */}
            <Section
              title="Blocks"
              subtitle="your links & content"
              open={blocksOpen}
              onOpenChange={setBlocksOpen}
              delay={240}
              badge={
                <span className="text-xs text-faint">
                  {plan.maxBlocks !== null
                    ? `${blocks.length} / ${plan.maxBlocks}`
                    : blocks.length}
                </span>
              }
            >
              {/* Add block — paleta skryta za jednym tlacidlom */}
              <button
                type="button"
                onClick={() => setPaletteOpen((v) => !v)}
                aria-expanded={paletteOpen}
                className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-line px-4 py-3 text-sm font-medium transition hover:border-ink"
              >
                {paletteOpen ? "Close" : "+ Add a block"}
              </button>

              <Collapse open={paletteOpen}>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button type="button" onClick={addSection} className={`flex items-center gap-2 rounded-full border border-line bg-surface px-3.5 py-2 text-sm transition hover:border-ink ${plan.sections ? "" : "opacity-55"}`}><span aria-hidden>▣</span>Section{!plan.sections && <Lock />}</button>
                  {BLOCK_ORDER.map((type) => {
                    const locked = !allowsBlock(plan, type);
                    return (
                      <button
                        key={type}
                        onClick={() => addBlock(type)}
                        title={BLOCK_META[type].hint}
                        className={`flex items-center gap-2 rounded-full border border-line bg-surface px-3.5 py-2 text-sm transition hover:border-ink ${
                          locked ? "opacity-55" : ""
                        }`}
                      >
                        <BlockGlyph type={type} />
                        {BLOCK_META[type].label}
                        {locked && <Lock />}
                      </button>
                    );
                  })}
                </div>
              </Collapse>

              <div className="mt-4 space-y-2.5">
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  modifiers={[restrictToVerticalAxis]}
                  onDragEnd={onDragEnd}
                >
                  <SortableContext
                    items={blocks.map((b) => b.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {blocks.map((block, index) => (
                      <div key={block.id} id={`block-editor-${block.id}`} className="scroll-mt-24"><BlockCard
                        block={block}
                        broken={broken.has(block.id)}
                        userId={userId}
                        vip={plan.vipLinks}
                        onChange={(patch) =>
                          patchBlocks((prev) =>
                            prev.map((b) =>
                              b.id === block.id ? { ...b, ...patch } : b,
                            ),
                          )
                        }
                        onDelete={() => removeBlock(block.id)}
                        onDuplicate={() => duplicateBlock(block.id)}
                        hasHalfPartner={
                          block.config.width === "half" &&
                          blocks[index + 1]?.type === "link" &&
                          blocks[index + 1]?.config.width === "half" &&
                          blocks[index + 1]?.is_active
                        }
                        onAddHalfPartner={() => addHalfPartner(block.id)}
                        open={openBlockId === block.id}
                        onOpenChange={(open) => setOpenBlockId(open ? block.id : null)}
                      /></div>
                    ))}
                  </SortableContext>
                </DndContext>
              </div>

              {blocks.length === 0 && (
                <p className="mt-4 rounded-2xl border border-dashed border-line p-10 text-center text-sm text-soft">
                  Nothing here yet — add your first block above.
                </p>
              )}
            </Section>
          </div>
        </div>

        {/* ---------- Preview column ---------- */}
        <div
          className={`${tab === "preview" ? "" : "hidden lg:block"} lg:sticky lg:top-8 lg:self-start`}
        >
          <Preview
            profileId={profile.id}
            displayName={profile.display_name}
            username={profile.username}
            bio={profile.bio}
            avatarUrl={profile.avatar_url}
            blocks={blocks}
            theme={theme}
            onSelect={selectFromPreview}
          />
        </div>
      </div>
      {pendingTemplate && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4" role="dialog" aria-modal="true"><div className="w-full max-w-md rounded-3xl bg-paper p-6 shadow-2xl"><p className="text-xs font-semibold tracking-wide text-faint uppercase">Preview selected</p><h2 className="mt-1 font-grotesk text-xl font-bold">Apply {pendingTemplate.label}?</h2><p className="mt-2 text-sm leading-relaxed text-soft">The card preview shows the final colours and buttons. Choose exactly what should change.</p><div className="mt-5 grid gap-2"><button type="button" onClick={() => applyTemplate(pendingTemplate, false)} className="btn-ink py-3 text-sm">Apply design only</button><button type="button" onClick={() => applyTemplate(pendingTemplate, true)} className="rounded-xl border border-line py-3 text-sm font-medium">Apply design + demo blocks</button><button type="button" onClick={() => setPendingTemplate(null)} className="py-2 text-sm text-soft">Cancel and keep previewing</button></div></div></div>}
    </div>
  );
}

function AvatarRow({
  url,
  userId,
  onChange,
}: {
  url: string | null;
  userId: string;
  onChange: (url: string | null) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  return (
    <div className="flex items-center gap-4">
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt=""
          className="h-16 w-16 rounded-full border border-line object-cover"
        />
      ) : (
        <div className="h-16 w-16 rounded-full border border-dashed border-line" />
      )}
      <input
        ref={ref}
        type="file"
        accept="image/*"
        hidden
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          setBusy(true);
          try {
            onChange(await uploadImage(file, userId));
          } finally {
            setBusy(false);
          }
        }}
      />
      <button
        type="button"
        onClick={() => ref.current?.click()}
        disabled={busy}
        className="rounded-full border border-line px-4 py-2 text-sm transition hover:border-ink disabled:opacity-50"
      >
        {busy ? "Uploading…" : url ? "Change photo" : "Upload photo"}
      </button>
      {url && (
        <button
          type="button"
          onClick={() => onChange(null)}
          className="text-sm text-danger"
        >
          Remove
        </button>
      )}
    </div>
  );
}
