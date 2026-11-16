"use client";

import {
  useActionState,
  useEffect,
  useId,
  useRef,
  useState,
  useTransition,
} from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  createProfile,
  saveProfileOrder,
  type ActionState,
} from "@/app/dashboard/actions";
import {
  EDITOR_DRAFT_STATE_EVENT,
  EDITOR_PUBLISHING_EVENT,
  type EditorDraftState,
} from "@/lib/editor-draft-state";
import { orderProfiles } from "@/lib/profile-order";
import { SITE_DOMAIN } from "@/lib/site";

type Item = {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  is_published: boolean;
};

function Grip() {
  return (
    <svg
      viewBox="0 0 16 20"
      width="12"
      height="16"
      fill="currentColor"
      aria-hidden
    >
      <circle cx="5" cy="4" r="1.3" />
      <circle cx="11" cy="4" r="1.3" />
      <circle cx="5" cy="10" r="1.3" />
      <circle cx="11" cy="10" r="1.3" />
      <circle cx="5" cy="16" r="1.3" />
      <circle cx="11" cy="16" r="1.3" />
    </svg>
  );
}

function ProfileTab({
  profile,
  active,
  first,
  disabled,
  reorderable,
  onSelect,
}: {
  profile: Item;
  active: boolean;
  first: boolean;
  disabled: boolean;
  reorderable: boolean;
  onSelect: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: profile.id, disabled: disabled || !reorderable });
  const [imageFailed, setImageFailed] = useState(false);
  useEffect(() => setImageFailed(false), [profile.avatar_url]);
  return (
    <li
      ref={setNodeRef}
      className={`profile-tab ${active ? "is-active" : ""} ${isDragging ? "is-dragging" : ""}`}
      style={{ transform: CSS.Transform.toString(transform), transition }}
    >
      <button
        type="button"
        className="profile-tab-select"
        onClick={onSelect}
        disabled={disabled}
        aria-pressed={active}
        aria-label={`Open @${profile.username}${first ? ", default profile" : ""}`}
      >
        <span className="profile-tab-avatar">
          {profile.avatar_url && !imageFailed ? (
            <img
              src={profile.avatar_url}
              alt=""
              onError={() => setImageFailed(true)}
              draggable={false}
            />
          ) : (
            <span>
              {(profile.display_name || profile.username)
                .slice(0, 1)
                .toUpperCase()}
            </span>
          )}
          <span
            className={`profile-tab-dot ${profile.is_published ? "is-live" : ""}`}
            title={profile.is_published ? "Live" : "Draft"}
          />
        </span>
        <span className="profile-tab-identity">
          <strong>{profile.display_name || profile.username}</strong>
          <span>@{profile.username}</span>
        </span>
        {first && (
          <span
            className="profile-default-mark"
            title="Opens first"
            aria-label="Default profile"
          >
            <svg
              viewBox="0 0 16 16"
              width="12"
              height="12"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.4"
              aria-hidden
            >
              <path d="m6 2 6 4-2 2-.5 3L6 9 3 13l1-5L2 6l3-1z" />
            </svg>
          </span>
        )}
      </button>
      {reorderable && (
        <button
          type="button"
          ref={setActivatorNodeRef}
          className="profile-drag-handle"
          {...attributes}
          {...listeners}
          aria-label={`Reorder @${profile.username}`}
          title="Drag to reorder · Space and arrow keys"
          disabled={disabled}
        >
          <Grip />
        </button>
      )}
    </li>
  );
}

function CreateProfileDialog({ onClose }: { onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    createProfile,
    undefined,
  );
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog.current?.showModal();
    input.current?.focus();
    return () => {
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, []);
  return createPortal(
    <dialog
      ref={dialog}
      className="studio-dialog profile-create-dialog"
      aria-labelledby="create-profile-title"
      onCancel={(event) => {
        if (pending) event.preventDefault();
        else onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget && !pending) onClose();
      }}
    >
      <header>
        <div>
          <h2 id="create-profile-title">Create a profile</h2>
          <p>Choose a username. You can customise everything next.</p>
        </div>
        <button
          type="button"
          className="studio-icon-button"
          onClick={onClose}
          disabled={pending}
          aria-label="Close new profile"
        >
          ×
        </button>
      </header>
      <form action={formAction}>
        <label
          htmlFor="new-profile-username"
          className="mb-2 block text-sm font-medium"
        >
          Profile address
        </label>
        <div className="profile-address-field">
          <span>{SITE_DOMAIN}/</span>
          <input
            ref={input}
            id="new-profile-username"
            name="username"
            required
            minLength={3}
            maxLength={30}
            pattern="[a-zA-Z0-9_.]{3,30}"
            spellCheck={false}
            autoComplete="off"
            placeholder="yourname"
            disabled={pending}
            aria-describedby="username-hint"
          />
        </div>
        <p id="username-hint" className="mt-2 text-xs text-soft">
          3–30 letters, numbers, dots or underscores.
        </p>
        {state?.error && (
          <p role="alert" className="mt-3 text-sm text-danger">
            {state.error}
          </p>
        )}
        <div className="profile-dialog-actions">
          <button type="button" onClick={onClose} disabled={pending}>
            Cancel
          </button>
          <button
            type="submit"
            className="profile-primary-action"
            disabled={pending}
          >
            {pending ? "Creating…" : "Create profile"}
          </button>
        </div>
      </form>
    </dialog>,
    document.body,
  );
}

