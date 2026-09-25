# `email-gmail`

Multi-resource Gmail integration node (message / draft / label / thread operations against the
Gmail API), using the resource/operation dispatch pattern
(`(mySettings.Resource, mySettings.Operation) switch` in `GmailNodeExecutor.cs`). Registered under
DB `Code = 'email-gmail'` (compile-time constant `GmailNodeExecutor.NodeTypeName`) — note this
differs from the `gmail` short name sometimes used informally. Requires credentials
(`RequiresCredentials = 1`): authenticates purely via OAuth2 — the executor calls
`ReadCredentialOAuth2PrimaryAsync()` and force-unwraps the result, so a valid stored OAuth2
credential (`credentialID`) is mandatory for every operation; there is no inline-token fallback.
Output ports: `main` (Success) / `error` (generic `GetOrCreatePortSuccessAndError()`).

## Config

| Field (JSON key) | Type | Required | Default | Notes |
|---|---|---|---|---|
| `resource` | string (enum: `message`, `draft`, `label`, `thread`) | yes | — | Dispatch key. |
| `operation` | string | yes | — | Dispatch key. DB schema does not enum the valid values per resource — see the operation list below. |
| `credentialID` | integer | yes (de facto) | — | Stored OAuth2 credential. Not itself declared in the DB `ConfigurationSchema`, but resolution is mandatory — every operation throws if no credential resolves. |
| `continueOnError` | boolean | no | `false` | Read at the settings root (`GmailNodeExecutorSettings.ContinueOnError`), available to all resource/operation combinations. |
| `profileName` | string | no | — | Declared in the DB `ConfigurationSchema` but **not read anywhere in the executor code** — dead field, do not rely on it. |

### `message.send` (most common operation) — full field detail

| Field (JSON key) | Type | Required | Default | Notes |
|---|---|---|---|---|
| `sendTo` | string | yes | — | Validated: node errors with `"Config key 'sendTo' is required."` if blank. |
| `subject` | string | no | `""` | |
| `emailType` | string | no | `"html"` | Controls both the Gmail API body MIME type and the attribution line format (see `appendAttribution`). |
| `message` | string | no | `""` | Body content. |
| `senderName` | string | no | — | Passed as the request's `From` display name. |
| `replyTo` | string | no | — | |
| `ccList` | string | no | — | |
| `bccList` | string | no | — | |
| `attachmentsBinary` | string (CSV or JSON array) | no | — | Parsed via `ParseStringList` into a field-name list, but **not actually wired to the outgoing Gmail request** — see Gotchas. |
| `appendAttribution` | boolean | no | `false` | When `true`, appends `"This email was sent automatically via BizFirst Workflow."` (HTML `<br><br><small>` wrapped, or `\n\n` for non-html `emailType`). |

### Other Gmail resource/operation combinations (name-only — not detailed here)

Enumerated from `GmailNodeExecutor._ExecuteInternal_Route_Async` and the `Main/Features/` folder
layout (10 message ops, 4 draft ops, 4 label ops, 8 thread ops):

- **message**: `send`, `reply`, `get`, `getMany`, `delete`, `trash`, `untrash`, `markAsRead`, `markAsUnread`, `addLabel`
- **draft**: `create`, `get`, `getMany`, `delete`
- **label**: `create`, `get`, `getMany`, `delete`
- **thread**: `get`, `getMany`, `delete`, `trash`, `untrash`, `addLabel`, `removeLabel`, `reply`

Each has its own `GmailNodeExecutorSettings{Resource}{Operation}Info` DTO under
`Main/Features/{Resource}/{Operation}/` — read the specific partial before authoring config for
any operation other than `message.send`.

## Example

```json
{
  "resource": "message",
  "operation": "send",
  "credentialID": 42,
  "sendTo": "customer@example.com",
  "subject": "Your invoice is ready",
  "emailType": "html",
  "message": "<p>Your invoice <b>#1234</b> is attached.</p>",
  "senderName": "BizFirst Notifications",
  "replyTo": "support@bizfirst.example",
  "ccList": "",
  "bccList": "",
  "appendAttribution": false
}
```

## Gotchas

- **DB schema gap:** the DB seed `ConfigurationSchema` for `email-gmail` only declares
  `credentialId`, `resource` (enum message/draft/label/thread), `operation` (untyped string, no
  enum), and `profileName`. It does not declare any of `message.send`'s real fields (`sendTo`,
  `subject`, `emailType`, `message`, `senderName`, `replyTo`, `ccList`, `bccList`,
  `attachmentsBinary`, `appendAttribution`) — an agent relying on the DB schema alone would not
  know these fields exist.
- `profileName` is present in the DB schema but has zero references in the Gmail executor code —
  it is a dead/stub field.
- `attachmentsBinary` is read and parsed (`ParseStringList`) but the resulting list is never used:
  `GmailSendRequest` is always constructed with `Array.Empty<GmailAttachmentData>()` and
  `HasAttachments = false`. **Attachments are not currently supported by `message.send`** despite
  the config field existing — do not tell a user this node can send attachments.
- Because credential resolution uses `(...).AccessToken` on a non-null-asserted result, a missing
  or invalid `credentialID` throws rather than returning a clean validation error — always ensure
  `credentialID` is set and valid before dispatching.
- `credentialID` key casing: the generic `BaseNodeExecutor` credential reader accepts both
  `credentialID` and `credentialId` (see `BaseNodeExecutor.Credentials.cs`), so either casing
  works for supplying it, unlike most operation-specific fields which use ordinal, case-sensitive
  lookups.
