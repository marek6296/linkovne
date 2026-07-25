import type { CSSProperties } from "react";
import { LogoMark } from "@/components/logo-mark";
import type { Theme } from "@/lib/themes";

export function ProfileTopControls({
  theme,
  showPromo,
  onPromo,
  onShare,
}: {
  theme: Theme;
  showPromo: boolean;
  onPromo?: () => void;
  onShare?: () => void;
}) {
  const buttonStyle: CSSProperties = {
    background: theme.btnBg,
    color: theme.btnText,
    border: theme.btnBorder,
    boxShadow: theme.btnShadow,
    backdropFilter: theme.btnBackdrop,
    WebkitBackdropFilter: theme.btnBackdrop,
  };
  const buttonClass =
    "flex h-11 w-11 items-center justify-center rounded-full transition duration-200 hover:-translate-y-0.5 hover:opacity-95 active:translate-y-0 active:scale-95 disabled:pointer-events-none";

  return (
    <div
      className="profile-top-controls absolute inset-x-0 top-[18px] z-40 mx-auto flex w-full items-center justify-between px-5"
      style={{ maxWidth: theme.contentWidthPx ?? 424 }}
    >
      {showPromo ? (
        <button
          type="button"
          onClick={onPromo}
          disabled={!onPromo}
          aria-label="About linkovne"
          className={buttonClass}
          style={buttonStyle}
        >
          <LogoMark className="h-[22px] w-[22px]" />
        </button>
      ) : (
        <span />
      )}
      <button
        type="button"
        onClick={onShare}
        disabled={!onShare}
        aria-label="Share this page"
        className={buttonClass}
        style={buttonStyle}
      >
        <svg
          viewBox="0 0 24 24"
          className="h-[18px] w-[18px]"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7" />
          <path d="M16 6l-4-4-4 4" />
          <path d="M12 2v14" />
        </svg>
      </button>
    </div>
  );
}
