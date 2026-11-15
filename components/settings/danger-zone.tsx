"use client";

import { DeleteProfileForm } from "./delete-profile-form";
import { useState } from "react";
import { deleteAccountData } from "@/app/dashboard/settings/actions";

export function DangerZone({
  profileId,
  username,
}: {
  profileId: string;
  username: string;
  profileCount: number;
}) {
  const [confirmAccount, setConfirmAccount] = useState("");

  return (
    <div className="space-y-3">
      <div className="card border-danger/25 p-5">
        <p className="mb-3 font-medium">Delete this profile</p>
        <DeleteProfileForm profileId={profileId} username={username} />
      </div>

      <div className="card border-danger/25 p-5">
        <p className="font-medium">Delete all my linkovne data</p>
        <p className="mt-1 max-w-xl text-sm text-soft">
          Deletes every page, block, message and statistic on this account. Your
          login itself stays — it&apos;s shared with our other sites, so
          removing it would lock you out of those too.
        </p>
        <form
          action={async () => {
            await deleteAccountData();
          }}
          className="mt-3 flex flex-wrap items-center gap-2"
        >
          <input
            value={confirmAccount}
            onChange={(e) => setConfirmAccount(e.target.value)}
            placeholder="Type DELETE to confirm"
            className="field max-w-xs py-2"
          />
          <button
            type="submit"
            disabled={confirmAccount !== "DELETE"}
            className="rounded-full border border-danger/30 px-4 py-2 text-sm text-danger transition hover:bg-danger/5 disabled:opacity-40"
          >
            Delete everything
          </button>
        </form>
      </div>
    </div>
  );
}
