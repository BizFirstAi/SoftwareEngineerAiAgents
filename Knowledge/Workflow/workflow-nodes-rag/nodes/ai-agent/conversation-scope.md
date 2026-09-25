# `ai-agent` — Conversation Scope & Identity

Sub-feature of `ai-agent` (see `00-index.md`). Covers the `operation` selector and everything that
determines *which* conversation an invocation reads/writes/resumes: the nested `ConversationScope`
object, explicit conversation identity, and postback (paused-tool-call reply) identity.

Source: `OctopusAiAgentNodeExecutorSettings.ConversationScope` (reads the 4 sub-fields),
`ConversationScope`/`eConversationScope`/`eConversationScopeMode`/`eConversationIsolation`
(`BizFirst.SuperCommon\Scoping\ConversationScope.cs`), and `OctopusAiAgentBridgeOriginReader`'s
`ConversationID`/`IsNewConversation`/postback fields.

## `operation`

| Field (JSON key) | Type | Required | Default | Notes |
|---|---|---|---|---|
| `operation` | string, enum `"send"` \| `"chat"` | implicit | `"send"` | `send` = one-shot, non-HIL, returns on `main` immediately. `chat` = HIL multi-turn; first call suspends (`waiting` port), later calls with the same conversation identity resume it. See `hil-features.md` for the suspend/resume mechanics this drives. |

## `ConversationScope` (nested object)

Not a flat value — read as 4 sibling config keys into one `ConversationScope` object
(`OctopusAiAgentNodeExecutorSettings.Read_ConversationScope`).

| Field (JSON key) | Type | Required | Default | Notes |
|---|---|---|---|---|
| `ConversationScope` | string, enum (`eConversationScope`, 11 values — see below) | No | `Default` | The boundary level a conversation is scoped to. |
| `ConversationMode` | string, enum (`eConversationScopeMode`: `Default`\|`PerInstance`\|`PerDefinition`) | No | `Default` | `PerInstance` = new conversation ID each run; `PerDefinition` = shared ID across runs at the same scope level. |
| `ConversationIsolation` | string, enum (`eConversationIsolation`, 9 values — see below) | No | `Default` | *How* the conversation is isolated across concurrent invocations — combined with `Scope` to produce the precise conversation ID prefix. |
| `AlwaysStartNewConversation` | boolean | No | `false` | Force a brand-new conversation regardless of what `Scope`/`Mode`/`Isolation` would otherwise resolve to. |

### `eConversationScope` values (real enum — the DB schema's `ProcessElement`/`ProcessDefinition`
two-value claim is wrong; there are 11)

| Value | Meaning |
|---|---|
| `Default` | Maps to `ProcessElement` behavior — one conversation per process element (node) within a process thread. |
| `App` | One conversation shared across the entire application lifetime. |
| `Channel` | One conversation per channel (e.g. per webhook channel or connector). |
| `Process` | One conversation per Process definition. |
| `ProcessThread` | One conversation per ProcessThread execution run. |
| `ProcessElement` | One conversation per ProcessElement (node) execution. |
| `RootExecution` | One conversation per root-level execution (top-most thread in a run). |
| `Conversation` | One shared conversation per explicit `conversationID` across invocations. |
| `AgentRun` | (real enum value; no doc comment in source beyond the name) |
| `Agent` | (real enum value; no doc comment in source beyond the name) |
| `State` | (real enum value; no doc comment in source beyond the name) |

### `eConversationIsolation` values

| Value | Meaning |
|---|---|
| `Default` | System-default — currently behaves as `Request`: isolated per-request, shared across nodes within that request. |
| `Transient` | Brand-new conversation for every single invocation; no history carried between runs. |
| `Request` | Shared across nodes in the same inbound request; new conversation per new request. |
| `UserSession` | Persists for the duration of the user's session; different sessions for the same user get different conversations. |
| `User` | Shared across all sessions for the same user — persistent "personal assistant" memory per user. |
| `Tenant` | All users in the same tenant share one conversation at the given scope. |
| `Server` | Isolated to the current server instance — for distributed debug/monitoring agents, not user-facing features. |
| `Platform` | Single shared conversation across all tenants on the platform — no tenant isolation, handle with care. |
| `Global` | Universally shared across all servers, tenants, and sessions — use only for read-only/idempotent agents. |

Typical `Scope`×`Isolation` combinations documented in source: `ProcessElement`+`Default` (one
conversation per node per request — the typical agent node), `ProcessElement`+`User` (per-user
persistent conversation per node), `ProcessElement`+`Tenant` (tenant-level memory per node),
`ProcessElement`+`Transient` (no history at all), `Agent`+`Platform` (single global conversation for
an agent across all tenants), `Channel`+`UserSession` (chat-window memory).

## Explicit conversation identity

| Field (JSON key) | Type | Required | Default | Notes |
|---|---|---|---|---|
| `conversationID` | string | No | — | Explicit conversation identity to resume against (chat mode); auto-generated/looked-up from `ConversationScope` if omitted. |
| `isNewConversation` | boolean | No | — | Force-starts a new conversation even if a prior `conversationID` would otherwise resume. |

## Postback fields (paused-tool-call reply)

Only set on a reply turn answering a paused Octopus tool call (e.g. `human_intervention_needed`);
routes through `IConversationHook.OnPostbackMessageReceived` instead of the generic message path.
Leave unset for ordinary sends/chats.

| Field (JSON key) | Type | Required | Default | Notes |
|---|---|---|---|---|
| `postbackFunctionName` | string | No | — | Name of the paused tool/function call being answered. |
| `postbackParentId` | string | No | — | ID of the paused message this postback is replying to. |
| `postbackPayload` | string | No | — | The reply payload for the paused call. |

## Gotchas

- The DB-seeded `ConfigurationSchema` models `ConversationScope` as a flat 2-value enum string
  (`ProcessElement`/`ProcessDefinition`) — both wrong on shape (it's a 4-field nested object) and on
  value set (`eConversationScope` has 11 values, and `ProcessDefinition` isn't even one of them —
  the closest real value is `Process`). Do not trust the DB column for this field.
- `ConversationIsolation` is entirely absent from the DB schema — there is no substitute for reading
  this doc or the `eConversationIsolation` source directly.
