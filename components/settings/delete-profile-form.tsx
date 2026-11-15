"use client";

import { useActionState, useEffect, useId, useState } from "react";
import {
  deleteProfile,
  type SettingsState,
} from "@/app/dashboard/settings/actions";

export function DeleteProfileForm({
  profileId,
  username,
  onCancel,
  onPendingChange,
}: {
  profileId: string;
  username: string;
  onCancel?: () => void;
  onPendingChange?: (pending: boolean) => void;
}) {
  const [confirmation, setConfirmation] = useState("");
  const [state, action, pending] = useActionState<SettingsState, FormData>(
    deleteProfile.bind(null, profileId),
    undefined,
  );
  const id = useId();
  useEffect(() => {
    onPendingChange?.(pending);
  }, [pending, onPendingChange]);

  return (
    <form action={action} className="delete-profile-form">
      <p id={`${id}-description`} className="text-sm text-soft">
        Permanently deletes <strong>@{username}</strong>, its content, analytics
        and messages. The address becomes available again. Your account and
        other profiles stay.
      </p>
      <label htmlFor={id} className="mt-5 mb-2 block text-sm font-medium">
        Type <strong>{username}</strong> to confirm
      </label>
      <input
        id={id}
        name="username"
        value={confirmation}
        onChange={(event) => setConfirmation(event.target.value)}
        required
        autoComplete="off"
        spellCheck={false}
        disabled={pending}
        aria-describedby={`${id}-description`}
        className="field"
      />
      {state?.error && (
        <p role="alert" className="mt-3 text-sm text-danger">
          {state.error}
        </p>
      )}
      <div className="profile-dialog-actions">
        {onCancel && (
          <button type="button" onClick={onCancel} disabled={pending}>
            Cancel
          </button>
        )}
        <button
          type="submit"
          className="profile-delete-confirm"
          disabled={pending || confirmation !== username}
        >
          {pending ? "Deleting…" : "Delete profile permanently"}
        </button>
      </div>
    </form>
  );
}
