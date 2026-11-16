"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
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
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  BLOCK_META,
  defaultConfig,
  type Block,
  type BlockType,
  isVisibleNow,
} from "@/lib/blocks";
import { THEMES, THEME_KEYS } from "@/lib/themes";
import { resolveTheme, type Design } from "@/lib/design";
import { allowsBlock, allowsTheme, type PlanFeatures } from "@/lib/plans";
import {
  designCaps,
  designForPlan,
  lockedDesignFeatures,
} from "@/lib/design-tiers";
import {
  EDITOR_DRAFT_STATE_EVENT,
  EDITOR_PUBLISHED_EVENT,
  type EditorDraftState,
} from "@/lib/editor-draft-state";
import {
  saveBlocks,
  saveProfile,
  setLinkShield,
  setEscapeInApp,
  setCreatorMode,
} from "@/app/dashboard/actions";
import { uploadImage } from "@/lib/upload";
import { AiDraft } from "@/components/editor/ai-draft";
import { BlockCard } from "@/components/editor/block-card";
import { ImportPanel } from "@/components/editor/import-panel";
import { TemplateGrid } from "@/components/editor/template-picker";
import { type Template } from "@/lib/templates";
import { DesignPanel, type DesignTab } from "@/components/editor/design-panel";
import { Preview } from "@/components/editor/preview";
import { Collapse, Chevron } from "@/components/editor/collapse";
import { ContentPicker } from "./content-picker";
import { ShareCard } from "./share-card";
import { DeleteProfileButton } from "./delete-profile-button";
import { reorderBlocks } from "@/lib/reorder-blocks";
import { createDraftSaveQueue } from "@/lib/draft-save-queue";

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
  creator_mode: boolean;
  hide_branding: boolean;
};

type SaveStatus = "idle" | "saving" | "saved" | "error";

function StatusPill({ status }: { status: SaveStatus }) {
  const map: Record<SaveStatus, string> = {
    idle: "",
    saving: "Saving draft…",
    saved: "Draft saved",
    error: "Couldn't save",
  };
  if (!map[status]) return null;
  return (
    <span
      role="status"
      className={`text-xs ${status === "error" ? "text-danger" : "text-faint"}`}
    >
      {map[status]}
    </span>
  );
}

