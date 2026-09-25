# `email-smtp`

Sends an email through a directly-configured SMTP server (via MailKit). Use this node when you
need to send mail through an arbitrary SMTP relay/host with inline credentials — for a Gmail
mailbox specifically, prefer the `email-gmail` node (OAuth2, no server settings). This node uses
the resource/operation dispatch pattern (`SmtpOperationInfoFactory`), but only one combination is
implemented: `resource="email"`, `operation="send"`. Output ports: `main` (Success) / `error`.
`RequiresCredentials = 1` in the DB seed, but credentials are effectively optional: the node
works with inline `host`/`port`/`userName`/`password`, and additionally supports a stored
`credentialID` (vault `KeyValueCredential`) whose resolved username/password **override** the
inline values when present.

## Config

| Field (JSON key) | Type | Required | Default | Notes |
|---|---|---|---|---|
| `resource` | string (enum: `email`) | yes | `email` | Dispatch key; only `email` is implemented. |
| `operation` | string (enum: `send`) | yes | `send` | Dispatch key; only `send` is implemented. |
| `host` | string | yes | — | SMTP server hostname/IP. Validated non-empty (`MISSING_HOST`). |
| `port` | integer | yes | — | 1–65535. Validated (`INVALID_PORT`). Common: 465 (SMTPS), 587 (STARTTLS), 25. |
| `userName` | string | no | — | SMTP AUTH username. Empty/absent = anonymous relay. **Actual code key is `userName` (capital N)** — see Gotchas. |
| `password` | string | no | — | SMTP AUTH password. Never echoed back in `ToDictionary()` diagnostics. |
| `credentialID` | integer | no | — | Vault `KeyValueCredential` id. When resolved, its Username/Password **override** inline `userName`/`password`. Not listed in the DB `ConfigurationSchema`. |
| `ssl` | boolean | no | `false` | `true` = SMTPS from first byte (port 465). |
| `tls` | boolean | no | `true` | STARTTLS upgrade attempt; only applies when `ssl` is `false`. |
| `allowUnauthorized` | boolean | no | `false` | Bypasses TLS certificate validation. Must never be `true` in production. |
| `timeoutSeconds` | integer | no | `30` | Overall SMTP operation timeout. `0` = MailKit's built-in 2-minute IO timeout. Not present in the DB `ConfigurationSchema`. |
| `fromEmail` | string | yes | — | Must contain `@` (validated `INVALID_FROM_EMAIL`). Supports `"Name <addr>"` format. |
| `fromName` | string | no | — | Applied when `fromEmail` is a bare address. |
| `toEmail` | string | yes | — | Comma-separated. Every address must contain `@` (validated `INVALID_TO_EMAIL`). |
| `ccEmail` | string | no | — | Comma-separated, validated same as `toEmail` if present. |
| `bccEmail` | string | no | — | Comma-separated, validated same as `toEmail` if present. |
| `replyToEmail` | string | no | — | Defaults to server using `fromEmail` if absent. |
| `subject` | string | no | `""` | |
| `text` | string | no | — | Plain-text body. Omit for HTML-only. |
| `html` | string | no | — | HTML body. When both `text` and `html` are set, a multipart/alternative body is built. |
| `priority` | string (enum: `high`, `normal`, `low`) | no | — | Case-insensitive match; any other value fails validation (`INVALID_PRIORITY`). |
| `headers` | object (string → string) | no | — | Custom headers. Keys are deduped case-insensitively (`OrdinalIgnoreCase`) — two header names differing only by case collide. |
| `attachmentsData` | array of `{fileName, contentType, content, cid}` | no | — | `content` must be base64. Entries with empty/missing `content` are silently skipped. `cid` is optional (inline image content-id). |

## Example

```json
{
  "resource": "email",
  "operation": "send",
  "host": "smtp.sendgrid.net",
  "port": 587,
  "userName": "apikey",
  "password": "SG.xxxxxxxxxxxxxxxxxxxxxxxx",
  "ssl": false,
  "tls": true,
  "allowUnauthorized": false,
  "fromEmail": "no-reply@bizfirst.example",
  "fromName": "BizFirst Notifications",
  "toEmail": "customer@example.com",
  "ccEmail": "",
  "bccEmail": "",
  "replyToEmail": "support@bizfirst.example",
  "subject": "Your invoice is ready",
  "text": "Your invoice #1234 is attached.",
  "html": "<p>Your invoice <b>#1234</b> is attached.</p>",
  "priority": "normal",
  "headers": { "X-Campaign-Id": "invoice-reminder" },
  "attachmentsData": [
    { "fileName": "invoice.pdf", "contentType": "application/pdf", "content": "JVBERi0xLjQK..." }
  ]
}
```

## Gotchas

- **DB schema gap (key casing):** the DB seed `ConfigurationSchema` lists the username field as
  `username`, but the real settings class (`EmailSendConnectionInfo.LoadFrom`, in
  `SmtpNodeExecutor.Email.Send.cs`) reads it as `reader.ReadConfigByKeyDefaultNull("userName")`
  — capital `N`. Config keys are read from a plain `Dictionary<string,object>` with
  ordinal (case-sensitive) lookup, so a config authored with `"username"` per the DB schema is
  silently ignored — the node falls back to anonymous relay instead of authenticating. Always use
  `userName`.
- **DB schema gap (missing fields):** `credentialID` and `timeoutSeconds` are real, working config
  keys that do not appear anywhere in the DB `ConfigurationSchema`.
- Aside from the `userName` casing bug and the two missing fields above, this DB seed is otherwise
  accurate and complete — a useful positive counter-example against `slack`'s schema, which is a
  verbatim copy-paste stub (see `slack.md`).
- `credentialID` resolution happens *after* inline config is loaded and *overrides* it — so a
  workflow with both a stored credential and an inline `password` will silently use the stored
  one, not the inline one.
- `attachmentsData[].content` must already be base64-encoded; there is no separate `contentEncoding`
  flag.
- The class implementing the real (internal) settings DTO is `EmailSendInfo` in
  `Main/Features/SendEmail/EmailSendInfo.cs`; `SmtpNodeExecutorSettingsEmailSendInfo` (the public
  record in `BizFirst.Integration.Smtp.Domain`) is only the final typed request handed to
  `ISmtpEmailService` — do not confuse the two when reading code.
