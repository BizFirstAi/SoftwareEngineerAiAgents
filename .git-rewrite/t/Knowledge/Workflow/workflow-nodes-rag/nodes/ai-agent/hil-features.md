# `ai-agent` — HIL / Suspend-Resume Behavior

Sub-feature of `ai-agent` (see `00-index.md`). These are **not config fields** — they are hardcoded
overrides on `OctopusAiAgentNodeExecutorSettings` (a `BaseHilNodeExecutorSettings` subclass) that
determine how the node's HIL (Human-in-Loop) machinery behaves. A workflow author cannot change any
of these values through `Configuration` JSON; they're documented here because they materially affect
what `operation: "chat"` does at runtime, and how a config-authoring agent should reason about the
node's suspend/resume contract.

Source: `OctopusAiAgentNodeExecutorSettings.cs` (the `HilFeature*Default` overrides and
`IsHilApplicable`).

## Fixed HIL feature flags

| Property | Value | Meaning |
|---|---|---|
| `HilFeatureEnableEngageDefault` | `false` | Engage (the general-purpose suspend/resume session mechanism, which writes an `EngageSession`/`InboxItem` per turn) is **off** for this node. An `EngageSession` write per conversation turn is exactly the cost that made an earlier inbox-based chat design too expensive for a chat window. |
| `HilFeatureSuspendsWithoutEngageDefault` | `true` | The opt-in that still makes `chat` mode return the `waiting` port and genuinely pause the node, even with Engage off. Without this, the node would complete on the `main` port immediately after the first LLM response instead of suspending, and a second inbound message would have nothing to resume against. |
| `HilFeatureEnableInboxDefault` | `false` | No per-message `InboxItem` write. Independently false regardless of Engage/SuspendsWithoutEngage — Inbox and Notification are each controlled separately from Engage in `HilFeatureInfo` (Engage being on would not imply either). With no `EngageSession` at all, `EnableInbox` is force-false at the `HilFeatureInfo` level anyway; this override stays explicit for clarity rather than relying on that implicit cascade. |
| `HilFeatureEnableNotificationDefault` | `false` | No separate per-turn notification. The live SignalR push (`HilEventReporting`, inherited as `true`) is this node's only response channel — there's nothing for a separate notification to add per turn. |
| `HilFeatureEnableHilEventReportingDefault` | `true` (inherited, not overridden here) | The live SignalR channel the chat response actually reaches the browser through. |
| `resourceDefault` | `"message"` | Default value for the `resource` config key when omitted. |
| `operationDefault` | `"send"` | Default value for the `operation` config key when omitted. |

## `IsHilApplicable`

```csharp
public override bool IsHilApplicable => Operation == "chat";
```

- `operation: "send"` → HIL does **not** apply — direct execution, no suspension, ever.
- `operation: "chat"` → HIL **applies** — Phase 1 suspend (`waiting` port) + Phase 2 resume loop.

## How resumption actually works (no Engage)

Chat resumption is tracked via the pair `ExecutionResID`/`NodeKey` (carried on `HilSessionContext` /
`HilPresentationReplyEnvelope`, consumed by `HilReplyContinuationService`'s no-Engage branch) — **not**
an `EngageSessionID` lookup. A second inbound message against the same `ExecutionResID`/`NodeKey` pair
resumes the suspended node; there is no separate session record to look up or expire independently of
that pair.

## Gotchas

- `send` never suspends; `chat` always does on its first turn — this is unconditional (`operation:
  "chat"` with, say, a very short `message` still suspends on the first LLM response).
- Because Engage is off, none of the general-purpose Engage/Inbox HIL UI surfaces apply to this node's
  chat mode — only the live SignalR event stream and the `ExecutionResID`/`NodeKey` resume pair.
- None of the fields on this page are settable via `Configuration` JSON — do not attempt to override
  them from a workflow definition; they are compiled-in behavior of the `ai-agent` node type itself.
