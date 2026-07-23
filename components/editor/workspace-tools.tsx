"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import type { AuditIssue, BrandKit, ProfileVersion, SavedTemplate } from "@/lib/editor-pro";
import type { Design } from "@/lib/design";
import { FONT_KEYS, FONTS } from "@/lib/design";
import type { Block } from "@/lib/blocks";
import {
  applyBrandKitToAllProfiles,
  createProfileVersion,
  deleteSavedTemplate,
  restoreProfileVersion,
  saveBrandKit,
  saveCurrentTemplate,
} from "@/app/dashboard/actions";

export function EditorToolbar({ canUndo, canRedo, status, onUndo, onRedo, onReset, onAudit }: {
  canUndo: boolean; canRedo: boolean; status: string; onUndo: () => void; onRedo: () => void; onReset: () => void; onAudit: () => void;
}) {
  return <div className="mt-4 flex flex-wrap items-center gap-2 rounded-2xl border border-line bg-surface p-2">
    <button type="button" disabled={!canUndo} onClick={onUndo} className="rounded-xl px-3 py-2 text-sm transition hover:bg-paper disabled:opacity-35">↶ Undo</button>
    <button type="button" disabled={!canRedo} onClick={onRedo} className="rounded-xl px-3 py-2 text-sm transition hover:bg-paper disabled:opacity-35">↷ Redo</button>
    <span className="mx-1 h-5 w-px bg-line" />
    <span aria-live="polite" className="px-2 text-xs text-faint">{status}</span>
    <button type="button" onClick={onReset} className="ml-auto rounded-xl px-3 py-2 text-sm text-soft transition hover:bg-paper hover:text-ink">Reset current section</button>
    <button type="button" onClick={onAudit} className="rounded-xl bg-ink px-3.5 py-2 text-sm font-medium text-paper">Design checker</button>
  </div>;
}

export function DesignChecker({ issues, onFixAll, onOpen, onClose }: { issues: AuditIssue[]; onFixAll: () => void; onOpen: (id?: string) => void; onClose: () => void }) {
  const fixable = issues.some((x) => x.fix);
  return <div className="mt-3 rounded-2xl border border-line bg-paper p-4 shadow-lg">
    <div className="flex items-start justify-between gap-4"><div><h2 className="font-semibold">Design checker</h2><p className="mt-1 text-xs text-soft">Contrast, motion, accessibility, links and image weight.</p></div><button type="button" onClick={onClose} className="text-soft">×</button></div>
    {issues.length === 0 ? <div className="mt-4 rounded-xl bg-ok/10 p-4 text-sm text-ok">✓ Everything looks healthy.</div> : <div className="mt-4 space-y-2">{issues.map((issue) => <button type="button" key={issue.id} onClick={() => onOpen(issue.blockId)} className="flex w-full items-start gap-3 rounded-xl border border-line p-3 text-left transition hover:border-soft"><span className={issue.severity === "error" ? "text-danger" : "text-amber-600"}>●</span><span><span className="block text-sm font-medium">{issue.title}</span><span className="mt-0.5 block text-xs text-soft">{issue.detail}</span></span></button>)}</div>}
    {fixable && <button type="button" onClick={onFixAll} className="mt-4 w-full rounded-xl bg-ink py-2.5 text-sm font-medium text-paper">Fix automatically</button>}
  </div>;
}

export function SavedTemplatesPanel({ profileId, templates, onApply }: { profileId: string; templates: SavedTemplate[]; onApply: (template: SavedTemplate, withBlocks: boolean) => void }) {
  const [name, setName] = useState("My template");
  const [includeBlocks, setIncludeBlocks] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return <div className="space-y-4">
    <div className="rounded-xl border border-line p-4"><p className="text-sm font-semibold">Save this look</p><div className="mt-3 flex flex-wrap gap-2"><input value={name} onChange={(e) => setName(e.target.value)} maxLength={60} className="field min-w-[180px] flex-1 py-2" /><button type="button" disabled={pending} onClick={() => start(async () => { const r = await saveCurrentTemplate(profileId, name, includeBlocks); setMessage(r?.error ?? "Template saved. It will appear after refresh."); })} className="btn-ink px-4 py-2 text-sm">Save</button></div><label className="mt-3 flex items-center gap-2 text-xs text-soft"><input type="checkbox" checked={includeBlocks} onChange={(e) => setIncludeBlocks(e.target.checked)} /> Also save the current blocks</label>{message && <p className="mt-2 text-xs text-soft">{message}</p>}</div>
    {templates.length > 0 ? <div className="grid gap-2 sm:grid-cols-2">{templates.map((t) => <div key={t.id} className="rounded-xl border border-line p-3"><p className="truncate text-sm font-medium">{t.name}</p><p className="mt-0.5 text-[11px] text-faint">{t.blocks ? "Design + blocks" : "Design only"}{t.is_shared ? " · Shared" : ""}</p><div className="mt-3 flex gap-2"><button type="button" onClick={() => onApply(t, false)} className="rounded-full border border-line px-3 py-1.5 text-xs">Apply look</button>{t.blocks && <button type="button" onClick={() => onApply(t, true)} className="rounded-full border border-line px-3 py-1.5 text-xs">+ blocks</button>}<button type="button" aria-label="Delete template" onClick={() => start(async () => { await deleteSavedTemplate(profileId, t.id); location.reload(); })} className="ml-auto text-danger">×</button></div></div>)}</div> : <p className="text-sm text-soft">Your saved templates will appear here.</p>}
  </div>;
}

