---
name: buffer-linkovne
description: Use for Linkovne social media in Buffer, including connected channels, ideas, drafts, queues, scheduled posts and performance. This is the dedicated Linkovne connection, separate from other Buffer accounts.
---

# Buffer Linkovne

Use this plugin's Buffer MCP connection for Linkovne work. Do not substitute
another Buffer, Buffer 2 or Buffer 3 connection just because the tool names match.
The official server is https://mcp.buffer.com/mcp and uses user-managed OAuth.
The connection name is `buffer_linkovne`. On Codex hosts where it is exposed as
`mcp__buffer_linkovne__*`, use those tools. This is the same dedicated connection,
not one of the other brands' Buffer accounts.

## Establish the account

1. On first use, call `get_account` from this connection. Read the returned
   organizations and the account timezone.
2. Call `list_channels` for the relevant returned organization ID. Confirm the
   channels belong to Linkovne before making changes. Reuse the verified IDs in
   the conversation. Do not infer IDs, account identity or channel handles from
   this plugin's name alone.
3. If the connection points to a different brand, ask the user to reconnect with
   their Linkovne account. If multiple organizations or channels are plausible,
   ask which one they intend. Never silently fall back to another connection.

## Work with Buffer

- Use the live tool schemas and provider guidance; do not invent arguments.
- Read channel details when their schedule, timezone or platform requirements
  matter. For queues, request only the needed channels, dates and statuses.
- For drafting requests, create drafts or ideas. Publish or schedule only when
  the user's request authorizes that action and the destination is clear.
- For edits, retain the existing scheduling mode and time unless the user asks
  to change them. Distinguish draft, queued, scheduled, sent and failed states.
- Use aggregate metrics for account or campaign totals. Request per-post metrics
  only when needed for the user's question.
- Follow the host's confirmation rules for irreversible deletion. Never publish,
  delete or create a test post merely to verify this integration.
- Summarize the actual result, channel and scheduled time in the user's language.
  Do not claim connection or publishing success without a successful response.

## Connection checks

A setup check is read-only: `get_account`, then `list_channels`. Let the user
complete login and OAuth consent in Buffer. Never extract tokens from a browser,
copy another account's credentials, or store credentials in this package.

## Account isolation

Use only `mcp__buffer_linkovne__*` for Linkovne. Doprai must use
`mcp__buffer_doprai__*`. Never use, log out, or reauthorize another brand's
connection. Verify account and channels before every publishing batch.
If another chat is using this connector for Doprai, stop and report the routing
error; do not switch accounts while that chat is working.
