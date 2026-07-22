"use client";

import { useEffect, useState } from "react";
import { SquishyBg } from "@/components/squishy";
import { SITE_DOMAIN } from "@/lib/site";

// Jemne farebne dlazdice — par v palete (indigo/pink tint), zvysok teple.
const POST_TONES = [
  "#e7e3f7",
  "#c9c4b4",
  "#f7dbe8",
  "#b8b2a0",
  "#d4cfc0",
  "#efede6",
];

const HIGHLIGHTS = ["Shop", "Links", "New"];

const FOLLOW_FROM = 8200;
const FOLLOW_TO = 24300;
const CLICKS_TO = 1248;

function formatK(n: number) {
  return (n / 1000).toFixed(1).replace(/\.0$/, "") + "k";
}

/**
 * Animovane promo: profil zacne bez linku a s menej followermi, potom sa
 * prida linkovne.com/… , nabehne „All good", followers napocitaju hore a
 * prileti karticka s klikmi. Bezi v slucke. Miesto pre link je vyhradene, aby
 * sa okolity layout pri animacii nehybal. Respektuje prefers-reduced-motion.
 */
export function HeroMockup() {
  const [linkShown, setLinkShown] = useState(false);
  const [chip, setChip] = useState(false);
  const [clicksCard, setClicksCard] = useState(false);
  const [followers, setFollowers] = useState(FOLLOW_FROM);
  const [clicks, setClicks] = useState(0);

  useEffect(() => {
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (reduced) {
      setLinkShown(true);
      setChip(true);
      setClicksCard(true);
      setFollowers(FOLLOW_TO);
      setClicks(CLICKS_TO);
      return;
    }

    let timers: ReturnType<typeof setTimeout>[] = [];
    let intervals: ReturnType<typeof setInterval>[] = [];

    function clearAll() {
      timers.forEach(clearTimeout);
      intervals.forEach(clearInterval);
      timers = [];
      intervals = [];
    }

    function count(
      from: number,
      to: number,
      duration: number,
      set: (v: number) => void,
    ) {
      const steps = 40;
      let i = 0;
      const id = setInterval(() => {
        i++;
        const t = i / steps;
        const eased = 1 - Math.pow(1 - t, 3);
        set(Math.round(from + (to - from) * eased));
        if (i >= steps) clearInterval(id);
      }, duration / steps);
      intervals.push(id);
    }

    function run() {
      clearAll();
      setLinkShown(false);
      setChip(false);
      setClicksCard(false);
      setFollowers(FOLLOW_FROM);
      setClicks(0);

      timers.push(setTimeout(() => setLinkShown(true), 1100));
      timers.push(setTimeout(() => setChip(true), 1800));
      timers.push(
        setTimeout(() => count(FOLLOW_FROM, FOLLOW_TO, 1600, setFollowers), 2100),
      );
      timers.push(setTimeout(() => setClicksCard(true), 2900));
      timers.push(setTimeout(() => count(0, CLICKS_TO, 1600, setClicks), 3100));
      timers.push(setTimeout(run, 8500));
    }

    run();

    const onVis = () => {
      if (document.visibilityState === "visible") run();
    };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      clearAll();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  return (
    <div className="reveal sq-card group relative overflow-hidden rounded-[2rem] bg-indigo-500 px-5 py-8 sm:px-8">
      {/* Phone card */}
      <div className="relative z-10 mx-auto w-full max-w-[280px] rounded-[1.6rem] bg-white p-4 shadow-[0_28px_80px_rgba(30,20,80,0.38)] ring-1 ring-black/5">
        {/* header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-semibold">mia.novak</p>
            <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-indigo-500 text-[9px] font-bold text-white">
              ✓
            </span>
          </div>
          <div className="flex flex-col gap-[3px]">
            <span className="h-[3px] w-[3px] rounded-full bg-neutral-400" />
            <span className="h-[3px] w-[3px] rounded-full bg-neutral-400" />
            <span className="h-[3px] w-[3px] rounded-full bg-neutral-400" />
          </div>
        </div>

        {/* avatar + stats */}
        <div className="mt-3.5 flex items-center gap-3.5">
          <div className="rounded-full bg-gradient-to-tr from-pink-500 via-indigo-500 to-indigo-400 p-[2px]">
            <div className="rounded-full bg-white p-[2px]">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-neutral-900 font-grotesk font-bold text-lg text-white">
                M
              </div>
            </div>
          </div>
          <div className="grid flex-1 grid-cols-3 text-center">
            <div>
              <p className="text-sm font-bold tabular-nums">128</p>
              <p className="text-[11px] text-faint">posts</p>
            </div>
            <div>
              <p className="text-sm font-bold tabular-nums">
                {formatK(followers)}
              </p>
              <p className="text-[11px] text-faint">followers</p>
            </div>
            <div>
              <p className="text-sm font-bold tabular-nums">412</p>
              <p className="text-[11px] text-faint">following</p>
            </div>
          </div>
        </div>

        {/* bio — link space is reserved so nothing shifts */}
        <div className="mt-3.5 text-sm leading-snug">
          <p className="font-semibold">Mia Novak</p>
          <p className="text-soft">Photographer · Prague</p>
          <div className="mt-0.5 h-5">
            <span
              className="inline-block font-medium text-indigo-600 transition-all duration-500"
              style={{
                opacity: linkShown ? 1 : 0,
                transform: linkShown ? "translateY(0)" : "translateY(-5px)",
              }}
            >
              {SITE_DOMAIN}/mia
            </span>
          </div>
        </div>

        {/* buttons */}
        <div className="mt-3.5 grid grid-cols-[1fr_1fr_auto] gap-2">
          <div className="rounded-lg bg-neutral-900 py-1.5 text-center text-sm font-semibold text-white">
            Follow
          </div>
          <div className="rounded-lg bg-neutral-100 py-1.5 text-center text-sm font-medium">
            Message
          </div>
          <div className="flex items-center justify-center rounded-lg bg-neutral-100 px-2.5 text-neutral-700">
            ⌄
          </div>
        </div>

        {/* story highlights */}
        <div className="mt-3.5 flex gap-4">
          {HIGHLIGHTS.map((h) => (
            <div key={h} className="flex flex-col items-center gap-1">
              <div className="h-9 w-9 rounded-full border border-line bg-neutral-50" />
              <span className="text-[10px] text-soft">{h}</span>
            </div>
          ))}
        </div>

        {/* post grid */}
        <div className="mt-3.5 grid grid-cols-3 gap-1 overflow-hidden rounded-xl">
          {POST_TONES.map((tone, i) => (
            <div
              key={i}
              className="aspect-square"
              style={{ background: tone }}
            />
          ))}
        </div>
      </div>

      {/* „All good" chip */}
      <div className="lk-float absolute top-5 left-2 z-20 sm:left-4">
        <div
          className="rounded-2xl bg-pink-500 px-4 py-2.5 text-white shadow-[0_12px_30px_rgba(236,72,153,0.45)] transition-all duration-500"
          style={{
            opacity: chip ? 1 : 0,
            transform: chip
              ? "rotate(-4deg) scale(1)"
              : "rotate(-4deg) scale(0.8)",
          }}
        >
          <p className="font-mono text-[10px] tracking-wide uppercase opacity-85">
            Link healthy
          </p>
          <p className="text-sm font-bold">All good ✓</p>
        </div>
      </div>

      {/* Clicks — compact widget */}
      <div className="lk-float-2 absolute right-1 bottom-5 z-20 sm:right-3">
        <div
          className="rounded-xl bg-white px-3 py-2.5 shadow-[0_16px_40px_rgba(30,20,80,0.3)] ring-1 ring-black/5 transition-all duration-500"
          style={{
            opacity: clicksCard ? 1 : 0,
            transform: clicksCard
              ? "rotate(3deg) translateY(0)"
              : "rotate(3deg) translateY(14px)",
          }}
        >
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-indigo-500" />
            </span>
            <span className="font-mono text-[8px] font-semibold tracking-[0.12em] text-faint uppercase">
              Clicks · this week
            </span>
          </div>

          <div className="mt-1 flex items-center gap-1.5">
            <span className="font-grotesk text-lg leading-none font-extrabold tracking-tight tabular-nums">
              {clicks.toLocaleString("en-US")}
            </span>
            <span className="inline-flex items-center gap-0.5 rounded-full bg-indigo-50 px-1.5 py-0.5 text-[10px] font-bold text-indigo-600">
              <svg
                viewBox="0 0 24 24"
                className="h-2.5 w-2.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="M3 17l5-5 3 3 8-8" />
                <path d="M17 7h4v4" />
              </svg>
              32%
            </span>
          </div>
        </div>
      </div>

      <SquishyBg id={2} />
    </div>
  );
}
