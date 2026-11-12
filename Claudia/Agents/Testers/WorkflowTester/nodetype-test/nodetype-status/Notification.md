# Node Certification Report: Notification (scope: email-smtp only)

## Summary
| | |
|---|---|
| Run ID | NC-NOTI-20261109-001 |
| Node type | Notification (category id 8 is empty in the registry; scope chosen by user: `email-smtp`, TypeID 129) |
| Execution | 2026-11-09 07:04:05-07:04:23 UTC (26.8 s), triggered manually by the user from Flow Studio |
| Agent status | COMPLETED (partial scope, see Verdict) |
| Nodes | 1 tested, **1 PASSED**, 0 failed. Other candidate nodes in `nodetype-list/Notification.md` not run. |
| Result | **1/1 PASSED** (email-smtp). Not a full-category certification. |

## Per-node table
| Node | TypeID | WorkflowID (thread / process) | ExecutionID (process / thread) | Node status | Execution status | Validation | Screenshots |
|---|---|---|---|---|---|---|---|
| email-smtp | 129 | 5726 / 5727 | 2387 / 1043 | Success (element exec 2078) | Success, 2/2 nodes, 0 failed | PASSED | missing: no browser tool available to the agent this run |

## Passed details: email-smtp
Validation criteria (spec Step 6) and what was actually observed:
1. Workflow execution completed: `Process_ProcessExecutions` 2387 status 10 = Success, TotalNodes 2, CompletedNodes 2, FailedNodes 0. OK.
2. Target node has an executed record: `Process_ProcessElementExecutions` 2078 for element 7677, status Success (trigger 7676 = 2077 Success). OK.
3. No node-level error: ErrorMessage empty. OK.
4. Node-specific assertion on real output (node DataState `outputData`): `status=success`, `resource=email`, `operation=send`, `messageId=UU5J16S8SUU4.IXQZCPNZOH4R3@anit`, `accepted=["<ethereal test address>"]`, `rejected=[]`, `response` begins "Accepted". Recipient equals configured `toEmail`. OK.
5. Independent confirmation outside the workflow: IMAP login to the Ethereal mailbox shows 1 message with the same Message-ID, From "NC Certification", To the test address, Subject "NC-NOTI-20261109-001 email-smtp certification", Date 12:34:17 +0530 (= 07:04:17 UTC, inside the node's 07:04:11-07:04:20 window). OK. "Provider accepted" and "arrived in the test mailbox" are both confirmed; this is a sandbox server, so real-world inbox delivery is not claimed.

Setup: workflow `Manual Trigger -> Send Email (SMTP)` (nodes 7676, 7677, edge 6006), config read back via `get_workflow`. Credentials: throwaway Ethereal account kept inline in the node config (credential store not reachable via MCP, finding 17).

## Not covered (honest limits)
- Screenshots (`workflow.png`, `configuration.png`): not captured, no browser tool in this session. Record: "screenshot missing: no browser automation available".
- Negative cases (bad host, auth failure, rejected recipient) were not run.
- Observe tables `Process_NodeActivityLogs` / `Process_ExecutionTraceNodeTraces` have no rows for this run (see finding 21); evidence came from `Process_ProcessElementExecutions.DataState` instead.
- 8 other candidate nodes (mailgun, email-gmail, email-ses, sms-message, twilio, slack, discord, whatsapp) and 2 triggers not tested.

## Verdict
Agent Status: COMPLETED. email-smtp: PASSED (1/1 in the agreed scope).
