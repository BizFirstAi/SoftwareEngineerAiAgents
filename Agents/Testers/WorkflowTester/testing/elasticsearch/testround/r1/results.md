# Elasticsearch Node — Test Round r1

Run: 2026-08-23 · Environment: SQL Server (`.\SQLEXPRESS` / `data-ocean-platform-prod`) reachable
throughout via direct `sqlcmd`; Consolidated WebApi backend (`https://localhost:10001`) reachable at
round start, found **unreachable partway through** (see Notes) and not restarted per standing rule;
Flow Studio dev server not started this round (blocked on backend); no Chrome/claude-in-chrome
screenshots captured this round for the same reason.

This is a **certification-in-progress** round, not a final sign-off — every case below has a real
verdict (per `..\..\..\globals.md`'s rule: Blocked-with-reason is acceptable, silent skipping is not),
but full sign-off per Binoy's instruction requires the credential + backend blockers in the Notes
section to clear first, plus a Chrome-driven UI evidence pass. See `..\..\test-plan.md`'s "Certification
/ sign-off" section.

| # | Case | Verdict | Evidence |
|---|---|---|---|
| P0-01 | Registry/executor/DB catalog agree | Pass | `evidence\P0-01-registry-row.txt` (live query: `ProcessElementTypeID=269`, `Code=elasticsearch`, `Enabled=1`, `RequiresCredentials=1`) |
| P0-02 | Atlas Form fields agree with C# `LoadFrom`/`Validate` | Pass | `..\..\resources\config-schema.md` (full field-by-field cross-check, produced by this case) |
| P0-03 | Stale test project doesn't silently claim current coverage | **Fail (real defect, reported)** | `dotnet build` output, 9 errors, `MSB9008` + `CS0234`/`CS0246` — see `..\..\resources\backend-projects.md` "Known issue" |
| P1-01..10 (a) | Phase 1 UI confirmation, preferred method (Flow Studio) | **Blocked** | Needs backend reachable + confirmed-logged-in session — Flow Studio's dev server proxies `/api` to the backend. Not yet attempted this round (session was logged out at build time, which is why (b) was used instead) |
| P1-01..10 (b) | Phase 1 build verification, fallback method, all 10 features | Pass | `evidence\phase1-phase2-processids.txt`, `evidence\phase1-document-create-config.txt` (one representative config round-trip; all 10 were individually verified the same way during the build — see `..\..\workflow-build\build-phase1-isolated-workflows.sql` header for the full ID table). Floor evidence only, not a substitute for (a) |
| P1-01..10 (c) | Phase 1 live execution (happy path) | **Blocked** | Needs real Elasticsearch credentials (`..\..\resource.md` §5) **and** backend reachable (currently down) |
| P1-01..10 (d) | Phase 1 backend data comparison (write/query cases) | **Blocked** | Needs real Elasticsearch credentials — requires a direct API call to Elasticsearch itself, independent of the workflow |
| P1-CROSS-01 | Invalid config rejected cleanly | **Blocked** | Needs backend reachable only (does not need ES credentials — case is designed around this) |
| P1-CROSS-02 | Credential-missing error is clean | **Blocked** | Same as above; workflow variant not yet built (5-minute addition once backend is up) |
| P2-01 | Phase 2 build verification, fallback method | Pass | `evidence\phase2-elements.txt`, `evidence\phase2-connections.txt` (all 11 elements + 10 connections read back correct). Floor evidence only, not a substitute for a UI pass |
| P2-02 | Phase 2 full chain execution + backend data comparison | **Blocked** | Needs Chrome/UI pass, real Elasticsearch credentials, and backend reachable — see `..\..\test-plan.md` P2-02 |

## Notes

**Real, positive evidence this round produced** (not fabricated, not descriptions of what "should"
happen):

- The `elasticsearch` node type is confirmed **live and real** in the actual dev database, not just
  present as an unapplied `.sql` script in the repo — `ProcessElementTypeID=269`, queried directly.
- **11 real workflows were built** (10 Phase 1 + 1 Phase 2), using a genuinely reusable direct-DB
  clone technique (see `..\..\workflow-build\README.md`) — this is new, previously-undocumented
  automation for this framework, not just planning. Every one was read back and confirmed correct:
  config JSON matches exactly what was intended, trigger flags correct, port wiring correct.
- The `execute-by-id` + locally-minted-JWT execution technique is **proven working precedent** (7 real
  executions logged in `Knowledge\Form\design\STATUS.md`,
  "Done (cont. 7)") — this round didn't need to re-prove the technique works, only apply it, and got
  as far as minting a valid JWT before hitting the backend-down blocker below.
- A real, previously-undocumented **defect** was found and reported: the Elasticsearch node's own
  unit test project (`Tests\BizFirst.Ai.ExecutionNodes.Productivity.ElasticSearch.Tests\`) does not
  currently build — it references a project deleted during a June 2026 refactor. Its own
  `TEST_EXECUTION_REPORT.md` ("87/87 passing") is stale and should not be cited as current coverage.
  See `..\..\resources\backend-projects.md`.

**What blocked further progress this round, and why neither was worked around:**

1. **Consolidated WebApi backend went unreachable partway through this round** (`curl` to
   `https://localhost:10001/swagger/index.html` returned connection-refused after previously
   returning `200` earlier in the same session — see `evidence\backend-health-check-2026-08-23.txt`).
   SQL Server itself, reached independently via `sqlcmd`, stayed up and reachable the entire time —
   this is specifically a WebApi-process issue, matching a previously-documented pattern of the same
   kind of interruption in `STATUS.md`. Per `Documentation\Employees\agentic-testing\globals.md`'s standing rule, its
   lifecycle is reserved for direct human action — **not restarted as part of this task**. This
   blocks: the `execute-by-id` API call (needed for every live-execution case), and any Chrome-driven
   Flow Studio pass (its dev server proxies `/api` to this same backend).
2. **No real Elasticsearch credentials available yet.** Every built workflow currently uses a
   syntactically-valid but fake connection (`https://localhost:9200`, placeholder password) —
   deliberately, so the workflows are ready to receive real values the moment they're available,
   without needing to be rebuilt. See `..\..\resource.md` §5 for the exact, actionable next step
   (Elastic Cloud free trial, opened in Chrome, verified live today).
3. **Methodology correction, applied after this round's build:** all 11 workflows in this round were
   built via the direct-DB fallback because the `claude-in-chrome` Flow Studio session was found
   logged out at build time — a legitimate trigger for the fallback per `..\..\..\globals.md`, but **not**
   the standing preferred method. Chrome-driven, through Flow Studio's real UI, is the preferred
   default going forward (see `..\..\..\01-Getting-started\index.html` and `..\..\..\02-guidelines.md` Step
   5) — a real UI pass for these 11 workflows is still owed, tracked as part of `test-plan.md`'s Phase
   1/Phase 2 part (a), not assumed satisfied by the DB build.

**What "done" looks like for this round to close out as a real certification**, once all blockers
clear: confirm/rebuild through Flow Studio's real UI (the preferred method) rather than relying on the
DB-built versions alone; re-run P1-CROSS-01/02 and all of P1(c)/(d)/P2-02 for real; capture real Flow
Studio screenshots for the UI-confirmation cases (canvas showing the node configured, execution
inspector showing success or a clean error); for every write/query case, independently confirm the
result against Elasticsearch's own API directly (`curl`, not just the workflow's own reported output
or another node's read-back — see `..\..\..\globals.md` category 7); and update every Blocked verdict
above to a real Pass/Fail with that evidence attached in `screenshots\` and `evidence\`. This file
should be revised in place until then rather than starting a fresh round — the same round, r1, simply
isn't finished yet; a new round number is for a **new** attempt after this one closes, not for
continuing this one.
