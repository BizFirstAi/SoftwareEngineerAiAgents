# Flow Webhooks RAG — Cross-Cutting Reference

Written 2026-09-07, source-grounded against `Documentation\WorkManagement\WebHookManagement\docs\`
(`Webhook-and-Callback-Architecture.md`, `Webhook-Node-Inventory.md`, `Trigger-Node-Inventory.md`) and
this session's own live end-to-end testing against a running host — not derived from
`Process_ProcessElementTypes.ConfigurationSchema` (see `00-overview.md`'s standing warning that
column is not reliable).

**Why this file exists, and why it's not a `nodes\{code}.md` entry:** webhook behavior is not one
node type's config surface — it's a platform layer (two dedicated HTTP endpoints, a lazy
self-registration mechanism, a signature-verification contract) that six different node types
(`webhook-trigger`, `facebook`, `whatsapp`, `instagram`, `apify-trigger`, plus GitHub/Stripe once
they're provisioned — see Gotchas) all implement against. Per-node config fields still belong in
each node's own Tier 1 doc; this file is the shared substrate above them, the same reasoning
`workflow-creation-rag-design.md` used for expressions/policies/guardrails. `nodes\webhook-trigger.md`
already exists and covers that one node's `Configuration` fields in full — read it for that node;
this file does not repeat it. Facebook/WhatsApp/Instagram/Apify Trigger have **no Tier 1 doc yet**
(all four are listed under `00-overview.md`'s "Not yet covered — Tier B") — until one exists, use
this file's Gotchas section for their resource/operation/credential shape instead of guessing from
`ConfigurationSchema`.

## The two live endpoint families

Two HTTP entry points exist for triggering a webhook-driven node, and they are **not** the same
thing — do not conflate them when telling a user how to point an external system at their workflow:

1. **`POST /api/webhook/{**path}`** (`WebhookController`) — the older, generic catch-all route
   `nodes\webhook-trigger.md` documents. Still live, unchanged.
2. **`POST /api/v1/flowwebhooks/trigger/{processId}/{nodeId}/{path?}`** (`WebhookTriggerController`)
   — a newer, dedicated route added 2026-09-07, purely additive (existing registrations against the
   older routes keep working). Functionally equivalent to the older path for a *new* webhook node:
   resolve `ProcessElement`/`ProcessElementType` → resolve the node's executor →
   `IWebhookNodeProvider.VerifyWebhookAsync` → `ExtractWebhookDataAsync` → fire the workflow in a
   background scope → **`202 Accepted` immediately**. Prefer this route when generating a *new*
   workflow's webhook URL — it's the readable, purpose-built one; only use the older
   `/api/webhook/{**path}` shape when the user is pointing at an already-existing external
   registration that predates this change.

Both routes are **fire-and-forget, async-only, unconditionally** — the HTTP response never carries
workflow output data, no matter what node runs last. There is no n8n-style "wait for the last node"
or "Respond to Webhook node" synchronous mode today. **Do not tell a user they can get a workflow's
result back in the webhook response** — if they need that, the workflow must itself call back out
(e.g. an outbound HTTP Request node, or writing a result somewhere the caller polls).

### Continuation — resuming one suspended node, not starting a new run

**`POST /api/v1/flowwebhooks/continuation/{processId}/{nodeId}/{executionId}/{path?}`**
(`WebhookContinuationController`) is a **different capability**, new in this same session: it
resumes one specific already-suspended node instance (e.g. an Approval/HIL node paused waiting for
an external decision) instead of starting a new workflow execution. `executionId` in the URL is the
suspended execution's `ResID` — the caller must already know it (typically because the workflow's
own trigger response, or an earlier step, surfaced it). It runs the *same*
`VerifyWebhookAsync`/`ExtractWebhookDataAsync` contract as the trigger path, then resumes the node on
its `main` (success) port with the extracted data as `resumeData`. If a user describes a workflow
shape like "pause until an external system posts back an approval," this is the endpoint that
shape needs — do not try to model it as a second trigger call, and do not invent a different
resume mechanism.

## Common workflow shape: webhook trigger → write a row

A frequent pattern is "receive a webhook, then persist something from it." Two things any agent
should get right when composing this shape were disproven by real testing, not assumption, this
session:

- **Port key**: every trigger node's success output port is `"main"` — the constant is literally
  `ExecutionConstants.OutputPorts.Success == "main"`. Wire `Source-PortKey: "main"` regardless of
  which trigger connector is upstream.
- **SQL Server row-insert node's `connectionStringKey`** is **not** a named credential/vault alias —
  it is read as the **literal ADO.NET connection string itself** (e.g.
  `"Data Source=.\SQLEXPRESS;Initial Catalog=mydb;Integrated Security=True;TrustServerCertificate=True"`).
  A workflow using Integrated Security here needs **no platform credential entity at all** — do not
  tell a user to create one, and do not put a symbolic alias name in that field expecting it to
  resolve against the credential vault.

## Per-connector resource/operation and credential shape (until Tier 1 docs exist)

Confirmed by reading each executor's real routing/settings code and, for four of these, by an
actual live curl test against a running host — not by sampling `ConfigurationSchema`:

| Node code | `resource`/`operation` | Credential | Notes |
|---|---|---|---|
| `facebook` | `"webhook"` / `"receive"` | Vault alias `"appSecret"` (via a `credentials` array entry or the flat form — **not** the same credential as the outbound Page Access Token) | Signature: `X-Hub-Signature-256: sha256=<hex>` |
| `whatsapp` | `"webhook"` / `"receive"` | Vault alias `"appSecret"` (distinct from the outbound access-token credential) | Same signature scheme as Facebook (both are Meta) |
| `instagram` | `"trigger"` / `"receive-event"` — **different convention from Facebook/WhatsApp**, do not assume the `"webhook"/"receive"` pair also works here | `appSecret` is a **plain inline config value**, not a vault credential — set it directly in `Configuration`, no credential entity needed | `GetWebhookDefinitionsAsync` gates strictly on `ActiveInfo is TriggerReceiveEventInfo`, which only that exact resource/operation pair produces |
| `apify-trigger` | No resource/operation gate — always declares its one webhook endpoint | Vault alias `"primary"` (the same alias convention as most other credentialed nodes' `ResolveApiTokenAsync`) | |
| `webhook-trigger` (generic) | N/A (not a resource/operation node) | No credential entity; optional inline `webhookSecret` | See `nodes\webhook-trigger.md` for its full field table |
| `github`, `stripe` | Executor code is complete and live-tested in isolation | — | **No `Process_ProcessElementTypes` catalog row exists in the dev DB as of 2026-09-07** — confirmed by direct query. These **cannot be added to any real workflow yet**, in Flow Studio or by any other means, until that catalog entry is provisioned. If a user asks for a GitHub- or Stripe-triggered workflow, say so rather than attempting to configure a node type that doesn't exist in the catalog. |

## Gotchas

- **Lazy self-registration exists but is config-dependent.** The first real HTTP call to a webhook
  node's URL auto-creates its `ProcessElementWebhook` registration row (`TryLazyRegisterAsync`) by
  asking the executor's `GetWebhookDefinitionsAsync` what it serves — but for every connector above
  except `apify-trigger`, that method returns nothing until the node's `Configuration` already has
  the *correct* `resource`/`operation` (and, for Instagram, `appSecret`) values loaded. Getting the
  config shape wrong doesn't just fail verification later — it means the endpoint 404s
  ("Webhook endpoint not found") on the very first call and stays that way, because no registration
  row ever got written. If a newly-configured webhook node 404s on its first real call, the
  `Configuration` JSON is the first thing to check, not the credential.
- **A connector's executor assembly must actually be loaded by the host you're testing against.**
  `facebook`/`whatsapp` are referenced by the Consolidated WebApi and Instagram was added the same
  way on 2026-09-07 — but this is a per-deployment-target wiring detail (project references), not
  something visible from the DB catalog or the node's own code. A node type existing in
  `Process_ProcessElementTypes` does not guarantee its executor assembly is loaded by whichever host
  is actually running; `NodeExecutorFactory.GetExecutorForNodeType` throws
  `NodeTypeNotRegisteredException` if it isn't, independent of any webhook-specific bug.
- **Async is the only response mode, full stop** (repeated from above because it's the single most
  likely wrong assumption to carry over from n8n familiarity): no "wait for completion," no
  "Respond to Webhook" node, no synchronous result in the trigger response, on either endpoint
  family, for any connector.
