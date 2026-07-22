import {
  ANIM_CLASS,
  socialHref,
  toEmbed,
  type Block,
  type LinkAnim,
  type LinkLayout,
  type SocialPlatform,
} from "@/lib/blocks";
import { Icon, ICON_KEYS, type IconKey } from "@/components/blocks/icon";
import { BTN_SIZES, type Theme } from "@/lib/themes";
import { readableText, safeColor } from "@/lib/design";
import { SocialIcon } from "@/components/blocks/social-icon";
import { Countdown } from "@/components/blocks/countdown";
import { Faq } from "@/components/blocks/faq";
import { ContactForm } from "@/components/blocks/contact-form";
import { VideoBlock } from "@/components/blocks/video-block";

// Ciste prezentacny komponent — pouziva ho aj verejna stranka (server)
// aj live preview v editore (client). Ziadne server-only API.

function LinkBlock({
  block,
  theme,
  href,
}: {
  block: Block;
  theme: Theme;
  href: string;
}) {
  const cfg = block.config;
  const featured = cfg.featured === true;
  const size = theme.size ?? BTN_SIZES.md;
  // Ide do src atributu (nie do CSS), takze staci trvat na https
  const image = /^https:\/\//i.test(cfg.thumb ?? "") ? cfg.thumb! : null;
  const title = cfg.title || "Untitled link";
  // VIP zamok — samotny kod sa TU nerenderuje (je len na serveri), len ikonka.
  const locked = typeof cfg.lockCode === "string" && cfg.lockCode.length > 0;
  const titleNode = (
    <>
      {title}
      {locked && <LockIcon />}
    </>
  );

  // Bez obrazka nemaju obrazkove layouty co zobrazit — spadneme na bar
  const wanted = cfg.layout ?? (cfg.thumb ? "thumb" : "bar");
  const layout: LinkLayout =
    wanted !== "bar" && !image ? "bar" : (wanted as LinkLayout);

  const customBg = safeColor(cfg.color);
  const customFg = safeColor(cfg.textColor);

  const background = customBg ?? (featured ? theme.text : theme.btnBg);
  // Featured tlacidlo ma pozadie vo farbe textu temy. Farbu popisu preto NEsmie
  // urcovat pozadie stranky (pri svetlom textColor + gradiente vysiel biely text
  // na svetlom buttone — neviditelny). Namiesto toho ju odvodime z JASU pozadia
  // buttonu, takze kontrast je zaruceny na kazdej teme aj custom farbe.
  const color = customFg ?? (featured ? readableText(background) : theme.btnText);

  const shell: React.CSSProperties = {
    background,
    color,
    border: customBg
      ? `1px solid ${customBg}`
      : featured
        ? `1px solid ${theme.text}`
        : theme.btnBorder,
    borderRadius: theme.btnRadius,
    boxShadow: featured ? "0 10px 30px rgba(0,0,0,0.18)" : theme.btnShadow,
    backdropFilter: theme.btnBackdrop,
    WebkitBackdropFilter: theme.btnBackdrop,
    fontSize: size.font,
  };

  // Roh miniatury sa riadi tvarom buttonu, nech nevyzera nalepena
  const innerRadius =
    theme.btnRadius === "999px"
      ? "999px"
      : theme.btnRadius === "2px"
        ? "2px"
        : "10px";

  // Pill zaoblenie na velkom obrazkovom bloku by orezalo fotku do ovalu,
  // takze card/cover maju strop.
  const mediaRadius = theme.btnRadius === "999px" ? "18px" : theme.btnRadius;

  const anim = ANIM_CLASS[(cfg.anim ?? "none") as LinkAnim] ?? "";
  const base = `block w-full font-medium transition duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.985] ${anim}`;

  const iconKey = cfg.icon as IconKey | undefined;
  const showIcon = !image && iconKey && ICON_KEYS.includes(iconKey);

  if (layout === "cover" && image) {
    return (
      <a
        href={href}
        rel="noopener"
        className={`${base} relative overflow-hidden`}
        style={{ ...shell, height: size.coverH, borderRadius: mediaRadius }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        {/* Scrim — text musi byt citatelny na akejkolvek fotke */}
        <span className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-black/10" />
        <span
          className="absolute inset-0 flex items-center justify-center px-5 text-center text-white"
          style={{ textShadow: "0 1px 12px rgba(0,0,0,0.5)" }}
        >
          {titleNode}
        </span>
      </a>
    );
  }

  if (layout === "card" && image) {
    return (
      <a
        href={href}
        rel="noopener"
        className={`${base} overflow-hidden`}
        style={{ ...shell, borderRadius: mediaRadius }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image}
          alt=""
          className="aspect-[16/9] w-full object-cover"
        />
        <span
          className="block text-center"
          style={{ padding: `${size.padY} ${size.padX}` }}
        >
          {titleNode}
        </span>
      </a>
    );
  }

  if (layout === "thumb" && image) {
    return (
      <a
        href={href}
        rel="noopener"
        className={`${base} flex items-center gap-3`}
        style={{ ...shell, padding: `0.45rem 0.75rem` }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image}
          alt=""
          className="shrink-0 object-cover"
          style={{
            width: size.thumb,
            height: size.thumb,
            borderRadius: innerRadius,
          }}
        />
        <span className="flex-1 text-center">{titleNode}</span>
        {/* Vyvazuje sirku miniatury, aby text ostal opticky v strede */}
        <span aria-hidden className="shrink-0" style={{ width: size.thumb }} />
      </a>
    );
  }

  // Bar — s volitelnou ikonou vlavo
  return (
    <a
      href={href}
      rel="noopener"
      className={`${base} ${showIcon ? "flex items-center gap-3" : "text-center"}`}
      style={{ ...shell, padding: `${size.padY} ${size.padX}` }}
    >
      {showIcon && (
        <span className="shrink-0">
          <Icon name={iconKey} className="h-5 w-5" />
        </span>
      )}
      <span className={showIcon ? "flex-1 text-center" : undefined}>
        {titleNode}
      </span>
      {/* Vyvazuje sirku ikony, aby text ostal opticky v strede */}
      {showIcon && <span aria-hidden className="w-5 shrink-0" />}
    </a>
  );
}

function LockIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
      className="ml-1.5 inline-block align-[-0.12em] opacity-70"
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

function EmbedBlock({ url }: { url: string }) {
  const embed = toEmbed(url);
  if (!embed) return null;

  // Vertikalne (TikTok/Shorts) = uzsi ramec 9:16; audio = fixna nizka vyska.
  if (embed.kind === "vertical") {
    return (
      <div className="mx-auto max-w-[325px] overflow-hidden rounded-xl">
        <iframe
          src={embed.src}
          loading="lazy"
          allowFullScreen
          title="Embed"
          className="aspect-[9/16] w-full border-0"
        />
      </div>
    );
  }
  if (embed.kind === "audio" || embed.kind === "audioTall") {
    return (
      <div className="overflow-hidden rounded-xl">
        <iframe
          src={embed.src}
          loading="lazy"
          allowFullScreen
          title="Embed"
          className="w-full border-0"
          style={{ height: embed.kind === "audioTall" ? 352 : 152 }}
        />
      </div>
    );
  }
  return (
    <div className="overflow-hidden rounded-xl">
      <iframe
        src={embed.src}
        loading="lazy"
        allowFullScreen
        title="Embed"
        className="aspect-video w-full border-0"
      />
    </div>
  );
}

function TipBlock({
  block,
  theme,
  href,
}: {
  block: Block;
  theme: Theme;
  href: string;
}) {
  const title = block.config.title || "Send a tip";
  return (
    <a
      href={href}
      rel="noopener"
      className="block w-full text-center font-semibold transition duration-200 hover:-translate-y-0.5"
      style={{
        background: theme.text,
        color: theme.page.includes("gradient") || theme.page.includes("url(")
          ? "#fff"
          : theme.page,
        border: `1px solid ${theme.text}`,
        borderRadius: theme.btnRadius,
        boxShadow: "0 10px 30px rgba(0,0,0,0.18)",
        padding: `${(theme.size ?? BTN_SIZES.md).padY} ${(theme.size ?? BTN_SIZES.md).padX}`,
        fontSize: (theme.size ?? BTN_SIZES.md).font,
      }}
    >
      {title}
    </a>
  );
}

export function BlockList({
  blocks,
  theme,
  hrefFor,
  profileId,
  preview = false,
}: {
  blocks: Block[];
  theme: Theme;
  /** Public page routes clicks through /r/{id}; preview links nowhere. */
  hrefFor: (block: Block) => string;
  profileId: string;
  /** In the editor nothing is actually submitted. */
  preview?: boolean;
}) {
  const active = blocks.filter((b) => b.is_active);

  const isHalf = (b: Block | undefined) =>
    !!b && b.type === "link" && b.config.width === "half";

  // Dva susedne half odkazy tvoria jeden riadok; osamoteny half ostane cely.
  const rows: Block[][] = [];
  for (let i = 0; i < active.length; i++) {
    if (isHalf(active[i]) && isHalf(active[i + 1])) {
      rows.push([active[i], active[i + 1]]);
      i++;
    } else {
      rows.push([active[i]]);
    }
  }

  const renderOne = (block: Block) => {
    {
      switch (block.type) {
            case "link":
              return (
                <LinkBlock
                  key={block.id}
                  block={block}
                  theme={theme}
                  href={hrefFor(block)}
                />
              );

            case "headline":
              return (
                <p
                  key={block.id}
                  className="pt-4 pb-1 text-sm font-semibold tracking-wide uppercase"
                  style={{ color: theme.muted }}
                >
                  {block.config.text}
                </p>
              );

            case "text":
              return (
                <p
                  key={block.id}
                  className="px-2 text-[15px] leading-relaxed text-pretty"
                  style={{ color: theme.muted }}
                >
                  {block.config.text}
                </p>
              );

            case "image": {
              const src = block.config.src;
              if (!src) return null;
              const media =
                block.config.mediaType === "video" ? (
                  <VideoBlock src={src} />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={src}
                    alt={block.config.alt ?? ""}
                    className="w-full rounded-xl object-cover"
                  />
                );
              return (
                <div key={block.id}>
                  {block.config.href ? (
                    <a href={block.config.href} rel="noopener">
                      {media}
                    </a>
                  ) : (
                    media
                  )}
                </div>
              );
            }

            case "video":
              return <EmbedBlock key={block.id} url={block.config.url ?? ""} />;

            case "divider":
              return (
                <div key={block.id} className="flex justify-center py-3">
                  <span
                    className="h-px w-16 rounded-full"
                    style={{ background: theme.text, opacity: 0.25 }}
                  />
                </div>
              );

            case "tip":
              return (
                <TipBlock
                  key={block.id}
                  block={block}
                  theme={theme}
                  href={hrefFor(block)}
                />
              );

            case "socials": {
              const items = (block.config.items ?? []).filter((i) =>
                i.url?.trim(),
              );
              if (items.length === 0) return null;
              return (
                <div
                  key={block.id}
                  className="flex flex-wrap items-center justify-center gap-4 py-2"
                >
                  {items.map((item, i) => (
                    <a
                      key={`${item.platform}-${i}`}
                      href={socialHref(
                        item.platform as SocialPlatform,
                        item.url,
                      )}
                      rel="noopener"
                      aria-label={item.platform}
                      className="transition hover:opacity-60"
                      style={{ color: theme.text }}
                    >
                      <SocialIcon platform={item.platform as SocialPlatform} />
                    </a>
                  ))}
                </div>
              );
            }

            case "faq":
              return (
                <Faq
                  key={block.id}
                  items={block.config.faqs ?? []}
                  theme={theme}
                />
              );

            case "countdown":
              return (
                <Countdown
                  key={block.id}
                  title={block.config.title}
                  target={block.config.target}
                  theme={theme}
                />
              );

            case "form":
              return (
                <ContactForm
                  key={block.id}
                  profileId={profileId}
                  blockId={block.id}
                  title={block.config.title}
                  buttonLabel={block.config.buttonLabel}
                  theme={theme}
                  preview={preview}
                />
              );

            default:
              return null;
          }
    }
  };

  return (
    <div className="space-y-3">
      {rows.map((row) =>
        row.length === 2 ? (
          <div key={row[0].id} className="grid grid-cols-2 gap-3">
            {row.map(renderOne)}
          </div>
        ) : (
          renderOne(row[0])
        ),
      )}
    </div>
  );
}

export function ProfileHeader({
  displayName,
  username,
  bio,
  avatarUrl,
  theme,
}: {
  displayName: string | null;
  username: string;
  bio: string | null;
  avatarUrl: string | null;
  theme: Theme;
}) {
  // Prazdne display name = klient ho vypol (chce iba foto + tlacidla).
  // Fallback na username je len pre iniciálu v placeholder avatare, nikdy sa
  // nezobrazuje ako text mena.
  const hasName = !!displayName?.trim();
  const initial = (displayName || username).charAt(0).toUpperCase();

  // Tvar/velkost/prstenec pochadzaju z `design` (Pro), s bezpecnymi fallbackmi.
  const avatarSize = theme.avatarSizePx ?? 96;
  const avatarRadius = theme.avatarRadius ?? "999px";
  const dropShadow = "0 12px 32px -10px rgba(0,0,0,0.45)";
  const avatarShadow = theme.avatarRing
    ? `${theme.avatarRing}, ${dropShadow}`
    : dropShadow;
  return (
    <div className="text-center">
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={avatarUrl}
          alt=""
          className="mx-auto object-cover"
          style={{
            width: avatarSize,
            height: avatarSize,
            borderRadius: avatarRadius,
            boxShadow: avatarShadow,
          }}
        />
      ) : (
        <div
          className="mx-auto flex items-center justify-center text-4xl"
          style={{
            width: avatarSize,
            height: avatarSize,
            borderRadius: avatarRadius,
            background: theme.avatarBg,
            color: theme.avatarText,
            fontFamily: theme.fontHeading ?? theme.font,
            boxShadow: avatarShadow,
          }}
        >
          {initial}
        </div>
      )}

      {hasName && (
        <h1
          className="mt-5 text-2xl font-semibold tracking-tight"
          style={{ fontFamily: theme.fontHeading ?? theme.font }}
        >
          {displayName}
        </h1>
      )}
      {bio && (
        <p
          className={`text-[15px] leading-relaxed text-pretty ${hasName ? "mt-2" : "mt-5"}`}
          style={{ color: theme.muted }}
        >
          {bio}
        </p>
      )}
    </div>
  );
}
