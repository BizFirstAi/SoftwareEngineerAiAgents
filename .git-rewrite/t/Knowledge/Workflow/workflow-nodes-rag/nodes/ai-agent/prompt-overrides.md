# `ai-agent` — Prompt-Segment Overrides

Sub-feature of `ai-agent` (see `00-index.md`). Covers the 9 independent, optional prompt-segment
fields a workflow can set on this node. Each is additive — a non-empty value is merged into the
target agent's prompt alongside its base prompt segments, not a replacement of the whole prompt.

Source: `OctopusAiAgentBridgeOriginReader.cs`, the `Prompts` dictionary property (each entry carries
both the raw content and a `Purpose` string baked into the reader itself — these purpose strings are
real source content, not this doc's own paraphrase).

## Fields

| Field (JSON key) | Type | Required | Default | Purpose (from source) |
|---|---|---|---|---|
| `systemPrompt` | string | No | — | Defines the agent's core identity, role, and overall behavior — the foundational instruction set. |
| `goalPrompt` | string | No | — | The specific objective or task the agent is trying to accomplish in this invocation. |
| `guidelinePrompt` | string | No | — | Rules and constraints the agent must follow while completing the task. |
| `profilePrompt` | string | No | — | Background/persona details about who or what the agent represents. |
| `lawPrompt` | string | No | — | Hard compliance or safety rules the agent must never violate, regardless of other instructions. |
| `skillPrompt` | string | No | — | Describes the tools, capabilities, or functions available to the agent. |
| `personaPrompt` | string | No | — | Tone, voice, and personality traits the agent should express in its responses. |
| `planningPrompt` | string | No | — | Instructions on how the agent should reason, plan, or break down the task before acting. |
| `stopPrompt` | string | No | — | Conditions or signals indicating when the agent should stop, hand off, or conclude the interaction. |

## How they're assembled

Each non-empty field is added to a `Dictionary<string, PromptInfo>` (`Prompts`), keyed by segment name
(`System`, `Goal`, `Guideline`, `Profile`, `Law`, `Skill`, `Persona`, `Planning`, `Stop`) — only
segments with non-empty content are present in the dictionary at all. Downstream, these merge into the
target agent's own prompt structure; the node does not replace the whole prompt, only supplies
additional segments the target agent doesn't already have.

## Example — node-level prompt override

```json
{
  "resource": "message",
  "operation": "send",
  "agentID": 42,
  "message": "Draft a summary of flagged transactions.",
  "goalPrompt": "Produce a concise, client-ready summary of this week's flagged transactions.",
  "lawPrompt": "Never disclose full account numbers; mask all but the last 4 digits."
}
```

## Gotchas

- None of these 9 fields appear in the DB `ConfigurationSchema` for `ai-agent` at all — see the
  schema-gap note in `00-index.md`.
- These are independently additive — setting one does not require setting any of the others, and an
  omitted field contributes nothing (not even an empty override) to the target agent's prompt.