const EMPTY_KIT: BrandKit = { name: "Brand kit", logo_url: null, colors: {}, font: null, font_heading: null, button: {}, locked: false };

export function BrandKitPanel({ profileId, initial, onApply }: { profileId: string; initial: BrandKit | null; onApply: (kit: BrandKit) => void }) {
  const [kit, setKit] = useState(initial ?? EMPTY_KIT);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const color = (key: keyof BrandKit["colors"], fallback: string) => <label className="flex items-center justify-between gap-3 text-sm text-soft"><span>{key === "page" ? "Background" : key === "buttonText" ? "Button text" : key}</span><input type="color" value={kit.colors[key] ?? fallback} onChange={(e) => setKit({ ...kit, colors: { ...kit.colors, [key]: e.target.value } })} className="h-9 w-14 rounded-lg border border-line p-1" /></label>;
  return <div className="space-y-4"><div className="grid gap-4 rounded-xl border border-line p-4 sm:grid-cols-2"><label className="sm:col-span-2"><span className="mb-1 block text-xs text-soft">Kit name</span><input value={kit.name} onChange={(e) => setKit({ ...kit, name: e.target.value })} className="field py-2" /></label>{color("page", "#ffffff")}{color("text", "#111111")}{color("button", "#111111")}{color("buttonText", "#ffffff")}<label><span className="mb-1 block text-xs text-soft">Body font</span><select value={kit.font ?? "sans"} onChange={(e) => setKit({ ...kit, font: e.target.value })} className="field py-2">{FONT_KEYS.map((k) => <option key={k} value={k}>{FONTS[k].label}</option>)}</select></label><label><span className="mb-1 block text-xs text-soft">Heading font</span><select value={kit.font_heading ?? "sans"} onChange={(e) => setKit({ ...kit, font_heading: e.target.value })} className="field py-2">{FONT_KEYS.map((k) => <option key={k} value={k}>{FONTS[k].label}</option>)}</select></label><label className="sm:col-span-2 flex items-start gap-2 text-sm"><input type="checkbox" checked={kit.locked} onChange={(e) => setKit({ ...kit, locked: e.target.checked })} /><span><span className="font-medium">Lock design for clients</span><span className="block text-xs text-soft">Marks this as the agency-approved visual system.</span></span></label></div><div className="flex flex-wrap gap-2"><button type="button" onClick={() => onApply(kit)} className="rounded-xl border border-line px-4 py-2 text-sm">Apply here</button><button type="button" disabled={pending} onClick={() => start(async () => { const r = await saveBrandKit(profileId, kit); setMessage(r?.error ?? "Brand Kit saved."); })} className="btn-ink px-4 py-2 text-sm">Save kit</button><button type="button" disabled={pending} onClick={() => start(async () => { const r = await applyBrandKitToAllProfiles(profileId); setMessage(r?.error ?? "Applied to every profile."); })} className="rounded-xl border border-line px-4 py-2 text-sm">Apply to all profiles</button></div>{message && <p className="text-xs text-soft">{message}</p>}</div>;
}

export function VersionHistory({ profileId, versions, days }: { profileId: string; versions: ProfileVersion[]; days: number }) {
  const [pending, start] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  return <div><div className="mb-4 flex items-center justify-between gap-3"><p className="text-xs text-soft">Automatic restore points are kept for {days} days.</p><button type="button" disabled={pending} onClick={() => start(async () => { const r = await createProfileVersion(profileId, "Manual version"); setMessage(r?.error ?? "Version created. Refresh to see it."); })} className="rounded-full border border-line px-3 py-1.5 text-xs">+ Save version</button></div>{versions.length ? <div className="space-y-2">{versions.map((v) => <div key={v.id} className="flex items-center justify-between gap-3 rounded-xl border border-line p-3"><div><p className="text-sm font-medium">{v.reason}</p><p className="text-[11px] text-faint">{new Date(v.created_at).toLocaleString()}</p></div><button type="button" disabled={pending} onClick={() => start(async () => { if (!confirm("Restore this version? The current state will be saved first.")) return; await createProfileVersion(profileId, "Before restore"); const r = await restoreProfileVersion(profileId, v.id); if (r?.error) setMessage(r.error); else location.reload(); })} className="rounded-full border border-line px-3 py-1.5 text-xs">Restore</button></div>)}</div> : <p className="rounded-xl border border-dashed border-line p-6 text-center text-sm text-soft">No restore points yet.</p>}{message && <p className="mt-3 text-xs text-soft">{message}</p>}</div>;
}

export function PremiumWorkspaceLock({ label }: { label: string }) {
  return <div className="flex items-center justify-between gap-3 rounded-xl border border-dashed border-line p-4 text-sm text-soft"><span>🔒 {label}</span><Link href="/#pricing" className="btn-ink px-3 py-1.5 text-xs">Upgrade</Link></div>;
}

export function applyKitDesign(current: Design, kit: BrandKit): Design {
  return { ...current, bg: kit.colors.page ? "solid" : current.bg, bgColor: kit.colors.page, textColor: kit.colors.text, btnBg: kit.colors.button, btnText: kit.colors.buttonText, font: (kit.font as Design["font"]) ?? current.font, fontHeading: (kit.font_heading as Design["fontHeading"]) ?? current.fontHeading, ...(kit.button as Design) };
}

export type TemplateApplyChoice = { theme: string; design: Design; blocks?: Block[] | null };
