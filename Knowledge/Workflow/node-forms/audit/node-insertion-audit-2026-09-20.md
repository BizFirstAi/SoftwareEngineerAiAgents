# Node Insertion Audit - 2026-09-20

Target: local SQL Server `.\SQLEXPRESS`, database `data-ocean-platform-prod` (only DB touched).
Source: `BizFirstFiDB\BizFirstFiV3DB\BizFirstFiV3DB\dbo\Data\projects\<Group>\<Node>\...` (folders named obsolete/backup/unapproved/unsorted and md files ignored).

## Summary

| Metric | Value |
|---|---|
| Node folders scanned | 128 |
| Fully present before this run | 123 |
| Missing rows before, fixed by this run | 5 (Blockchain/DataProof, Blockchain/Safe, PostgreSQL, Standard/Smtp, Standard/Gmail) |
| Fully present after run | 128 of 128 (+ 0 none; see notes) |
| Nodes still with missing rows | 0 |
| ProcessElementTypes expected / present | 109 / 109 |
| Forms expected / present | 1359 / 1359 |
| DataTemplates expected / present | 1334 / 1334 |
| Row counts before | PET=112 FORMS=1394 DT=1380 CredTypes=10 |
| Row counts after | PET=115 FORMS=1455 DT=1447 CredTypes=11 |

Rows inserted: 3 Process_ProcessElementTypes, 61 Atlas_Forms, 67 Template_DataTemplates, 1 AIExt_CredentialTypes (GOOGLE_OAUTH2).

## The "harshi" search

No artefact called "harshi" exists anywhere checked: not in any projects-folder file name or content, not in Process_ProcessElementTypes (Code/Name/DisplayName), Template_DataTemplates (TemplateName/ContentData), Atlas_Forms (Name/FormCode/PrimaryUsage/NodeUsage), not under BizFirstPayrollV3\src\mvc-server\AI (folder/file names, *.cs contents), and not in git commit messages of BizFirstFiDB / BizFirstPayrollV3. It is therefore not a "missing insert": there is no script for it. It may be a person name or a node not yet created or pushed by its author.

## Nodes that were missing rows before the run (now fixed)

| Node | Missing before |
|---|---|
| Blockchain/DataProof | 1 PET, 3 FORM, 9 DT |
| Blockchain/Safe | 1 PET, 19 FORM, 19 DT |
| PostgreSQL | 1 PET, 39 FORM, 38 DT |
| Standard/Gmail | 1 AIExt_CredentialTypes |
| Standard/Smtp | 1 DT |

Scripts run (one file at a time, -b, all exit code 0): 62 files from DataProof, Safe, PostgreSQL and the Gmail credential type, plus an extract of Step 2 of `Standard\Smtp\Synchup_smtp.sql` (template 40019 only). The full Synchup_smtp.sql was NOT run: it starts with USE [BIZFIRSTATLASDB] (a different DB) and DELETEs then re-inserts rows. Then the two idempotent normalisers ran (Forms display order: 61 rows normalised; DataTemplates names: 0 updated, it is guarded by old names).

## Per-node table

Profile column = type-13 templates whose profileName matches an Atlas_Forms PrimaryUsage minus node-form-: OK / MISSING (no profileName) / MISMATCH. Informational only, not fixed.

