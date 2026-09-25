# Lessons — Elasticsearch Node Testing

**This node folder is a running agent, not a one-off deliverable.** Anyone — human or Claude agent —
picking up work on the `elasticsearch` node **must read this file first**, before touching
`resource.md`, `test-plan.md`, or `workflow-build\`. Any real finding, defect, or process improvement
discovered while working on this node **must** be appended here as a new dated entry before the work
is considered done — this is a standing requirement, not optional, the same pattern already
established in `..\..\agentic-coding\atlas-form-automation-project\lessons\README.md`. Newest entries
first. Keep each entry short and specific — what was assumed going in, what turned out to be true or
false, and what to do differently next time. Bias toward the surprising and the concrete over the
obvious; this is not a changelog of what someone was told to fix.

Also check `..\..\02-guidelines.md`'s "Lessons" section before starting — some findings below (the
decoy-folder pitfall, the credential-sourcing pattern, the UI-vs-DB-fallback rule) are general enough
that they've been promoted there too, for every future node type, not just this one.

---

## 2026-08-23 — Framework build + two correction passes: five concrete, transferable lessons

Full context: this is the pilot node for the whole `agentic-testing-nodes` framework — built from
scratch, then corrected twice in the same session on real Binoy feedback. Five lessons worth carrying
into the next node type, in the order they'd actually bite someone:

**1. A node type can have a decoy, empty duplicate folder sitting right next to the real
implementation — don't trust folder names alone.**
`BizFirstPayrollV3\...\ExecutionNodes\Productivity\Elasticsearch\` looks exactly like where you'd
expect the real node to live, and it exists on disk — but it contains **no real C# source**, only
IDE scratch (`.vs\`) and build-artifact (`obj\`) folders, no `Main\`/`Support\`, and is referenced by
**zero** `.sln` files in the repo. The real implementation is at `...\ExecutionNodes\DB\ElasticSearch\`
— a different category folder than the name would suggest. **Lesson: before writing anything into a
node's `resource.md`, confirm the folder you found is referenced by a real solution file (grep every
`.sln` for the project name) and contains a real `Main\`/DI-registration file
(`*NodeExecutorDependency.cs` calling `ExecutorRegistry.Register<...>`) — don't assume the
first folder matching the node's name by string search is the real one.**

**2. A node's own `TEST_EXECUTION_REPORT.md` claiming "87/87 passing" can be describing a project
that was deleted months ago — always run `dotnet build` yourself, never cite the report on faith.**
`Tests\BizFirst.Ai.ExecutionNodes.Productivity.ElasticSearch.Tests\` still exists on disk, still has a
report file dated 2026-05-12 claiming full green, but its `RootNamespace`/class references
(`ElasticsearchNodeExecutor`, lowercase-s) point at a project deleted during a June 2026 refactor that
moved the real node to `DB\ElasticSearch\` (capital S, different base class). `dotnet build` gives 9
real errors, the tell-tale one being `MSB9008: referenced project ...csproj does not exist`. **Lesson:
a stale test-report file is a real, silent trap for the next reader — treat any
`TEST_EXECUTION_REPORT.md`/`TEST_STATUS_SUMMARY.md`-style file as a claim to verify, not a fact, and
always run the actual build/test command before citing coverage numbers from one.**

**3. The `execute-by-id` + locally-minted-JWT technique (first proven in
`agentic-coding\atlas-form-automation-project\STATUS.md`, "Done (cont. 7)", 7 real executions) really
is a clean, reusable pattern across sessions — but confirm the backend is actually up before minting
the token, don't assume.** Reused it here: read `Jwt:Key`/`Issuer`/`Audience` straight from
`BizFirst.Ai.Consolidated.WebApi\appsettings.json`, signed an HS256 token for `UserID=5`/`TenantID=1`
(Binoy's real `binoyjose` admin account) via PowerShell's `HMACSHA256` (no `python`/`node` needed on
this machine — worth remembering, `python3`/`python` are not installed here, PowerShell's built-in
crypto classes are the fastest path to an HS256 JWT with zero new dependencies). The minting itself
worked first try. The actual `execute-by-id` call never got a result this session — the Consolidated
WebApi backend went unreachable partway through, independent of anything this task did. **Lesson: the
technique transfers cleanly; the backend's uptime does not — always `curl` the swagger health check
immediately before relying on `execute-by-id`, not just once at the start of a session.**

**4. Building 10+ near-identical DB rows by hand is exactly the kind of place `EXEC sp_executesql`
silently breaks on string-concatenation expressions passed as named parameters — pre-compute into a
local variable first.** `EXEC sp_executesql @sql, N'@Key NVARCHAR(100)', @Key = N'prefix-' + @Var +
N'-suffix'` throws `Incorrect syntax near '+'` — T-SQL's `EXEC` named-parameter syntax does not accept
a concatenation expression as a parameter value directly, even though it looks like it should. Fix:
`SET @KeyVal = N'prefix-' + @Var + N'-suffix'; EXEC sp_executesql @sql, N'@Key NVARCHAR(100)', @Key =
@KeyVal`. Also hit, same session: cloning rows via dynamic `INSERT...SELECT` into
`Process_Processes`/`Process_ProcessElements`-family tables fails with `Msg 1934: INSERT failed
because SET options incorrect` unless `SET QUOTED_IDENTIFIER ON; SET ANSI_NULLS ON;` are explicitly
set at the top of the script — these tables apparently have a filtered index/computed column that
requires it, and `sqlcmd -i <file>` does not reliably inherit the right defaults. **Lesson: any
dynamic-SQL clone script for this codebase's `Process_*` tables needs both fixes from the start, not
discovered by trial and error each time — copy `elasticsearch\workflow-build\build-phase1-isolated-workflows.sql`'s
header as the working template.**

**5. Company policy: never call the `Artifact` tool for internal deliverables, even when it seems
like the most polished way to present a methodology doc — write real local repo files from the
start.** This node's `01-Getting-started` methodology page and the framework's `about.html` were
initially published via the `Artifact` tool (which does require a local file first, so no content was
lost) and linked to each other via `claude.ai/code/artifact/...` URLs. Binoy's explicit, standing
correction: "I never ever want to use code artifact of claude... company policy does not want claude
to host any files EVER." Fixed by replacing every such URL with a local relative path and never
calling `Artifact` again. **Lesson: for this company, default to writing plain local files for any
HTML/methodology deliverable — don't reach for `Artifact` publishing as a first instinct, even for
something that would visually benefit from it. If unsure whether a company has this policy, ask before
publishing, not after.**

**Two related methodology corrections, also worth carrying forward as standing rules (see
`..\..\02-guidelines.md`'s Lessons section for the general version):**

- **Chrome-driven testing through Flow Studio's real UI is the preferred, default method — the
  direct-DB build script in `workflow-build\` is a fallback, used here because the browser session was
  found logged out at build time, not because it's faster or preferred.** All 11 of this node's Phase
  1/Phase 2 workflows were built via the DB fallback and still owe a real Chrome-driven confirmation
  pass before sign-off — don't let "the DB build worked" read as "the node is tested."
- **A node's own reported success (or one workflow step reading back what an earlier step wrote) is
  not sufficient evidence for a write/query case — it only proves internal self-consistency.** Every
  write/query case needs an independent call to the real external system's own API (a direct `curl`
  against Elasticsearch, for this node) before it can be recorded as a real Pass.
