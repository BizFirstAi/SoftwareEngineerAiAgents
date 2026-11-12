# MCP Write-Tool Authorization — Design (resolving Open Question 1)

Research-and-design only, no code changes. Answers `octopus-agent-mcp-design.md`'s Open Question 1
and `architecture.md`'s "Credential & tenant scoping" section's deferred threading question, both of
which flagged the same unresolved gate: every write route the MCP tool modules (Atlas Forms,
Credentials, Workflow, and the future Octopus Agent-generation module) wrap is decorated with
`[AuthorizeTenantAdminAttribute]` or `[AuthorizeRegularUserAttribute]`. What identity does an
in-process MCP tool call present to satisfy that?

## Headline finding — this is a live bug today, and it is worse than the design docs assumed

Both `octopus-agent-mcp-design.md` and `architecture.md` frame the open question as "what identity
does the call present to *satisfy* the tenant-admin gate" — implying the gate is evaluated and needs
a passing identity. **That framing is wrong. The gate is never evaluated at all on the MCP path.**

Traced end to end, against the actual shipped code (not the design docs' plan):

1. **`AuthorizeTenantAdminAttribute`/`AuthorizeRegularUserAttribute`** (`BizFirst.IAM.Login.Service`,
   `Attributes\Common\{TenantAdmin,RegularUser}\...Attribute.cs`) both derive from
   `AuthorizeWithRoleAttribute` (`Attributes\Common\Base\BizFirstFiAuthorizeWithRoleAttribute.cs`),
   which is a plain `ActionFilterAttribute`. Its `OnActionExecuting` reads
   `context.HttpContext.User` — a `ClaimsPrincipal` — checks `FindFirst(ClaimTypes.NameIdentifier)`
   then `user.IsInRole(role)`. **This only runs at all when a request is dispatched through the MVC
   action-invocation pipeline** (i.e. `MapControllers()` → a controller action decorated with the
   attribute).
2. **The MCP tool modules never call controllers.** Confirmed directly against the shipped tool code
   (`BizFirst.Ai.Mcp.Tools.AtlasForms\Tools\CreateFormTool.cs`,
   `BizFirst.Ai.Mcp.Tools.Credentials\Tools\CreateCredentialTool.cs`, and the rest of both modules
   plus `BizFirst.Ai.Mcp.Tools.Workflow`): every `[McpServerTool]` method takes the domain service
   interface (`IFormService`, `ICredentialService`, ...) as a plain constructor/method DI parameter
   and calls it directly — `formService.CreateAsync(...)`, `credentialService.CreateAsync(...)`. This
   is by design (`architecture.md`: "in-process only... NOT: ...Api / .Api.Base — no HTTP hop"), and
   it is architecturally correct for performance/simplicity — but its side effect is that **the entire
   MVC filter pipeline, including every `[AuthorizeTenantAdminAttribute]`/
   `[AuthorizeRegularUserAttribute]` on the controllers these same services back, is structurally
   unreachable from an MCP tool call.** There is no code path by which an `ActionFilterAttribute` on
   `BaseCredentialController`/`BaseAgentController`/`BaseMcpServerController` ever executes for a call
   that came in over `/mcp`.
3. **Nothing else fills the gap.** Checked `AddAuthorization()` registration
   (`PlatformWebServerExtensionsByBuilder.cs:42`) — plain `AddAuthorization()`, no
   `FallbackPolicy`/global `RequireAuthorization()` that would apply endpoint-level auth to
   `app.MapMcp("/mcp")`'s minimal-API endpoints regardless of controller attributes. Checked the
   service implementations directly reachable from the tool code (`CredentialService.CreateAsync`,
   `FormService`/`FormsExtendedService`) for any internal, defense-in-depth role check — none found;
   they trust the caller the same way every other internal service method in this codebase trusts its
   controller to have already gated the call.
4. **The `/mcp`-path middleware in `PlatformWebServerExtensionsByApp.cs` (lines 99-107) only ever
   touches tenant/user *scoping*, never authorization.** It calls
   `IGoUserContextAccessor.SetBackgroundJobContext(tenantID: 1, jobName: "BizFirst.Ai.Mcp.Tools.AtlasForms")`
   — this seeds which `TenantID` rows get written/read and which `CreatedBy`/`LastModifiedBy` value
   gets stamped (`BackgroundJobIdentity.SystemUserId`, confirmed in `GoUserContextAccessor.cs:156-158`).
   It does **not** touch `HttpContext.User`/`ClaimsPrincipal` at all — there is no JWT on this path, so
   `HttpContext.User` stays the default unauthenticated principal for the entire request. Even if some
   future MCP tool method were reimplemented as a real controller action, this middleware's identity
   would still fail `IsInRole("TenantAdmin")`/`IsInRole("Admin")`/`IsInRole("User")` — it grants zero
   roles, not even the regular-user ones.

**Net effect**: today, any MCP client that can reach `/mcp` (or `/mcp/sse`, the actual live transport
per the Gateway's `DevelopmentHistoryLog.md`) and is granted visibility into a tool via
`AIMCP_McpServerGroupMembers`/an agent's `McpServerGroupID` can call `create_form`,
`create_credential`, `add_form_control`, and every other currently-shipped write tool with **no
authorization check of any kind** — not a wrongly-scoped one, an absent one. `TenantID=1` fixes *whose*
data gets mutated (a real, separately-flagged multi-tenancy gap — every write today lands under
Tenant 1 regardless of who or what is really asking), but it was never doing authorization work in the
first place, so calling it "a workaround for the tenant-admin gate" overstates what it does. This is a
genuine, currently-shipped authorization gap on the two tool modules already merged into the platform
server (Atlas Forms, Credentials) and will apply identically to Workflow and to every future
component of the Octopus Agent MCP server (Agents, Agent Teams, MCP Servers admin, DocumentCollection)
the moment they are built the same way — which every design doc reviewed says they will be.

This is consistent with, and should be read alongside, the other live authorization gaps already found
this session elsewhere in the codebase (per `feedback_maintain_360_understanding.md`'s standing
context) — this is not an isolated finding.

## How `AuthorizeTenantAdminAttribute`/`AuthorizeRegularUserAttribute` actually read identity

For the fix design below: both attributes need, at minimum, a `ClaimsPrincipal` on
`HttpContext.User` carrying `ClaimTypes.NameIdentifier` (checked unconditionally) and a role claim
ASP.NET Core's `IsInRole` resolves against (`"TenantAdmin"`/`"Admin"` for tenant-admin,
`"RegularUser"`/`"Admin"`/`"User"` for regular-user — the `"User"` string was added 2026-08-03 per
that attribute's own doc comment, after discovering real issued JWTs carry `"role":"User"`, not
`"RegularUser"`). These are ordinary ASP.NET Core claims-based checks — nothing MCP-specific, nothing
this codebase would need to invent a new mechanism for, **provided the identity is presented as a real
`ClaimsPrincipal`, which today's `/mcp` path never constructs.**

## Existing precedent: is there already a "service account"/system-identity pattern to reuse?

**Yes — but it is a tenant/audit-scoping precedent, not an authorization-bypass precedent, and that
distinction matters for the recommendation below.**

`IGoUserContextAccessor.SetBackgroundJobContext(tenantID, userId?, jobName?)` is a real, established,
widely-reused pattern — not something invented for the MCP merge. It backs:
- `TenantBackgroundService`/`SubTenantBackgroundService` (the base classes every per-tenant scheduled
  job in this codebase derives from),
- `ScopedExecutionContextPropagator` (background-thread continuation of a request's context),
- Several concrete jobs: `LedgerReconciliationJob`, `GroupAccountBalanceAuditJob`,
  `SessionKeyCleanupJob`.

All of these are **first-party, platform-authored background jobs** — code the platform team wrote
and deploys, triggered on a schedule, never by an end user or an LLM's autonomous decision. They call
domain services directly (same in-process shape as the MCP tools) and, like the MCP tools, never pass
through `[AuthorizeTenantAdminAttribute]`-gated controllers — but that is an acceptable, intentional
omission for them, because *the code path itself* is the trust boundary: only a deployed background
job, not an arbitrary caller, can ever reach that code. The `/mcp` middleware reuses the exact same
`SetBackgroundJobContext` call for a categorically different kind of caller: an LLM-driven, tenant-user
-configured, autonomous agent, potentially acting on attacker-influenced input (prompt injection via
tool results, conversation content, or a compromised upstream MCP server per
`octopus-agent-mcp-design.md`'s own `create_mcp_server` blast-radius concern). Reusing a
background-job-shaped trust model for that caller is a mismatch, not a precedent that actually
transfers — the design below treats this distinction as the central constraint.

`AgentManagementService`/V21's `IAgentManagementService` (referenced in
`octopus-agent-mcp-design.md` §1) is the other candidate precedent, and it resolves the same way:
its write methods (`CreateAgent`/`UpdateAgent`/`DeleteAgent`) are documented there as thin wrappers
that resolve `IAgentService` via DI and call it directly — no independent authorization path, no
claims construction. It is not a counter-example; it is the same in-process-trusts-its-caller shape
as everything else surveyed here.

**Conclusion: no existing pattern in this codebase already solves "authorize an autonomous,
LLM-driven, in-process caller." `SetBackgroundJobContext` solves tenant/audit scoping for trusted
first-party code; it was never meant to, and should not be read as, an authorization mechanism.**

## Recommended design

**Recommendation: option (a)-shaped, but scoped through the agent's own grant, not a single global
elevated identity — a synthesized `ClaimsPrincipal` built from the calling Octopus agent's own
`TenantID` and an explicit, narrow role, minted per-call from data already in the request/conversation
context, not a fixed system account.**

Reasoning, evaluating the two framings the task posed directly:

**Framing 1 — thread the calling agent's own `TenantID`, with the agent itself needing to be
scoped to acceptable write permissions.** This is the right primitive, for two reasons the
investigation surfaced:
- `AIAgent_Agents` rows are themselves tenant-admin-created (per `octopus-agent-mcp-design.md`
  §Component 1, `create_agent` is itself tenant-admin-gated in the design). An agent's `TenantID` is
  already a real, durable column on the row that invoked the tool — not something that needs new
  schema, just needs threading from wherever the MCP call is correlated back to the invoking
  `AgentID`/conversation.
- It composes correctly with `AIMCP_McpServerGroupMembers`'s existing tool-visibility gate (which
  tools an agent can even *see*) instead of duplicating it: visibility says "this agent may call
  `create_mcp_server`"; the claims-based identity this recommends says "and when it does, the write
  lands under this agent's own tenant, attributed to this agent, at this privilege level" — two
  different, complementary controls, not one standing in for the other.

**Framing 2 — a simpler global "MCP service identity with a fixed elevated role."** Rejected as the
primary mechanism, for a reason specific to this finding, not a generic security-review preference:
this is close to what already exists today (`SetBackgroundJobContext(tenantID: 1, ...)`) and it is
*that* shape which produced the live bug documented above — a single fixed identity that either has
no claims at all (today) or, if "fixed" and "elevated" both hold, would grant every tool-visible agent
tenant-admin rights over Tenant 1's data unconditionally, regardless of which tenant the agent or its
conversation actually belongs to. Given `create_mcp_server`'s own documented blast radius (§5.2 Open
Question 5 in `octopus-agent-mcp-design.md` — a newly-registered server's `Command`/`Arguments`/
`EndPoint` becomes something a *future* agent's tool-calling can reach), a fixed elevated global
identity turns any one compromised or careless agent conversation into a cross-tenant write. It is
simpler to build, and that simplicity is exactly why it is the wrong default for a write-capable,
autonomous, LLM-driven caller.

**Concrete shape**:
1. Add a claims-construction step to the existing `/mcp`-path middleware (or a new, narrowly-scoped
   middleware placed the same way), replacing today's bare `SetBackgroundJobContext(tenantID: 1, ...)`
   call. It must resolve, per MCP call: the invoking `AgentID` (from whatever correlation mechanism
   the conversation/session context already carries into the tool call — this is the same threading
   gap `architecture.md` already flagged as unconfirmed, "confirm this threading works before building
   the first real write tool," and remains unconfirmed after this pass; resolving it is a prerequisite
   for this design, not a detail within it), then that agent's `TenantID` from `AIAgent_Agents`.
2. Build a `ClaimsPrincipal` carrying `ClaimTypes.NameIdentifier` (a real, attributable identifier —
   e.g. a reserved system-user row per tenant, or the agent's own `AgentID` if `CreatedBy`/audit
   columns can accept it; needs a concrete decision, not guessed here) and a role claim scoped to
   what this agent is entitled to, not a blanket `"Admin"`. Concretely: introduce a narrow role (e.g.
   `"McpAgentWriter"`) that `AuthorizeRegularUserAttribute`-gated actions already accept via OR logic
   without any attribute change, and evaluate whether `AuthorizeTenantAdminAttribute`-gated actions
   (the higher-risk ones — `create_mcp_server`, `create_agent`, `create_credential`) should accept
   that same role or require a stricter one — this is a policy call for Binoy (Open Questions below),
   not a code-level decision this pass can make alone.
3. Set `IGoUserContextAccessor.SetBackgroundJobContext(tenantID: <resolved>, userId: <resolved>,
   jobName: "mcp-agent:{AgentID}")` using the *resolved* tenant, not the current fixed `1` — this is
   the same call already in place, just fed real data instead of a constant.
4. Only after both (2) and (3) land does it become meaningful to reconsider whether the MCP tool
   methods should be re-expressed as thin controller-backed endpoints (to make the existing
   `[AuthorizeTenantAdminAttribute]` filters actually execute) versus keeping the current in-process
   call shape and adding an equivalent explicit claims check inside each tool method. Recommend the
   latter — re-routing through MVC controllers reintroduces the HTTP-hop cost `architecture.md`
   deliberately designed out — but call this out explicitly as a design choice, not a default.

This directly answers the task's framing question: **thread the calling agent's own TenantID as an
on-behalf-of identity, gated by which agents are themselves allowed write-tool access** — not a fixed
global elevated identity. `AIMCP_McpServerGroupMembers` remains valuable and complementary (it decides
tool *visibility*), but it is not a substitute for a real claims-based identity on the call itself,
since visibility alone was never what `[AuthorizeTenantAdminAttribute]` was checking in the first
place.

## Open questions for Binoy — do not guess

1. **Agent/conversation correlation into the MCP call is still unresolved, and this design depends on
   it.** `architecture.md` flagged this as unconfirmed before the first write tool was built; it is
   still unconfirmed now that two write-capable modules (Atlas Forms, Credentials) are live. What
   mechanism actually carries "this MCP call came from `AgentID=X`'s conversation" into the tool
   method today — is there one at all, or does every MCP call currently look identical regardless of
   which agent placed it? This blocks step 1 of the recommended design concretely, not abstractly.
2. **What role(s) should `[AuthorizeTenantAdminAttribute]`-gated write tools accept from an
   MCP-agent-originated claim?** Should `create_mcp_server`/`create_agent`/`create_credential`
   (the highest-blast-radius tools per `octopus-agent-mcp-design.md` §5.4/Open Question 5) require a
   role no agent gets automatically — i.e. reserved for a human-initiated MCP call only, matching that
   document's own option (c) — while lower-risk tenant-admin actions (`update_agent`,
   `set_mcp_server_active`) accept the new narrower `McpAgentWriter`-shaped role? This spec does not
   decide the exact tool-by-tool split; it only argues against one flat identity for all of them.
