# MCP Cross-Tenant Authentication — Design (supersedes the same-tenant assumption in
`mcp-write-tool-authorization-design.md`)

Research-and-design only, no code changes. Written in direct response to Binoy's correction
(verbatim, tonight): *"we need explicit role check and proper signin or apikey based signin to mcp
tools. typically how are mcp server logins happen in the industry - we want that. because these mcp
servers will be called cross tenant."*

This invalidates the core assumption behind last night's just-shipped fix (`McpAgentTenantResolver`,
the `X-Mcp-Agent-Id`-keyed claims-construction middleware in `PlatformWebServerExtensionsByApp.cs`,
`DevelopmentHistoryLog.md`'s 2026-08-19 entry): resolving the calling agent's own `TenantID` and
minting a `"McpAgentWriter"`-role `ClaimsPrincipal` from it only makes sense when the caller and the
tool's data both belong to the same tenant. A cross-tenant external caller has no `AgentID` to resolve
in the first place — it isn't an internal Octopus agent at all.

---

## Part 1 — What the industry actually does (real findings, cited)

### 1.1 The official MCP Authorization specification

Fetched directly from `https://modelcontextprotocol.io/specification/draft/basic/authorization`
(the current/draft spec; also cross-checked against the `2025-03-26` version in the
`modelcontextprotocol/modelcontextprotocol` GitHub repo — same core model). Exact terminology:

- **"A protected MCP server acts as an [OAuth 2.1 resource server]... An MCP client acts as an
  [OAuth 2.1 client], making protected resource requests on behalf of a resource owner."** This is
  the literal roles section — confirms the expected framing precisely: MCP server = OAuth 2.1
  Resource Server, never an Authorization Server itself (a separate AS, "hosted with the resource
  server or a separate entity," issues tokens).
- **Authorization is explicitly OPTIONAL for MCP implementations.** Quoted directly: *"Implementations
  using an HTTP-based transport SHOULD conform to this specification. Implementations using an STDIO
  transport SHOULD NOT follow this specification, and instead retrieve credentials from the
  environment. Implementations using alternative transports MUST follow established security best
  practices for their protocol."* This matters for our recommendation below — the spec does not
  mandate OAuth as the only legitimate mechanism; it defines OAuth 2.1 as the mechanism *if and when*
  a server opts into this specific delegated-authorization extension.
- **Standards it's built from**: OAuth 2.1 (`draft-ietf-oauth-v2-1-13`), Bearer Token Usage (RFC
  6750), Authorization Server Metadata (RFC 8414), Dynamic Client Registration (RFC 7591), **Resource
  Indicators for OAuth 2.0 (RFC 8707)** — the `resource` parameter, mandatory on every authorization
  and token request, binds a token to one specific MCP server's canonical URI, preventing a token
  minted for server A from being replayed at server B — plus OAuth 2.0 Protected Resource Metadata
  (RFC 9728) and OpenID Connect Discovery.
- **Token usage, quoted exactly**: `Authorization: Bearer <access-token>` on every request; **"MCP
  servers... MUST validate access tokens as described in OAuth 2.1 Section 5.2"** and **"MUST validate
  that access tokens were issued specifically for them as the intended audience, according to RFC 8707
  Section 2."** Invalid/expired tokens get a hard `401`.
- **Delegated-user flow**: Authorization Code + PKCE (S256) through a browser user-agent — the
  sequence diagram in the spec shows `Client → 401 → discover Protected Resource Metadata → discover
  AS metadata → PKCE + resource-parameter authorization request → browser redirect → code exchange →
  Bearer token`.
- **Machine-to-machine is explicitly named, not just implied**: the spec's own Step-Up Authorization
  section distinguishes *"Clients acting on behalf of a user"* (should attempt step-up re-auth) from
  **"Clients acting on their own behalf (`client_credentials` clients)"** (MAY attempt step-up or
  abort immediately) — confirming `client_credentials`-grant OAuth clients are a first-class,
  named category in the spec, i.e. the standard OAuth 2.1 machine-to-machine grant is the spec's own
  answer for a non-interactive, non-human caller.

