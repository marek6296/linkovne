"use client";

import { useEffect, useState } from "react";
import type { Theme } from "@/lib/themes";
import { LogoMark } from "@/components/logo-mark";

/**
 * Plavajuce prvky na verejnom profile — rastovy loop pre Linkovne:
 *  • vlavo hore: marketing button → popup „zaloz si vlastnu Linkovne" (len ak
 *    profil ukazuje branding — free vzdy, Pro+ ked si nevypol),
 *  • vpravo hore: share button → pekny share modal s nahladom a zdielanim.
 */
export function ProfileWidgets({
  name,
  username,
  avatarUrl,
  siteUrl,
  siteDomain,
  showPromo,
  theme,
}: {
  name: string;
  username: string;
  avatarUrl: string | null;
  siteUrl: string;
  siteDomain: string;
  showPromo: boolean;
  theme: Theme;
}) {
  const [open, setOpen] = useState<null | "promo" | "share">(null);
  // `render` drzi modal v DOM pocas zatvaracej animacie — `open` sa vynuluje
  // az po nej, aby sme nezmizli obsah pred dobehnutim prechodu.
  const [render, setRender] = useState(false);
  const [entered, setEntered] = useState(false);
  const [pageUrl, setPageUrl] = useState(`${siteUrl}/${username}`);
  const [claim, setClaim] = useState("");
  const [copied, setCopied] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);

  useEffect(() => {
    setPageUrl(window.location.href.split("?")[0]);
    setCanNativeShare(typeof navigator !== "undefined" && !!navigator.share);
  }, []);

  function openModal(type: "promo" | "share") {
    setOpen(type);
    setRender(true);
    requestAnimationFrame(() => requestAnimationFrame(() => setEntered(true)));
  }

  function closeModal() {
    setEntered(false);
    window.setTimeout(() => {
      setRender(false);
      setOpen(null);
    }, 220);
  }

  const btnStyle: React.CSSProperties = {
    background: theme.btnBg,
    color: theme.btnText,
    border: theme.btnBorder,
    boxShadow: theme.btnShadow,
    backdropFilter: theme.btnBackdrop,
    WebkitBackdropFilter: theme.btnBackdrop,
  };

  const enc = encodeURIComponent;
  const shareTargets = [
    { key: "x", label: "X", href: `https://twitter.com/intent/tweet?text=${enc(name)}&url=${enc(pageUrl)}` },
    { key: "wa", label: "WhatsApp", href: `https://wa.me/?text=${enc(name + " " + pageUrl)}` },
    { key: "tg", label: "Telegram", href: `https://t.me/share/url?url=${enc(pageUrl)}&text=${enc(name)}` },
    { key: "fb", label: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${enc(pageUrl)}` },
  ];

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(pageUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {}
  }

  async function nativeShare() {
    try {
      await navigator.share({ title: name, url: pageUrl });
    } catch {}
  }

  return (
    <>
      {/* Top bar — zarovnany k vrchu karty profilu (na desktope k okrajom karty). */}
      <div className="absolute inset-x-0 top-4 z-40 mx-auto flex w-full max-w-[26rem] items-center justify-between px-6">
        {showPromo ? (
          <button
            type="button"
            onClick={() => openModal("promo")}
            aria-label="About linkovne"
            className="flex h-10 w-10 items-center justify-center rounded-full transition hover:opacity-90"
            style={btnStyle}
          >
            <LogoMark className="h-[22px] w-[22px]" />
          </button>
        ) : (
          <span />
        )}
        <button
          type="button"
          onClick={() => openModal("share")}
          aria-label="Share this page"
          className="flex h-10 w-10 items-center justify-center rounded-full transition hover:opacity-90"
          style={btnStyle}
        >
          <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7" />
            <path d="M16 6l-4-4-4 4" />
            <path d="M12 2v14" />
          </svg>
        </button>
      </div>

      {/* Backdrop + modal — fade + slide/scale, rovnaky prechod pri otvoreni aj zatvoreni */}
      {render && (
        <div
          className={`fixed inset-0 z-[60] flex items-end justify-center p-0 transition-colors duration-200 ease-out sm:items-center sm:p-4 ${
            entered ? "bg-black/50" : "bg-black/0"
          }`}
          onClick={closeModal}
        >
          <div
            className={`w-full max-w-md overflow-hidden rounded-t-3xl bg-white text-neutral-900 shadow-2xl transition-all duration-[220ms] ease-out sm:rounded-3xl ${
              entered
                ? "translate-y-0 opacity-100 sm:scale-100"
                : "translate-y-6 opacity-0 sm:translate-y-2 sm:scale-95"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {open === "promo" ? (
              <PromoModal
                siteUrl={siteUrl}
                siteDomain={siteDomain}
                claim={claim}
                setClaim={setClaim}
                onClose={closeModal}
              />
            ) : (
              <ShareModal
                name={name}
                username={username}
                avatarUrl={avatarUrl}
                siteDomain={siteDomain}
                siteUrl={siteUrl}
                pageUrl={pageUrl}
                showPromo={showPromo}
                copied={copied}
                copyLink={copyLink}
                canNativeShare={canNativeShare}
                nativeShare={nativeShare}
                shareTargets={shareTargets}
                onClose={closeModal}
              />
            )}
          </div>
        </div>
      )}
    </>
  );
}

