# Buffer Linkovne

Private plugin package using Buffer's hosted MCP server. No custom backend,
API key or Buffer credentials belong in this repository.

Private plugin: https://chatgpt.com/plugins/plugins_6af8d3e9c39c8191a7f86dc86d1994cb

Initial release: `pluginrel_6af8d3eb37b48191a8659ab3ce7a215c` (1.0.0).
Resolve the current release before future updates; do not create a second plugin.

- Endpoint: `https://mcp.buffer.com/mcp`
- Transport: Streamable HTTP
- Authentication: OAuth, dynamic client registration (PKCE S256)
- Provider guide: https://developers.buffer.com/guides/integrations/chatgpt.html

Install the private plugin and connect the Linkovne Buffer account through the
provider's OAuth screen. Verify the connection with `get_account` and
`list_channels`; check the organization and channel identities before writes.
Creating the package alone does not authenticate the account.

The MCP connection is named `linkovne_social`, including in Codex host settings.
If Codex has not registered it, use the provider's supported setup flow:

```sh
codex mcp add linkovne_social --url https://mcp.buffer.com/mcp --oauth-client-registration dcr
```

For an existing connection that needs login, use `codex mcp login linkovne_social`.
Complete the OAuth screen with the Linkovne account. An `o_auth` status and
successful tool discovery verify the transport; `get_account` and `list_channels`
are still required to verify which account was authorized.

The plugin provides a dedicated connection and account-selection instructions.
Keep it separate from existing Buffer MCP connections for other brands.

Package the contents of this directory as one ZIP, including `plugin.json`,
`mcp.json`, `assets/` and `skills/`. No local configuration or secrets are needed.