**Confirmed, not paraphrased**: the expected model (OAuth 2.1 Resource Server, PKCE for delegated/user
flows, `client_credentials`-shaped flows for M2M, bearer tokens, RFC 8707 audience binding) is exactly
what the spec defines — this was a correct expectation to verify, and it checked out against the
primary source.

Sources: [Authorization — modelcontextprotocol.io](https://modelcontextprotocol.io/specification/draft/basic/authorization), [authorization.mdx, 2025-03-26 spec — GitHub](https://github.com/modelcontextprotocol/modelcontextprotocol/blob/main/docs/specification/2025-03-26/basic/authorization.mdx)

### 1.2 What real, production MCP servers actually do (not just what the spec allows)

This is the more important finding for our decision — **every major real-world example runs a hybrid,
not an OAuth-only posture**:

- **Stripe's own MCP server** (`docs.stripe.com/mcp`, hosted at `https://mcp.stripe.com`): *"OAuth is
  the preferred connection mechanism because it provides user-based authorization and granular
  access. When a client does not support OAuth, Stripe permits a restricted API key in the
  Authorization header as a Bearer token."* Stripe's own written guidance: use a **restricted** API
  key (least-privilege, not the full secret key), passed as `Authorization: Bearer sk_live_...`, as a
  first-class supported alternative, not a deprecated legacy path.
- **GitHub's official MCP server** (`github/github-mcp-server`): OAuth is the default for the hosted
  remote server, but a **Personal Access Token (fine-grained, scoped) is a fully supported,
  documented, first-class alternative** — and per GitHub's own docs, *"You can authenticate with a
  GitHub Personal Access Token by setting `GITHUB_PERSONAL_ACCESS_TOKEN` instead (it takes precedence
  over OAuth)."* GitHub Enterprise's HTTP-mode deployment additionally supports **per-request OAuth
  token forwarding via the `Authorization` header** for shared/multi-user server deployments —
  relevant precedent for "one server, many distinct external callers, each presenting their own
  credential."
- **Cloudflare's Agents/MCP docs** (`developers.cloudflare.com/agents/model-context-protocol/...`):
  Cloudflare's guidance for building a remote MCP server centers on OAuth (via a Workers
  `OAuthProvider`, Cloudflare Access, or a third-party IdP as the Authorization Server) for
  user-delegated access, **but explicitly separately documents API tokens as bearer credentials for
  CI/CD and automation callers** — the same interactive-vs-machine split as Stripe and GitHub.

**Pattern across all three real, named, production examples**: OAuth 2.1 (typically Authorization
Code + PKCE) for interactive/user-delegated access, **and a scoped, bearer-style API key/token as a
fully legitimate, documented, non-deprecated alternative for programmatic/machine callers** — not
"API keys are legacy, migrate to OAuth," but "both exist simultaneously for different caller shapes."