function CloseBtn({ onClose }: { onClose: () => void }) {
  return (
    <button
      type="button"
      onClick={onClose}
      aria-label="Close"
      className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full text-neutral-500 transition hover:bg-neutral-100"
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M6 6l12 12M18 6L6 18" />
      </svg>
    </button>
  );
}

function PromoModal({
  siteUrl,
  siteDomain,
  claim,
  setClaim,
  onClose,
}: {
  siteUrl: string;
  siteDomain: string;
  claim: string;
  setClaim: (v: string) => void;
  onClose: () => void;
}) {
  const clean = claim.trim().toLowerCase().replace(/[^a-z0-9_.]/g, "");
  const href = clean
    ? `${siteUrl}/register?u=${encodeURIComponent(clean)}`
    : `${siteUrl}/register`;
  return (
    <div className="relative p-7">
      <CloseBtn onClose={onClose} />
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-neutral-900 text-white">
        <LogoMark className="h-6 w-6" />
      </span>
      <h2 className="mt-4 font-grotesk text-2xl font-extrabold tracking-tight">
        Your link, built to last.
      </h2>
      <p className="mt-2 text-[15px] leading-relaxed text-neutral-600">
        Put all your links on one page and your own domain — free, ready in two
        minutes.
      </p>

      <div className="mt-5 flex items-stretch overflow-hidden rounded-xl border border-neutral-200 focus-within:border-neutral-900">
        <span className="flex items-center pl-3.5 text-sm text-neutral-400">
          {siteDomain}/
        </span>
        <input
          value={claim}
          onChange={(e) => setClaim(e.target.value)}
          placeholder="yourname"
          spellCheck={false}
          className="w-full bg-transparent py-3 pr-3 pl-0.5 text-sm outline-none placeholder:text-neutral-400"
        />
      </div>

      <a
        href={href}
        className="gradient-button mt-3 flex w-full items-center justify-center px-6 py-3.5 text-sm"
      >
        Claim your page
      </a>
      <p className="mt-3 text-center text-xs text-neutral-400">
        Free · No card required
      </p>
    </div>
  );
}