3. **What identifies the "actor" for `CreatedBy`/audit columns on an agent-originated write?** A real
   `INT` user ID is required by this codebase's DB standards (`CreatedBy INT`, not a string). Does a
   reserved synthetic system-user row per tenant get created for this purpose (analogous to
   `BackgroundJobIdentity.SystemUserId`, but tenant-scoped and MCP-specific so these writes are
   distinguishable in an audit trail from genuine background-job writes), or is there a different
   existing convention this should reuse?
4. **Should Atlas Forms' and Credentials' *already-shipped* write tools be treated as an active
   incident (temporarily degraded/pulled from any agent's grant) until this is fixed, or left live
   given the dev-box-only, TenantID=1-only blast radius today?** This pass did not find evidence these
   modules are reachable from outside this dev box, but did not exhaustively verify that either —
   worth an explicit decision rather than an assumption either way.
5. **Does `api/v1/knowledge/collections`'s existing `[AuthorizeApiKeyOrUserAttribute]` pattern
   (already flagged as a candidate in `octopus-agent-mcp-design.md` Open Question 2) generalize into
   the claims-construction step recommended here** — i.e. should the `/mcp` middleware mint an
   API-key-shaped identity rather than a role-claims one, reusing that attribute's existing evaluation
   path instead of `AuthorizeWithRoleAttribute`'s? Both attributes were read this pass; this document
   recommends the role-claims shape because it composes more directly with the *existing*
   `AuthorizeTenantAdminAttribute`/`AuthorizeRegularUserAttribute` gates already on every write route
   surveyed, without needing every one of those controllers to also add API-key attribute support —
   but this is a real fork worth Binoy's explicit call, not settled here.
