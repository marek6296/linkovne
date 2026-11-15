"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { DeleteProfileForm } from "@/components/settings/delete-profile-form";

export function DeleteProfileButton({
  profileId,
  username,
  disabled,
}: {
  profileId: string;
  username: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        className="profile-delete-trigger"
        disabled={disabled}
        onClick={() => setOpen(true)}
      >
        Delete profile
      </button>
      {open && (
        <DeleteProfileDialog
          profileId={profileId}
          username={username}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

function DeleteProfileDialog({
  profileId,
  username,
  onClose,
}: {
  profileId: string;
  username: string;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [pending, setPending] = useState(false);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog.current?.showModal();
    return () => {
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, []);

  return createPortal(
    <dialog
      ref={dialog}
      className="studio-dialog profile-delete-dialog"
      aria-labelledby="delete-profile-title"
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
          <h2 id="delete-profile-title">Delete @{username}?</h2>
          <p>This action cannot be undone.</p>
        </div>
        <button
          type="button"
          className="studio-icon-button"
          aria-label="Close delete profile"
          disabled={pending}
          onClick={onClose}
        >
          ×
        </button>
      </header>
      <DeleteProfileForm
        profileId={profileId}
        username={username}
        onCancel={onClose}
        onPendingChange={setPending}
      />
    </dialog>,
    document.body,
  );
}