function Lock() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-3.5 w-3.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
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
  label,
}: {
  label: string;
  on: boolean;
  onToggle: (next: boolean) => void;
  busy?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-label={label}
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
  isPublished,
  publishControls,
}: {
  isPublished: boolean;
  publishControls?: ReactNode;
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
  const [workspace, setWorkspace] = useState<
    "content" | "design" | "share" | "settings"
  >("content");
  const [tab, setTab] = useState<"edit" | "preview">("edit");
  const [notice, setNotice] = useState<string | null>(null);
  const [designMode, setDesignMode] = useState<"templates" | "customise">(
    "customise",
  );
  const [designTab, setDesignTab] = useState<DesignTab>("layout");
  const [buttonTarget, setButtonTarget] = useState("all");
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [shieldBusy, setShieldBusy] = useState(false);
  const [escapeBusy, setEscapeBusy] = useState(false);
  const [creatorBusy, setCreatorBusy] = useState(false);
  const [profileOpen, setProfileOpen] = useState(true);
  const [blocksOpen, setBlocksOpen] = useState(true);
  const [openBlockId, setOpenBlockId] = useState<string | null>(null);
  const [hasLocalChanges, setHasLocalChanges] = useState(false);
  // Ktora template bola naposledy aplikovana — cisto pre vizualne oznacenie v
  // pickeri (hlavne na mobile, kde nevidno live preview). Manualna uprava
  // temy/dizajnu oznacenie zrusi (uz to nie je „ta template").
  const [appliedTemplate, setAppliedTemplate] = useState<string | null>(null);

  // Bez tychto flagov by autosave vystrelil hned po mounte a prepisoval by
  // server tym istym, co z neho prislo.
  const editVersion = useRef(0);
  const blocksDirty = useRef(false);
  const profileDirty = useRef(false);
  const saveQueue = useRef(createDraftSaveQueue());
  const [retrySave, setRetrySave] = useState(0);
  const [deletedBlock, setDeletedBlock] = useState<{
    block: Block;
    index: number;
  } | null>(null);

  const publishBlockers = lockedDesignFeatures(profile.design, plan);
  const hasPendingSave =
    profileDirty.current || blocksDirty.current || status === "saving";

  useEffect(() => {
    const detail: EditorDraftState = {
      hasChanges: hasLocalChanges,
      revision: editVersion.current,
      saving: hasPendingSave,
      saveError: status === "error",
      blockers: publishBlockers,
    };
    window.dispatchEvent(
      new CustomEvent<EditorDraftState>(EDITOR_DRAFT_STATE_EVENT, { detail }),
    );
  }, [
    hasLocalChanges,
    hasPendingSave,
    profile.design,
    publishBlockers.join("|"),
    status,
  ]);

  useEffect(() => {
    const onPublished = () => setHasLocalChanges(false);
    window.addEventListener(EDITOR_PUBLISHED_EVENT, onPublished);
    return () =>
      window.removeEventListener(EDITOR_PUBLISHED_EVENT, onPublished);
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const savePlanKey = JSON.stringify(plan);
  useEffect(() => {
    const queue = saveQueue.current;
    const revision = queue.invalidate();
    if (!blocksDirty.current && !profileDirty.current) return;
    setStatus("saving");
    const timer = setTimeout(() => {
      void queue.enqueue(revision, async () => {
        try {
          if (profileDirty.current) {
            const locked =
              lockedDesignFeatures(profile.design, plan).length > 0;
            const result = await saveProfile(profile.id, {
              display_name: profile.display_name,
              bio: profile.bio,
              avatar_url: profile.avatar_url,
              trackedLinks: profile.design.trackedLinks ?? [],
              ...(locked
                ? {}
                : { theme: profile.theme, design: profile.design }),
            });
            if (result?.error) throw new Error(result.error);
          }
          if (blocksDirty.current) {
            const result = await saveBlocks(profile.id, blocks);
            if (result?.error) throw new Error(result.error);
          }
          if (queue.isCurrent(revision)) {
            profileDirty.current = false;
            blocksDirty.current = false;
            setStatus("saved");
          }
        } catch (error) {
          if (queue.isCurrent(revision)) {
            setStatus("error");
            setNotice(
              error instanceof Error
                ? error.message
                : "Couldn't save. Your edits are still here — retry when connected.",
            );
          }
        }
      });
    }, 700);
    return () => {
      clearTimeout(timer);
      queue.invalidate();
    };
  }, [blocks, savePlanKey, profile, retrySave]);

  useEffect(() => {
    const warnBeforeLeaving = (event: BeforeUnloadEvent) => {
      if (!profileDirty.current && !blocksDirty.current) return;
      event.preventDefault();
      event.returnValue = "";
    };
    const guardNavigation = (event: MouseEvent) => {
      if (!profileDirty.current && !blocksDirty.current) return;
      const link = (event.target as Element).closest<HTMLAnchorElement>(
        "a[href]",
      );
      if (!link || link.target === "_blank" || event.metaKey || event.ctrlKey)
        return;
      const next = new URL(link.href, window.location.href);
      if (
        next.pathname === window.location.pathname &&
        next.search === window.location.search
      )
        return;
      event.preventDefault();
      event.stopPropagation();
      setNotice(
        "Your draft is still saving. Wait for Saved before leaving, or use Retry saving if the connection failed.",
      );
    };
    window.addEventListener("beforeunload", warnBeforeLeaving);
    document.addEventListener("click", guardNavigation, true);
    return () => {
      window.removeEventListener("beforeunload", warnBeforeLeaving);
      document.removeEventListener("click", guardNavigation, true);
    };
  }, []);

  function patchProfile(patch: Partial<ProfileState>) {
    profileDirty.current = true;
    editVersion.current += 1;
    setHasLocalChanges(true);
    // Manualna zmena temy/dizajnu = uz to nie je cisty template → zrus oznacenie.
    if ("theme" in patch || "design" in patch) setAppliedTemplate(null);
    setProfile((p) => ({ ...p, ...patch }));
  }

  /** Merge customizations over the latest design state. Rapid slider and chip
   * changes must never restore an older template object from a stale render. */
  function patchDesign(patch: Design) {
    profileDirty.current = true;
    editVersion.current += 1;
    setHasLocalChanges(true);
    setAppliedTemplate(null);
    setProfile((current) => ({
      ...current,
      design: { ...current.design, ...patch },
    }));
  }

  function resetDesign() {
    profileDirty.current = true;
    editVersion.current += 1;
    setHasLocalChanges(true);
    setAppliedTemplate(null);
    setProfile((current) => ({
      ...current,
      design: { trackedLinks: current.design.trackedLinks },
    }));
  }

  /**
   * Vyber temy zahodi FAREBNE prepisy z designu (pozadie, farby tlacidiel,
   * styl), aby zvolena tema naozaj bola vidno. Ponecha typografiu a tvar —
   * to su preferencie, nie farby konkretnej temy. Bez toho by farby zo
   * sablony maskovali kazdu novo zvolenu temu.
   */
  function pickTheme(key: string) {
    profileDirty.current = true;
    editVersion.current += 1;
    setHasLocalChanges(true);
    setAppliedTemplate(null);
    setProfile((p) => ({
      ...p,
      theme: key,
      design: {
        trackedLinks: p.design.trackedLinks,
        profileLayout: p.design.profileLayout,
        contentWidth: p.design.contentWidth,
        font: p.design.font,
        fontHeading: p.design.fontHeading,
        nameSize: p.design.nameSize,
        handleSize: p.design.handleSize,
        bioSize: p.design.bioSize,
        profileTextAlign: p.design.profileTextAlign,
        avatarVideo: p.design.avatarVideo,
        avatarVideoPoster: p.design.avatarVideoPoster,
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
    editVersion.current += 1;
    setHasLocalChanges(true);
    setBlocks(fn);
  }

  /**
   * Link Shield sa uklada samostatnou akciou (nie cez debounced autosave) a
   * plati okamzite. Preto NEnastavujeme profileDirty — autosave sa nespusti.
   */
  async function toggleShield(next: boolean) {
    setShieldBusy(true);
    setProfile((p) => ({ ...p, link_shield: next }));
    try {
      const result = await setLinkShield(profile.id, next);
      if (result?.error) throw new Error(result.error);
    } catch (error) {
      setProfile((current) => ({ ...current, link_shield: !next }));
      setNotice(
        error instanceof Error
          ? error.message
          : "Could not save the setting. Try again.",
      );
    } finally {
      setShieldBusy(false);
    }
  }

  async function toggleEscape(next: boolean) {
    setEscapeBusy(true);
    setProfile((p) => ({ ...p, escape_inapp: next }));
    try {
      const result = await setEscapeInApp(profile.id, next);
      if (result?.error) throw new Error(result.error);
    } catch (error) {
      setProfile((current) => ({ ...current, escape_inapp: !next }));
      setNotice(
        error instanceof Error
          ? error.message
          : "Could not save the setting. Try again.",
      );
    } finally {
      setEscapeBusy(false);
    }
  }

  async function toggleCreator(next: boolean) {
    setCreatorBusy(true);
    setProfile((p) => ({ ...p, creator_mode: next }));
    try {
      const result = await setCreatorMode(profile.id, next);
      if (result?.error) throw new Error(result.error);
    } catch (error) {
      setProfile((current) => ({ ...current, creator_mode: !next }));
      setNotice(
        error instanceof Error
          ? error.message
          : "Could not save the setting. Try again.",
      );
    } finally {
      setCreatorBusy(false);
    }
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
    const id = crypto.randomUUID();
    patchBlocks((prev) => [
      ...prev,
      {
        id,
        type,
        config: defaultConfig(type),
        position: prev.length,
        is_active: true,
      },
    ]);
    setPaletteOpen(false);
    selectFromPreview({ kind: "block", id });
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
    const id = crypto.randomUUID();
    patchBlocks((prev) => [
      ...prev,
      {
        id,
        type: "headline",
        config: {
          text: "New section",
          isSection: true,
          sectionBg: "#ffffff",
          sectionText: "#191813",
          sectionBorder: "#e7e4dc",
          sectionRadius: "rounded",
          sectionLayout: "stack",
        },
        position: prev.length,
        is_active: true,
      },
    ]);
    setPaletteOpen(false);
    selectFromPreview({ kind: "block", id });
  }

  function removeBlock(id: string) {
    const index = blocks.findIndex((block) => block.id === id);
    if (index < 0) return;
    setDeletedBlock({ block: blocks[index], index });
    patchBlocks((previous) => previous.filter((block) => block.id !== id));
    if (openBlockId === id) setOpenBlockId(null);
  }

  function undoDelete() {
    if (!deletedBlock) return;
    const { block, index } = deletedBlock;
    patchBlocks((previous) => {
      if (previous.some((item) => item.id === block.id)) return previous;
      const next = [...previous];
      next.splice(Math.min(index, next.length), 0, block);
      return next;
    });
    setDeletedBlock(null);
    selectFromPreview({ kind: "block", id: block.id });
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
    patchBlocks((previous) =>
      reorderBlocks(previous, String(active.id), String(over.id)),
    );
  }

  function selectFromPreview(
    target: { kind: "profile" } | { kind: "block"; id: string },
  ) {
    setTab("edit");
    setWorkspace("content");
    if (target.kind === "profile") {
      setProfileOpen(true);
      requestAnimationFrame(() =>
        document
          .getElementById("editor-profile")
          ?.scrollIntoView({ behavior: "smooth", block: "start" }),
      );
      return;
    }
    setBlocksOpen(true);
    setOpenBlockId(target.id);
    requestAnimationFrame(() => {
      const blockEditor = document.getElementById(`block-editor-${target.id}`);
      blockEditor?.scrollIntoView({ behavior: "smooth", block: "center" });
      blockEditor
        ?.querySelector<HTMLInputElement>("input:not([type=hidden])")
        ?.focus({ preventScroll: true });
    });
  }

  // Drag-to-reorder priamo na preview — presunie blok na pozíciu druhého v
  // plnom poli blokov (podľa id, takže to sedí aj s neaktívnymi/sekciami).
  function reorderFromPreview(activeId: string, overId: string) {
    patchBlocks((previous) => reorderBlocks(previous, activeId, overId));
  }

  function customizeButton(id: string) {
    setWorkspace("design");
    setDesignMode("customise");
    setDesignTab("buttons");
    setButtonTarget(id);
    requestAnimationFrame(() =>
      document
        .getElementById("editor-design-studio")
        ?.scrollIntoView({ behavior: "smooth", block: "start" }),
    );
  }

  // Template aplikuje IBA dizajn (tema + farby/buttony) — bloky uzivatela
  // ostavaju nedotknute. Ziadny medzi-dialog, klik = okamzita zmena vzhladu.
  function applyTemplate(template: Template) {
    const previewOnly = template.premium === true && !plan.customDesign;
    if (previewOnly) { setNotice("This template is available on Pro. Your current design has been kept."); return; }
    if (!previewOnly) profileDirty.current = true;
    editVersion.current += 1;
    setHasLocalChanges(true);
    setProfile((p) => ({
      ...p,
      theme: template.theme,
      design: {
        ...(previewOnly
          ? template.design
          : designForPlan(template.design, plan)),
        trackedLinks: p.design.trackedLinks,
      },
    }));
    setAppliedTemplate(template.key);
    setNotice(
      previewOnly
        ? `Previewing “${template.label}”. Upgrade to publish its premium design features.`
        : `“${template.label}” applied — your links were kept.`,
    );
  }

  const caps = designCaps(plan);
  // Preview ukazuje presne lokalny draft, aj ked obsahuje Pro funkcie. Server
  // ich na Free nikdy neulozi a publish toolbar presne vypise, co blokuje live.
  const theme = resolveTheme(profile.theme, profile.design);
  const previewBlocks = blocks.filter(isVisibleNow);
  const workspacePanel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const animation = workspacePanel.current?.animate(
      [{ opacity: 0.45, translate: "0 6px" }, { opacity: 1, translate: "0 0" }],
      { duration: 180, easing: "ease-out" },
    );
    return () => animation?.cancel();
  }, [workspace]);

  const previewBranding = !(plan.hideBranding && profile.hide_branding);
  return (
    <div className="studio-editor">
      <div className="studio-toolbar">
        <nav className="studio-tabs" aria-label="Page editor">
          {(["content", "design", "share", "settings"] as const).map((item) => (
            <button
              key={item}
              type="button"
              aria-pressed={workspace === item}
              onClick={() => {
                setWorkspace(item);
                setTab("edit");
              }}
            >
              {item === "share"
                ? "Share & track"
                : item.charAt(0).toUpperCase() + item.slice(1)}
            </button>
          ))}
        </nav>
        {publishControls}
      </div>
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

      <div className="studio-workspace">
        {/* ---------- Editor column ---------- */}
        <div ref={workspacePanel} className={tab === "edit" ? "" : "hidden lg:block"}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-xl font-semibold tracking-tight">
                {
                  {
                    content: "Build your page",
                    design: "Make it yours",
                    share: "Share your page",
                    settings: "Page settings",
                  }[workspace]
                }
              </h1>
              <p className="mt-1 text-sm text-soft">
                {
                  {
                    content:
                      "Your profile, links and media — in the order visitors see them.",
                    design:
                      "Choose a complete look or adjust one detail at a time.",
                    share:
                      "One page. Separate links for every account and campaign.",
                    settings:
                      "Control privacy and how visitors open your links.",
                  }[workspace]
                }
              </p>
            </div>
            <div className="shrink-0 text-right">
              <StatusPill status={status} />
              {status === "error" && (
                <button
                  type="button"
                  className="ml-2 text-xs font-semibold underline"
                  onClick={() => {
                    setNotice(null);
                    setRetrySave((value) => value + 1);
                  }}
                >
                  Retry saving
                </button>
              )}
            </div>
          </div>

          {notice && (
            <div
              role="status"
              className="studio-notice mt-4 flex flex-wrap items-center justify-between gap-3"
            >
              <span>{notice}</span>
              <button
                type="button"
                onClick={() => setNotice(null)}
                className="shrink-0 text-xs underline underline-offset-2"
              >
                Dismiss
              </button>
            </div>
          )}

          <div className="mt-5 space-y-3">
            <div className="studio-pane" hidden={workspace !== "content"}>
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
                    onChange={(avatar_url) => {
                      patchProfile({ avatar_url });
                      patchDesign({ avatarVideo: undefined, avatarVideoPoster: undefined });
                    }}
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
            </div>
            <div className="studio-pane" hidden={workspace !== "design"}>
              {buttonTarget !== "all" && designTab === "buttons" && (
                <button
                  type="button"
                  className="mb-3 text-xs font-medium text-soft hover:text-ink"
                  onClick={() =>
                    selectFromPreview({ kind: "block", id: buttonTarget })
                  }
                >
                  ← Back to content
                </button>
              )}
              <div
                className="studio-design-modes"
                aria-label="Appearance options"
              >
                <button
                  type="button"
                  aria-pressed={designMode === "templates"}
                  onClick={() => setDesignMode("templates")}
                >
                  Templates
                </button>
                <button
                  type="button"
                  aria-pressed={designMode === "customise"}
                  onClick={() => setDesignMode("customise")}
                >
                  Customise
                </button>
              </div>
              <div
                hidden={designMode !== "templates"}
                className="studio-design-panel card p-4"
              >
                <p className="mb-4 text-sm text-soft">
                  A complete look in one click. Your content stays in place.
                </p>
                <TemplateGrid
                  onPick={(t) => applyTemplate(t)}
                  selectedKey={appliedTemplate}
                  canUsePremium={plan.customDesign}
                  onLocked={(t) =>
                    setNotice(
                      `${t.label} is a Pro template. Free includes Paper and Mono. Your current design stays unchanged.`,
                    )
                  }
                />
              </div>
              <div
                hidden={designMode !== "customise"}
                id="editor-design-studio"
                className="studio-design-panel scroll-mt-24"
              >
                <DesignPanel
                  design={profile.design}
                  caps={caps}
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
                  onChange={patchDesign}
                  onReset={resetDesign}
                  onUpsell={() =>
                    setNotice(
                      "That's a Pro design feature — upgrade to unlock it.",
                    )
                  }
                  tab={designTab}
                  onTabChange={setDesignTab}
                  linkBlocks={blocks.filter((block) => block.type === "link")}
                  buttonTarget={buttonTarget}
                  onButtonTargetChange={setButtonTarget}
                  onLinkChange={(id, configPatch) =>
                    patchBlocks((prev) =>
                      prev.map((block) =>
                        block.id === id
                          ? {
                              ...block,
                              config: { ...block.config, ...configPatch },
                            }
                          : block,
                      ),
                    )
                  }
                />
              </div>
            </div>
            <div className="studio-pane" hidden={workspace !== "settings"}>
              {/* Protection — Link Shield + escape z in-app prehliadaca v JEDNEJ
                karte: obe su ochranne prepinace, patria k sebe. Dva symetricke
                riadky (nazov + popis + Switch), oddelene ciarou. */}
              <Section
                title="Privacy & link behaviour"
                defaultOpen
                subtitle="link privacy · real browser"
                delay={180}
                badge={(() => {
                  if (!plan.linkShield && !plan.escapeInApp) return <Lock />;
                  const n =
                    (plan.creatorMode && profile.creator_mode ? 1 : 0) +
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
                    <p className="pb-4 text-xs text-soft">
                      These settings apply immediately to your live page.
                    </p>
                    {/* Creator / Stealth mode — master ochranny prepinac */}
                    {plan.creatorMode && (
                      <div className="py-5">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <p className="flex items-center gap-2 text-sm font-medium">
                              Creator mode
                              <span className="rounded-full bg-ink px-2 py-0.5 text-[9px] font-bold tracking-widest text-paper uppercase">
                                Stealth
                              </span>
                            </p>
                            <p className="mt-1 max-w-md text-xs leading-relaxed text-soft">
                              Hides your page from search and serves platform
                              crawlers a clean page — no bio, photo or links to
                              scrape. Combine it with Link Shield and Open
                              externally below; each works on its own.{" "}
                              <Link
                                href="/safe"
                                target="_blank"
                                className="font-medium text-ink underline underline-offset-2"
                              >
                                Safe sharing guide →
                              </Link>
                            </p>
                          </div>
                          <Switch
                            label="Creator mode"
                            on={profile.creator_mode}
                            busy={creatorBusy}
                            onToggle={toggleCreator}
                          />
                        </div>
                      </div>
                    )}

                    {/* Link Shield */}
                    <div className="flex items-start justify-between gap-4 py-5">
                      <div className="min-w-0">
                        <p className="text-sm font-medium">Link Shield</p>
                        <p className="mt-1 max-w-md text-xs leading-relaxed text-soft">
                          A neutral confirmation step (with an optional 18+
                          check) before sensitive links. The destination stays
                          out of your page&apos;s code and previews, so it
                          can&apos;t be scraped. Always follow each
                          platform&apos;s own rules.
                        </p>
                      </div>
                      <Switch
                        label="Link Shield"
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
                        label="Open externally"
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
                    <Link
                      href="/#pricing"
                      className="btn-ink px-4 py-2 text-sm"
                    >
                      Upgrade
                    </Link>
                  </div>
                )}
              </Section>
              <section className="card mt-4 p-5" aria-labelledby="profile-deletion-heading">
                <h2 id="profile-deletion-heading" className="text-sm font-semibold">Delete this profile</h2>
                <p className="mt-2 mb-3 text-sm text-soft">
                  Permanently remove @{profile.username} and its content. Your other profiles stay.
                </p>
                <DeleteProfileButton
                  profileId={profile.id}
                  username={profile.username}
                  disabled={hasPendingSave || shieldBusy || escapeBusy || creatorBusy}
                />
              </section>
            </div>
            <div className="studio-pane" hidden={workspace !== "content"}>
              {/* 4 — Blocks (otvorene) */}
              <Section
                title="Page content"
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
                  className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-ink bg-ink text-white px-4 py-3 text-sm font-medium transition hover:border-ink"
                >
                  Add content +
                </button>

                {paletteOpen && (
                  <ContentPicker
                    plan={plan}
                    onPick={addBlock}
                    onSection={addSection}
                    onClose={() => setPaletteOpen(false)}
                  />
                )}

                {deletedBlock && (
                  <div
                    className="mt-3 flex items-center justify-between rounded-lg bg-indigo-50 px-3 py-2 text-sm"
                    role="status"
                  >
                    <span>Content removed from your draft.</span>
                    <button
                      type="button"
                      onClick={undoDelete}
                      className="font-semibold text-indigo-700"
                    >
                      Undo
                    </button>
                  </div>
                )}
                {blocks.length === 0 && (
                  <p className="py-8 text-center text-sm text-soft">
                    Start with a link, photo or social account.
                    <br />
                    You can reorder everything later.
                  </p>
                )}
                <div className="mt-4 space-y-2.5">
                  <DndContext
                    id={`editor-${profile.id}`}
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
                        <div
                          key={block.id}
                          id={`block-editor-${block.id}`}
                          className="scroll-mt-24"
                        >
                          <BlockCard
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
                            onCustomizeButton={() => customizeButton(block.id)}
                            open={openBlockId === block.id}
                            onOpenChange={(open) =>
                              setOpenBlockId(open ? block.id : null)
                            }
                          />
                        </div>
                      ))}
                    </SortableContext>
                  </DndContext>
                </div>

                {blocks.length === 0 && (
                  <p className="mt-4 rounded-2xl border border-dashed border-line p-10 text-center text-sm text-soft">
                    Nothing here yet — add your first block above.
                  </p>
                )}
              </Section>{" "}
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
                          ? {
                              ...p.design,
                              ...draft.design,
                              trackedLinks: p.design.trackedLinks,
                            }
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
                        // Klon z inej linkovne stranky nesie aj vzhlad — prenesieme
                        // ho v ramci planu (rovnako ako AI draft vyssie).
                        theme:
                          result.theme && allowsTheme(plan, result.theme)
                            ? result.theme
                            : p.theme,
                        design:
                          result.design && plan.customDesign
                            ? {
                                ...p.design,
                                ...result.design,
                                trackedLinks: p.design.trackedLinks,
                              }
                            : p.design,
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
            </div>
            {workspace === "share" && (
              <ShareCard
                username={profile.username}
                isPublished={isPublished}
                trackedLinks={profile.design.trackedLinks ?? []}
                onTrackedLinksChange={(trackedLinks) =>
                  patchDesign({ trackedLinks })
                }
              />
            )}
          </div>
        </div>

        {/* ---------- Preview column ---------- */}
        <div
          className={`${tab === "preview" ? "" : "hidden lg:block"} studio-preview-column`}
        >
          <Preview
            profileId={profile.id}
            displayName={profile.display_name}
            username={profile.username}
            bio={profile.bio}
            avatarUrl={profile.avatar_url}
            blocks={previewBlocks}
            theme={theme}
            showBranding={previewBranding}
            onSelect={selectFromPreview}
            onReorder={reorderFromPreview}
          />
        </div>
      </div>
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
  const [uploadError, setUploadError] = useState<string | null>(null);

  return (
    <div className="flex flex-wrap items-center gap-4">
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
          setUploadError(null);
          try {
            onChange(await uploadImage(file, userId));
          } catch (error) {
            setUploadError(
              error instanceof Error
                ? error.message
                : "Upload failed. Please try again.",
            );
          } finally {
            e.target.value = "";
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
      {uploadError && (
        <p role="alert" className="w-full text-sm text-danger">
          {uploadError}
        </p>
      )}
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
