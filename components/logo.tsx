import Image from "next/image";

export function Logo({
  className = "h-7 w-auto",
  variant = "color",
}: {
  className?: string;
  /** "white" — pre tmave/farebne pozadia, kde ceren+modra loga nie je vidiet. */
  variant?: "color" | "white";
}) {
  return (
    <Image
      src="/logo.png"
      alt="linkovne"
      width={874}
      height={236}
      priority
      className={className}
      style={variant === "white" ? { filter: "brightness(0) invert(1)" } : undefined}
    />
  );
}
