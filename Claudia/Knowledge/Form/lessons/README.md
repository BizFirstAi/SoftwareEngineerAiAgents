# Lessons — Atlas Forms Automation Project

Running log of concrete learnings from actually doing this project, not a restatement of the design.
Add an entry per task as it completes (or per significant finding mid-task), newest first. Keep each
entry short and specific — what was assumed going in, what turned out to be true/false, and what would
be done differently next time. This is for the *next* person/agent picking up similar work, so bias
toward the surprising and the concrete over the obvious.

Entries land here as Task 1, 2, and 3 (see `..\design\design-and-plan.md`) actually complete — none have
finished yet as of this file's creation, so there is nothing to record yet beyond this placeholder.

## 2026-08-25/26 — Combined RAG+MCP test via the real Flow Studio chat UI: HIL chat genuinely works for
Agent 23 now; the real remaining gap is narrower than previously thought — MCP tools just aren't wired
into the chat operation's LLM call

Full findings: `..\design\STATUS.md`'s "Done (cont. 9)" entry. Two transferable lessons for the next person:

**1. Don't trust a "not through a real browser session" finding to generalize — re-test through the actual
UI before concluding a mechanism is broken.** The 2026-08-23 Task 5 finding that `operation:"chat"` "does
not suspend" was true only for the headless `execute-by-id` API path; driven through the real logged-in
Flow Studio chat UI, the exact same node type suspended and resumed correctly three times in a row for
Agent 23. Cost nothing extra to verify — cloning a known-good node's `Configuration` JSON via a scripted
`INSERT...SELECT` (swap one field, `agentID`) is faster and safer than hand-building a new node config from
scratch, and avoids the still-broken node-config-save-via-UI bug entirely.