function ShareModal({
  name,
  username,
  avatarUrl,
  siteDomain,
  siteUrl,
  pageUrl,
  showPromo,
  copied,
  copyLink,
  canNativeShare,
  nativeShare,
  shareTargets,
  onClose,
}: {
  name: string;
  username: string;
  avatarUrl: string | null;
  siteDomain: string;
  siteUrl: string;
  pageUrl: string;
  showPromo: boolean;
  copied: boolean;
  copyLink: () => void;
  canNativeShare: boolean;
  nativeShare: () => void;
  shareTargets: { key: string; label: string; href: string }[];
  onClose: () => void;
}) {
  return (
    <div className="relative">
      <div className="relative px-7 pt-6 pb-5">
        <h3 className="text-center text-base font-bold">Share</h3>
        <CloseBtn onClose={onClose} />
      </div>

      {/* Preview card */}
      <div className="px-7">
        <div className="flex flex-col items-center rounded-2xl bg-neutral-900 px-6 py-7 text-white">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt="" className="h-20 w-20 rounded-full object-cover" />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/15 text-3xl font-bold">
              {(name || username).charAt(0).toUpperCase()}
            </div>
          )}
          <p className="mt-3 text-lg font-bold">{name}</p>
          <p className="text-sm text-white/60">
            {siteDomain}/{username}
          </p>
        </div>
      </div>

      {/* Targets */}
      <div className="flex flex-wrap justify-center gap-5 px-7 py-6">
        <ShareIcon label={copied ? "Copied" : "Copy link"} onClick={copyLink} tone="#f3f4f6" fg="#111827">
          <path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1" /><path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1" />
        </ShareIcon>
        {canNativeShare && (
          <ShareIcon label="Share…" onClick={nativeShare} tone="#f3f4f6" fg="#111827">
            <path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7" /><path d="M16 6l-4-4-4 4" /><path d="M12 2v14" />
          </ShareIcon>
        )}
        {shareTargets.map((t) => (
          <a key={t.key} href={t.href} target="_blank" rel="noopener noreferrer" className="flex w-16 flex-col items-center gap-1.5">
            <span className="flex h-12 w-12 items-center justify-center rounded-full" style={{ background: BRAND_TONE[t.key] }}>
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="#fff" aria-hidden dangerouslySetInnerHTML={{ __html: BRAND_PATH[t.key] }} />
            </span>
            <span className="text-xs text-neutral-600">{t.label}</span>
          </a>
        ))}
      </div>

      {/* Join CTA */}
      {showPromo && (
        <a
          href={`${siteUrl}/register`}
          className="flex items-center justify-between gap-3 border-t border-neutral-100 px-7 py-4 transition hover:bg-neutral-50"
        >
          <span className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-neutral-900 text-white">
              <LogoMark className="h-5 w-5" />
            </span>
            <span className="text-sm">
              <span className="font-semibold">Create your own linkovne</span>
              <span className="block text-xs text-neutral-500">Free · one link that lasts</span>
            </span>
          </span>
          <span className="rounded-full bg-neutral-900 px-4 py-2 text-xs font-semibold text-white">
            Sign up
          </span>
        </a>
      )}
    </div>
  );
}

function ShareIcon({
  label,
  onClick,
  tone,
  fg,
  children,
}: {
  label: string;
  onClick: () => void;
  tone: string;
  fg: string;
  children: React.ReactNode;
}) {
  return (
    <button type="button" onClick={onClick} className="flex w-16 flex-col items-center gap-1.5">
      <span className="flex h-12 w-12 items-center justify-center rounded-full" style={{ background: tone }}>
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke={fg} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {children}
        </svg>
      </span>
      <span className="text-xs text-neutral-600">{label}</span>
    </button>
  );
}

const BRAND_TONE: Record<string, string> = {
  x: "#000000",
  wa: "#25D366",
  tg: "#229ED9",
  fb: "#1877F2",
};

// Jednoduche brand glyphy (biele na farebnom kruhu).
const BRAND_PATH: Record<string, string> = {
  x: '<path d="M18.244 2h3.308l-7.227 8.26L22.5 22h-6.75l-5.286-6.91L4.4 22H1.09l7.73-8.835L1.5 2h6.918l4.78 6.32L18.244 2Zm-1.16 18h1.833L7.01 3.9H5.04L17.083 20Z"/>',
  wa: '<path d="M12.04 2a9.9 9.9 0 0 0-8.46 15.07L2 22l5.05-1.32A9.9 9.9 0 1 0 12.04 2Zm5.8 14.09c-.25.7-1.44 1.34-1.98 1.38-.53.05-1.02.24-3.44-.72-2.9-1.14-4.73-4.13-4.87-4.32-.14-.19-1.16-1.54-1.16-2.94s.73-2.08 1-2.37c.26-.29.57-.36.76-.36l.55.01c.18.01.42-.07.65.5.25.6.84 2.08.91 2.23.07.14.12.31.02.5-.09.19-.14.31-.28.48-.14.16-.29.37-.42.49-.14.14-.28.29-.12.57.16.28.72 1.18 1.54 1.91 1.06.95 1.96 1.24 2.24 1.38.28.14.44.12.6-.07.16-.19.69-.8.87-1.08.18-.28.37-.23.62-.14.25.09 1.6.75 1.87.89.28.14.46.21.53.32.07.12.07.66-.18 1.36Z"/>',
  tg: '<path d="M21.94 4.3 18.9 19.1c-.23 1.02-.84 1.27-1.7.79l-4.7-3.46-2.27 2.18c-.25.25-.46.46-.94.46l.33-4.78 8.7-7.86c.38-.34-.08-.53-.59-.19L6.98 13.2l-4.63-1.45c-1.01-.32-1.02-1.01.21-1.5l18.1-6.98c.84-.31 1.57.2 1.28 1.03Z"/>',
  fb: '<path d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.78-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.44 2.89h-2.34v6.99A10 10 0 0 0 22 12Z"/>',
};
