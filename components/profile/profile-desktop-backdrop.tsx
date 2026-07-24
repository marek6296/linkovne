import type { Theme } from "@/lib/themes";

export function ProfileDesktopBackdrop({ theme }: { theme: Theme }) {
  return (
    <>
      <div
        aria-hidden
        className="profile-desktop-backdrop"
        style={{
          background: theme.deskBg ?? theme.page,
          ...(theme.deskBlur !== false
            ? { filter: "blur(64px) brightness(0.72)", transform: "scale(1.35)" }
            : null),
        }}
      />
      <div aria-hidden className="profile-desktop-shade" />
    </>
  );
}