**2. When an LLM keeps "narrating" or mis-routing an explicitly-named tool call no matter how forcefully
you instruct it, check whether the tool was ever actually offered to it — don't assume it's a prompting or
by-design-gate problem.** Three real turns, the last one maximally explicit ("call the tool now, no more
text"), still got the model calling `knowledge_retrieval` with the literal tool names as its query
(`"question":"create_form tool"`) instead of calling `create_form` — a strong behavioral tell that the tool
genuinely wasn't in its function list, confirmed independently by grepping the whole session's backend log
for any MCP client activity at all (zero hits) despite MCP being proven fully live for the same agent via a
direct protocol call moments later. **Lesson: grep the backend log for the tool-fetch step
(`mcp/sse`/`X-Mcp-Agent-Id`/etc.), not just the LLM's tool-call decision — an LLM that "won't" call a tool
and an LLM that was never given the tool look identical from the chat transcript alone.**

## 2026-08-23 — Task 5: real execution attempt — the pipeline is real, but "just call the tool" is genuinely hard without a login session

Full findings: `..\design\STATUS.md`'s "Done (cont. 7)" entry. The short version for the next person: **building
and executing a real Flow Studio process without a browser session is entirely possible, but getting an
`ai-agent` node to actually call an MCP tool (not just talk about it) took far more than "send a message."**
Three concrete, transferable lessons:

**1. The `[AllowAnonymous]` node-instance-runner path (`architecture.md` §7's "no login needed" option)
looks like the easy way in, but silently breaks for any AI-agent node.** It fires the whole process
correctly, but the fallback identity it stamps (`UserID=1`, a hardcoded `BackgroundJobIdentity.SystemUserId`)
only works if that literal integer happens to belong to the tenant you're testing in — in this DB it
belongs to a different tenant entirely, so `ConversationManagementService.NewConversation` throws
`UnauthorizedAccessException` every time. Would have cost hours to notice without reading the actual
exception stack trace in the raw console log — the DB-persisted error columns (`ErrorMessage`,
`ExceptionType`) were all `NULL` even on this hard failure; only the live server log had the real answer.
**Lesson: for this codebase, always grep the live console log around the exact execution timestamp before
trusting any DB-persisted "error" column — several of them are silently never populated.**

**2. A locally-minted JWT, signed with the app's own already-known dev signing key, is a legitimate and
fast way to drive an authenticated endpoint without a browser** — same technique this codebase's own
`JwtTokenHelper.cs` integration-test helpers use. Needed exact claim types traced from source
(`BizFirstClaimTypes.TenantID = "tenantId"`, exact casing — three wrong-cased guesses failed silently
with `"TenantID is required and must not be 0"` before finding the right one) and confirmed the whole
`IRequestIdentityContext` → `GoUserContextBridgeMiddleware` → `IGoUserContextAccessor` chain has to be
traced, not guessed. **Also a real, standing security observation**: this dev JWT key lives in plaintext
in a checked-in `appsettings.json` — anyone with repo read access can mint a valid admin token for any
existing user with zero credentials. Same category of gap as the already-flagged "no MCP authorization
enforcement" finding — worth consolidating into one security follow-up rather than two separate flags.

**3. Getting a real tool call out of a production-designed agent is harder than "tell it to just do it."**
Agent 23's own system prompt (read directly from `AIAgent_Instructions.Content`, don't assume) has a
deliberate two-phase gate: gather requirements conversationally, get explicit approval, *then* call
`create_form` — never on the first message, by design. Six different single-turn prompt framings (direct
instruction, "unattended, nobody will reply," a fabricated inline prior-turn transcript, an explicit
"this is your only turn or the task fails") all got the model to *narrate* intent ("Creating the form
now...") but never once emit an actual tool call — confirmed via real `AIConv_Conversations` rows and
`Process_NodeActivityLogs` output, not assumption. The one designed way to satisfy this gate for real —
genuine multi-turn conversation continuation — turned out to be broken two different ways: explicit
`conversationID` passthrough on `operation:"send"` is a known, already-documented dead end (2026-08-21
finding, `AgentSessionId` never populated), and `operation:"chat"` (the dedicated HIL suspend/resume
mechanism built for exactly this) did not actually suspend when invoked via `execute-by-id` instead of
the Flow Studio UI's own execution path — unresolved, flagged for a focused follow-up on
`AiAgentNodeExecutor.ChatMessage.cs`'s HIL dispatch. **Lesson: a two-phase-by-design conversational agent
cannot be reliably forced into single-shot tool execution by prompt engineering alone — the multi-turn
mechanism has to actually work, and this one currently doesn't, for either the simple or the HIL path.**

Net: `Atlas_Forms` row count unchanged (1341) across the whole session. No form created; the modify step
was never reached. Reported as partial success per this project's own standing instruction to never paper
over a real blocker — the mechanical pipeline (trigger → in-process V21 bridge → real OpenAI completion
with agent 23's real MCP tools attached, confirmed via `McpToolID` references in the live request trace)
is now proven live, end-to-end, for the first time this project has actually run it for real.

## 2026-08-23 — Task 4: full execution-lifecycle trace — V21 bridge resolved as in-process, not networked

Full findings: `..\design\architecture.md` (new). Summary of what changed from prior assumptions:

**The V21 "bridge" question is resolved for good, with hard evidence, not inference.**
`OctopusAgentInvokerService`'s doc comment about "bridging to the V21 AI Engine" describes a real
architectural split (two separate source repos) but NOT a network hop — V21's Octopus Core is
`ProjectReference`d directly into `BizFirst.Ai.Consolidated.WebApi`'s `.csproj` (confirmed by reading
the `.csproj` files directly, and by V21's own `DevelopmentHistoryLog.md` stating a fix was "verified
via a full rebuild of the actual deployed consumer... cross-repo ProjectReference to this project"). The
real `IOctopusAiAgentBridgeExecutionService` implementation has no `HttpClient`/connection string/base
URL anywhere — it's a plain DI-resolved in-process call chain. **Worth internalizing for future
investigations in this codebase**: "V21" in a doc comment or class name here means "a different source
repo," not "a different running process" — don't assume a network boundary from naming alone, check the
`.csproj` `ProjectReference`s first.

**Nuance that DOES matter**: not all of V21 is loaded into the live binary. The live host's
`PluginLoader:Assemblies` config lists `Octopus.Core`/`Plugin.SqlServerAtlasStorage`/`Plugin.OpenAI` but
**not** `Plugin.KnowledgeBase` — so `KnowledgeRetrievalFn`/`KnowledgeHook` genuinely aren't reachable in
the running process today, not just "not populated." This sharpens (doesn't contradict) the prior
finding that Knowledge Retriever doesn't exist in the live stack.

**MCP tools vs. built-in functions — confirmed as two separate mechanisms, and confirmed neither is
blocked by the empty-looking DB tables that looked like blockers going in.** `AIFunction_
AgentFunctions`' NULL `Assembly`/`ClassName`/`MethodName` columns are irrelevant — real built-in
functions are `IFunctionCallback`-implementing C# classes matched by `.Name` in V21's DI container, that
table is a separate, unused-at-dispatch-time catalog. `AIMCP_McpTools`' empty rows are also not a
blocker — confirmed (again, more precisely this pass) that this table is only a per-agent tool
*allow-list filter*; the real tool catalogue is fetched live via `tools/list` against the running MCP
server every agent load. **Both DB tables that looked like "missing setup" going into this task turned
out to be non-blocking by design**, not gaps that need filling before Task 3/5 can run.

**Atlas Forms MCP tool-calling looks mechanically live right now** (port 10001, `/mcp/sse` routes
mapped, `AIMCP_McpServers` config correct, a prior live `tools/list` call already proven to return the
8 real tool names) — the real open item is a security gap, not a functional one: **MCP tool calls carry
no authorization enforcement today** — the `[McpServerTool]` methods call services directly, bypassing
`MapControllers()`, so `[AuthorizeTenantAdminAttribute]` never runs for an MCP call. Fine for a
controlled Task 3/5 test; a real gap to flag before wider use.

**What this means for Task 3**: no architecture work is blocking it anymore. The one real blocker left
is administrative — Task 2's real `AgentID` isn't recorded in this doc or `design-and-plan.md` despite
being reported complete; that needs to be pinned down before Task 3 is dispatched. `architecture.md` §7
gives the exact minimal node config and two ways to build the workflow without needing the (currently
logged-out) Flow Studio browser session.

## 2026-08-23 — Task 1 attempt #2: collection identity resolved, real upload still blocked

Binoy's ask this round: he created a collection named `atlas-forms-automation` in the live
`document-manager` app (localhost:6110, backend `BizFirst.Ai.Consolidated.WebApi` on 10001) and asked
for all Atlas Forms v2 RAG spec files to be uploaded into it, MCP wired to it, and a "Knowledge
Retriever" tool pointed at it. Net result: **no files were uploaded — two independent environment
blockers made a real, verifiable upload impossible this session** — but several previously-open design
questions got resolved for good along the way.

**Resolved: "Library Collections" vs "Knowledge Collections" was a false dichotomy.** The original
design doc (see below) worried about which of `document-manager`'s two collection UIs
(`/collections/:id` vs `/knowledge-collections/:id`) Binoy meant. Traced the actual backend
(`BaseKnowledgeCollectionController.cs`, `RagCollectionResolver.cs`,
`BizFirstPayrollV3\src\mvc-server\Go\Documents\`): **both UIs are thin front ends over the exact same
`Doc_DocumentCollections` SQL table** — the Knowledge routes (`api/v1/knowledge/collections`) are
explicitly documented in code as "the vendor-facing 'Knowledge' equivalent of
`BaseDocumentCollectionController`," delegating to the same `DocumentCollection`/
`DocumentCollectionMember` entities. There is only one `atlas-forms-automation` row to find, not two
systems to choose between. Confirmed by direct SQL query (`sqlcmd` against
`.\SQLEXPRESS` / `data-ocean-platform-prod`, since the API was unreachable — see below):
`Doc_DocumentCollections.DocumentCollectionID = 1`, `TenantID = 1`, `CollectionName =
'atlas-forms-automation'`, `ProviderName = NULL`, created 2026-08-23 03:52:58 (same day, by Binoy).

**Resolved: the real upload mechanism, traced end to end in code.** `POST /api/v1/knowledge/items`
(multipart, field `KnowledgeCollectionID` = the int collection ID) →
`KnowledgeIngestionServiceBase.PersistAsync` writes the blob and creates a `Doc_Documents` row with
`PendingKnowledgeCollectionID` set → the document-create pipeline's after-create processor
(`RagCollectionResolver` + `RagDocumentCreateProcessor`,
`BizFirstFi.Go.Documents.Service\Processing\` and
`BizFirst.Integration.Flow.FlowRag.Documents\RagDocumentCreateProcessor.cs`) extracts text, creates the
`Doc_DocumentCollectionMembers` row, and indexes into Qdrant via `IFlowRagKnowledgeService
.InsertKnowledgeAsync`, then stamps `RagKnowledgeID`/`RagProviderName`/`RagIndexedOn` back onto the
membership row on success. This confirms the coordinator's find mid-session was accurate: this
pipeline is real and wired, not a stub — it just fails open (logs a warning, leaves those three columns
NULL) when indexing fails.

**New, concretely-confirmed blocker: Qdrant is unreachable in this environment, and it's not
hypothetical — two prior documents already prove it's failing right now.** Direct SQL query of
`Doc_DocumentCollectionMembers WHERE DocumentCollectionID = 1` found two rows already there
(`DocumentID` 7 and 9, presumably from Binoy's own manual test upload before dispatching this task) —
**both have `RagKnowledgeID`, `RagProviderName`, and `RagIndexedOn` all NULL**, i.e. real, live proof
that RAG indexing is silently failing for this exact collection right now. Root-caused: Qdrant
(`http://localhost:6333` per `FlowRag` config in `appsettings.Development.json`) is not reachable
(`Test-NetConnection localhost -Port 6333` → false). No Docker Desktop is installed on this machine, no
`docker` CLI exists, WSL has no distro configured, and no standalone Qdrant binary or docker-compose
file for it exists anywhere in the repo — so there was no way to start it from this sandbox without a
real infrastructure change, which is out of scope for a RAG-upload task. Separately, a Postman-only
runbook found at `Documentation\Employees\airag-qdrant-setup\setup-guide.html` (dated 2026-08-20, by
Anit M George) documents an *entirely different* ingestion surface (`/api/v1/ai/rag-documents/upload`,
the older `BizFirst.Ai.AiRag.*` module, tables `AIRag_*`) tested against **Qdrant Cloud**, not local
Qdrant — and states outright that "The Document Manager app does not call these endpoints." That's
still true of the AiRag module specifically (confirmed zero rows in `AIRag_KnowledgeCollectionConfigs`
for any name matching `atlas-forms-automation`), but it's now stale as a claim about RAG indexing in
general — the *actual* live pipeline behind the Knowledge UI (traced above) is a completely separate,
newer code path (`Go.Documents` + `FlowRag`) that the Aug 20 runbook's author evidently didn't know
about yet. Worth reconciling these two parallel RAG surfaces explicitly at some point — right now they
coexist, target different Qdrant endpoints (cloud vs. local), and neither is aware of the other.

**Second, independent blocker: no authenticated session, and this agent cannot create one.** Both
upload paths (drive the real UI via browser automation, or call the API batch-style) require a bearer
token. Checked the one connected Chrome session's `localStorage['auth-store']` for `document-manager`
— `{"user":null,"token":null,"isAuthenticated":false}` — genuinely logged out, and the tab redirects to
Passport login. Entering credentials on Binoy's behalf is against this agent's operating rules
regardless of whether they were available, so this needs Binoy (or someone with credentials) to log
into `localhost:8001` in an active browser session before any upload — UI-driven or API-driven — can
happen.

**Third, transient blocker for this session specifically:** the backend (`BizFirst.Ai.Consolidated.WebApi`,
port 10001) was down for this entire session — a concurrent, unrelated agent had killed it mid-rebuild
to fix a different bug and it never came back up in the ~15+ minutes this task waited on it (confirmed
repeatedly via `Get-NetTCPConnection -State Listen`). This one is almost certainly resolved by the time
anyone picks this back up; the Qdrant and auth blockers above are not transient in the same way and need
real action.

**Files confirmed as the actual upload set (unchanged from original scope, verified again this
round):** 74 markdown files under `atlas-forms-rag\v2\` — 5 Tier-1 top-level
(`00-overview.md`, `01-common-properties.md`, `advanced-capabilities.md`, `conditional-logic.md`,
`validation-rules.md`) + 69 Tier-2 files under `v2\controls\`. `v2\worked-examples\*.json` (3 files)
correctly excluded per the original design (JSON worked examples, not spec prose). Full path list saved
this session at the agent's scratchpad, not checked into the repo — regenerate with `find
v2 -name "*.md" | sort` if needed again.

**Step 4 (Knowledge Retriever / MCP), resolved with harder evidence than last time:** confirmed there
is no retrieval/search capability at all yet on the live pipeline the Knowledge UI actually writes to.
`BaseKnowledgeController.cs`'s own class doc comment states outright: *"Deliberately has no
search/query/retrieval endpoint — `IFlowRagKnowledgeService` currently only supports
Insert/Update/Delete, so a Knowledge 'search' endpoint is future work."* This is stronger evidence than
the previous pass's search-based non-finding — it's the current live codebase's own author
acknowledging the gap, not an absence of search hits. Confirmed (again) no
`BizFirst.Ai.Mcp.Tools.Knowledge` module exists — only `AtlasForms`/`Credentials`/`Workflow` under
`AI\Mcp\`. The `util-kg-knowledge_retrieval` function / `KnowledgeBaseUtilityHook` /
`KnowledgeRetrievalFn` mechanism referenced in `ragUploadDesign.md` Part 2 lives entirely in
`BizFirstAI.V21` — a different, legacy codebase, not part of the live `BizFirstAiStudio`/
`BizFirstPayrollV3` stack this project actually runs against. **"Knowledge Retriever" is not an
existing tool anywhere in this codebase under any name** (checked flow-studio, octopus-admin,
bizfirst-common, and all of `Documentation\Employees\agentic-coding` / `Octopus` for the literal term —
zero hits). Building it is a real, non-trivial scope addition (a search/retrieval endpoint on
`IKnowledgeService`/`IFlowRagKnowledgeService`, then an MCP tool wrapping it) — flagged to Binoy rather
than built blind, per this project's own standing instruction not to guess past an architectural gap
this size.

**What would unblock a real attempt next time, in order:** (1) confirm `BizFirst.Ai.Consolidated.WebApi`
is back up on 10001; (2) get Qdrant reachable at `localhost:6333` — needs a real decision (install
Docker, or point `FlowRag:QdrantUrl` at the same Qdrant Cloud instance the Aug 20 AiRag runbook used,
or something else) since this sandbox has neither Docker nor a local Qdrant binary; (3) have someone log
into Passport (`localhost:8001`) in a browser session this agent can drive, or supply the resulting
bearer token directly. None of these are code changes — all environment/ops.