export function ProfileSwitcher({
  profiles,
  currentId,
  canAddMore,
}: {
  profiles: Item[];
  currentId: string;
  canAddMore: boolean;
  limit: number;
}) {
  const router = useRouter();
  const dndId = useId();
  const [adding, setAdding] = useState(false);
  const [order, setOrder] = useState(() =>
    profiles.map((profile) => profile.id),
  );
  const [savingOrder, setSavingOrder] = useState(false);
  const savingRef = useRef(false);
  const [orderMessage, setOrderMessage] = useState("");
  const [orderError, setOrderError] = useState(false);
  const [waitingForSave, setWaitingForSave] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [navigating, startNavigation] = useTransition();
  const serverOrder = profiles.map((profile) => profile.id).join(",");
  useEffect(() => {
    setOrder(serverOrder.split(","));
  }, [serverOrder]);
  useEffect(() => {
    const onDraft = (event: Event) => {
      const state = (event as CustomEvent<EditorDraftState>).detail;
      setWaitingForSave(state.saving || state.saveError);
    };
    window.addEventListener(EDITOR_DRAFT_STATE_EVENT, onDraft);
    const onPublishing = (event: Event) =>
      setPublishing((event as CustomEvent<boolean>).detail);
    window.addEventListener(EDITOR_PUBLISHING_EVENT, onPublishing);
    return () => {
      window.removeEventListener(EDITOR_DRAFT_STATE_EVENT, onDraft);
      window.removeEventListener(EDITOR_PUBLISHING_EVENT, onPublishing);
    };
  }, []);
  useEffect(() => {
    if (!orderMessage || orderError) return;
    const timer = setTimeout(() => setOrderMessage(""), 2500);
    return () => clearTimeout(timer);
  }, [orderMessage, orderError]);
  const items = orderProfiles(profiles, order);
  const disabled = waitingForSave || publishing || savingOrder || navigating;
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  async function reorder({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id || savingRef.current || disabled) return;
    const previous = items.map((profile) => profile.id);
    const from = previous.indexOf(String(active.id));
    const to = previous.indexOf(String(over.id));
    if (from < 0 || to < 0) return;
    const next = arrayMove(previous, from, to);
    savingRef.current = true;
    setSavingOrder(true);
    setOrderError(false);
    setOrderMessage("Saving order…");
    setOrder(next);
    try {
      const result = await saveProfileOrder(next);
      if (result.error) throw new Error(result.error);
      if (result.order) setOrder(result.order);
      setOrderMessage("Order saved");
    } catch (error) {
      setOrder(previous);
      setOrderError(true);
      setOrderMessage(
        error instanceof Error
          ? error.message
          : "Could not save the order. Try dragging again.",
      );
    } finally {
      savingRef.current = false;
      setSavingOrder(false);
    }
  }

  return (
    <div className="profile-switcher" aria-busy={savingOrder || navigating}>
      <DndContext
        id={dndId}
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={reorder}
        accessibility={{
          screenReaderInstructions: {
            draggable:
              "Press Space to pick up a profile. Use the arrow keys to change its position. Press Space to save, or Escape to cancel.",
          },
        }}
      >
        <SortableContext
          items={items.map((profile) => profile.id)}
          strategy={rectSortingStrategy}
        >
          <ul className="profile-tabs" aria-label="Your profiles">
            {items.map((profile, index) => (
              <ProfileTab
                key={profile.id}
                profile={profile}
                active={profile.id === currentId}
                first={index === 0}
                disabled={disabled}
                reorderable={items.length > 1}
                onSelect={() => {
                  if (profile.id !== currentId)
                    startNavigation(() =>
                      router.push(`/dashboard?p=${profile.id}`, {
                        scroll: false,
                      }),
                    );
                }}
              />
            ))}
            {canAddMore && (
              <li className="profile-add-slot">
                <button type="button" className="profile-add-action" onClick={() => setAdding(true)} disabled={disabled}>
                  <span aria-hidden>+</span> New profile
                </button>
              </li>
            )}
          </ul>
        </SortableContext>
      </DndContext>
      {orderMessage && (
        <p
          role={orderError ? "alert" : "status"}
          className={`profile-order-message ${orderError ? "is-error" : ""}`}
        >
          {orderMessage}
        </p>
      )}
      {adding && <CreateProfileDialog onClose={() => setAdding(false)} />}
    </div>
  );
}
