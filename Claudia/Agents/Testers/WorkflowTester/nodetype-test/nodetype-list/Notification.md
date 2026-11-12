# Node type: Notification (run NC-NOTI-20261109-001)

Retrieved 2026-11-09 from the live registry (`Process_ProcessElementTypes`, read-only SELECT on the DB the WebApi uses; remote `workstation-3-prod-platform-octopus`).

## Result of category resolution
- Category `Notification` = `ProcessElementCategoryID` 8 exists, but **0** enabled node types are assigned to it.
- Registry totals: 121 enabled node types, **120 have a NULL category**; only `satellite` (268) has one (12, Utility). Category-based discovery cannot work on this DB.
- Per the agent spec (Step 2.5) a literal run reports "0 nodes found". The table below is a **proposed candidate set chosen by node code/name, pending user confirmation**. It is not the registry's own grouping.

## Candidate messaging/notification nodes
| Name (code) | TypeID | RequiresCredentials | Test status | Note |
|---|---|---|---|---|
| email-smtp | 129 | yes | PASSED (run NC-NOTI-20261109-001) | |
| mailgun | 276 | yes | BLOCKED: needs Mailgun API key + sending domain (no free local sandbox) | resource=message, operation=send; fields fromEmail, toEmail, subject, bodyText |
| email-gmail | 292 | yes | PENDING | |
| email-ses | 295 | yes | PENDING | |
| sms-message | 301 | yes | PENDING | |
| twilio | 303 | yes | PENDING | |
| slack | 289 | no (registry); executor needs bot token | BLOCKED: needs bot token + channel; registry schema mismatch (finding 22) | |
| discord | 286 | yes | PENDING | |
| whatsapp | 291 | yes | PENDING | |
| email-gmail-trigger | 293 | yes | SKIPPED | trigger, cannot be driven by a Manual Trigger |
| email-imap-trigger | 296 | yes | SKIPPED | trigger, cannot be driven by a Manual Trigger |
| facebook / instagram / tiktok | 287 / 288 / 290 | yes | not proposed | social platforms, confirm if wanted |
