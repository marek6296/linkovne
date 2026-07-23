import {
  ANIM_CLASS,
  socialHref,
  toEmbed,
  SOCIAL_BRAND,
  SOCIAL_SIZE_PX,
  SOCIAL_SHAPE_RADIUS,
  LINK_TEXT_SIZES,
  type Block,
  type LinkLayout,
  type SocialPlatform,
} from "@/lib/blocks";
import { Icon, ICON_KEYS, type IconKey } from "@/components/blocks/icon";
import { BTN_SIZES, type Theme } from "@/lib/themes";
import {
  BTN_BORDERS,
  BTN_SHAPES,
  BTN_SHADOWS,
  BTN_WEIGHTS,
  readableText,
  safeColor,
} from "@/lib/design";
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
  const isHalf = cfg.width === "half";
  const size =
    cfg.buttonSize && cfg.buttonSize in BTN_SIZES
      ? BTN_SIZES[cfg.buttonSize]
      : (theme.size ?? BTN_SIZES.md);
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
  let background = customBg ?? (featured ? theme.text : theme.btnBg);
  // Featured tlacidlo ma pozadie vo farbe textu temy. Farbu popisu preto NEsmie
  // urcovat pozadie stranky (pri svetlom textColor + gradiente vysiel biely text
  // na svetlom buttone — neviditelny). Namiesto toho ju odvodime z JASU pozadia
  // buttonu, takze kontrast je zaruceny na kazdej teme aj custom farbe.
  let color = customFg ?? (featured ? readableText(background) : theme.btnText);
  let border = customBg
    ? `1px solid ${customBg}`
    : featured
      ? `1px solid ${theme.text}`
      : theme.btnBorder;
  let boxShadow = featured ? "0 10px 30px rgba(0,0,0,0.18)" : theme.btnShadow;
  let backdropFilter = theme.btnBackdrop;

  switch (cfg.buttonStyle) {
    case "fill":
      border = `1px solid ${customBg ?? theme.btnBg}`;
      break;
    case "outline":
      background = "transparent";
      color = customFg ?? theme.btnText;
      border = `1.5px solid ${color}`;
      boxShadow = "none";
      backdropFilter = undefined;
      break;
    case "soft":
      background = `color-mix(in oklab, ${customBg ?? theme.btnBg} 22%, transparent)`;
      color = customFg ?? theme.btnText;
      border = "1px solid transparent";
      boxShadow = "none";
      backdropFilter = undefined;
      break;
    case "glass":
      background = "rgba(255,255,255,0.16)";
      color = customFg ?? theme.btnText;
      border = "1px solid rgba(255,255,255,0.38)";
      boxShadow = "0 8px 26px rgba(0,0,0,0.14)";
      backdropFilter = "blur(10px)";
      break;
    case "gradient": {
      const from = safeColor(cfg.buttonGradientColor) ?? customBg ?? "#7c3aed";
      const to = safeColor(cfg.buttonGradientColor2) ?? "#0ea5e9";
      background = `linear-gradient(135deg, ${from}, ${to})`;
      color = customFg ?? readableText(from);
      border = "1px solid transparent";
      boxShadow = "0 10px 26px rgba(0,0,0,0.16)";
      backdropFilter = undefined;
      break;
    }
  }

  if (cfg.buttonBorder && cfg.buttonBorder in BTN_BORDERS) {
    const width = BTN_BORDERS[cfg.buttonBorder].width;
    border =
      width === "0px"
        ? "0 solid transparent"
        : `${width} solid ${customBg ?? color}`;
  }
  if (cfg.buttonShadow && cfg.buttonShadow in BTN_SHADOWS) {
    boxShadow = BTN_SHADOWS[cfg.buttonShadow].css;
  }
  const borderRadius =
    cfg.buttonShape && cfg.buttonShape in BTN_SHAPES
      ? BTN_SHAPES[cfg.buttonShape].radius
      : theme.btnRadius;
  const fontSize =
    cfg.buttonTextSize && cfg.buttonTextSize in LINK_TEXT_SIZES
      ? LINK_TEXT_SIZES[cfg.buttonTextSize].css
      : (theme.btnFontSize ?? size.font);
  const fontWeight =
    cfg.buttonWeight && cfg.buttonWeight in BTN_WEIGHTS
      ? BTN_WEIGHTS[cfg.buttonWeight].value
      : (theme.btnWeight ?? 500);

  const shell: React.CSSProperties = {
    background,
    color,
    border,
    borderRadius,
    boxShadow,
    backdropFilter,
    WebkitBackdropFilter: backdropFilter,
    fontSize,
    fontWeight,
  };

  // Roh miniatury sa riadi tvarom buttonu, nech nevyzera nalepena
  const innerRadius =
    borderRadius === "999px"
      ? "999px"
      : borderRadius === "2px"
        ? "2px"
        : "10px";

  // Pill zaoblenie na velkom obrazkovom bloku by orezalo fotku do ovalu,
  // takze card/cover maju strop.
  const mediaRadius = borderRadius === "999px" ? "18px" : borderRadius;

  const animation = cfg.anim ?? theme.btnAnimation ?? "none";
  const anim = ANIM_CLASS[animation] ?? "";
  const base = `block min-w-0 max-w-full w-full overflow-hidden font-medium transition duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.985] ${anim}`;

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
          className="absolute inset-0 flex min-w-0 items-center justify-center overflow-hidden px-4 text-center leading-snug break-words text-white [overflow-wrap:anywhere]"
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
          className="block min-w-0 overflow-hidden text-center leading-snug break-words [overflow-wrap:anywhere]"
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
        <span className="min-w-0 flex-1 overflow-hidden text-center leading-snug break-words [overflow-wrap:anywhere]">{titleNode}</span>
        {/* Vyvazuje sirku miniatury, aby text ostal opticky v strede */}
        {!isHalf && <span aria-hidden className="shrink-0" style={{ width: size.thumb }} />}
      </a>
    );
  }

  // Bar — s volitelnou ikonou vlavo
  return (
    <a
      href={href}
      rel="noopener"
      className={`${base} ${showIcon ? "flex items-center gap-3" : "text-center"}`}
      style={{ ...shell, padding: `${size.padY} ${isHalf ? "0.7rem" : size.padX}` }}
    >
      {showIcon && (
        <span className="shrink-0">
          <Icon name={iconKey} className="h-5 w-5" />
        </span>
      )}
      <span className={`${showIcon ? "min-w-0 flex-1 text-center" : "block text-center"} overflow-hidden leading-snug break-words [overflow-wrap:anywhere]`}>
        {titleNode}
      </span>
      {/* Vyvazuje sirku ikony, aby text ostal opticky v strede */}
      {showIcon && !isHalf && <span aria-hidden className="w-5 shrink-0" />}
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
  onSelect,
}: {
  blocks: Block[];
  theme: Theme;
  /** Public page routes clicks through /r/{id}; preview links nowhere. */
  hrefFor: (block: Block) => string;
  profileId: string;
  /** In the editor nothing is actually submitted. */
  preview?: boolean;
  onSelect?: (blockId: string) => void;
}) {
  const active = blocks.filter((b) => b.is_active);

  const isHalf = (b: Block | undefined) =>
    !!b && b.type === "link" && b.config.width === "half";

  // Section markers remain headline blocks in storage, so older databases and
  // published snapshots stay compatible. Every marker owns following blocks
  // until the next marker.
  const groups: { section?: Block; items: Block[] }[] = [{ items: [] }];
  for (const block of active) {
    if (block.type === "headline" && block.config.isSection) groups.push({ section: block, items: [] });
    else groups[groups.length - 1].items.push(block);
  }

  const makeRows = (items: Block[]) => {
    const rows: Block[][] = [];
    for (let i = 0; i < items.length; i++) {
      if (isHalf(items[i]) && isHalf(items[i + 1])) {
        rows.push([items[i], items[i + 1]]);
        i++;
      } else rows.push([items[i]]);
    }
    return rows;
  };

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

              const style = block.config.socialStyle ?? "line";
              const shape = block.config.socialShape ?? "bare";
              const size = block.config.socialSize ?? "md";
              const px = SOCIAL_SIZE_PX[size];
              const radius = SOCIAL_SHAPE_RADIUS[shape];
              // Chip = ikona + vypln okolo (mensia pri sm, vacsia pri lg).
              const chipPx = px + (size === "sm" ? 16 : size === "md" ? 20 : 24);

              return (
                <div
                  key={block.id}
                  className="flex flex-wrap items-center justify-center gap-3 py-2"
                >
                  {items.map((item, i) => {
                    const platform = item.platform as SocialPlatform;
                    // „Accent" = signaturna farba ikony (override → brand → tema).
                    const accent =
                      safeColor(item.color) ??
                      (style === "brand"
                        ? SOCIAL_BRAND[platform]
                        : (safeColor(block.config.socialColor) ?? theme.text));
                    const accented = style === "brand" || !!item.color;

                    let glyphColor = accent;
                    let chipBg: string | undefined;
                    if (shape !== "bare") {
                      if (accented) {
                        chipBg = accent;
                        glyphColor = readableText(accent);
                      } else {
                        chipBg = safeColor(block.config.socialBg) ?? theme.btnBg;
                        glyphColor =
                          safeColor(block.config.socialColor) ?? theme.btnText;
                      }
                    }

                    const bare = shape === "bare";
                    return (
                      <a
                        key={`${platform}-${i}`}
                        href={socialHref(platform, item.url)}
                        rel="noopener"
                        aria-label={platform}
                        className={
                          bare
                            ? "transition hover:opacity-60"
                            : "flex items-center justify-center transition hover:opacity-85"
                        }
                        style={
                          bare
                            ? { color: glyphColor }
                            : {
                                width: chipPx,
                                height: chipPx,
                                borderRadius: radius,
                                background: chipBg,
                                color: glyphColor,
                                boxShadow: theme.btnShadow,
                              }
                        }
                      >
                        <SocialIcon platform={platform} size={px} />
                      </a>
                    );
                  })}
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

  const selectable = (block: Block) => {
    const node = renderOne(block);
    if (!onSelect) return node;
    return (
      <div
        key={block.id}
        className="group relative min-w-0 max-w-full overflow-hidden rounded-xl"
      >
        {node}
        <button
          type="button"
          aria-label={`Edit ${block.type} block`}
          onClick={() => onSelect(block.id)}
          className="absolute inset-0 z-10 cursor-pointer rounded-xl outline-none ring-offset-2 transition group-hover:ring-2 group-hover:ring-current/30 focus-visible:ring-2"
        />
      </div>
    );
  };

  const renderRows = (items: Block[], forceGrid = false) => (
    <div className={forceGrid ? "grid grid-cols-2 gap-3" : "flex flex-col gap-3"}>
      {makeRows(items).map((row) =>
        row.length === 2 || isHalf(row[0]) ? (
          <div
            key={row[0].id}
            className={forceGrid ? "contents" : "grid grid-cols-2 gap-3"}
          >
            {row.map(selectable)}
          </div>
        ) : (
          selectable(row[0])
        ),
      )}
    </div>
  );

  return (
    <div className="flex flex-col gap-3">
      {groups.map((group, index) => {
        if (!group.section) return <div key={`root-${index}`}>{renderRows(group.items)}</div>;
        const cfg = group.section.config;
        const radius = cfg.sectionRadius === "square" ? "2px" : cfg.sectionRadius === "soft" ? "28px" : "16px";
        return <section key={group.section.id} style={{ background: safeColor(cfg.sectionBg) ?? "rgba(255,255,255,.12)", color: safeColor(cfg.sectionText) ?? theme.text, border: `1px solid ${safeColor(cfg.sectionBorder) ?? "rgba(127,127,127,.25)"}`, borderRadius: radius }} className="p-4"><h2 className="mb-3 text-sm font-semibold tracking-wide uppercase">{cfg.text || "Section"}</h2>{renderRows(group.items, cfg.sectionLayout === "grid")}</section>;
      })}
    </div>
  );
}

export function ProfileHeader({
  displayName,
  username,
  bio,
  avatarUrl,
  theme,
  onSelect,
}: {
  displayName: string | null;
  username: string;
  bio: string | null;
  avatarUrl: string | null;
  theme: Theme;
  onSelect?: () => void;
}) {
  // Prazdne display name = klient ho vypol (chce iba foto + tlacidla).
  // Fallback na username je len pre iniciálu v placeholder avatare, nikdy sa
  // nezobrazuje ako text mena.
  const hasName = !!displayName?.trim();
  const initial = (displayName || username).charAt(0).toUpperCase();

  // Tvar/velkost/prstenec pochadzaju z `design` (Pro), s bezpecnymi fallbackmi.
  const avatarSize = theme.avatarSizePx ?? 96;
  const avatarWidth = theme.avatarWidthPx ?? avatarSize;
  const avatarHeight = theme.avatarHeightPx ?? avatarSize;
  const avatarRadius = theme.avatarRadius ?? "999px";
  const dropShadow = "0 12px 32px -10px rgba(0,0,0,0.45)";
  const avatarShadow =
    theme.avatarShadow ??
    (theme.avatarRing ? `${theme.avatarRing}, ${dropShadow}` : dropShadow);
  const avatarStyle: React.CSSProperties = {
    width: avatarWidth,
    height: avatarHeight,
    boxSizing: "border-box",
    borderRadius: avatarRadius,
    border: theme.avatarBorder,
    background: theme.avatarBg,
    boxShadow: avatarShadow,
  };
  const content = (
    <>
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={avatarUrl}
          alt=""
          className="mx-auto"
          style={{
            ...avatarStyle,
            objectFit: theme.avatarFit ?? "cover",
            objectPosition: theme.avatarPosition ?? "center",
          }}
        />
      ) : (
        <div
          className="mx-auto flex items-center justify-center text-4xl"
          style={{
            ...avatarStyle,
            background: theme.avatarBg,
            color: theme.avatarText,
            fontFamily: theme.fontHeading ?? theme.font,
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
    </>
  );
  return onSelect ? (
    <button type="button" onClick={onSelect} className="w-full rounded-2xl text-center outline-none ring-offset-2 transition hover:ring-2 hover:ring-current/30 focus-visible:ring-2">
      {content}
    </button>
  ) : (
    <div className="text-center">{content}</div>
  );
}
