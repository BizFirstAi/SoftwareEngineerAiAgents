# How to manually test an Octopus AI Agent node via Flow Studio

A reusable runbook, not a narrative of one bug — follow steps 1-7 verbatim for any AI-agent-related
verification; only the target-specific parts (which project/workflow to open, what to look for)
change per task. Written 2026-08-18 from the first real session that did this end-to-end
(`targets\octopus-ai-agent-hil.md`'s investigation). If you're an agent picking this up cold, this
is everything you need — no need to ask Binoy to re-explain the mechanics.

## 1. Environment prerequisites and startup order

Three services, check each before starting a new one — this dev machine has ~7.7GB RAM, and
running WebApi + 3 frontend dev servers + an active `dotnet build` all at once has OOM-killed the
WebApi before. Startup order: WebApi first, confirm healthy, then frontends.

- **WebApi** (`BizFirst.Ai.Consolidated.WebApi`, port `https://localhost:10001`):
  ```
  cd C:\BizFirstGO_FI_AI\BizFirstPayrollV3
  dotnet run --no-build --project "src\mvc-server\Solutions\AiUltimate\BizFirst.Ai.Consolidated.WebApi\BizFirst.Ai.Consolidated.WebApi.csproj"
  ```
  The containing folder has *several* `.csproj` files (`.Mini.csproj`, a `CustomerPortal` one,
  etc.) — you must target this exact path or `dotnet run` errors as ambiguous. Use `--no-build`
  only if you know the project is already built for the code you want to test; otherwise build
  first per `Solutions\AiUltimate\BUILD.md` (project build, not solution-only, or the V21 plugin
  DLLs won't be copied and DI validation fails at startup).
- **Login app** (`BizFirst Passport Login`, default port `8001`):
  `pnpm dev` from `BizFirstAiStudio\src\passport\apps\login`.
- **Flow Studio** (default port `6005`):
  `pnpm dev` from `BizFirstAiStudio\src\flow-studio\apps\flow-studio`.

Before starting either frontend, check if it's already running:
```
curl -s -o /dev/null -w "%{http_code}" http://localhost:8001/
curl -s -o /dev/null -w "%{http_code}" http://localhost:6005/
```
A `200` means it's already up — use it, don't start a duplicate. This session repeatedly found
both already running from a prior session; starting a second instance just lands Vite on a
fallback port (e.g. `8003`, `6007`) and wastes memory for no benefit. If you do need to stop a
redundant duplicate you started by mistake, use `TaskStop` on that specific background task.

## 2. Log in

Navigate to `http://localhost:8001/`. The email/password fields are pre-filled by Chrome's saved
credentials — **this can look empty in an accessibility-tree read** (`find`/`read_page`), so take
a screenshot to actually confirm before assuming the form is blank. Click "Sign In". Lands on
`/post-login`.

## 3. Navigate to the workflow under test

Go to `http://localhost:6005/`. First load may show "Loading Workflow Designer... Initializing
node templates" for 20-30+ seconds — this is a real (separately tracked) backend slow-query issue,
not a hang; wait it out rather than assuming something's broken.

Once the Dashboard loads: find the project card containing the node you're testing (this session
used a project named "Ai Agent 8/15" — that's specific to the target being tested, not a fixed
name; scroll/paginate the project grid to find whichever project has the node type you need), then
click **Design** on that card. This opens the Designer at that project's workflow (session example:
"Ai Agent 8/15 Workflow 1", execution `#1048`) with the node under test visible on the canvas.

## 4. Execute

Click **Execute** (top-right of the Designer toolbar). The canvas switches to a read-only
"Execution Mode" banner, and a bottom panel dashboard appears automatically with tabs: Dashboard,
Execution Status, **Execution Logs**, Error Analysis, Nodes Hierarchy, Nodes, HIL Actions.

## 5. Watch live — Execution Logs is the primary debugging tool

Click the panel's expand icon (top-right of its own tab bar) for a full-screen view. The
**Execution Logs** tab is a live, SignalR-driven, per-node event table (columns: time / level /
node / type / execution ID / stage / substage / message). Click any row to open a right-hand pane
with that event's full raw payload — toggle **Formatted / JSON**; the JSON view is the one worth
reading for real diagnosis, formatted view hides the fields you usually need.

Fields this session found diagnostically load-bearing for an AI Agent HIL/suspend investigation
specifically (adapt to whatever your own target actually needs):
- `hilInboxReferences.engageSessionID` — `0` means no real suspend/session was created.
- `hilPresentationRequest.session.resumeCallbackURL` — empty means the same.
- a `workflowRouting.portName` field inside `customData` — empty string instead of `"waiting"`
  means the node never actually returned the waiting port, even if it visually looked like it
  paused.
- `rawDetail.progress.skippedNodes` — a downstream node getting skipped is consistent with a
  `"waiting"`-only outgoing edge never firing.

## 6. HIL Actions tab — a fast cross-check independent of log-reading

Shows **"No active HIL event... Forms, chats, and approval requests will appear here when a
workflow suspends"** whenever nothing is genuinely suspended. Use this as a quick sanity check
before diving into JSON — if it says no active event but you expected a suspend, you already know
the bug is real without reading a single log line.

## 7. Multiple-Chrome-browsers gotcha

If any `claude-in-chrome` browser action (most often `tabs_context_mcp`) returns a "multiple
Chrome browsers connected" error, you **must** call `AskUserQuestion` listing every connected
browser (by its `deviceId`) as an option, plus the tool-provided "open a confirmation screen"
option — do not guess or auto-pick one. This recurred multiple times in one session (closing and
reopening Chrome windows re-triggers it) — it's a routine interruption, not a real failure, handle
it the same way every time.

## 8. Testing an actual multi-turn HIL conversation

Once the underlying suspend/resume mechanism genuinely works (this session's first real run was
still fixing it, so this protocol wasn't exercised end-to-end yet — treat it as the target, not a
confirmed-working example): reply as the simulated user via the chat window UI (or directly `POST
/api/hil/respond/{engageSessionId}`), confirm the same `ConversationID`/`agentSessionId` persists
turn to turn, repeat for several turns, then send an explicit end-conversation action and confirm
the node completes via the `Main` port with its `Process_SuspendedExecutions` row cleared. Full
protocol detail lives in `targets\octopus-ai-agent-hil.md`'s "Required E2E test protocol" section —
link to it rather than re-deriving it here, so the two docs don't drift apart.

## 9. Known slow-but-not-broken behaviors

- The node-template load spinner (step 3) — 20-30+ seconds is normal on this environment, not a
  hang.
- The general loop — **execute → watch Execution Logs → cross-check HIL Actions** — is the
  repeatable pattern for any future AI-agent verification task, not just the specific HIL-suspend
  bug this session was chasing. Reuse steps 1-7 unmodified; only what you look for in step 5/6/8
  changes per target.