| Group/Node | ProcessElementType | Forms found/expected | Templates found/expected | Other tables | Profile status | Verdict |
|---|---|---|---|---|---|---|
| 00_DataTemplates/NodeCategoryTemplates/blockchain | (no PET script) | 0/0 | 1/1 | - | n/a | FULL |
| 00_DataTemplates/NodeCategoryTemplates/database | (no PET script) | 0/0 | 1/1 | - | n/a | FULL |
| 00_DataTemplates/NodeCategoryTemplates/error-handling | (no PET script) | 0/0 | 1/1 | - | n/a | FULL |
| 00_DataTemplates/NodeCategoryTemplates/file | (no PET script) | 0/0 | 1/1 | - | n/a | FULL |
| 00_DataTemplates/NodeCategoryTemplates/http | (no PET script) | 0/0 | 1/1 | - | n/a | FULL |
| 00_DataTemplates/NodeCategoryTemplates/infrastructure | (no PET script) | 0/0 | 1/1 | - | n/a | FULL |
| 00_DataTemplates/NodeCategoryTemplates/llm | (no PET script) | 0/0 | 1/1 | - | n/a | FULL |
| 00_DataTemplates/NodeCategoryTemplates/notification | (no PET script) | 0/0 | 1/1 | - | n/a | FULL |
| 00_DataTemplates/NodeCategoryTemplates/social | (no PET script) | 0/0 | 1/1 | - | n/a | FULL |
| 00_DataTemplates/NodeCategoryTemplates/tool | (no PET script) | 0/0 | 1/1 | - | n/a | FULL |
| 00_DataTemplates/NodeCategoryTemplates/transform | (no PET script) | 0/0 | 1/1 | - | n/a | FULL |
| 00_DataTemplates/NodeCategoryTemplates/trigger | (no PET script) | 0/0 | 1/1 | - | n/a | FULL |
| 00_DataTemplates/NodeCategoryTemplates/workflow | (no PET script) | 0/0 | 1/1 | - | n/a | FULL |
| 00_DataTemplates/NodeTemplates/tool | (no PET script) | 0/0 | 2/2 | - | OK 0 MISSING 1 | FULL |
| 00_DataTemplates/NodeTypeTemplates/ai-memory | (no PET script) | 0/0 | 1/1 | - | n/a | FULL |
| 00_DataTemplates/NodeTypeTemplates/blockchain | (no PET script) | 0/0 | 1/1 | - | n/a | FULL |
| 00_DataTemplates/NodeTypeTemplates/database | (no PET script) | 0/0 | 1/1 | - | n/a | FULL |
| 00_DataTemplates/NodeTypeTemplates/error-handling | (no PET script) | 0/0 | 1/1 | - | n/a | FULL |
| 00_DataTemplates/NodeTypeTemplates/file | (no PET script) | 0/0 | 1/1 | - | n/a | FULL |
| 00_DataTemplates/NodeTypeTemplates/http | (no PET script) | 0/0 | 1/1 | - | n/a | FULL |
| 00_DataTemplates/NodeTypeTemplates/infrastructure | (no PET script) | 0/0 | 1/1 | - | n/a | FULL |
| 00_DataTemplates/NodeTypeTemplates/llm | (no PET script) | 0/0 | 1/1 | - | n/a | FULL |
| 00_DataTemplates/NodeTypeTemplates/notification | (no PET script) | 0/0 | 1/1 | - | n/a | FULL |
| 00_DataTemplates/NodeTypeTemplates/tool | (no PET script) | 0/0 | 1/1 | - | n/a | FULL |
| 00_DataTemplates/NodeTypeTemplates/transform | (no PET script) | 0/0 | 1/1 | - | n/a | FULL |
| 00_DataTemplates/NodeTypeTemplates/trigger | (no PET script) | 0/0 | 1/1 | - | n/a | FULL |
| 00_DataTemplates/NodeTypeTemplates/workflow | (no PET script) | 0/0 | 1/1 | - | n/a | FULL |
| Ai/AI-Agent | ai-agent OK | 8/8 | 2/2 | - | OK 0 MISMATCH 2 | FULL |
| Ai/AI-Function | ai-function OK | 19/19 | 1/1 | - | OK 0 MISSING 1 | FULL |
| Ai/AI-Memory | (no PET script) | 0/0 | 1/1 | - | OK 0 MISMATCH 1 | FULL |
| Ai/Ai-Llm | (no PET script) | 0/0 | 1/1 | - | OK 0 MISMATCH 1 | FULL |
| Ai/Ai-ToolServer | (no PET script) | 5/5 | 1/1 | - | OK 0 MISMATCH 1 | FULL |
| Ai/AiRag | (no PET script) | 0/0 | 0/0 | AIExt_Credentials:1 OK | n/a | FULL |
| Ai/Flow/FlowRag | flow-rag OK | 3/3 | 3/3 | - | OK 3 | FULL |
| Blockchain/Binance | binance OK | 11/11 | 11/11 | - | OK 11 | FULL |
| Blockchain/Bitcoin | bitcoin OK | 34/34 | 34/34 | - | OK 34 | FULL |
| Blockchain/Centrifuge | centrifuge OK | 6/6 | 6/6 | - | OK 6 | FULL |
| Blockchain/Chainlink | chainlink OK | 11/11 | 11/11 | - | OK 11 | FULL |
| Blockchain/Coinbase | coinbase-advanced-trade OK, coinbase-server-wallet OK | 40/40 | 40/40 | - | OK 40 | FULL |
| Blockchain/DataProof | dataproof OK | 9/9 | 9/9 | - | OK 3 MISMATCH 6 | FULL [FIXED 2026-09-20] |
| Blockchain/Ethereum | ethereum OK | 64/64 | 64/64 | - | OK 64 | FULL |
| Blockchain/HashiCorp | hashicorp OK | 18/18 | 18/18 | - | OK 18 | FULL |
| Blockchain/Hedera | hedera OK | 8/8 | 0/0 | - | n/a | FULL |
| Blockchain/IPFS | ipfs OK | 61/61 | 61/61 | - | OK 61 | FULL |
| Blockchain/Ondo | ondo OK | 0/0 | 0/0 | - | n/a | FULL |
| Blockchain/Safe | safe OK | 19/19 | 19/19 | - | OK 19 | FULL [FIXED 2026-09-20] |
| Blockchain/Solana | solana OK | 17/17 | 17/17 | - | OK 17 | FULL |
| Blockchain/Wormhole | wormhole OK | 85/85 | 85/85 | - | OK 85 | FULL |
| Cloud/AzureBlob | azure-blob OK | 20/20 | 20/20 | - | OK 10 MISMATCH 10 | FULL |
| Core | (no PET script) | 1/1 | 1/1 | - | OK 0 MISSING 1 | FULL |
| Core/Core/Data/CollectionOperation | collection-operation OK | 1/1 | 1/1 | - | OK 0 MISSING 1 | FULL |
| Core/Core/Data/DataMapping | data-mapping OK | 1/1 | 2/2 | - | OK 0 MISSING 2 | FULL |
| Core/Core/Data/Filter | filter OK | 0/0 | 1/1 | - | OK 0 MISSING 1 | FULL |
| Core/Core/Data/JsonTransform | json-transform OK | 2/2 | 1/1 | - | OK 0 MISSING 1 | FULL |
| Core/Core/Data/MemoryRetrieve | memory-retrieve OK | 0/0 | 1/1 | - | n/a | FULL |
| Core/Core/Data/MemoryStore | memory-store OK | 0/0 | 1/1 | - | n/a | FULL |
| Core/Core/Data/Merge | merge OK | 0/0 | 1/1 | - | OK 0 MISSING 1 | FULL |
| Core/Core/Data/ObjectMapper | object-mapper OK | 0/0 | 1/1 | - | OK 0 MISSING 1 | FULL |
| Core/Core/Data/SetData | set-data OK | 0/0 | 1/1 | - | OK 0 MISSING 1 | FULL |
| Core/Core/Data/VariableAssignment | variable-assignment OK | 1/1 | 1/1 | - | OK 0 MISSING 1 | FULL |
| Core/Core/Flow/CatchBlock | catch-block OK | 1/1 | 1/1 | - | OK 0 MISSING 1 | FULL |
| Core/Core/Flow/Delay | delay OK | 1/1 | 1/1 | - | OK 0 MISSING 1 | FULL |
| Core/Core/Flow/EventWait | event-wait OK | 1/1 | 1/1 | - | OK 0 MISSING 1 | FULL |
| Core/Core/Flow/FinallyBlock | finally-block OK | 1/1 | 1/1 | - | OK 0 MISSING 1 | FULL |
| Core/Core/Flow/Loop | loop OK | 1/1 | 1/1 | - | OK 0 MISSING 1 | FULL |
| Core/Core/Flow/ParallelFork | parallel-fork OK | 1/1 | 1/1 | - | OK 0 MISSING 1 | FULL |
| Core/Core/Flow/ParallelJoin | parallel-join OK | 1/1 | 1/1 | - | OK 0 MISSING 1 | FULL |
| Core/Core/Flow/SubWorkflow | sub-workflow OK | 1/1 | 1/1 | - | OK 0 MISSING 1 | FULL |
| Core/Core/Flow/TryBlock | try-block OK | 1/1 | 1/1 | - | OK 0 MISSING 1 | FULL |
| Core/Core/Human/Approval | (no PET script) | 6/6 | 0/0 | - | n/a | FULL |
| Core/Core/Human/Chat | (no PET script) | 3/3 | 1/1 | - | n/a | FULL |
| Core/Core/Human/ChatReceive | (no PET script) | 0/0 | 1/1 | - | n/a | FULL |
| Core/Core/Logic/Break | break OK | 1/1 | 1/1 | - | OK 0 MISSING 1 | FULL |
| Core/Core/Logic/Continue | continue OK | 1/1 | 1/1 | - | OK 0 MISSING 1 | FULL |
| Core/Core/Logic/IfCondition | if-condition OK | 1/1 | 1/1 | - | OK 0 MISSING 1 | FULL |
| Core/Core/Logic/StopWorkflow | workflow-control OK | 0/0 | 0/0 | - | n/a | FULL |
| Core/Core/Logic/Switch | switch OK | 1/1 | 1/1 | - | OK 0 MISSING 1 | FULL |
| Core/Core/Script/CodeExecute | code-execute OK | 1/1 | 2/2 | - | OK 0 MISSING 1 | FULL |
| Core/Core/Script/Function | function OK | 1/1 | 1/1 | - | n/a | FULL |
| Core/Core/Trigger/ChatTrigger | (no PET script) | 0/0 | 1/1 | - | n/a | FULL |
| Core/Core/Trigger/FormTrigger | form-trigger OK | 1/1 | 1/1 | - | OK 0 MISSING 1 | FULL |
| Core/Core/Trigger/ManualTrigger | (no PET script) | 1/1 | 2/2 | - | OK 0 MISSING 1 | FULL |
| Core/Core/Trigger/ScheduledTrigger | schedule-trigger OK | 1/1 | 1/1 | - | OK 0 MISSING 1 | FULL |
| Core/Core/Trigger/WebhookTrigger | (no PET script) | 1/1 | 2/2 | - | OK 0 MISSING 1 | FULL |
| Core/HIL | approval OK, chat OK, chat-receive OK, chat-trigger OK, form OK, hil OK, hil-form OK | 7/7 | 10/10 | - | OK 0 MISSING 5 | FULL |
| Core/Satellite | satellite OK | 2/2 | 2/2 | - | OK 0 MISMATCH 2 | FULL |
| DB/ElasticSearch | elasticsearch OK | 11/11 | 11/11 | - | OK 11 | FULL |
| Distributed/Kafka | kafka OK | 34/34 | 34/34 | - | OK 34 | FULL |
| Distributed/Redis | redis OK | 103/103 | 103/103 | - | OK 0 MISSING 103 | FULL |
| Enterprise/Salesforce | salesforce OK | 29/29 | 30/30 | - | OK 16 MISMATCH 13 | FULL |
| FlowAiAgent/FlowAiAgent | flow-ai-agent OK | 6/6 | 1/1 | - | OK 0 MISSING 1 | FULL |
| IaaS/Deploy | deploy OK | 4/4 | 3/3 | - | OK 3 | FULL |
| IaaS/Docker | docker OK | 30/30 | 30/30 | - | OK 30 | FULL |
| IaaS/DockerCompose | docker-compose OK | 15/15 | 14/14 | - | OK 14 | FULL |
| IaaS/Kubernetes | kubernetes OK | 60/60 | 60/60 | - | OK 60 | FULL |
| IaaS/Ssh | ssh OK | 9/9 | 8/8 | - | OK 8 | FULL |
| Mail/MailGun | mailgun OK | 69/69 | 69/69 | - | OK 69 | FULL |
| MySql | mysql OK | 37/37 | 3/3 | - | OK 1 MISSING 1 | FULL |
| Ondo | (no PET script) | 20/20 | 20/20 | - | OK 1 MISMATCH 19 | FULL |
| PostgreSQL | postgresql OK | 39/39 | 38/38 | - | OK 38 | FULL [FIXED 2026-09-20] |
| Productivity/GSheets | google-sheets OK | 12/12 | 13/13 | - | OK 11 | FULL |
| Productivity/GoogleCalendar | google-calendar OK | 1/1 | 15/15 | - | OK 0 MISMATCH 15 | FULL |
| Productivity/GoogleDocs | google-docs OK | 1/1 | 10/10 | - | OK 0 MISMATCH 10 | FULL |
| Productivity/GoogleDrive | google-drive OK | 1/1 | 20/20 | - | OK 0 MISMATCH 20 | FULL |
| Productivity/Jira | jira OK | 23/23 | 24/24 | - | OK 11 MISMATCH 12 | FULL |
| Productivity/MicrosoftExcel | microsoft-excel OK | 1/1 | 23/23 | - | OK 0 MISMATCH 23 | FULL |
| Productivity/MicrosoftPowerPoint | microsoft-powerpoint OK | 1/1 | 12/12 | - | OK 0 MISMATCH 12 | FULL |
| Productivity/MicrosoftWord | microsoft-word OK | 1/1 | 14/14 | - | OK 0 MISMATCH 14 | FULL |
| Productivity/MongoDB | mongodb OK | 11/11 | 12/12 | - | OK 5 MISMATCH 6 | FULL |
| Productivity/Notion | notion OK | 16/16 | 17/17 | - | OK 10 MISMATCH 6 | FULL |
| Productivity/S3 | aws-s3 OK | 14/14 | 14/14 | - | OK 14 | FULL |
| Providers/Cloudflare | cloudflare OK | 22/22 | 23/23 | - | OK 22 | FULL |
| RealEstate/Odoo | odoo OK | 35/35 | 35/35 | - | OK 35 | FULL |
| ScrapeApi/Apify | apify OK, apify-trigger OK | 12/12 | 12/12 | - | OK 12 | FULL |
| ScrapeApi/Browserless | browserless OK | 9/9 | 9/9 | - | OK 8 | FULL |
| Social/Discord | discord OK | 0/0 | 2/2 | - | OK 0 MISSING 1 | FULL |
| Social/Facebook | facebook OK | 15/15 | 15/15 | - | OK 14 | FULL |
| Social/GitHub | (no PET script) | 1/1 | 0/0 | - | n/a | FULL |
| Social/Instagram | instagram OK | 22/22 | 19/19 | - | OK 18 | FULL |
| Social/Slack | slack OK | 42/42 | 43/43 | - | OK 42 | FULL |
| Social/TikTok | tiktok OK | 13/13 | 14/14 | - | OK 13 | FULL |
| Social/WhatsApp | whatsapp OK | 79/79 | 1/1 | - | n/a | FULL |
| SqlServer | sqlserver OK | 38/38 | 37/37 | - | OK 37 | PRESENT-WITH-NOTES (Form 18532 exists under different FormID 25001 (FormCode)) |
| Standard/Gmail | email-gmail OK, email-gmail-trigger OK | 27/27 | 27/27 | AIExt_CredentialTypes:GOOGLE_OAUTH2 OK | OK 27 | FULL [FIXED 2026-09-20] |
| Standard/HttpRequest | http-request OK | 1/1 | 1/1 | - | OK 0 MISMATCH 1 | FULL |
| Standard/Ses | email-ses OK | 13/13 | 13/13 | - | OK 5 MISMATCH 8 | FULL |
| Standard/Smtp | email-smtp OK | 1/1 | 2/2 | - | OK 0 MISMATCH 1 | FULL [FIXED 2026-09-20] |
| Standard/Standard | email-gmail OK, email-gmail-trigger OK, email-imap-trigger OK, manual-trigger OK, rest-api-auth OK, rest-get OK, rest-post OK, sms-message OK, standard OK, twilio OK, webhook-post OK, webhook-trigger OK, web-search-tool OK | 0/0 | 2/2 | - | OK 0 MISSING 1 | FULL |

