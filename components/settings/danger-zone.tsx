"use client";

import { useState } from "react";
import {
  deleteAccountData,
  deleteProfile,
} from "@/app/dashboard/settings/actions";

export function DangerZone({
  profileId,
  username,
  profileCount,
}: {
  profileId: string;
  username: string;
  profileCount: number;
}) {
  const [confirmProfile, setConfirmProfile] = useState("");
  const [confirmAccount, setConfirmAccount] = useState("");

  return (
    <div className="space-y-3">
      {profileCount > 1 && (
        <div className="card border-danger/25 p-5">
          <p className="font-medium">Delete this page</p>
          <p className="mt-1 text-sm text-soft">
            Removes <span className="font-medium">{username}</span>, its blocks,
            stats and messages. The address becomes free for someone else.
          </p>
          <form
            action={deleteProfile.bind(null, profileId)}
            className="mt-3 flex flex-wrap items-center gap-2"
          >
            <input
              value={confirmProfile}
              onChange={(e) => setConfirmProfile(e.target.value)}
              placeholder={`Type ${username} to confirm`}
              className="field max-w-xs py-2"
            />
            <button
              type="submit"
              disabled={confirmProfile !== username}
              className="rounded-full border border-danger/30 px-4 py-2 text-sm text-danger transition hover:bg-danger/5 disabled:opacity-40"
            >
              Delete page
            </button>
          </form>
        </div>
      )}

      <div className="card border-danger/25 p-5">
        <p className="font-medium">Delete all my Linkovne data</p>
        <p className="mt-1 max-w-xl text-sm text-soft">
          Deletes every page, block, message and statistic on this account. Your
          login itself stays — it&apos;s shared with our other sites, so removing
          it would lock you out of those too.
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
