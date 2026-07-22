"use client";

import type { Block } from "@/lib/blocks";
import type { Theme } from "@/lib/themes";
import { BlockList, ProfileHeader } from "@/components/blocks/render";
import { profileLabel } from "@/lib/site";

export function Preview({
  profileId,
  displayName,
  username,
  bio,
  avatarUrl,
  blocks,
  theme,
}: {
  profileId: string;
  displayName: string;
  username: string;
  bio: string;
  avatarUrl: string | null;
  blocks: Block[];
  theme: Theme;
}) {
  return (
    <div className="mx-auto w-[318px]">
      <div className="rounded-[2.4rem] border-[10px] border-ink bg-ink shadow-[0_24px_70px_rgba(25,24,19,0.22)]">
        <div
          className="h-[620px] overflow-y-auto rounded-[1.7rem]"
          style={{
            background: theme.page,
            color: theme.text,
            fontFamily: theme.font,
          }}
        >
          <div className="px-5 py-9">
            <ProfileHeader
              displayName={displayName}
              username={username}
              bio={bio}
              avatarUrl={avatarUrl}
              theme={theme}
            />
            <div className="mt-8">
              <BlockList
                blocks={blocks}
                theme={theme}
                hrefFor={() => "#"}
                profileId={profileId}
                preview
              />
            </div>
          </div>
        </div>
      </div>
      <p className="mt-3 text-center text-xs text-faint">
        Live preview · {profileLabel(username)}
      </p>
    </div>
  );
}