## Missing items after run

None.

## Notes and open items

- SqlServer: script Form 18532 exists in the DB under FormID 25001 (matched by FormCode; the script is guarded by FormCode). Not re-inserted.
- Ai/AiRag AIExt_Credentials 11 script contains an encrypted secret and AiRag is deprecated; row 11 is already present in the DB. Not run.
- DataProof new type-13 template names (for example "Compute Document Hash") do not carry the node type; the names normaliser only rewrites known old names, and names were not updated by hand.
- 24 non-deleted node-form forms still have DisplayOrder >= 500 (pre-existing, outside this run).
- Profile flags (informational): 142 PROFILE-MISSING, 183 PROFILE-MISMATCH type-13 templates. Largest: Distributed/Redis (103 missing); Productivity Google/Microsoft, Ondo, Salesforce (mismatch).

## C# executors with NO ProcessElementType script (21 candidate gaps of 114 NodeTypeName declarations)

Detected by grepping NodeTypeName / NodeType / ProcessElementTypeCode string constants under Ai\ExecutionNodes (excluding tests). "Code in DB" = a Process_ProcessElementTypes row with that Code exists. Some may be registered by other means (unverified).

| Code | Executor file | Code in DB |
|---|---|---|
| audio | Ai/Audio/BizFirst.Ai.ExecutionNodes.Ai.Audio/Main/Executor/AudioNodeExecutor.cs | no |
| environment-variables | Config/EnvironmentVariables/BizFirst.Ai.ExecutionNodes.EnvironmentVariables/Main/Executor/EnvironmentVariablesNodeExecutor.cs | no |
| sample-transform | Core/BizFirst.Ai.ExecutionNodes.Core/Nodes/Flow/SampleTransformNode/SampleTransformNodeExecutor.cs | no |
| chatgpt | Core/BizFirst.Ai.ExecutionNodes.Core/Nodes/Human/Chat/Vendors/ChatGpt/Executor/ChatGptNodeExecutor.cs | no |
| claude | Core/BizFirst.Ai.ExecutionNodes.Core/Nodes/Human/Chat/Vendors/Claude/Executor/ClaudeNodeExecutor.cs | no |
| gemini | Core/BizFirst.Ai.ExecutionNodes.Core/Nodes/Human/Chat/Vendors/Gemini/Executor/GeminiNodeExecutor.cs | no |
| huggingface | Core/BizFirst.Ai.ExecutionNodes.Core/Nodes/Human/Chat/Vendors/HuggingFace/Executor/HuggingFaceNodeExecutor.cs | no |
| llama | Core/BizFirst.Ai.ExecutionNodes.Core/Nodes/Human/Chat/Vendors/Llama/Executor/LlamaNodeExecutor.Config.cs | no |
| llama | Core/BizFirst.Ai.ExecutionNodes.Core/Nodes/Human/Chat/Vendors/Llama/Executor/LlamaNodeExecutor.cs | no |
| stop | Core/BizFirst.Ai.ExecutionNodes.Core/Nodes/Logic/StopWorkflow/Executor/StopWorkflowNodeExecutor.cs | no |
| validation | Core/BizFirst.Ai.ExecutionNodes.Core/Nodes/Logic/Validation/Executor/ValidationNodeExecutor.cs | no |
| scheduled-trigger | Core/BizFirst.Ai.ExecutionNodes.Core/Nodes/Trigger/ScheduledTrigger/Executor/ScheduledTriggerNodeExecutor.cs | no |
| spreadsheet-file | Documents/SpreadsheetFile/BizFirst.Ai.ExecutionNodes.SpreadsheetFile/Main/Executor/SpreadsheetFileNodeExecutor.cs | no |
| stripe-payment-webhook | Gateways/BizFirst.Ai.ExecutionNodes.Stripe.Services/Executor/StripePaymentNodeExecutor.Main.cs | no |
| google-calendar-trigger | Providers/Google/Calendar/BizFirst.Ai.ExecutionNodes.GoogleCalendar/Main/Trigger/GoogleCalendarTriggerNodeExecutor.cs | no |
| google-drive-trigger | Providers/Google/Drive/BizFirst.Ai.ExecutionNodes.GoogleDrive/Main/Trigger/GoogleDriveTriggerNodeExecutor.cs | no |
| rag-document-add | Providers/RAGdoc/BizFirst.Ai.ExecutionNodes.Providers.RAGdoc/Nodes/AddRagDoc/AddRagDocExecutor.cs | no |
| rag-document-delete | Providers/RAGdoc/BizFirst.Ai.ExecutionNodes.Providers.RAGdoc/Nodes/DeleteRagDoc/DeleteRagDocExecutor.cs | no |
| rag-document-update | Providers/RAGdoc/BizFirst.Ai.ExecutionNodes.Providers.RAGdoc/Nodes/UpdateRagDoc/UpdateRagDocExecutor.cs | no |
| apollo | Sales/Apollo/BizFirst.Ai.ExecutionNodes.Apollo/Executor/ApolloNodeExecutor.cs | no |
| github-webhook | Social/GitHub/BizFirst.Social.ExecutionNodes.GitHub.Services/Executor/GitHubWebhookNodeExecutor.Main.cs | no |

## Palette / cache reminder

The API caches type-13 templates for about 10 minutes. After DB inserts, recycle the IIS app pool (not done by this run) and hard refresh Flow Studio (Ctrl+F5) before new palette entries appear.

## Method

Scratch scripts parse every INSERT ... VALUES/SELECT in the node scripts, key rows (FormID or FormCode, DataTemplateID, Code) and compare with dumps from the live DB (ISJSON, JSON_VALUE for profileName). They live in the session scratchpad; the procedure is summarised in the lessons README.