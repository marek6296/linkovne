import type { SocialPlatform } from "@/lib/blocks";

// Geometricky kreslene ikony jednotnym strokom — nie stiahnute brand assety,
// takze drzia jeden vizualny jazyk naprieč temami.
const PATHS: Record<SocialPlatform, React.ReactNode> = {
  instagram: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" stroke="none" />
    </>
  ),
  tiktok: (
    <>
      <path d="M15 4v9.2a3.8 3.8 0 1 1-3.2-3.75" />
      <path d="M15 4c.4 2.2 1.9 3.6 4 3.8" />
    </>
  ),
  youtube: (
    <>
      <rect x="2.5" y="6" width="19" height="12" rx="4" />
      <path d="M10.5 9.8v4.4l4-2.2z" fill="currentColor" stroke="none" />
    </>
  ),
  facebook: (
    <>
      <circle cx="12" cy="12" r="9.2" />
      <path d="M13.9 8.4h-1.3c-.8 0-1.3.5-1.3 1.3v1.5m-1.5 0h4.1m-2.6 0v5.6" />
    </>
  ),
  x: (
    <>
      <path d="M4.5 4.5 19.5 19.5M19.5 4.5 4.5 19.5" />
    </>
  ),
  linkedin: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <path d="M7.5 10.5v6M7.5 7.6v.1M11.5 16.5v-6M11.5 13a2 2 0 0 1 4 0v3.5" />
    </>
  ),
  whatsapp: (
    <>
      <path d="M3.8 20.2 5 16.6a8 8 0 1 1 3 2.9z" />
      <path d="M9 9.5c0 3 2.5 5.5 5.5 5.5.6 0 1-.5 1-1l-1.4-.7-.9.8a5 5 0 0 1-2.3-2.3l.8-.9L11 9.5c0-.5-.4-1-1-1s-1 .4-1 1z" />
    </>
  ),
  telegram: (
    <>
      <path d="M20.5 4.3 3.6 10.8c-.7.3-.7 1.3 0 1.5l4.2 1.3 1.6 4.6c.2.7 1.1.8 1.5.2l2.2-2.8 4.1 3c.6.4 1.4.1 1.5-.6l2.5-13c.2-.7-.5-1.3-1.2-1z" />
      <path d="M8 13.4 18.6 6.6l-7.4 8.2" />
    </>
  ),
  email: (
    <>
      <rect x="2.8" y="5" width="18.4" height="14" rx="2.5" />
      <path d="m3.6 7 8.4 6 8.4-6" />
    </>
  ),
  phone: (
    <>
      <path d="M7.2 3.5 9.6 8l-2 1.7a11 11 0 0 0 5.6 5.6l1.8-2 4.5 2.4-.6 3a1.6 1.6 0 0 1-1.8 1.3C10.4 19.1 4.9 13.6 4 6.5a1.6 1.6 0 0 1 1.3-1.8z" />
    </>
  ),
};

export function SocialIcon({
  platform,
  className = "h-5 w-5",
}: {
  platform: SocialPlatform;
  className?: string;
}) {
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
      {PATHS[platform]}
    </svg>
  );
}