Sources: [Model Context Protocol (MCP) — Stripe Documentation](https://docs.stripe.com/mcp), [Setting up the GitHub MCP Server — GitHub Docs](https://docs.github.com/en/copilot/how-tos/provide-context/use-mcp-in-your-ide/set-up-the-github-mcp-server), [github/github-mcp-server — oauth-login.md](https://github.com/github/github-mcp-server/blob/main/docs/oauth-login.md), [Securing MCP servers — Cloudflare Agents docs](https://developers.cloudflare.com/agents/model-context-protocol/guides/securing-mcp-server/)

### 1.3 Is API-key auth a legitimate pattern, or has the ecosystem moved OAuth-only?

**Answer, stated honestly: API-key auth is legitimate and current, not deprecated — the ecosystem has
not moved OAuth-only, and the spec itself does not require it to.** Three independent pieces of
evidence converge on this, not just one:

1. The spec itself only mandates OAuth 2.1 **if a server chooses to implement the Authorization
   extension at all** — authorization is optional, and the spec is silent/permissive on what a server
   does instead (STDIO servers are explicitly told to use environment-provided credentials, not
   OAuth).
2. Every real production example checked (Stripe, GitHub, Cloudflare) **ships and documents API-key
   auth as a first-class alternative today**, not a deprecated fallback — Stripe's own docs recommend
   *restricted* (scoped) keys specifically as the non-OAuth path, which is the same shape recommended
   below.
3. General industry commentary converges on the same split: OAuth for user-delegated/third-party
   client access with fine-grained per-user scoping; **API keys are the recommended default for
   internal servers, developer tooling, CI/CD, and "service-to-service calls where you control both
   ends"** (per multiple 2026 MCP-auth guides surveyed, e.g. `dev.to`'s OAuth-vs-API-key-vs-mTLS
   comparison and `getmaxim.ai`'s MCP authentication guide) — this is exactly a cross-tenant B2B
   server-to-server shape, not a third-party public client shape.

Sources: [MCP Authentication Explained: OAuth, API Keys, and Token Management](https://www.getmaxim.ai/articles/mcp-authentication-explained-oauth-api-keys-and-token-management/), [MCP Server Authentication: OAuth vs API Keys vs Mutual TLS](https://dev.to/whoffagents/mcp-server-authentication-oauth-vs-api-keys-vs-mutual-tls-which-to-use-and-when-4nj3)

**The one caveat worth stating plainly**: none of the three real examples above use a *raw, unscoped*
static API key with no expiry/rotation/audit story. Every one either scopes the key narrowly (Stripe's
"restricted key" guidance), supports revocation/rotation, or (GitHub Enterprise) forwards a real
per-user OAuth token instead of a shared key for multi-user deployments. "API key" in current practice
means "a scoped, revocable, auditable bearer credential," not "a shared static secret" — this
constrains the design in Part 2, it doesn't just bless "reuse what exists" unconditionally.

---

## Part 2 — Concrete redesign for this codebase

### 2.1 Cross-tenant model — recommendation: extend `IAM_ApiKeys`, do not build OAuth 2.1 from scratch

**Recommendation: extend the already-live `IAM_ApiKeys` / `AuthorizeApiKeyOrUserAttribute` system with
an MCP-scoped grant model. Do not build an OAuth 2.1 Authorization Server for this.**

Reasoning, weighed directly against Part 1's findings rather than defaulting to reuse:

- Part 1.3 establishes API-key auth is not a compromise or a stopgap — it is the pattern every real
  production MCP server (Stripe, GitHub, Cloudflare) documents as the correct choice for exactly this
  codebase's actual scenario: **server-to-server, B2B, "you control both ends or at minimum
  provision the credential yourself" cross-tenant calls** — not a third-party public client a random
  end-user's browser needs to delegate through. This is not "OAuth is better but we're cutting a
  corner" — it is the documented right tool for this specific caller shape.
- Building a real OAuth 2.1 Authorization Server (dynamic client registration or pre-registration,
  PKCE-verifying authorization endpoint, token endpoint, RFC 8414/9728 metadata discovery documents,
  refresh-token rotation, `iss`/audience validation per RFC 9207/8707) is a materially larger, multi-week
  build with its own new attack surface — and this codebase has **no existing OAuth Authorization
  Server implementation anywhere to extend** (confirmed: `IAM`'s auth surface is JWT/SSO login +
  `IAM_ApiKeys`, not an OAuth AS). It would be new infrastructure, not an extension of proven
  infrastructure, which is the opposite trade this codebase's standing "prefer reuse over new"
  guidance argues for — and Part 1 confirms the industry doesn't require it for this caller shape.
- `IAM_ApiKeys`/`AuthorizeApiKeyOrUserAttribute` is **already real, already live, already proven against
  exactly this problem shape twice**: once for the Knowledge API (external vendor, no JWT, tenant-scoped
  key, `"knowledge:read"`/`"knowledge:write"` scopes) and once tonight for ChatDesk (anonymous
  cross-origin caller, `AllowedOrigins` column just added). A third, MCP-shaped extension is the same
  pattern a third time, not a new pattern.
- **Verified**: `ApiKey` (`BizFirstFi.Go.IAM.Domain\Entities\ApiKey.cs`) inherits `BaseEntity`, which
  carries `TenantID` — confirmed directly in `ApiKeyAuthenticator.AuthenticateAsync`
  (`.../Authentication/ApiKeyAuthenticator.cs`) and `AuthorizeApiKeyOrUserAttribute.TryAuthenticateApiKeyAsync`
  (line 115): `userContextAccessor.SetUserContext(userId: null, tenantID: apiKey.TenantID)`. This is
  **already the caller's own tenant**, not the resource's — an `ApiKey` row already models "who is
  calling, from which tenant," which is precisely what a cross-tenant MCP caller needs presented on
  the call. Confirms the design brief's assumption correctly: yes, `TenantID` is already a real column
  on `ApiKey` via `BaseEntity`, no schema change needed for that part.

**What needs to be added (net-new, concrete)**:

1. **New scope strings**, following the existing `Scopes` JSON-array convention exactly (no schema
   change to `ApiKey` itself) — e.g. `"mcp:atlas-forms:write"`, `"mcp:atlas-forms:read"`,
   `"mcp:credentials:write"`, `"mcp:octopus-agents:write"`. One scope string per MCP tool-module
   component (matching `octopus-agent-mcp-design.md`'s §5.1 module boundaries), not one scope per
   individual tool — granular enough to be meaningful, coarse enough not to explode into 37+ scope
   strings for the Octopus catalogue alone.
2. **New table, `AIMCP_McpApiKeyServerGroups`** (`ApiKeyID` FK → `IAM_ApiKeys`, `McpServerGroupID` FK
   → `AIMCP_McpServerGroups`, standard audit/tenant columns) — reuses the *existing*
   `AIMCP_McpServerGroups`/`AIMCP_McpServerGroupMembers` tool-visibility mechanism
   (`octopus-agent-mcp-design.md` §5.3 already established this as the per-agent tool allow-list
   pattern) rather than inventing a second grant concept. An MCP-calling API key gets grouped exactly
   like an Octopus agent does — same table family, same admin UI extended, not duplicated. Confirmed
   by codebase search this pass: no `ApiKeyID` column exists anywhere under `Ai\AiMcp` today, so this
   is genuinely new, not a rediscovery.
3. **A new attribute, `AuthorizeMcpApiKeyAttribute`** (or an `AuthorizeApiKeyOrUserAttribute` overload
   with an MCP-aware scope check) that, on top of the existing key/scope/origin validation, resolves
   the key's `AIMCP_McpApiKeyServerGroups` grant and exposes it to the tool-call layer described in
   §2.3 below — this is the enforcement point, not a second parallel identity system.
4. **`AllowedOrigins` does not apply here** — that column is specifically for browser-embedded callers
   (ChatDesk widget); a cross-tenant MCP client is a server-to-server caller with no browser `Origin`
   header in the normal case. Leave it null for MCP-scoped keys (the same "null = unrestricted, opt-in
   only" default already documented on that column applies unchanged).

**Where this makes the caller's tenant unambiguous, correctly, unlike last night's fix**: the calling
tenant is `apiKey.TenantID` — the tenant that *owns the key*, i.e. the real external/cross-tenant
caller's own tenant — never resolved from an internal `AgentID`. The tool then operates on whatever
tenant the specific MCP call's payload/route targets, gated by whether that key's grant permits
cross-tenant access to that target tenant's data at all (see Open Question 1 below — this is the one
piece genuinely underspecified by "just reuse ApiKeys," and needs an explicit decision, not a guess).

### 2.2 Does the same-tenant agent-to-tool case (last night's fix) still have a place?

**Recommendation: keep it, narrowed explicitly to its real scope — internal, trusted, same-process
Octopus-agent-to-tool calls — and stop treating it as a stand-in for cross-tenant auth. Do not
replace it with the API-key mechanism; the two solve different problems and conflating them was the
actual mistake in last night's framing, not the mechanism itself.**

- The `X-Mcp-Agent-Id` → `McpAgentTenantResolver` → `"McpAgentWriter"`-role `ClaimsPrincipal` path is
  correct **for what it actually is**: an in-process trust boundary where the caller (an Octopus agent
  running in this same deployment, calling a tool on behalf of its own tenant) is not adversarial in
  the same way an arbitrary external network caller is. It is a legitimate "fast path for trusted
  in-process same-tenant calls," exactly the framing the task brief offered — keep it as that,
  narrowly.
- What must change: last night's `DevelopmentHistoryLog.md` entry already shows this was built
  conservatively (`AuthorizeTenantAdminAttribute` deliberately *not* extended to accept
  `"McpAgentWriter"` — `create_mcp_server`/`create_agent`/`create_credential` stay blocked for any
  agent-originated call). That conservatism should stay, and should now be read as *load-bearing*
  rather than provisional: an internal agent's own `TenantID` should never, by itself, be sufficient
  to justify a cross-tenant-capable action. The two mechanisms should never be merged into one
  identity model — an agent-sourced `ClaimsPrincipal` and an API-key-sourced one should stay
  distinguishable role-wise (`"McpAgentWriter"` vs. a new `"McpApiKeyCaller"`-shaped role/claim) so a
  future authorization check can tell "this came from a trusted internal agent" from "this came from
  an external cross-tenant credential" and apply different policy to each, per tool.
- Concretely: `X-Mcp-Agent-Id` stays for agent-originated in-process calls (the SSE connection
  `McpClientManager` opens on an Octopus agent's own behalf); `X-Api-Key` is the mechanism for a
  genuinely external MCP client (a different tenant's own system, a partner integration, a human
  operator's own tooling). Both can arrive at the same `/mcp` endpoint; the middleware described in
  §2.3 must branch on which header is actually present, not assume only one exists.

### 2.3 The actual enforcement point

**Recommendation: (a) — a shared decorator/interceptor every `[McpServerTool]` method goes through,
not (b) re-routing through controllers. This conclusion does not change under the cross-tenant
requirement — if anything it strengthens it.**

Reasoning, evaluating both options directly per the task brief:

**Option (b), re-routing through thin controller-backed endpoints, reconsidered explicitly**: the
cross-tenant requirement does not change the tradeoff that made this the wrong call last night
(`architecture.md`'s deliberate in-process-no-HTTP-hop decision, reaffirmed in tonight's merge notes —
"re-routing through MVC controllers reintroduces the HTTP-hop cost `architecture.md` deliberately
designed out"). A cross-tenant external caller already pays one real network hop to reach `/mcp` at
all; that does not create a new reason to add a *second*, internal HTTP hop from the MCP tool method
into a controller purely to get `[Authorize*Attribute]` to execute. The actual problem — filters never
running because the call never reaches `MapControllers()` — is solved more directly by making the
check run explicitly in the one place every tool call already passes through, not by rebuilding the
call path around ASP.NET's filter pipeline.

**Option (a), a shared decorator, is the recommended design. Concrete shape**:

1. Every `[McpServerTool]` method across every tool module (Atlas Forms, Credentials, and every future
   Octopus component) already takes its domain service via DI and is invoked by the
   `ModelContextProtocol.AspNetCore` SDK's own tool-dispatch machinery — this SDK dispatch, not
   `MapControllers()`, is the one true choke point every MCP tool call already passes through
   regardless of module. Add a single, shared `IMcpToolAuthorizationGuard` (or an
   `IMcpToolAuthorizationFilter`, if the SDK's tool-invocation pipeline exposes a filter/interceptor
   hook — verify this against the installed `ModelContextProtocol`/`ModelContextProtocol.AspNetCore`
   `0.1.0-preview.11` package's actual API surface before implementation, since a preview-version SDK's
   extensibility hooks are the one thing this design pass could not verify without live access to that
   package's source; if no such hook exists, the fallback is a thin static helper each tool module's
   generated tool wrapper calls as its first line — functionally identical, just invoked explicitly
   rather than via a pipeline hook).
2. This guard reads `HttpContext.User` (now correctly populated by either §2.2's agent-path middleware
   or §2.1's new API-key attribute) and the tool's own declared requirement — a small
   `[McpToolRequiresRole("McpAgentWriter", "TenantAdmin")]`-style attribute (or a constant on each tool
   class) naming which role(s)/scope(s) the specific tool accepts, mirroring
   `AuthorizeTenantAdminAttribute`/`AuthorizeRegularUserAttribute`'s existing role-string vocabulary so
   this is additive to, not a fork of, the existing role model.
3. For an API-key-originated call specifically, the guard additionally checks the resolved
   `AIMCP_McpApiKeyServerGroups` grant (§2.1) covers the specific tool/module being invoked — the same
   "visibility is a separate, complementary control from authorization" principle
   `mcp-write-tool-authorization-design.md` already established for agent grants, now applied
   identically to key grants.
4. On failure, the tool method returns an MCP tool-error result (not an HTTP 401/403 — there is no HTTP
   response to shape at this layer since the SDK, not a controller, is producing the outer response);
   the guard is responsible for producing a result shape the SDK's tool-call error convention expects.
5. This is a single, small, shared piece of code (one guard class, one attribute), applied uniformly —
   not a per-tool-module reimplementation — so every current and future `[McpServerTool]` method
   (Atlas Forms, Credentials, Workflow, and all five-plus Octopus components from
   `octopus-agent-mcp-design.md`) gets the same enforcement automatically once each tool method calls
   through it, closing the exact "Known residual gap" tonight's `DevelopmentHistoryLog.md` entry
   flagged as still open.

### 2.4 Write-tool risk tier — does cross-tenant calling strengthen the case for stricter access on
`create_mcp_server`/`create_agent`/`create_credential`?

**Yes, plainly and substantially — state this directly, not hedged.**

`octopus-agent-mcp-design.md` §5.4/Open Question 5 already flagged `create_mcp_server` as the single
highest-blast-radius write tool in that whole spec, reasoning from a same-tenant, prompt-injection/
compromised-agent threat model: a malicious or malformed `ConfigJson` a *future agent's own
tool-calling* could reach. Cross-tenant calling adds a second, independent threat vector on top of
that, not a variation of the same one:

- A same-tenant compromised agent can at worst corrupt/mis-register something inside its own tenant's
  data (bad, but bounded by tenant).
- A cross-tenant caller presenting a valid-but-narrowly-scoped API key is, by this design's own model,
  *expected* to reach across the tenant boundary for legitimate reasons (that is the entire point of
  building this). That means a leaked, over-scoped, or carelessly-granted cross-tenant key is not
  bounded by tenant at all — `create_credential` writing a new credential row, `create_agent` creating
  a new agent, or `create_mcp_server` registering a new stdio command/SSE endpoint under a *different*
  tenant than the key's own owner is now a plausible failure mode this design must foreclose, not a
  same-tenant blast-radius question.

**Concrete consequence for §2.1/§2.3's design**: these three tools (`create_mcp_server`,
`create_agent`, `create_credential` — and by the same reasoning, any future tool with equivalent
blast radius) should be excluded from the set any API-key grant can ever name, full stop — not just
gated behind a stricter scope string, but structurally unreachable via the API-key path at all,
mirroring exactly how last night's fix already keeps `AuthorizeTenantAdminAttribute` un-extended for
`"McpAgentWriter"`. Reserve these specifically for a human-initiated, individually-audited path (a
real tenant-admin's own JWT session, or — if a cross-tenant human operator genuinely needs this — an
explicit human-approval step, e.g. HIL, per the codebase's existing HIL/Actor-in-Loop infrastructure)
never an autonomous agent grant and never a standing API-key grant, cross-tenant or same-tenant alike.
This is the same conclusion `octopus-agent-mcp-design.md`'s own Open Question 5 already pointed toward
(option (c): "reserved for a human-initiated MCP call only") — cross-tenant calling removes any
remaining ambiguity about whether that's the right default; it is.

---

## Open questions for Binoy — do not guess

1. **Cross-tenant grant model's target-tenant boundary — the one piece genuinely underspecified by
   "reuse ApiKeys."** `apiKey.TenantID` unambiguously identifies the *caller's own* tenant. It does
   **not**, by itself, say which *other* tenant(s) that key's tool calls are allowed to operate on data
   for. Does a cross-tenant MCP key need an explicit second grant — e.g. a `TargetTenantID` (or a list)
   on `AIMCP_McpApiKeyServerGroups` naming exactly which tenant's resources it may touch — or is "the
   tool call's own payload names the target tenant, and any key with the right scope may name any
   tenant" the intended model? The first is materially safer and is what this design assumes by
   default; needs Binoy's explicit confirmation since it changes the new table's schema.
2. **Provisioning/issuance flow for a cross-tenant MCP key** — is this admin-only (an internal
   BizFirst operator manually issues a key to a partner tenant, reusing the existing `ApiKeyController`
   CRUD), or does a tenant need self-service ability to issue a key another tenant can use to call
   into *their* MCP tools? Changes how much new UI/API surface this needs versus pure backend reuse —
   same open question shape as `anonymous-chatdesk-security-and-llm-usage-quotas.md`'s own Open
   Question 1 for the ChatDesk widget key, worth deciding once for both.
3. **`ModelContextProtocol.AspNetCore` SDK's actual tool-invocation extensibility surface** — §2.3
   assumes a filter/interceptor hook exists on the installed `0.1.0-preview.11` package; this pass did
   not have live access to verify that package's API against source. A build agent must confirm this
   before implementing §2.3 — if no such hook exists, the fallback (each generated tool wrapper calls a
   shared static guard explicitly) is functionally equivalent but mechanically different to wire up.
4. **Audit actor identity for a cross-tenant API-key-originated write** — mirrors
   `mcp-write-tool-authorization-design.md`'s own still-open Open Question 3 (a reserved synthetic
   system-user row per tenant for `CreatedBy`/audit columns), now with an added wrinkle: should a
   cross-tenant write's `CreatedBy` attribute to a system-user row under the *caller's* tenant, the
   *target* tenant, or carry both (e.g. `CreatedBy` = target-tenant system user, with the calling
   `ApiKeyID` logged separately for attribution)? Not decided here — needs a real answer before
   `AIMCP_McpApiKeyServerGroups`-gated writes land, not guessed at.
5. **Rate limiting for cross-tenant MCP keys** — `anonymous-chatdesk-security-and-llm-usage-quotas.md`
   already found this codebase's rate-limiting infrastructure (`RateLimitBaseAttribute`/
   `RateLimitFilter`, with an `IpAddress`/`TenantAndUser`-shaped scope system) is fully built but
   dormant in every host. A cross-tenant MCP key is exactly the same abuse shape as an anonymous
   ChatDesk widget key — no per-user accountability, real potential for high-volume automated abuse —
   and should very likely share whatever work eventually turns that system on, rather than be treated
   as a separate problem. Flagging the connection, not resolving it here; whichever target activates
   that infrastructure first should account for both consumers.
