# `webhook-trigger`

Entry-point node that starts a workflow when an external system sends an HTTP request to the
platform's catch-all webhook endpoint. The live route (`WebhookController` in
`NodeInstanceWebhookController.cs`) is:

```
POST /api/webhook/{**path}       (also accepts GET)
```

where `path` is either `{nodeId}` or `{tenantId}/{nodeId}`. The controller responds immediately
with **HTTP 202 Accepted** (fire-and-forget) and returns **404** if no webhook endpoint matches the
path; the actual workflow execution happens asynchronously afterward, resolved via `IWebhookRouter`
against the node's registered webhook capability. The deserialized JSON body — merged with
injected `_webhook_*` system metadata (method, path, headers, query, receivedAt, etc.) — becomes
the node's `InputData` for downstream nodes.

Output ports: `main` (payload accepted and passed validation), `error` (payload validation failed,
or an unhandled exception occurred). Requires no platform credential entity, but supports an
optional HMAC-SHA256 shared secret for signature verification.

## Config

| Field (JSON key) | Type | Required | Default | Notes |
|---|---|---|---|---|
| `webhookSecret` | string | No | (none) | HMAC-SHA256 shared secret. Only enforced when the webhook **capability's** `authType` property equals `"hmac"` (see Gotchas — this is not the same JSON as `Configuration`). When `authType=hmac` and this is empty, verification fails closed (every request rejected with 401). |
| `requireBody` | string/bool (`"true"`/`"false"`) | No | `false` | When `true`, requests with a null or empty body are rejected and routed to `error`. |
| `requiredFields` | string (comma-separated) | No | (none) | Top-level field names that must be present in the request body, e.g. `"eventType, payload"`. Whitespace around entries is trimmed. **Only checked when `requireBody` is also `true`** — see Gotchas. |

## Example

```json
{
  "webhookSecret": "whsec_exampleSecretValue",
  "requireBody": true,
  "requiredFields": "eventType, payload"
}
```

HMAC-signed callers must send the signature in header `X-Hub-Signature-256` with prefix
`sha256=` followed by the lowercase hex HMAC-SHA256 of the raw request body, keyed with
`webhookSecret`.

## Gotchas

- DB schema gap: `ConfigurationSchema` in the seed
  (`Process_ProcessElementTypes_WebhookTrigger.data.sql`) is a completely empty stub
  `{"type":"object","properties":{}}`, despite all three fields above (`webhookSecret`,
  `requireBody`, `requiredFields`) being real, functioning config keys read by
  `WebhookTriggerNodeSettings`. Confirmed directly against the seed file — this is one of the
  worst gaps found in this investigation.
- `requiredFields` is silently ignored unless `requireBody` is also `true`.
  `ValidateWebhookPayload` returns immediately (`if (!settings.RequireBody) return;`) before ever
  checking `RequiredFields`. Setting `requiredFields` alone, without `requireBody: true`, has no
  effect at all.
- `authType` (`"hmac"` / `"none"`) is **not** a key inside this node's `Configuration` JSON. It
  lives on the node's separate webhook *capability* definition (read via
  `CapabilityConfigurationService.GetProperty<string>(cap, "authType")` against the matching
  `NodeWebhooks` entry). Setting `webhookSecret` in `Configuration` alone does **not** turn on
  signature verification — the capability's `authType` must also be set to `hmac`, which is a
  different configuration surface than the node's `Configuration` column.
- The executor's own XML doc comment (`WebhookTriggerNodeExecutor.cs`) describes the route as
  `POST /api/process-engine/webhook/{processThreadId}` — that comment is stale. The route actually
  registered and live is `api/webhook/{**path}` in `WebhookController`
  (`BizFirst.Ai.ProcessEngine.Api.Base`), with `{nodeId}` or `{tenantId}/{nodeId}` as the path
  shape, not a `processThreadId` segment.
- `RequireBody` is parsed with `bool.TryParse` on the string form of the config value; a raw JSON
  boolean still round-trips fine through the config reader, but any value other than the literal
  strings `"true"`/`"false"` (case-insensitive) is treated as `false` rather than raising a
  validation error.
