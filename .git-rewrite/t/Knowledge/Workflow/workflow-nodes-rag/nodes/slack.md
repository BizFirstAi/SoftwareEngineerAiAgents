# `slack`

Multi-resource Slack integration node (message / channel / file / reaction / user / userGroup
operations against the Slack Web API), using the resource/operation dispatch pattern
(`SlackOperationInfoFactory.Create(Resource, Operation, ConfigReader)`, 44 total operation
combinations). Output ports: `main` (Success) / `error`. Bot token can be supplied inline
(`botToken`) or via a stored credential (`credentialID`) resolved through `ICredentialResolver` —
when both configured, `ApplyBotTokenAsync` overwrites the inline token with the vault-resolved
bearer token. DB seed has `RequiresCredentials = 0`, which is misleading — every operation's
`Validate()` requires either `botToken` or `credentialID`.

## Config

| Field (JSON key) | Type | Required | Default | Notes |
|---|---|---|---|---|
| `resource` | string (enum: `message`, `channel`, `file`, `reaction`, `user`, `userGroup`) | yes | — | Dispatch key. |
| `operation` | string | yes | — | Dispatch key — see the full operation list below. |
| `botToken` | string | conditional | — | Inline bot token. Required unless `credentialID` is set. Rejected if it contains `"YOUR_"` (case-insensitive) as a placeholder-value guard. |
| `credentialID` | integer | conditional | — | Vault credential id resolved to a bearer token via `ICredentialResolver`, overwriting `botToken`. |

### `message.send` (`chat.postMessage`, most common operation) — full field detail

| Field (JSON key) | Type | Required | Default | Notes |
|---|---|---|---|---|
| `channel` | string | yes | — | Channel ID (`C...`), channel name (`#general`), or DM user ID (`U...`). Validated non-empty. |
| `text` | string | yes | — | Supports Slack `mrkdwn`: `*bold*`, `_italic_`, `~strike~`, `` `code` ``, `>blockquote`, `<URL\|label>`. Validated non-empty. |
| `threadTs` | string | no | — | Set to post as a threaded reply. |
| `username` | string | no | — | Overrides the bot's display name for this message. |
| `iconEmoji` | string | no | — | e.g. `:wave:`. Requires `chat:write.customize` scope. |
| `blocksJson` | string (JSON array) | no | — | Block Kit blocks as a raw JSON array string; `text` is the fallback. Must parse as a JSON array (not object), and each block must have a `type` property, or the node errors before calling Slack. |
| `ephemeral` | boolean | no | `false` | When `true`, sends via `chat.postEphemeral` (visible only to `targetUserId`). Cannot be updated/deleted/retrieved from history afterward. |
| `targetUserId` | string | conditional | — | Required when `ephemeral` is `true`; validated at execution time (`"targetUserId is required when ephemeral is true"`). |
| `incomingText` | string | no | — | Pass-through field for text received from an upstream Slack event; propagated into output, not sent to Slack. |
| `conversationId` | string | no | — | Workflow-level conversation identifier for message threading; propagated into output only. |

### Other Slack resource/operation combinations (name-only — not detailed here)

Enumerated from `SlackOperationInfoFactory._Create` (37 more combinations beyond `message.send`):

- **message**: `sendAndWait`, `sendEphemeral`, `update`, `delete`, `getPermalink`, `search`
- **channel**: `archive`, `close`, `create`, `get`, `getMany`, `getHistory`, `invite`, `join`, `kick`, `leave`, `getMembers`, `open`, `rename`, `getReplies`, `setPurpose`, `setTopic`, `unarchive`
- **file**: `upload`, `get`, `getMany`
- **reaction**: `add`, `get`, `remove`
- **user**: `get`, `getMany`, `getProfile`, `getStatus`, `updateProfile`
- **userGroup**: `create`, `disable`, `enable`, `getMany`, `getUsers`, `addUsers`, `update`

Each has its own `{Operation}Info` class under
`BizFirst.Ai.ExecutionNodes.Slack/Main/Features/{Resource}/{Operation}/` (or `OperationInfo/` for
some) — read the specific class before authoring config for any operation other than
`message.send`.

## Example

```json
{
  "resource": "message",
  "operation": "send",
  "credentialID": 17,
  "channel": "#general",
  "text": "Deployment finished successfully :white_check_mark:",
  "threadTs": "",
  "username": "BizFirst Bot",
  "iconEmoji": ":robot_face:",
  "ephemeral": false
}
```

## Gotchas

- **DB schema gap — serious (copy-paste stub):** the DB seed `ConfigurationSchema` for `slack` is
  a **verbatim copy of the unrelated `ai-agent` node type's schema**. It lists fields `AgentID`,
  `MessageSource` (enum `config`/`inputData`), `Message`, `ConversationScope` (enum
  `ProcessElement`/`ProcessDefinition`), `ConversationMode` (enum `PerInstance`/`PerDefinition`),
  `IncludeInputData`, `InstanceInstructions`, `InstanceMcpServerIds`, `InjectExecutionEnv`,
  `EnableObservabilityLogging` — **none of these are real Slack fields**. None of `resource`,
  `operation`, `channel`, `text`, `botToken`, or any other actual Slack config key appears in the
  DB schema at all. Do not use the DB `ConfigurationSchema` for this node under any circumstance —
  it will produce a config the executor cannot read.
- The DB seed also sets `RequiresCredentials = 0`, which is inaccurate: every Slack operation's
  `Validate()` fails without a resolvable `botToken` or `credentialID`.
- `botToken` placeholder detection only catches values containing `"YOUR_"` or exactly matching
  `"YOUR_SLACK_BOT_TOKEN"` (case-insensitive) — other obviously-fake tokens pass validation.
- The Slack Web API always returns HTTP 200; failure is signaled by `"ok": false` in the response
  body, which `ISlackChatService`/`SlackMessageSendResult` translate into the node's `error` port
  — do not assume an HTTP-level check is happening.
- `ephemeral: true` messages cannot later be targeted by `message.update` or `message.delete` —
  there is no `ts` retrievable for them the same way as a normal post.
