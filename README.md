# `kolivri-voice-mcp` — Real AI Phone Line for Claude Code, OpenCode, Cursor & Claude Desktop

`kolivri-voice-mcp` is a zero-dependency Node.js ESM Model Context Protocol (MCP) server that gives AI coding and operator agents a real phone line powered by Kolivri (`app.kolivri.co.il`).

## Features & Tools

1. **`kolivri_place_call`** — Trigger an outbound AI voice call via `POST ${KOLIVRI_API_URL}/api/v1/engine/trigger/${webhookId}`:
   - Normalizes Israeli (`054-1234567`) and international E.164 (`+972541234567`) phone numbers.
   - Enforces language whitelist (`he`, `en`, `ar`, `ru`, `fr`, `es`, `de`, `pt`, default `he`).
   - Enforces KYC verified-caller checks (`verifiedCallerId` + optional `KOLIVRI_VERIFIED_CALLER_ID` allowlist).
   - Enforces per-key sliding-window rate limits (`KOLIVRI_MAX_CALLS_PER_MINUTE`, default `5/min`) to prevent robocall loops.
2. **`kolivri_get_call_status`** — Fetch call status, structured outcome, transcript, summary, appointment status, and recording URL.
3. **`kolivri_carrier_forwarding_codes`** — Generate exact 30-second GSM/IMS call-forwarding dial strings (`*61*`, `*67*`, `*62*`, `*004*`, `*21*`, and `##002#` reset) for Israeli carriers (`partner`, `pelephone`, `cellcom`, `hot_mobile`, `golan`, `019`, `we4g`, `bezeq`).
4. **`kolivri_preview_roi`** — Compute monthly SMB missed-call loss, recovered revenue, and recommend the matching Kolivri unified plan (`Starter $69 / ₪247`, `Business $139 / ₪479`, `Pro $249 / ₪880`).

## Environment Variables

| Variable | Required | Default | Description |
| --- | --- | --- | --- |
| `KOLIVRI_API_KEY` | Yes (for live calls) | — | Kolivri API key sent in `x-api-key` header |
| `KOLIVRI_WEBHOOK_ID` | Optional | `default-webhook` | Default Kolivri campaign/engine webhook ID |
| `KOLIVRI_VERIFIED_CALLER_ID` | Optional | — | Comma-separated KYC-verified caller IDs in E.164 or Israeli format |
| `KOLIVRI_API_URL` | Optional | `https://app.kolivri.co.il` | Kolivri API base URL |
| `KOLIVRI_MAX_CALLS_PER_MINUTE` | Optional | `5` | Maximum outbound calls per minute per API key |

## Installation

### 1. Claude Code (`claude mcp add`)

```bash
claude mcp add kolivri-voice \
  -e KOLIVRI_API_KEY="your-kolivri-api-key" \
  -e KOLIVRI_WEBHOOK_ID="your-webhook-id" \
  -e KOLIVRI_VERIFIED_CALLER_ID="+97235550199" \
  -- node /path/to/kolivri-code/kolivri-voice-mcp/src/server.mjs
```

### 2. OpenCode (`~/.config/opencode/opencode.json`)

Add `kolivri-voice` under the `"mcp"` key in `opencode.json`:

```json
{
  "mcp": {
    "kolivri-voice": {
      "type": "local",
      "command": ["node", "/path/to/kolivri-code/kolivri-voice-mcp/src/server.mjs"],
      "environment": {
        "KOLIVRI_API_KEY": "your-kolivri-api-key",
        "KOLIVRI_WEBHOOK_ID": "your-webhook-id",
        "KOLIVRI_VERIFIED_CALLER_ID": "+97235550199"
      },
      "enabled": true
    }
  }
}
```

### 3. Cursor (`~/.cursor/mcp.json`)

```json
{
  "mcpServers": {
    "kolivri-voice": {
      "command": "node",
      "args": ["/path/to/kolivri-code/kolivri-voice-mcp/src/server.mjs"],
      "env": {
        "KOLIVRI_API_KEY": "your-kolivri-api-key",
        "KOLIVRI_WEBHOOK_ID": "your-webhook-id",
        "KOLIVRI_VERIFIED_CALLER_ID": "+97235550199"
      }
    }
  }
}
```

## Running Tests

```bash
node --test kolivri-voice-mcp/test/voice-mcp.test.mjs
```
