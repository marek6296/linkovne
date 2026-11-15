"use client";
import { useId, useState, type ReactNode, type KeyboardEvent } from "react";

export function SettingsWorkspace({
  sections,
}: {
  sections: {
    id: string;
    title: string;
    description: string;
    content: ReactNode;
  }[];
}) {
  const [active, setActive] = useState(sections[0].id);
  const uid = useId();
  function navigate(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const next =
      event.key === "ArrowDown" || event.key === "ArrowRight"
        ? (index + 1) % sections.length
        : event.key === "ArrowUp" || event.key === "ArrowLeft"
          ? (index + sections.length - 1) % sections.length
          : event.key === "Home"
            ? 0
            : event.key === "End"
              ? sections.length - 1
              : -1;
    if (next < 0) return;
    event.preventDefault();
    setActive(sections[next].id);
    document.getElementById(`${uid}-tab-${sections[next].id}`)?.focus();
  }
  return (
    <div className="settings-workspace">
      <nav
        className="settings-navigation"
        role="tablist"
        aria-label="Settings categories"
        aria-orientation="vertical"
      >
        {sections.map((section, i) => (
          <button
            key={section.id}
            id={`${uid}-tab-${section.id}`}
            type="button"
            role="tab"
            aria-selected={active === section.id}
            aria-controls={`${uid}-panel-${section.id}`}
            tabIndex={active === section.id ? 0 : -1}
            onClick={() => setActive(section.id)}
            onKeyDown={(e) => navigate(e, i)}
          >
            {section.title}
            <span aria-hidden>›</span>
          </button>
        ))}
      </nav>
      <div className="settings-panels">
        {sections.map((section) => (
          <section
            key={section.id}
            role="tabpanel"
            id={`${uid}-panel-${section.id}`}
            aria-labelledby={`${uid}-tab-${section.id}`}
            hidden={section.id !== active}
            tabIndex={0}
          >
            <header className="settings-panel-heading">
              <h2>{section.title}</h2>
              <p>{section.description}</p>
            </header>
            <div className="settings-panel-body">{section.content}</div>
          </section>
        ))}
      </div>
    </div>
  );
}
