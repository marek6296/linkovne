import { SOCIAL_LABELS, type SocialPlatform } from "@/lib/blocks";
import { SocialIcon } from "@/components/blocks/social-icon";

// Vseobecne ikony na buttony — rovnaky geometricky jazyk ako socialne siete.
// Konkretne brand loga (Fanvue, OnlyFans…) sa nahravaju ako obrazok, viac v README.
const GENERIC = {
  link: (
    <>
      <path d="M10 13.5a3.5 3.5 0 0 0 5 0l3-3a3.5 3.5 0 0 0-5-5l-1 1" />
      <path d="M14 10.5a3.5 3.5 0 0 0-5 0l-3 3a3.5 3.5 0 0 0 5 5l1-1" />
    </>
  ),
  star: <path d="m12 3.6 2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z" />,
  heart: (
    <path d="M12 20s-7.5-4.4-7.5-9.4A4.1 4.1 0 0 1 12 8a4.1 4.1 0 0 1 7.5 2.6C19.5 15.6 12 20 12 20z" />
  ),
  cart: (
    <>
      <path d="M3 4h2l2.4 10.4a1.6 1.6 0 0 0 1.6 1.2h7.6a1.6 1.6 0 0 0 1.6-1.2L20 8H6" />
      <circle cx="9.5" cy="19" r="1.3" />
      <circle cx="17" cy="19" r="1.3" />
    </>
  ),
  camera: (
    <>
      <path d="M3.5 8.5h3l1.4-2h6.2l1.4 2h3a1.5 1.5 0 0 1 1.5 1.5v7a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 2 17v-7a1.5 1.5 0 0 1 1.5-1.5z" />
      <circle cx="12" cy="13.5" r="3.2" />
    </>
  ),
  music: (
    <>
      <path d="M9 18V6l10-2v12" />
      <circle cx="7" cy="18" r="2" />
      <circle cx="17" cy="16" r="2" />
    </>
  ),
  video: (
    <>
      <rect x="2.5" y="6" width="13" height="12" rx="2.5" />
      <path d="m15.5 11 6-3v8l-6-3z" />
    </>
  ),
  calendar: (
    <>
      <rect x="3.5" y="5" width="17" height="15" rx="2.5" />
      <path d="M3.5 10h17M8 3.5v3M16 3.5v3" />
    </>
  ),
  download: (
    <>
      <path d="M12 3.5v11m0 0 4-4m-4 4-4-4" />
      <path d="M4.5 18.5h15" />
    </>
  ),
  lock: (
    <>
      <rect x="4.5" y="10.5" width="15" height="9.5" rx="2.5" />
      <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
    </>
  ),
  sparkle: (
    <>
      <path d="M12 3.5 13.6 9 19 10.6 13.6 12.2 12 17.7 10.4 12.2 5 10.6 10.4 9z" />
      <path d="M18.5 16.5 19.2 18.6 21.3 19.3 19.2 20 18.5 22.1 17.8 20 15.7 19.3 17.8 18.6z" />
    </>
  ),
  chat: (
    <path d="M20.5 12.4c0 3.9-3.8 7-8.5 7-1 0-2-.15-2.9-.4l-4.6 1.5 1.5-3.9a6.6 6.6 0 0 1-2.5-4.2c0-3.9 3.8-7 8.5-7s8.5 3.1 8.5 7z" />
  ),
  location: (
    <>
      <path d="M12 21s6.5-6 6.5-10.5a6.5 6.5 0 1 0-13 0C5.5 15 12 21 12 21z" />
      <circle cx="12" cy="10.5" r="2.5" />
    </>
  ),
  gift: (
    <>
      <rect x="3.5" y="9" width="17" height="11" rx="2" />
      <path d="M3.5 13h17M12 9v11" />
      <path d="M12 9S10.5 4.5 8 4.5a2 2 0 0 0 0 4.5zM12 9s1.5-4.5 4-4.5a2 2 0 0 1 0 4.5z" />
    </>
  ),
} as const;

export type GenericIcon = keyof typeof GENERIC;
export type IconKey = SocialPlatform | GenericIcon;

export const GENERIC_KEYS = Object.keys(GENERIC) as GenericIcon[];

export const ICON_KEYS: IconKey[] = [
  ...(Object.keys(SOCIAL_LABELS) as SocialPlatform[]),
  ...GENERIC_KEYS,
];

function isSocial(key: IconKey): key is SocialPlatform {
  return key in SOCIAL_LABELS;
}

export function Icon({
  name,
  className = "h-5 w-5",
}: {
  name: IconKey;
  className?: string;
}) {
  if (isSocial(name)) return <SocialIcon platform={name} className={className} />;

  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {GENERIC[name]}
    </svg>
  );
}
