import Link from "next/link";
import { Logo } from "@/components/logo";
import { SquishyBg } from "@/components/squishy";

/**
 * Spolocny obal pre login/register/reset — farebny panel vlavo (v tych istych
 * farbach ako pricing), formular vpravo. Na mobile sa panel skryje a ostane
 * cisty formular.
 */
export function AuthShell({
  panelTitle,
  panelSubtitle,
  bg,
  bgId,
  children,
}: {
  panelTitle: string;
  panelSubtitle: string;
  bg: string;
  bgId: 1 | 2 | 3;
  children: React.ReactNode;
}) {
  return (
    <main className="grid min-h-dvh lg:grid-cols-2">
      {/* Colour panel — hover spusti tu istu „squishy" animaciu pozadia ako
          bento karty na landingu/pricingu (sq-card). `sq-bg-only` potlaci
          zvacsenie celeho panela, hyba sa len pozadie. */}
      <div
        className={`sq-card sq-bg-only relative hidden overflow-hidden p-12 text-white lg:flex lg:flex-col lg:justify-between ${bg}`}
      >
        <Link href="/" className="relative z-10 w-fit">
          <Logo className="h-7 w-auto" variant="white" />
        </Link>
        <div className="relative z-10 max-w-sm">
          <h2 className="font-grotesk text-4xl leading-[1.1] font-extrabold">
            {panelTitle}
          </h2>
          <p className="mt-4 text-lg text-white/85">{panelSubtitle}</p>
        </div>
        <p className="relative z-10 font-mono text-xs tracking-wide text-white/70 uppercase">
          linkovne.com
        </p>
        <SquishyBg id={bgId} />
      </div>

      {/* Form */}
      <div className="flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm">
          <Link href="/" className="mb-8 block lg:hidden">
            <Logo className="h-6 w-auto" />
          </Link>
          {children}
        </div>
      </div>
    </main>
  );
}
