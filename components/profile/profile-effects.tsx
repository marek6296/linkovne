"use client";
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import type { Theme } from "@/lib/themes";
import { readableText } from "@/lib/design";

export function ProfileEffects({
  theme,
  children,
  scope = "header",
}: {
  theme: Theme;
  children: ReactNode;
  scope?: "header" | "card";
}) {
  const motionRoot = useRef<HTMLDivElement>(null);
  const root = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(theme.profileHover === "flip");
  const effect = theme.profileHover ?? "none";
  const pointerFrame = useRef(0);
  useEffect(() => () => cancelAnimationFrame(pointerFrame.current), []);
  const resetPointer = () => {
    cancelAnimationFrame(pointerFrame.current);
    root.current?.style.setProperty("--tilt-x", "0deg");
    root.current?.style.setProperty("--tilt-y", "0deg");
  };
  useEffect(() => {
    setActive(effect === "flip");
    const node = root.current;
    if (!node || effect !== "reveal") return;
    const measure = () => {
      const avatar = node.querySelector(".profile-header-main img,.profile-header-main video,img,video");
      if (!avatar) return;
      const r = node.getBoundingClientRect(),
        a = avatar.getBoundingClientRect();
      if (!r.width || !r.height) return;
      node.style.setProperty("--reveal-size", `${Math.hypot(r.width, r.height)}px`);
      node.style.setProperty(
        "--reveal-x",
        `${((a.left + a.width / 2 - r.left) / r.width) * 100}%`,
      );
      node.style.setProperty(
        "--reveal-y",
        `${((a.top + a.height / 2 - r.top) / r.height) * 100}%`,
      );
    };
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    const avatar = node.querySelector(".profile-header-main img,.profile-header-main video,img,video");
    if (avatar) observer.observe(avatar);
    measure();
    return () => observer.disconnect();
  }, [effect]);
  useEffect(() => {
    const node = motionRoot.current;
    if (!node || !theme.profileMotion || theme.profileMotion === "none") return;
    let visible = false;
    const update = () => {
      node.style.animationPlayState =
        visible && !document.hidden ? "running" : "paused";
    };
    const observer = new IntersectionObserver((entries) => {
      visible = entries[0]?.isIntersecting ?? false;
      update();
    });
    observer.observe(node);
    document.addEventListener("visibilitychange", update);
    update();
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", update);
    };
  }, [theme.profileMotion]);
  const interactive = effect === "flip" || effect === "reveal";
  return (
    <div
      ref={motionRoot}
      className="profile-motion"
      data-motion={theme.profileMotion ?? "none"}
    >
      <div
        ref={root}
        className="profile-effects"
        data-effect={effect}
        data-scope={scope}
        data-active={active}
        tabIndex={interactive ? 0 : undefined}
        aria-label={interactive ? "Profile card" : undefined}
        onFocus={() => { if (interactive) setActive(effect !== "flip"); }}
        onBlur={(e) => { if (interactive && !e.currentTarget.contains(e.relatedTarget)) setActive(effect === "flip"); }}
        onPointerDown={(e) => {
          if (e.pointerType !== "mouse" && interactive) setActive(effect !== "flip");
        }}
        onPointerEnter={(e) => {
          if (effect === "reveal") {
            const node = e.currentTarget;
            const avatar = node.querySelector(".profile-header-main img,.profile-header-main video,img,video");
            if (avatar) {
              const r = node.getBoundingClientRect(), a = avatar.getBoundingClientRect();
              node.style.setProperty("--reveal-x", `${(a.left + a.width / 2 - r.left) / r.width * 100}%`);
              node.style.setProperty("--reveal-y", `${(a.top + a.height / 2 - r.top) / r.height * 100}%`);
            }
          }
          if (e.pointerType === "mouse" && interactive) setActive(effect !== "flip");
        }}
        onPointerMove={(e) => {
          if (e.pointerType !== "mouse" || !["tilt", "spotlight"].includes(effect) || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
          const box = e.currentTarget.getBoundingClientRect();
          const x = Math.max(0, Math.min(1, (e.clientX - box.left) / box.width));
          const y = Math.max(0, Math.min(1, (e.clientY - box.top) / box.height));
          cancelAnimationFrame(pointerFrame.current);
          pointerFrame.current = requestAnimationFrame(() => {
            const node = root.current; if (!node) return;
            node.style.setProperty("--tilt-x", `${(0.5-y)*12}deg`);
            node.style.setProperty("--tilt-y", `${(x-0.5)*14}deg`);
            node.style.setProperty("--pointer-x", `${x*100}%`);
            node.style.setProperty("--pointer-y", `${y*100}%`);
          });
        }}
        onPointerLeave={(e) => {
          resetPointer();
          if (e.pointerType === "mouse" && interactive) setActive(effect === "flip");
        }}
        onKeyDown={(e) => {
          if (e.key === "Escape") setActive(false);
        }}
        style={
          {
            "--profile-accent": theme.profileAccent ?? theme.btnBg,
            "--profile-accent-text": readableText(
              theme.profileAccent ?? theme.btnBg,
            ),
          } as CSSProperties
        }
      >
        <div className="profile-effects-turn">
          <div
            className="profile-effects-front"
            inert={effect === "flip" && active ? true : undefined}
          >
            {children}
          </div>
          {effect === "flip" && (
            <div
              className="profile-effects-back"
              inert={!active ? true : undefined}
            >
              <h2>{theme.profileBackTitle || "About me"}</h2>
              <p>{theme.profileBackText || theme.profileCaption || ""}</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
