# Lessons — Odoo Node Testing

**This node folder is a running agent, not a one-off deliverable.** Anyone — human or Claude agent —
picking up work on the `odoo` node **must read this file first**, before touching `resource.md`,
`test-plan.md`, or `workflow-build\`. Any real finding, defect, or process improvement discovered
while working on this node **must** be appended here as a new dated entry before the work is
considered done — the same standing requirement as `..\elasticsearch\lessons\README.md`. Newest
entries first. Keep each entry short and specific.

Also check `..\elasticsearch\lessons\README.md` before starting new work here — several of its
findings are general, not Elasticsearch-specific: the decoy-duplicate-folder check (this node came up
clean, but always re-check), stale-test-report skepticism (this node has no test project at all,
which is its own, different flavor of the same underlying risk — see below), the
`execute-by-id`+locally-minted-JWT recipe, and the `Process_*` dynamic-SQL gotchas
(`SET QUOTED_IDENTIFIER ON`/`SET ANSI_NULLS ON`, pre-computing concatenation before `sp_executesql`)
if this node ever needs the DB-fallback build path.

---

## 2026-09-06 — Framework build (folder created): four concrete, transferable lessons

Full context: this folder was created in the same session that (a) stood up a real local Odoo dev
instance for an unrelated LeadFirst design task and (b) manually proved out its JSON-RPC API by hand
(login/create/search/delete against `res.partner`), then was asked to add this node to the
`agentic-testing-nodes` framework using Elasticsearch as the template. Four lessons worth carrying
forward:

**1. A node can already have its "credential sourcing" problem solved by unrelated prior work in the
same session/repo — check for that before assuming every node needs the full vendor-signup
playbook.** Elasticsearch's round is permanently stuck on sourcing a real external account
(`..\02-guidelines.md` Step 6's full playbook). This node didn't need any of that — a real local Odoo
instance already existed from a different task earlier the same day, and its connection details were
already documented in `Documentation\WorkManagement\LeadFirst\Workflows\Odoo\password.md`. **Lesson:
before writing a node's credential-sourcing section as "blocked, here's the vendor signup flow,"
check whether a real instance of the target system already exists somewhere in this repo/session's
own history** (a `password.md`/`*-setup.md`-style doc, a running local service) — it can turn a
permanently-blocked category into an immediately-testable one.

**2. "No test project exists" and "a stale test project exists" are both real gaps, but they are not
the same finding — don't conflate them.** Elasticsearch has a test project that *looks* like current
coverage (a `TEST_EXECUTION_REPORT.md` claiming 87/87) but silently doesn't build. This node has
**no test project at all** — a repo-wide search for `*Odoo*Tests*` returned zero matches. The second
is arguably a cleaner failure mode (nobody can be misled into citing stale numbers) but is still a
real gap worth flagging distinctly, not folded into the same "stale test project" framing.

**3. When a node has no `NodeReport.md`-style coverage-matrix file, don't invent one from
assumption — build the operation-by-operation routing/field cross-check for real, or mark it
explicitly incomplete.** Elasticsearch's `NodeReport.md` gave a pre-validated 10/10 starting point
this framework only had to spot-check. This node's DB-side project has a good `Forms\README.md` (a
real spec covering `PrimaryUsage` conventions and schema layout) but nothing playing
`NodeReport.md`'s specific role of "here is the proof every operation routes end to end." **This
folder's `resource.md`/`test-plan.md` deliberately mark the routing/field cross-check for
Lead/Activity/Lookup/Trigger (20 of 35 operations) as open, not done** — resist the temptation to
write a confident-sounding coverage table for those 20 without actually reading
`OdooLeadInfos.cs`/`OdooActivityInfos.cs`/`OdooLookupInfo.cs`/`OdooTriggerInfo.cs` first.

**4. A node can support two different auth "modes" (here: `apiKey` vs `usernamePassword`) that
resolve credentials through genuinely different code paths and even different transports
(`OdooJsonRpcTransport` vs `OdooJsonTwoTransport`) — a test plan needs to cover both, not just
whichever one the first real test target happens to use.** The local Odoo instance this session
verified uses `usernamePassword` (an admin login), which exercises `OdooJsonRpcTransport`'s
legacy `common.login`→`uid` path. `OdooJsonTwoTransport` (the presumed `apiKey`-mode path) has not
been read or exercised at all yet. **Lesson: don't let "we have one working real credential" become
"the credential story is done" — check whether the node has more than one auth mode/transport before
declaring credential sourcing complete.**
