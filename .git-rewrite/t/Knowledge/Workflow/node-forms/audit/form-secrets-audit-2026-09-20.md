# Node Config Form Secrets Audit - 2026-09-20

Status: READ-ONLY review for Binoy. No form script, code or database row was changed. Secret values are never printed (first 4 chars + `***` at most).

Company rule under test: passwords, API keys, tokens, private keys, mnemonics/seed phrases and certificates reach a node ONLY through a credential (credentialID picker); a form must never hold the secret itself.

## 1. Method and scope

- Source of truth: every `.sql` under `C:/BizFirstGO_FI_AI/BizFirstFiDB/BizFirstFiV3DB/BizFirstFiV3DB/dbo/Data/projects` (excluding folders named obsolete/backup/unapproved/unsorted). JSON form schemas are pulled out of the T-SQL `N'...'` literals (`''` undoubled), parsed with `JSON.parse`, then walked recursively; a field is any object with id/name/key + type (controls[] style) or any entry of a `properties` map (JSON-schema style). Non-input widgets (heading, divider, group, ...) are ignored.
- Classification is name/label/placeholder/help/type/default based (regex rules in the appendix script). Numeric/boolean/select controls whose NAME looks sensitive are downgraded to REVIEW (section 7), not counted as findings.
- Live DB cross-check (read-only SELECTs via sqlcmd on `data-ocean-platform-prod`): `Atlas_Forms` (1455 non-deleted forms), `Process_ProcessElementTypes.ConfigurationSchema` (115 rows), `Template_DataTemplates.ContentData` (1447 rows), `AIExt_CredentialTypes`.
- Forms in the DB but with NO script are also scanned from their live schema and flagged `db-only` (they are included in all counts below).

| Metric | Value |
|---|---|
| .sql files under projects root (all) | 2832 |
| Excluded (obsolete/backup/unapproved/unsorted) - not scanned | 90 (obsolete 60, unsorted 12, backup 10, unapproved 8) |
| In-scope .sql files | 2742 |
|   - DataTemplate/palette scripts (covered via DB ContentData, section 6.3) | 1297 |
|   - scripts that touch Atlas_Forms (scanned) | 1335 |
|   - other scripts (no Atlas_Forms) | 110 |
| JSON literals parsed cleanly | 2572 |
| Scripts using parse-fallback (regex) | 17 |
| Scripts where no fields were found (patch/sync scripts) | 80 |
| Distinct forms analysed (script FormIDs + DB-only) | 1487 |
| Fields / properties inspected | 7186 |
| Compliant credential-picker fields | 99 |
| Forms in DB (non-deleted) | 1455 |
| DB forms with no script (db-only) | 163 |
| Script FormIDs not found in DB | 21 |
| ConfigurationSchema rows scanned | 115 |
| Palette template ContentData rows scanned | 1447 |


Parse-fallback scripts (first 40): `PostgreSQL/Forms/Atlas_Forms_PostgreSQL_NodeForms.data.sql`, `Productivity/Notion/Forms/Atlas_Forms_32030_notion_database_get.data.sql`, `Productivity/Notion/Forms/Atlas_Forms_32031_notion_database_getmany.data.sql`, `Productivity/Notion/Forms/Atlas_Forms_32032_notion_database_search.data.sql`, `Productivity/Notion/Forms/Atlas_Forms_32033_notion_database_query.data.sql`, `Productivity/Notion/Forms/Atlas_Forms_32034_notion_database_createpage.data.sql`, `Productivity/Notion/Forms/Atlas_Forms_32035_notion_page_create.data.sql`, `Productivity/Notion/Forms/Atlas_Forms_32036_notion_page_get.data.sql`, `Productivity/Notion/Forms/Atlas_Forms_32037_notion_page_update.data.sql`, `Productivity/Notion/Forms/Atlas_Forms_32038_notion_page_archive.data.sql`, `Productivity/Notion/Forms/Atlas_Forms_32039_notion_block_getchildren.data.sql`, `Productivity/Notion/Forms/Atlas_Forms_32040_notion_block_appendchildren.data.sql`, `Productivity/Notion/Forms/Atlas_Forms_32041_notion_user_get.data.sql`, `Productivity/Notion/Forms/Atlas_Forms_32042_notion_user_getmany.data.sql`, `Productivity/Notion/Forms/Atlas_Forms_32043_notion_trigger_pageadded.data.sql`, `Productivity/Notion/Forms/Atlas_Forms_32044_notion_trigger_pageupdated.data.sql`, `Productivity/Notion/Forms/Atlas_Forms_32045_notion_trigger_webhook.data.sql`


Excluded folders (file counts): `Ai/AI-Function/obsolete (24)`, `Ai/AI-Function/unsorted (5)`, `Ai/Ai-Llm/obsolete (2)`, `Ai/Flow/FlowRag/obsolete (7)`, `Core/approval/backup (7)`, `Core/chat-node/backup (3)`, `Core/Core/Human/Approval/unapproved (5)`, `Core/Core/Human/Chat/unapproved (3)`, `Core/Core/Script/CodeExecute/Forms/obsolete (1)`, `Core/Core/Trigger/FormTrigger/DataTemplates/obsolete (1)`, `Core/Core/Trigger/FormTrigger/Forms/obsolete (1)`, `Core/Core/Trigger/ScheduledTrigger/DataTemplates/obsolete (2)`, `Core/Core/Trigger/ScheduledTrigger/Forms/obsolete (1)`, `Core/HIL/obsolete (2)`, `Core/HIL/unsorted (1)`, `Gateways/Stripe/unsorted (2)`, `IaaS/Docker/obsolete (1)`, `Social/Facebook/obsolete (14)`, `Social/Slack/unsorted (1)`, `Standard/HttpRequest/obsolete (4)`, `Standard/HttpRequest/unsorted (3)`

## 2. Summary counts

| Severity | Findings (field hits) | Distinct forms affected |
|---|---|---|
| CRITICAL | 328 | 290 |
| HIGH | 326 | 309 |
| MEDIUM | 560 | 362 |
| REVIEW / AMBIGUOUS (need decision, section 7) | 7 |  |


By category:

| Severity / category | Count |
|---|---|
| CRITICAL / api-key | 62 |
| CRITICAL / authorization-header | 1 |
| CRITICAL / certificate-key-material | 15 |
| CRITICAL / connection-string | 12 |
| CRITICAL / cookie-session | 1 |
| CRITICAL / password | 2 |
| CRITICAL / password-control | 295 |
| CRITICAL / pin | 1 |
| CRITICAL / private-key | 15 |
| CRITICAL / secret | 31 |
| CRITICAL / token | 225 |
| HIGH / access-key-id | 13 |
| HIGH / connection-string | 104 |
| HIGH / custom-body | 4 |
| HIGH / env-map | 6 |
| HIGH / headers | 9 |
| HIGH / key-file-path | 29 |
| HIGH / secret-key-reference | 130 |
| HIGH / username-with-password | 31 |
| MEDIUM / auth-disabled | 2 |
| MEDIUM / auth-none-option | 61 |
| MEDIUM / code-exec | 27 |
| MEDIUM / cors | 5 |
| MEDIUM / debug-log | 1 |
| MEDIUM / expression | 7 |
| MEDIUM / file-path | 88 |
| MEDIUM / iam-broad | 3 |
| MEDIUM / public-access | 5 |
| MEDIUM / raw-query | 52 |
| MEDIUM / redirects | 4 |
| MEDIUM / secret-reference | 8 |
| MEDIUM / ssrf-url-host | 286 |
| MEDIUM / tls-bypass | 11 |


By node group:

| Group | CRITICAL | HIGH | MEDIUM |
|---|---|---|---|
| Social | 176 | 12 | 21 |
| Productivity | 64 | 3 | 59 |
| IaaS | 32 | 51 | 93 |
| Standard | 14 | 17 | 12 |
| DB | 10 | 10 | 22 |
| ScrapeApi | 10 | 4 | 20 |
| Blockchain | 8 | 0 | 168 |
| (db-only) | 4 | 42 | 37 |
| Mail | 4 | 2 | 34 |
| Ai | 2 | 2 | 14 |
| FlowAiAgent | 2 | 1 | 3 |
| Core | 2 | 0 | 8 |
| Distributed | 0 | 104 | 0 |
| SqlServer | 0 | 39 | 8 |
| MySql | 0 | 36 | 8 |
| PostgreSQL | 0 | 3 | 3 |
| Cloud | 0 | 0 | 2 |
| RealEstate | 0 | 0 | 48 |


## 3. Findings

### 3.1 CRITICAL and HIGH (every field listed)

Sorted by severity then node. `Src`: script = found in a repo script (also in DB unless noted in section 1), db-only = form has no script.

| Severity | Group/Node | FormID | FormCode | Field ID | Label | Control type | Reason | Suggested fix | Src |
|---|---|---|---|---|---|---|---|---|---|
| CRITICAL | (db-only)/node-capability-webhook-editor | 12003 | NODECAP_WEBHOOK_PROPERTIES | secret | Secret | password | control type/format is password/secret/masked (password); collects a secret value (client secret / secret key / signing secret) | remove field; require credentialID picker / remove; use credential type API_KEY | db-only |
| CRITICAL | (db-only)/node-form-http-request | 11059 | NODETYPE_HTTP_REQUEST | bearer_token | Bearer Token | password | control type/format is password/secret/masked (password); collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type BEARER_TOKEN | db-only |
| CRITICAL | (db-only)/node-form-slack-message | 25000 | SLACK_ROOT | botToken | Bot Token | password | control type/format is password/secret/masked (password); collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type BEARER_TOKEN | db-only |
| CRITICAL | (db-only)/node-form-stripe-payment-webhook | 11032 | NODETYPE_STRIPE_PAYMENT_WEBHOOK | webhookSecret | Webhook Secret | password | control type/format is password/secret/masked (password); collects a secret value (client secret / secret key / signing secret) | remove field; require credentialID picker / remove; use credential type SIGNING_SECRET (proposed) | db-only |
| CRITICAL | Ai/AI-Function | 21015 | AI_FUNCTION_DATA_SQL_DRIVER_SELECT | connectionString | Connection String | text | connection string whose placeholder/help/default embeds credentials (Password=/user:pass@) | remove; use credential type CONNECTION_STRING (proposed) or BASIC_AUTH | script |
| CRITICAL | Ai/AI-Function | 21019 | AI_FUNCTION_DATA_HTTP_REQUEST | authorization | Authorization | text | authorization header value supplied on form | remove; use credential type BEARER_TOKEN / API_KEY | script |
| CRITICAL | Blockchain/Centrifuge | 20400 | MONGODB_DOCUMENT_INSERT | connectionUri | Connection URI | password | control type/format is password/secret/masked (password); connection string whose placeholder/help/default embeds credentials (Password=/user:pass@) | remove field; require credentialID picker / remove; use credential type CONNECTION_STRING (proposed) or BASIC_AUTH | script |
| CRITICAL | Blockchain/Centrifuge | 20401 | MONGODB_DOCUMENT_FIND | connectionUri | Connection URI | password | control type/format is password/secret/masked (password); connection string whose placeholder/help/default embeds credentials (Password=/user:pass@) | remove field; require credentialID picker / remove; use credential type CONNECTION_STRING (proposed) or BASIC_AUTH | script |
| CRITICAL | Blockchain/Centrifuge | 20402 | MONGODB_DOCUMENT_FINDONEANDUPDATE | connectionUri | Connection URI | password | control type/format is password/secret/masked (password); connection string whose placeholder/help/default embeds credentials (Password=/user:pass@) | remove field; require credentialID picker / remove; use credential type CONNECTION_STRING (proposed) or BASIC_AUTH | script |
| CRITICAL | Blockchain/Centrifuge | 20403 | MONGODB_DOCUMENT_FINDONEANREPLACE | connectionUri | Connection URI | password | control type/format is password/secret/masked (password); connection string whose placeholder/help/default embeds credentials (Password=/user:pass@) | remove field; require credentialID picker / remove; use credential type CONNECTION_STRING (proposed) or BASIC_AUTH | script |
| CRITICAL | Blockchain/Centrifuge | 20404 | MONGODB_DOCUMENT_UPDATE | connectionUri | Connection URI | password | control type/format is password/secret/masked (password); connection string whose placeholder/help/default embeds credentials (Password=/user:pass@) | remove field; require credentialID picker / remove; use credential type CONNECTION_STRING (proposed) or BASIC_AUTH | script |
| CRITICAL | Blockchain/Centrifuge | 20405 | MONGODB_DOCUMENT_DELETE | connectionUri | Connection URI | password | control type/format is password/secret/masked (password); connection string whose placeholder/help/default embeds credentials (Password=/user:pass@) | remove field; require credentialID picker / remove; use credential type CONNECTION_STRING (proposed) or BASIC_AUTH | script |
| CRITICAL | Blockchain/HashiCorp | 10000431 | HASHICORP_SECRETS_WRITE | secretData | Secret Data (JSON object) | code-editor | collects a secret value (client secret / secret key / signing secret) | remove; use credential type API_KEY | script |
| CRITICAL | Blockchain/IPFS | 10000382 | IPFS_PIN_REMOTE_SERVICE_ADD | remoteServiceApiKey | Remote Service API Key | text | collects an API/access/signing/license key value | remove field; use credential type API_KEY | script |
| CRITICAL | Core/Core/Trigger/WebhookTrigger | 11028 | NODETYPE_WEBHOOK_TRIGGER | webhookSecret | Webhook Secret | password | control type/format is password/secret/masked (password); collects a secret value (client secret / secret key / signing secret) | remove field; require credentialID picker / remove; use credential type SIGNING_SECRET (proposed) | script |
| CRITICAL | Core/Core/Trigger/WebhookTrigger | ? |  | webhookSecret | Webhook Secret | password | control type/format is password/secret/masked (password); collects a secret value (client secret / secret key / signing secret) | remove field; require credentialID picker / remove; use credential type SIGNING_SECRET (proposed) | script |
| CRITICAL | DB/ElasticSearch | 20300 | ELASTICSEARCH_INDEX_CREATE | password | Password | password | control type/format is password/secret/masked (password); collects a password/passphrase value | remove field; require credentialID picker / remove field; use credential type BASIC_AUTH (username+password) | script |
| CRITICAL | DB/ElasticSearch | 20301 | ELASTICSEARCH_INDEX_GET | password | Password | password | control type/format is password/secret/masked (password); collects a password/passphrase value | remove field; require credentialID picker / remove field; use credential type BASIC_AUTH (username+password) | script |
| CRITICAL | DB/ElasticSearch | 20302 | ELASTICSEARCH_INDEX_GETMANY | password | Password | password | control type/format is password/secret/masked (password); collects a password/passphrase value | remove field; require credentialID picker / remove field; use credential type BASIC_AUTH (username+password) | script |
| CRITICAL | DB/ElasticSearch | 20303 | ELASTICSEARCH_INDEX_DELETE | password | Password | password | control type/format is password/secret/masked (password); collects a password/passphrase value | remove field; require credentialID picker / remove field; use credential type BASIC_AUTH (username+password) | script |
| CRITICAL | DB/ElasticSearch | 20304 | ELASTICSEARCH_DOCUMENT_CREATE | password | Password | password | control type/format is password/secret/masked (password); collects a password/passphrase value | remove field; require credentialID picker / remove field; use credential type BASIC_AUTH (username+password) | script |
| CRITICAL | DB/ElasticSearch | 20305 | ELASTICSEARCH_DOCUMENT_GET | password | Password | password | control type/format is password/secret/masked (password); collects a password/passphrase value | remove field; require credentialID picker / remove field; use credential type BASIC_AUTH (username+password) | script |
| CRITICAL | DB/ElasticSearch | 20306 | ELASTICSEARCH_DOCUMENT_GETMANY | password | Password | password | control type/format is password/secret/masked (password); collects a password/passphrase value | remove field; require credentialID picker / remove field; use credential type BASIC_AUTH (username+password) | script |
| CRITICAL | DB/ElasticSearch | 20307 | ELASTICSEARCH_DOCUMENT_SEARCH | password | Password | password | control type/format is password/secret/masked (password); collects a password/passphrase value | remove field; require credentialID picker / remove field; use credential type BASIC_AUTH (username+password) | script |
| CRITICAL | DB/ElasticSearch | 20308 | ELASTICSEARCH_DOCUMENT_UPDATE | password | Password | password | control type/format is password/secret/masked (password); collects a password/passphrase value | remove field; require credentialID picker / remove field; use credential type BASIC_AUTH (username+password) | script |
| CRITICAL | DB/ElasticSearch | 20309 | ELASTICSEARCH_DOCUMENT_DELETE | password | Password | password | control type/format is password/secret/masked (password); collects a password/passphrase value | remove field; require credentialID picker / remove field; use credential type BASIC_AUTH (username+password) | script |
| CRITICAL | FlowAiAgent/FlowAiAgent | 10000851 | FLOW_AI_AGENT_LOOP_MEMORY | sessionId | Session ID | text | cookie / session value | remove; use credential type SESSION_COOKIE (proposed) | script |
| CRITICAL | FlowAiAgent/FlowAiAgent | 10000852 | FLOW_AI_AGENT_SQL_ADVANCED | sqlConnectionString | Connection String | password | control type/format is password/secret/masked (password) | remove field; require credentialID picker | script |
| CRITICAL | IaaS/Deploy | 40203 | DEPLOY | password | Password / Passphrase | password | control type/format is password/secret/masked (password); collects a password/passphrase value | remove field; require credentialID picker / remove field; use credential type BASIC_AUTH (username+password) | script |
| CRITICAL | IaaS/Deploy | 40203 | DEPLOY | privateKeyPem | Private Key (PEM) | code-editor | collects a private key; collects certificate / PEM / PFX / service-account key material | remove field; use credential type PRIVATE_KEY (proposed) / remove; use credential type CERTIFICATE | script |
| CRITICAL | IaaS/Deploy | 40385 | DEPLOY | password | Password / Passphrase | password | control type/format is password/secret/masked (password); collects a password/passphrase value | remove field; require credentialID picker / remove field; use credential type BASIC_AUTH (username+password) | script |
| CRITICAL | IaaS/Deploy | 40385 | DEPLOY | privateKeyPem | Private Key (PEM) | code-editor | collects a private key; collects certificate / PEM / PFX / service-account key material | remove field; use credential type PRIVATE_KEY (proposed) / remove; use credential type CERTIFICATE | script |
| CRITICAL | IaaS/Deploy | 40386 | DEPLOY | password | Password / Passphrase | password | control type/format is password/secret/masked (password); collects a password/passphrase value | remove field; require credentialID picker / remove field; use credential type BASIC_AUTH (username+password) | script |
| CRITICAL | IaaS/Deploy | 40386 | DEPLOY | privateKeyPem | Private Key (PEM) | code-editor | collects a private key; collects certificate / PEM / PFX / service-account key material | remove field; use credential type PRIVATE_KEY (proposed) / remove; use credential type CERTIFICATE | script |
| CRITICAL | IaaS/Deploy | 40387 | DEPLOY | password | Password / Passphrase | password | control type/format is password/secret/masked (password); collects a password/passphrase value | remove field; require credentialID picker / remove field; use credential type BASIC_AUTH (username+password) | script |
| CRITICAL | IaaS/Deploy | 40387 | DEPLOY | privateKeyPem | Private Key (PEM) | code-editor | collects a private key; collects certificate / PEM / PFX / service-account key material | remove field; use credential type PRIVATE_KEY (proposed) / remove; use credential type CERTIFICATE | script |
| CRITICAL | IaaS/Docker | 34013 | DOCKER_IMAGE_PULL | registryPassword | Registry Password | password | control type/format is password/secret/masked (password); collects a password/passphrase value | remove field; require credentialID picker / remove field; use credential type BASIC_AUTH (username+password) | script |
| CRITICAL | IaaS/Docker | 40201 | DOCKER | registryPassword | Registry Password | password | control type/format is password/secret/masked (password); collects a password/passphrase value | remove field; require credentialID picker / remove field; use credential type BASIC_AUTH (username+password) | script |
| CRITICAL | IaaS/DockerCompose | 40200 | DOCKER-COMPOSE | privateKeyPem | Private Key (PEM) | code-editor | collects a private key; collects certificate / PEM / PFX / service-account key material | remove field; use credential type PRIVATE_KEY (proposed) / remove; use credential type CERTIFICATE | script |
| CRITICAL | IaaS/DockerCompose | 40200 | DOCKER-COMPOSE | serverPassword | Password / Passphrase | password | control type/format is password/secret/masked (password); collects a password/passphrase value | remove field; require credentialID picker / remove field; use credential type BASIC_AUTH (username+password) | script |
| CRITICAL | IaaS/DockerCompose | 40358 | DOCKER-COMPOSE | privateKeyPem | Private Key (PEM) | code-editor | collects a private key; collects certificate / PEM / PFX / service-account key material | remove field; use credential type PRIVATE_KEY (proposed) / remove; use credential type CERTIFICATE | script |
| CRITICAL | IaaS/DockerCompose | 40358 | DOCKER-COMPOSE | serverPassword | Password / Passphrase | password | control type/format is password/secret/masked (password); collects a password/passphrase value | remove field; require credentialID picker / remove field; use credential type BASIC_AUTH (username+password) | script |
| CRITICAL | IaaS/Ssh | 40202 | SSH | password | Password / Passphrase | password | control type/format is password/secret/masked (password); collects a password/passphrase value | remove field; require credentialID picker / remove field; use credential type BASIC_AUTH (username+password) | script |
| CRITICAL | IaaS/Ssh | 40202 | SSH | privateKeyPem | Private Key (PEM) | code-editor | collects a private key; collects certificate / PEM / PFX / service-account key material | remove field; use credential type PRIVATE_KEY (proposed) / remove; use credential type CERTIFICATE | script |
| CRITICAL | IaaS/Ssh | 40370 | SSH | password | Password / Passphrase | password | control type/format is password/secret/masked (password); collects a password/passphrase value | remove field; require credentialID picker / remove field; use credential type BASIC_AUTH (username+password) | script |
| CRITICAL | IaaS/Ssh | 40370 | SSH | privateKeyPem | Private Key (PEM) | code-editor | collects a private key; collects certificate / PEM / PFX / service-account key material | remove field; use credential type PRIVATE_KEY (proposed) / remove; use credential type CERTIFICATE | script |
| CRITICAL | IaaS/Ssh | 40371 | SSH | password | Password / Passphrase | password | control type/format is password/secret/masked (password); collects a password/passphrase value | remove field; require credentialID picker / remove field; use credential type BASIC_AUTH (username+password) | script |
| CRITICAL | IaaS/Ssh | 40371 | SSH | privateKeyPem | Private Key (PEM) | code-editor | collects a private key; collects certificate / PEM / PFX / service-account key material | remove field; use credential type PRIVATE_KEY (proposed) / remove; use credential type CERTIFICATE | script |
| CRITICAL | IaaS/Ssh | 40372 | SSH | password | Password / Passphrase | password | control type/format is password/secret/masked (password); collects a password/passphrase value | remove field; require credentialID picker / remove field; use credential type BASIC_AUTH (username+password) | script |
| CRITICAL | IaaS/Ssh | 40372 | SSH | privateKeyPem | Private Key (PEM) | code-editor | collects a private key; collects certificate / PEM / PFX / service-account key material | remove field; use credential type PRIVATE_KEY (proposed) / remove; use credential type CERTIFICATE | script |
| CRITICAL | IaaS/Ssh | 40373 | SSH | password | Password / Passphrase | password | control type/format is password/secret/masked (password); collects a password/passphrase value | remove field; require credentialID picker / remove field; use credential type BASIC_AUTH (username+password) | script |
| CRITICAL | IaaS/Ssh | 40373 | SSH | privateKeyPem | Private Key (PEM) | code-editor | collects a private key; collects certificate / PEM / PFX / service-account key material | remove field; use credential type PRIVATE_KEY (proposed) / remove; use credential type CERTIFICATE | script |
| CRITICAL | IaaS/Ssh | 40374 | SSH | password | Password / Passphrase | password | control type/format is password/secret/masked (password); collects a password/passphrase value | remove field; require credentialID picker / remove field; use credential type BASIC_AUTH (username+password) | script |
| CRITICAL | IaaS/Ssh | 40374 | SSH | privateKeyPem | Private Key (PEM) | code-editor | collects a private key; collects certificate / PEM / PFX / service-account key material | remove field; use credential type PRIVATE_KEY (proposed) / remove; use credential type CERTIFICATE | script |
| CRITICAL | IaaS/Ssh | 40375 | SSH | password | Password / Passphrase | password | control type/format is password/secret/masked (password); collects a password/passphrase value | remove field; require credentialID picker / remove field; use credential type BASIC_AUTH (username+password) | script |
| CRITICAL | IaaS/Ssh | 40375 | SSH | privateKeyPem | Private Key (PEM) | code-editor | collects a private key; collects certificate / PEM / PFX / service-account key material | remove field; use credential type PRIVATE_KEY (proposed) / remove; use credential type CERTIFICATE | script |
| CRITICAL | IaaS/Ssh | 40376 | SSH | password | Password / Passphrase | password | control type/format is password/secret/masked (password); collects a password/passphrase value | remove field; require credentialID picker / remove field; use credential type BASIC_AUTH (username+password) | script |
| CRITICAL | IaaS/Ssh | 40376 | SSH | privateKeyPem | Private Key (PEM) | code-editor | collects a private key; collects certificate / PEM / PFX / service-account key material | remove field; use credential type PRIVATE_KEY (proposed) / remove; use credential type CERTIFICATE | script |
| CRITICAL | IaaS/Ssh | 40377 | SSH | password | Password / Passphrase | password | control type/format is password/secret/masked (password); collects a password/passphrase value | remove field; require credentialID picker / remove field; use credential type BASIC_AUTH (username+password) | script |
| CRITICAL | IaaS/Ssh | 40377 | SSH | privateKeyPem | Private Key (PEM) | code-editor | collects a private key; collects certificate / PEM / PFX / service-account key material | remove field; use credential type PRIVATE_KEY (proposed) / remove; use credential type CERTIFICATE | script |
| CRITICAL | Mail/MailGun | 24000 | MAILGUN_MESSAGE_SEND | smtpPassword | SMTP Password | password | control type/format is password/secret/masked (password); collects a password/passphrase value | remove field; require credentialID picker / remove field; use credential type BASIC_AUTH (username+password) | script |
| CRITICAL | Mail/MailGun | 24002 | MAILGUN_MESSAGE_VALIDATE_EMAIL | smtpPassword | SMTP Password | password | control type/format is password/secret/masked (password); collects a password/passphrase value | remove field; require credentialID picker / remove field; use credential type BASIC_AUTH (username+password) | script |
| CRITICAL | Mail/MailGun | 24005 | MAILGUN_DOMAIN_CREATE | smtpPassword | SMTP Password | password | control type/format is password/secret/masked (password); collects a password/passphrase value | remove field; require credentialID picker / remove field; use credential type BASIC_AUTH (username+password) | script |
| CRITICAL | Mail/MailGun | 24006 | MAILGUN_DOMAIN_UPDATE | smtpPassword | SMTP Password | password | control type/format is password/secret/masked (password); collects a password/passphrase value | remove field; require credentialID picker / remove field; use credential type BASIC_AUTH (username+password) | script |
| CRITICAL | Productivity/GSheets | 23079 | GOOGLE_SHEETS | appSecretVaultKey | App Secret Vault Key | text | collects a secret value (client secret / secret key / signing secret) | remove; use credential type API_KEY | script |
| CRITICAL | Productivity/Jira | 30001 | JIRA_ISSUE_CREATE | apiToken | API Token | password | control type/format is password/secret/masked (password); collects an API/access/signing/license key value; collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type API_KEY / remove field; use credential type BEARER_TOKEN | script |
| CRITICAL | Productivity/Jira | 30002 | JIRA_ISSUE_GET | apiToken | API Token | password | control type/format is password/secret/masked (password); collects an API/access/signing/license key value; collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type API_KEY / remove field; use credential type BEARER_TOKEN | script |
| CRITICAL | Productivity/Jira | 30003 | JIRA_ISSUE_GETALL | apiToken | API Token | password | control type/format is password/secret/masked (password); collects an API/access/signing/license key value; collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type API_KEY / remove field; use credential type BEARER_TOKEN | script |
| CRITICAL | Productivity/Jira | 30004 | JIRA_ISSUE_UPDATE | apiToken | API Token | password | control type/format is password/secret/masked (password); collects an API/access/signing/license key value; collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type API_KEY / remove field; use credential type BEARER_TOKEN | script |
| CRITICAL | Productivity/Jira | 30005 | JIRA_ISSUE_DELETE | apiToken | API Token | password | control type/format is password/secret/masked (password); collects an API/access/signing/license key value; collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type API_KEY / remove field; use credential type BEARER_TOKEN | script |
| CRITICAL | Productivity/Jira | 30006 | JIRA_ISSUE_GETTRANSITIONS | apiToken | API Token | password | control type/format is password/secret/masked (password); collects an API/access/signing/license key value; collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type API_KEY / remove field; use credential type BEARER_TOKEN | script |
| CRITICAL | Productivity/Jira | 30007 | JIRA_ISSUE_EXECUTETRANSITION | apiToken | API Token | password | control type/format is password/secret/masked (password); collects an API/access/signing/license key value; collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type API_KEY / remove field; use credential type BEARER_TOKEN | script |
| CRITICAL | Productivity/Jira | 30008 | JIRA_ISSUE_GETCHANGELOG | apiToken | API Token | password | control type/format is password/secret/masked (password); collects an API/access/signing/license key value; collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type API_KEY / remove field; use credential type BEARER_TOKEN | script |
| CRITICAL | Productivity/Jira | 30009 | JIRA_ISSUE_NOTIFY | apiToken | API Token | password | control type/format is password/secret/masked (password); collects an API/access/signing/license key value; collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type API_KEY / remove field; use credential type BEARER_TOKEN | script |
| CRITICAL | Productivity/Jira | 30010 | JIRA_COMMENT_ADD | apiToken | API Token | password | control type/format is password/secret/masked (password); collects an API/access/signing/license key value; collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type API_KEY / remove field; use credential type BEARER_TOKEN | script |
| CRITICAL | Productivity/Jira | 30011 | JIRA_COMMENT_GET | apiToken | API Token | password | control type/format is password/secret/masked (password); collects an API/access/signing/license key value; collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type API_KEY / remove field; use credential type BEARER_TOKEN | script |
| CRITICAL | Productivity/Jira | 30012 | JIRA_COMMENT_GETALL | apiToken | API Token | password | control type/format is password/secret/masked (password); collects an API/access/signing/license key value; collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type API_KEY / remove field; use credential type BEARER_TOKEN | script |
| CRITICAL | Productivity/Jira | 30013 | JIRA_COMMENT_UPDATE | apiToken | API Token | password | control type/format is password/secret/masked (password); collects an API/access/signing/license key value; collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type API_KEY / remove field; use credential type BEARER_TOKEN | script |
| CRITICAL | Productivity/Jira | 30014 | JIRA_COMMENT_REMOVE | apiToken | API Token | password | control type/format is password/secret/masked (password); collects an API/access/signing/license key value; collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type API_KEY / remove field; use credential type BEARER_TOKEN | script |
| CRITICAL | Productivity/Jira | 30015 | JIRA_ATTACHMENT_ADD | apiToken | API Token | password | control type/format is password/secret/masked (password); collects an API/access/signing/license key value; collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type API_KEY / remove field; use credential type BEARER_TOKEN | script |
| CRITICAL | Productivity/Jira | 30016 | JIRA_ATTACHMENT_GET | apiToken | API Token | password | control type/format is password/secret/masked (password); collects an API/access/signing/license key value; collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type API_KEY / remove field; use credential type BEARER_TOKEN | script |
| CRITICAL | Productivity/Jira | 30017 | JIRA_ATTACHMENT_GETALL | apiToken | API Token | password | control type/format is password/secret/masked (password); collects an API/access/signing/license key value; collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type API_KEY / remove field; use credential type BEARER_TOKEN | script |
| CRITICAL | Productivity/Jira | 30018 | JIRA_ATTACHMENT_REMOVE | apiToken | API Token | password | control type/format is password/secret/masked (password); collects an API/access/signing/license key value; collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type API_KEY / remove field; use credential type BEARER_TOKEN | script |
| CRITICAL | Productivity/Jira | 30019 | JIRA_PROJECT_GET | apiToken | API Token | password | control type/format is password/secret/masked (password); collects an API/access/signing/license key value; collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type API_KEY / remove field; use credential type BEARER_TOKEN | script |
| CRITICAL | Productivity/Jira | 30020 | JIRA_PROJECT_LIST | apiToken | API Token | password | control type/format is password/secret/masked (password); collects an API/access/signing/license key value; collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type API_KEY / remove field; use credential type BEARER_TOKEN | script |
| CRITICAL | Productivity/Jira | 30021 | JIRA_USER_CREATE | apiToken | API Token | password | control type/format is password/secret/masked (password); collects an API/access/signing/license key value; collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type API_KEY / remove field; use credential type BEARER_TOKEN | script |
| CRITICAL | Productivity/Jira | 30022 | JIRA_USER_GET | apiToken | API Token | password | control type/format is password/secret/masked (password); collects an API/access/signing/license key value; collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type API_KEY / remove field; use credential type BEARER_TOKEN | script |
| CRITICAL | Productivity/Jira | 30023 | JIRA_USER_DELETE | apiToken | API Token | password | control type/format is password/secret/masked (password); collects an API/access/signing/license key value; collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type API_KEY / remove field; use credential type BEARER_TOKEN | script |
| CRITICAL | Productivity/MicrosoftPowerPoint | 40410 | MICROSOFT_POWERPOINT | linkPassword | Link Password | text | collects a password/passphrase value | remove field; use credential type BASIC_AUTH (username+password) | script |
| CRITICAL | Productivity/MicrosoftWord | 40290 | MICROSOFT_WORD | linkPassword | Link Password | text | collects a password/passphrase value | remove field; use credential type BASIC_AUTH (username+password) | script |
| CRITICAL | Productivity/MongoDB | 20406 | MONGODB_DOCUMENT_AGGREGATE | connectionUri | Connection URI | password | control type/format is password/secret/masked (password); connection string whose placeholder/help/default embeds credentials (Password=/user:pass@) | remove field; require credentialID picker / remove; use credential type CONNECTION_STRING (proposed) or BASIC_AUTH | script |
| CRITICAL | Productivity/MongoDB | 20407 | MONGODB_SEARCHINDEX_LIST | connectionUri | Connection URI | password | control type/format is password/secret/masked (password); connection string whose placeholder/help/default embeds credentials (Password=/user:pass@) | remove field; require credentialID picker / remove; use credential type CONNECTION_STRING (proposed) or BASIC_AUTH | script |
| CRITICAL | Productivity/MongoDB | 20408 | MONGODB_SEARCHINDEX_CREATE | connectionUri | Connection URI | password | control type/format is password/secret/masked (password); connection string whose placeholder/help/default embeds credentials (Password=/user:pass@) | remove field; require credentialID picker / remove; use credential type CONNECTION_STRING (proposed) or BASIC_AUTH | script |
| CRITICAL | Productivity/MongoDB | 20409 | MONGODB_SEARCHINDEX_UPDATE | connectionUri | Connection URI | password | control type/format is password/secret/masked (password); connection string whose placeholder/help/default embeds credentials (Password=/user:pass@) | remove field; require credentialID picker / remove; use credential type CONNECTION_STRING (proposed) or BASIC_AUTH | script |
| CRITICAL | Productivity/MongoDB | 20410 | MONGODB_SEARCHINDEX_DROP | connectionUri | Connection URI | password | control type/format is password/secret/masked (password); connection string whose placeholder/help/default embeds credentials (Password=/user:pass@) | remove field; require credentialID picker / remove; use credential type CONNECTION_STRING (proposed) or BASIC_AUTH | script |
| CRITICAL | Productivity/Notion | 32030 | NOTION_DATABASE_GET | accessToken | Access Token | password [,] | control type/format is password/secret/masked (password ,); collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type OAUTH2 or BEARER_TOKEN | script |
| CRITICAL | Productivity/Notion | 32030 | NOTION_DATABASE_GET | apiToken | API Token | password [,] | control type/format is password/secret/masked (password ,); collects an API/access/signing/license key value; collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type API_KEY / remove field; use credential type BEARER_TOKEN | script |
| CRITICAL | Productivity/Notion | 32031 | NOTION_DATABASE_GETMANY | accessToken | Access Token | password [,] | control type/format is password/secret/masked (password ,); collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type OAUTH2 or BEARER_TOKEN | script |
| CRITICAL | Productivity/Notion | 32031 | NOTION_DATABASE_GETMANY | apiToken | API Token | password [,] | control type/format is password/secret/masked (password ,); collects an API/access/signing/license key value; collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type API_KEY / remove field; use credential type BEARER_TOKEN | script |
| CRITICAL | Productivity/Notion | 32032 | NOTION_DATABASE_SEARCH | accessToken | Access Token | password [,] | control type/format is password/secret/masked (password ,); collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type OAUTH2 or BEARER_TOKEN | script |
| CRITICAL | Productivity/Notion | 32032 | NOTION_DATABASE_SEARCH | apiToken | API Token | password [,] | control type/format is password/secret/masked (password ,); collects an API/access/signing/license key value; collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type API_KEY / remove field; use credential type BEARER_TOKEN | script |
| CRITICAL | Productivity/Notion | 32033 | NOTION_DATABASE_QUERY | accessToken | Access Token | password [,] | control type/format is password/secret/masked (password ,); collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type OAUTH2 or BEARER_TOKEN | script |
| CRITICAL | Productivity/Notion | 32033 | NOTION_DATABASE_QUERY | apiToken | API Token | password [,] | control type/format is password/secret/masked (password ,); collects an API/access/signing/license key value; collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type API_KEY / remove field; use credential type BEARER_TOKEN | script |
| CRITICAL | Productivity/Notion | 32034 | NOTION_DATABASE_CREATEPAGE | accessToken | Access Token | password [,] | control type/format is password/secret/masked (password ,); collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type OAUTH2 or BEARER_TOKEN | script |
| CRITICAL | Productivity/Notion | 32034 | NOTION_DATABASE_CREATEPAGE | apiToken | API Token | password [,] | control type/format is password/secret/masked (password ,); collects an API/access/signing/license key value; collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type API_KEY / remove field; use credential type BEARER_TOKEN | script |
| CRITICAL | Productivity/Notion | 32035 | NOTION_PAGE_CREATE | accessToken | Access Token | password [,] | control type/format is password/secret/masked (password ,); collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type OAUTH2 or BEARER_TOKEN | script |
| CRITICAL | Productivity/Notion | 32035 | NOTION_PAGE_CREATE | apiToken | API Token | password [,] | control type/format is password/secret/masked (password ,); collects an API/access/signing/license key value; collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type API_KEY / remove field; use credential type BEARER_TOKEN | script |
| CRITICAL | Productivity/Notion | 32036 | NOTION_PAGE_GET | accessToken | Access Token | password [,] | control type/format is password/secret/masked (password ,); collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type OAUTH2 or BEARER_TOKEN | script |
| CRITICAL | Productivity/Notion | 32036 | NOTION_PAGE_GET | apiToken | API Token | password [,] | control type/format is password/secret/masked (password ,); collects an API/access/signing/license key value; collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type API_KEY / remove field; use credential type BEARER_TOKEN | script |
| CRITICAL | Productivity/Notion | 32037 | NOTION_PAGE_UPDATE | accessToken | Access Token | password [,] | control type/format is password/secret/masked (password ,); collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type OAUTH2 or BEARER_TOKEN | script |
| CRITICAL | Productivity/Notion | 32037 | NOTION_PAGE_UPDATE | apiToken | API Token | password [,] | control type/format is password/secret/masked (password ,); collects an API/access/signing/license key value; collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type API_KEY / remove field; use credential type BEARER_TOKEN | script |
| CRITICAL | Productivity/Notion | 32038 | NOTION_PAGE_ARCHIVE | accessToken | Access Token | password [,] | control type/format is password/secret/masked (password ,); collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type OAUTH2 or BEARER_TOKEN | script |
| CRITICAL | Productivity/Notion | 32038 | NOTION_PAGE_ARCHIVE | apiToken | API Token | password [,] | control type/format is password/secret/masked (password ,); collects an API/access/signing/license key value; collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type API_KEY / remove field; use credential type BEARER_TOKEN | script |
| CRITICAL | Productivity/Notion | 32039 | NOTION_BLOCK_GETCHILDREN | accessToken | Access Token | password [,] | control type/format is password/secret/masked (password ,); collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type OAUTH2 or BEARER_TOKEN | script |
| CRITICAL | Productivity/Notion | 32039 | NOTION_BLOCK_GETCHILDREN | apiToken | API Token | password [,] | control type/format is password/secret/masked (password ,); collects an API/access/signing/license key value; collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type API_KEY / remove field; use credential type BEARER_TOKEN | script |
| CRITICAL | Productivity/Notion | 32040 | NOTION_BLOCK_APPENDCHILDREN | accessToken | Access Token | password [,] | control type/format is password/secret/masked (password ,); collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type OAUTH2 or BEARER_TOKEN | script |
| CRITICAL | Productivity/Notion | 32040 | NOTION_BLOCK_APPENDCHILDREN | apiToken | API Token | password [,] | control type/format is password/secret/masked (password ,); collects an API/access/signing/license key value; collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type API_KEY / remove field; use credential type BEARER_TOKEN | script |
| CRITICAL | Productivity/Notion | 32041 | NOTION_USER_GET | accessToken | Access Token | password [,] | control type/format is password/secret/masked (password ,); collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type OAUTH2 or BEARER_TOKEN | script |
| CRITICAL | Productivity/Notion | 32041 | NOTION_USER_GET | apiToken | API Token | password [,] | control type/format is password/secret/masked (password ,); collects an API/access/signing/license key value; collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type API_KEY / remove field; use credential type BEARER_TOKEN | script |
| CRITICAL | Productivity/Notion | 32042 | NOTION_USER_GETMANY | accessToken | Access Token | password [,] | control type/format is password/secret/masked (password ,); collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type OAUTH2 or BEARER_TOKEN | script |
| CRITICAL | Productivity/Notion | 32042 | NOTION_USER_GETMANY | apiToken | API Token | password [,] | control type/format is password/secret/masked (password ,); collects an API/access/signing/license key value; collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type API_KEY / remove field; use credential type BEARER_TOKEN | script |
| CRITICAL | Productivity/Notion | 32043 | NOTION_TRIGGER_PAGEADDED | accessToken | Access Token | password [,] | control type/format is password/secret/masked (password ,); collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type OAUTH2 or BEARER_TOKEN | script |
| CRITICAL | Productivity/Notion | 32043 | NOTION_TRIGGER_PAGEADDED | apiToken | API Token | password [,] | control type/format is password/secret/masked (password ,); collects an API/access/signing/license key value; collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type API_KEY / remove field; use credential type BEARER_TOKEN | script |
| CRITICAL | Productivity/Notion | 32044 | NOTION_TRIGGER_PAGEUPDATED | accessToken | Access Token | password [,] | control type/format is password/secret/masked (password ,); collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type OAUTH2 or BEARER_TOKEN | script |
| CRITICAL | Productivity/Notion | 32044 | NOTION_TRIGGER_PAGEUPDATED | apiToken | API Token | password [,] | control type/format is password/secret/masked (password ,); collects an API/access/signing/license key value; collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type API_KEY / remove field; use credential type BEARER_TOKEN | script |
| CRITICAL | Productivity/Notion | 32045 | NOTION_TRIGGER_WEBHOOK | accessToken | Access Token | password [,] | control type/format is password/secret/masked (password ,); collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type OAUTH2 or BEARER_TOKEN | script |
| CRITICAL | Productivity/Notion | 32045 | NOTION_TRIGGER_WEBHOOK | apiToken | API Token | password [,] | control type/format is password/secret/masked (password ,); collects an API/access/signing/license key value; collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type API_KEY / remove field; use credential type BEARER_TOKEN | script |
| CRITICAL | Productivity/Notion | 32045 | NOTION_TRIGGER_WEBHOOK | authValue | Auth Value | password | control type/format is password/secret/masked (password) | remove field; require credentialID picker | db (script drift) |
| CRITICAL | ScrapeApi/Apify | 20211 | APIFY_TRIGGER | webhookSecret | Webhook Secret | password | control type/format is password/secret/masked (password); collects a secret value (client secret / secret key / signing secret) | remove field; require credentialID picker / remove; use credential type SIGNING_SECRET (proposed) | script |
| CRITICAL | ScrapeApi/Browserless | 20600 | BROWSERLESS | token | API Token | password | control type/format is password/secret/masked (password); collects an API/access/signing/license key value; collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type API_KEY / remove field; use credential type BEARER_TOKEN | script |
| CRITICAL | ScrapeApi/Browserless | 20601 | BROWSERLESS_PAGE_CONTENT | token | API Token | password | control type/format is password/secret/masked (password); collects an API/access/signing/license key value; collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type API_KEY / remove field; use credential type BEARER_TOKEN | script |
| CRITICAL | ScrapeApi/Browserless | 20602 | BROWSERLESS_PAGE_SCREENSHOT | token | API Token | password | control type/format is password/secret/masked (password); collects an API/access/signing/license key value; collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type API_KEY / remove field; use credential type BEARER_TOKEN | script |
| CRITICAL | ScrapeApi/Browserless | 20603 | BROWSERLESS_PAGE_PDF | token | API Token | password | control type/format is password/secret/masked (password); collects an API/access/signing/license key value; collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type API_KEY / remove field; use credential type BEARER_TOKEN | script |
| CRITICAL | ScrapeApi/Browserless | 20604 | BROWSERLESS_PAGE_SCRAPE | token | API Token | password | control type/format is password/secret/masked (password); collects an API/access/signing/license key value; collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type API_KEY / remove field; use credential type BEARER_TOKEN | script |
| CRITICAL | ScrapeApi/Browserless | 20605 | BROWSERLESS_SCRIPT_EXECUTE | token | API Token | password | control type/format is password/secret/masked (password); collects an API/access/signing/license key value; collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type API_KEY / remove field; use credential type BEARER_TOKEN | script |
| CRITICAL | ScrapeApi/Browserless | 20606 | BROWSERLESS_PAGE_UNBLOCK | token | API Token | password | control type/format is password/secret/masked (password); collects an API/access/signing/license key value; collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type API_KEY / remove field; use credential type BEARER_TOKEN | script |
| CRITICAL | ScrapeApi/Browserless | 20607 | BROWSERLESS_SCRIPT_DOWNLOAD | token | API Token | password | control type/format is password/secret/masked (password); collects an API/access/signing/license key value; collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type API_KEY / remove field; use credential type BEARER_TOKEN | script |
| CRITICAL | ScrapeApi/Browserless | 20608 | BROWSERLESS_PAGE_PERFORMANCE | token | API Token | password | control type/format is password/secret/masked (password); collects an API/access/signing/license key value; collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type API_KEY / remove field; use credential type BEARER_TOKEN | script |
| CRITICAL | Social/Facebook | 32046 | FACEBOOK_PAGE_POST | pageAccessToken | Page Access Token | password | control type/format is password/secret/masked (password); collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type OAUTH2 or BEARER_TOKEN | script |
| CRITICAL | Social/Facebook | 32047 | FACEBOOK_PAGE_GETFEED | pageAccessToken | Page Access Token | password | control type/format is password/secret/masked (password); collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type OAUTH2 or BEARER_TOKEN | script |
| CRITICAL | Social/Facebook | 32048 | FACEBOOK_PAGE_GETINFO | pageAccessToken | Page Access Token | password | control type/format is password/secret/masked (password); collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type OAUTH2 or BEARER_TOKEN | script |
| CRITICAL | Social/Facebook | 32049 | FACEBOOK_PAGE_GETINSIGHTS | pageAccessToken | Page Access Token | password | control type/format is password/secret/masked (password); collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type OAUTH2 or BEARER_TOKEN | script |
| CRITICAL | Social/Facebook | 32050 | FACEBOOK_POST_COMMENT | pageAccessToken | Page Access Token | password | control type/format is password/secret/masked (password); collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type OAUTH2 or BEARER_TOKEN | script |
| CRITICAL | Social/Facebook | 32051 | FACEBOOK_POST_GETCOMMENTS | pageAccessToken | Page Access Token | password | control type/format is password/secret/masked (password); collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type OAUTH2 or BEARER_TOKEN | script |
| CRITICAL | Social/Facebook | 32052 | FACEBOOK_POST_UPDATE | pageAccessToken | Page Access Token | password | control type/format is password/secret/masked (password); collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type OAUTH2 or BEARER_TOKEN | script |
| CRITICAL | Social/Facebook | 32053 | FACEBOOK_MESSAGE_SEND | pageAccessToken | Page Access Token | password | control type/format is password/secret/masked (password); collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type OAUTH2 or BEARER_TOKEN | script |
| CRITICAL | Social/Facebook | 32054 | FACEBOOK_MESSAGE_GETCONVERSATIONS | pageAccessToken | Page Access Token | password | control type/format is password/secret/masked (password); collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type OAUTH2 or BEARER_TOKEN | script |
| CRITICAL | Social/Facebook | 32055 | FACEBOOK_REACTIONS_ADD | pageAccessToken | Page Access Token | password | control type/format is password/secret/masked (password); collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type OAUTH2 or BEARER_TOKEN | script |
| CRITICAL | Social/Facebook | 32056 | FACEBOOK_MODERATION_HIDECOMMENT | pageAccessToken | Page Access Token | password | control type/format is password/secret/masked (password); collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type OAUTH2 or BEARER_TOKEN | script |
| CRITICAL | Social/Facebook | 32057 | FACEBOOK_MODERATION_DELETECOMMENT | pageAccessToken | Page Access Token | password | control type/format is password/secret/masked (password); collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type OAUTH2 or BEARER_TOKEN | script |
| CRITICAL | Social/Facebook | 32058 | FACEBOOK_MEDIA_UPLOADIMAGE | pageAccessToken | Page Access Token | password | control type/format is password/secret/masked (password); collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type OAUTH2 or BEARER_TOKEN | script |
| CRITICAL | Social/Facebook | 32059 | FACEBOOK_MEDIA_UPLOADVIDEO | pageAccessToken | Page Access Token | password | control type/format is password/secret/masked (password); collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type OAUTH2 or BEARER_TOKEN | script |
| CRITICAL | Social/Facebook | 32073 | FACEBOOK_WEBHOOK_RECEIVE | appSecret | App Secret | password | control type/format is password/secret/masked (password); collects a secret value (client secret / secret key / signing secret) | remove field; require credentialID picker / remove; use credential type API_KEY | script |
| CRITICAL | Social/Instagram | 22001 | INSTAGRAM_IMAGE_PUBLISH | accessToken | Access Token | password | control type/format is password/secret/masked (password); collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type OAUTH2 or BEARER_TOKEN | script |
| CRITICAL | Social/Instagram | 22002 | INSTAGRAM_TRIGGER_RECEIVE_EVENT | appSecretVaultKey | App Secret Vault Key | text | collects a secret value (client secret / secret key / signing secret) | remove; use credential type API_KEY | script |
| CRITICAL | Social/Instagram | 22002 | INSTAGRAM_TRIGGER_RECEIVE_EVENT | verifyToken | Verify Token | password | control type/format is password/secret/masked (password) | remove field; require credentialID picker | script |
| CRITICAL | Social/Instagram | 22003 | INSTAGRAM_REELS_PUBLISH | accessToken | Access Token | password | control type/format is password/secret/masked (password); collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type OAUTH2 or BEARER_TOKEN | script |
| CRITICAL | Social/Instagram | 22004 | INSTAGRAM_STORIES_PUBLISH | accessToken | Access Token | password | control type/format is password/secret/masked (password); collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type OAUTH2 or BEARER_TOKEN | script |
| CRITICAL | Social/Instagram | 22005 | INSTAGRAM_CAROUSEL_PUBLISH | accessToken | Access Token | password | control type/format is password/secret/masked (password); collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type OAUTH2 or BEARER_TOKEN | script |
| CRITICAL | Social/Instagram | 22006 | INSTAGRAM_COMMENTS_LIST | accessToken | Access Token | password | control type/format is password/secret/masked (password); collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type OAUTH2 or BEARER_TOKEN | script |
| CRITICAL | Social/Instagram | 22007 | INSTAGRAM_COMMENTS_HIDE | accessToken | Access Token | password | control type/format is password/secret/masked (password); collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type OAUTH2 or BEARER_TOKEN | script |
| CRITICAL | Social/Instagram | 22008 | INSTAGRAM_COMMENTS_UNHIDE | accessToken | Access Token | password | control type/format is password/secret/masked (password); collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type OAUTH2 or BEARER_TOKEN | script |
| CRITICAL | Social/Instagram | 22009 | INSTAGRAM_COMMENTS_DELETE | accessToken | Access Token | password | control type/format is password/secret/masked (password); collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type OAUTH2 or BEARER_TOKEN | script |
| CRITICAL | Social/Instagram | 22010 | INSTAGRAM_COMMENTS_DISABLE | accessToken | Access Token | password | control type/format is password/secret/masked (password); collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type OAUTH2 or BEARER_TOKEN | script |
| CRITICAL | Social/Instagram | 22011 | INSTAGRAM_COMMENTS_ENABLE | accessToken | Access Token | password | control type/format is password/secret/masked (password); collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type OAUTH2 or BEARER_TOKEN | script |
| CRITICAL | Social/Instagram | 22012 | INSTAGRAM_COMMENTS_SEND_PRIVATE_REPLY | accessToken | Access Token | password | control type/format is password/secret/masked (password); collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type OAUTH2 or BEARER_TOKEN | script |
| CRITICAL | Social/Instagram | 22013 | INSTAGRAM_USER_GET | accessToken | Access Token | password | control type/format is password/secret/masked (password); collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type OAUTH2 or BEARER_TOKEN | script |
| CRITICAL | Social/Instagram | 22014 | INSTAGRAM_USER_GET_MEDIA | accessToken | Access Token | password | control type/format is password/secret/masked (password); collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type OAUTH2 or BEARER_TOKEN | script |
| CRITICAL | Social/Instagram | 22015 | INSTAGRAM_HASHTAG_SEARCH | accessToken | Access Token | password | control type/format is password/secret/masked (password); collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type OAUTH2 or BEARER_TOKEN | script |
| CRITICAL | Social/Instagram | 22016 | INSTAGRAM_HASHTAG_GET_RECENT_MEDIA | accessToken | Access Token | password | control type/format is password/secret/masked (password); collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type OAUTH2 or BEARER_TOKEN | script |
| CRITICAL | Social/Instagram | 22017 | INSTAGRAM_HASHTAG_GET_TOP_MEDIA | accessToken | Access Token | password | control type/format is password/secret/masked (password); collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type OAUTH2 or BEARER_TOKEN | script |
| CRITICAL | Social/Instagram | 22018 | INSTAGRAM_MESSAGING_SEND | accessToken | Access Token | password | control type/format is password/secret/masked (password); collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type OAUTH2 or BEARER_TOKEN | script |
| CRITICAL | Social/Instagram | 22019 | INSTAGRAM_PAGE_GET_INSTAGRAM_ACCOUNT | accessToken | Access Token | password | control type/format is password/secret/masked (password); collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type OAUTH2 or BEARER_TOKEN | script |
| CRITICAL | Social/Instagram | ? |  | appSecretVaultKey | App Secret Vault Key | text | collects a secret value (client secret / secret key / signing secret) | remove; use credential type API_KEY | script |
| CRITICAL | Social/Instagram | 22020 | INSTAGRAM_AUTH_EXCHANGE_TOKEN | clientSecretVaultKey | Client Secret Vault Key | text | collects a secret value (client secret / secret key / signing secret) | remove; use credential type OAUTH2 | script |
| CRITICAL | Social/Instagram | 22020 | INSTAGRAM_AUTH_EXCHANGE_TOKEN | shortLivedToken | Short-Lived Token | password | control type/format is password/secret/masked (password) | remove field; require credentialID picker | script |
| CRITICAL | Social/Instagram | 22021 | INSTAGRAM_AUTH_REFRESH_TOKEN | longLivedToken | Long-Lived Token | password | control type/format is password/secret/masked (password) | remove field; require credentialID picker | script |
| CRITICAL | Social/Instagram | 22022 | INSTAGRAM_AUTH_GET_ME | accessToken | Access Token | password | control type/format is password/secret/masked (password); collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type OAUTH2 or BEARER_TOKEN | script |
| CRITICAL | Social/Instagram | ? |  | verifyToken | Verify Token | password | control type/format is password/secret/masked (password) | remove field; require credentialID picker | script |
| CRITICAL | Social/Slack | 35001 | SLACK_USERGROUP_UPDATE | botToken | Bot Token | password | control type/format is password/secret/masked (password); collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type BEARER_TOKEN | script |
| CRITICAL | Social/Slack | 35002 | SLACK_MESSAGE_SEND | botToken | Bot Token | password | control type/format is password/secret/masked (password); collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type BEARER_TOKEN | script |
| CRITICAL | Social/Slack | 35003 | SLACK_MESSAGE_SENDANDWAIT | botToken | Bot Token | password | control type/format is password/secret/masked (password); collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type BEARER_TOKEN | script |
| CRITICAL | Social/Slack | 35004 | SLACK_MESSAGE_SENDEPHEMERAL | botToken | Bot Token | password | control type/format is password/secret/masked (password); collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type BEARER_TOKEN | script |
| CRITICAL | Social/Slack | 35005 | SLACK_MESSAGE_UPDATE | botToken | Bot Token | password | control type/format is password/secret/masked (password); collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type BEARER_TOKEN | script |
| CRITICAL | Social/Slack | 35006 | SLACK_MESSAGE_DELETE | botToken | Bot Token | password | control type/format is password/secret/masked (password); collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type BEARER_TOKEN | script |
| CRITICAL | Social/Slack | 35007 | SLACK_MESSAGE_GETPERMALINK | botToken | Bot Token | password | control type/format is password/secret/masked (password); collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type BEARER_TOKEN | script |
| CRITICAL | Social/Slack | 35008 | SLACK_MESSAGE_SEARCH | botToken | User Token | password | control type/format is password/secret/masked (password); collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type BEARER_TOKEN | script |
| CRITICAL | Social/Slack | 35009 | SLACK_CHANNEL_CREATE | botToken | Bot Token | password | control type/format is password/secret/masked (password); collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type BEARER_TOKEN | script |
| CRITICAL | Social/Slack | 35010 | SLACK_CHANNEL_GET | botToken | Bot Token | password | control type/format is password/secret/masked (password); collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type BEARER_TOKEN | script |
| CRITICAL | Social/Slack | 35011 | SLACK_CHANNEL_GETMANY | botToken | Bot Token | password | control type/format is password/secret/masked (password); collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type BEARER_TOKEN | script |
| CRITICAL | Social/Slack | 35012 | SLACK_CHANNEL_GETHISTORY | botToken | Bot Token | password | control type/format is password/secret/masked (password); collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type BEARER_TOKEN | script |
| CRITICAL | Social/Slack | 35013 | SLACK_CHANNEL_GETMEMBERS | botToken | Bot Token | password | control type/format is password/secret/masked (password); collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type BEARER_TOKEN | script |
| CRITICAL | Social/Slack | 35014 | SLACK_CHANNEL_GETREPLIES | botToken | Bot Token | password | control type/format is password/secret/masked (password); collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type BEARER_TOKEN | script |
| CRITICAL | Social/Slack | 35015 | SLACK_CHANNEL_INVITE | botToken | Bot Token | password | control type/format is password/secret/masked (password); collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type BEARER_TOKEN | script |
| CRITICAL | Social/Slack | 35016 | SLACK_CHANNEL_JOIN | botToken | Bot Token | password | control type/format is password/secret/masked (password); collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type BEARER_TOKEN | script |
| CRITICAL | Social/Slack | 35017 | SLACK_CHANNEL_KICK | botToken | Bot Token | password | control type/format is password/secret/masked (password); collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type BEARER_TOKEN | script |
| CRITICAL | Social/Slack | 35018 | SLACK_CHANNEL_LEAVE | botToken | Bot Token | password | control type/format is password/secret/masked (password); collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type BEARER_TOKEN | script |
| CRITICAL | Social/Slack | 35019 | SLACK_CHANNEL_OPEN | botToken | Bot Token | password | control type/format is password/secret/masked (password); collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type BEARER_TOKEN | script |
| CRITICAL | Social/Slack | 35020 | SLACK_CHANNEL_RENAME | botToken | Bot Token | password | control type/format is password/secret/masked (password); collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type BEARER_TOKEN | script |
| CRITICAL | Social/Slack | 35021 | SLACK_CHANNEL_SETPURPOSE | botToken | Bot Token | password | control type/format is password/secret/masked (password); collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type BEARER_TOKEN | script |
| CRITICAL | Social/Slack | 35022 | SLACK_CHANNEL_SETTOPIC | botToken | Bot Token | password | control type/format is password/secret/masked (password); collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type BEARER_TOKEN | script |
| CRITICAL | Social/Slack | 35023 | SLACK_CHANNEL_ARCHIVE | botToken | Bot Token | password | control type/format is password/secret/masked (password); collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type BEARER_TOKEN | script |
| CRITICAL | Social/Slack | 35024 | SLACK_CHANNEL_UNARCHIVE | botToken | Bot Token | password | control type/format is password/secret/masked (password); collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type BEARER_TOKEN | script |
| CRITICAL | Social/Slack | 35025 | SLACK_CHANNEL_CLOSE | botToken | Bot Token | password | control type/format is password/secret/masked (password); collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type BEARER_TOKEN | script |
| CRITICAL | Social/Slack | 35026 | SLACK_FILE_UPLOAD | botToken | Bot Token | password | control type/format is password/secret/masked (password); collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type BEARER_TOKEN | script |
| CRITICAL | Social/Slack | 35027 | SLACK_FILE_GET | botToken | Bot Token | password | control type/format is password/secret/masked (password); collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type BEARER_TOKEN | script |
| CRITICAL | Social/Slack | 35028 | SLACK_FILE_GETMANY | botToken | Bot Token | password | control type/format is password/secret/masked (password); collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type BEARER_TOKEN | script |
| CRITICAL | Social/Slack | 35029 | SLACK_REACTION_ADD | botToken | Bot Token | password | control type/format is password/secret/masked (password); collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type BEARER_TOKEN | script |
| CRITICAL | Social/Slack | 35030 | SLACK_REACTION_GET | botToken | Bot Token | password | control type/format is password/secret/masked (password); collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type BEARER_TOKEN | script |
| CRITICAL | Social/Slack | 35031 | SLACK_REACTION_REMOVE | botToken | Bot Token | password | control type/format is password/secret/masked (password); collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type BEARER_TOKEN | script |
| CRITICAL | Social/Slack | 35032 | SLACK_USER_GET | botToken | Bot Token | password | control type/format is password/secret/masked (password); collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type BEARER_TOKEN | script |
| CRITICAL | Social/Slack | 35033 | SLACK_USER_GETMANY | botToken | Bot Token | password | control type/format is password/secret/masked (password); collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type BEARER_TOKEN | script |
| CRITICAL | Social/Slack | 35034 | SLACK_USER_GETPROFILE | botToken | Bot Token | password | control type/format is password/secret/masked (password); collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type BEARER_TOKEN | script |
| CRITICAL | Social/Slack | 35035 | SLACK_USER_GETSTATUS | botToken | Bot Token | password | control type/format is password/secret/masked (password); collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type BEARER_TOKEN | script |
| CRITICAL | Social/Slack | 35036 | SLACK_USER_UPDATEPROFILE | userToken | User Token | password | control type/format is password/secret/masked (password); collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type BEARER_TOKEN | script |
| CRITICAL | Social/Slack | 35037 | SLACK_USERGROUP_CREATE | botToken | Bot Token | password | control type/format is password/secret/masked (password); collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type BEARER_TOKEN | script |
| CRITICAL | Social/Slack | 35038 | SLACK_USERGROUP_DISABLE | botToken | Bot Token | password | control type/format is password/secret/masked (password); collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type BEARER_TOKEN | script |
| CRITICAL | Social/Slack | 35039 | SLACK_USERGROUP_ENABLE | botToken | Bot Token | password | control type/format is password/secret/masked (password); collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type BEARER_TOKEN | script |
| CRITICAL | Social/Slack | 35040 | SLACK_USERGROUP_GETMANY | botToken | Bot Token | password | control type/format is password/secret/masked (password); collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type BEARER_TOKEN | script |
| CRITICAL | Social/Slack | 35041 | SLACK_USERGROUP_GETUSERS | botToken | Bot Token | password | control type/format is password/secret/masked (password); collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type BEARER_TOKEN | script |
| CRITICAL | Social/Slack | 35042 | SLACK_USERGROUP_ADDUSERS | botToken | Bot Token | password | control type/format is password/secret/masked (password); collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type BEARER_TOKEN | script |
| CRITICAL | Social/TikTok | 32060 | TIKTOK_VIDEO_UPLOAD_INIT | accessToken | Access Token | password | control type/format is password/secret/masked (password); collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type OAUTH2 or BEARER_TOKEN | script |
| CRITICAL | Social/TikTok | 32061 | TIKTOK_VIDEO_UPLOAD_DIRECT | accessToken | Access Token | password | control type/format is password/secret/masked (password); collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type OAUTH2 or BEARER_TOKEN | script |
| CRITICAL | Social/TikTok | 32062 | TIKTOK_VIDEO_LIST | accessToken | Access Token | password | control type/format is password/secret/masked (password); collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type OAUTH2 or BEARER_TOKEN | script |
| CRITICAL | Social/TikTok | 32063 | TIKTOK_VIDEO_GET_STATUS | accessToken | Access Token | password | control type/format is password/secret/masked (password); collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type OAUTH2 or BEARER_TOKEN | script |
| CRITICAL | Social/TikTok | 32064 | TIKTOK_VIDEO_DELETE | accessToken | Access Token | password | control type/format is password/secret/masked (password); collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type OAUTH2 or BEARER_TOKEN | script |
| CRITICAL | Social/TikTok | 32065 | TIKTOK_USER_GET_INFO | accessToken | Access Token | password | control type/format is password/secret/masked (password); collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type OAUTH2 or BEARER_TOKEN | script |
| CRITICAL | Social/TikTok | 32066 | TIKTOK_USER_GET_VIDEOS | accessToken | Access Token | password | control type/format is password/secret/masked (password); collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type OAUTH2 or BEARER_TOKEN | script |
| CRITICAL | Social/TikTok | 32067 | TIKTOK_COMMENT_CREATE | accessToken | Access Token | password | control type/format is password/secret/masked (password); collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type OAUTH2 or BEARER_TOKEN | script |
| CRITICAL | Social/TikTok | 32068 | TIKTOK_COMMENT_DELETE | accessToken | Access Token | password | control type/format is password/secret/masked (password); collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type OAUTH2 or BEARER_TOKEN | script |
| CRITICAL | Social/TikTok | 32069 | TIKTOK_COMMENT_REPLY | accessToken | Access Token | password | control type/format is password/secret/masked (password); collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type OAUTH2 or BEARER_TOKEN | script |
| CRITICAL | Social/TikTok | 32070 | TIKTOK_ENGAGEMENT_LIKE | accessToken | Access Token | password | control type/format is password/secret/masked (password); collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type OAUTH2 or BEARER_TOKEN | script |
| CRITICAL | Social/TikTok | 32071 | TIKTOK_ENGAGEMENT_UNLIKE | accessToken | Access Token | password | control type/format is password/secret/masked (password); collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type OAUTH2 or BEARER_TOKEN | script |
| CRITICAL | Social/TikTok | 32072 | TIKTOK_ENGAGEMENT_SHARE | accessToken | Access Token | password | control type/format is password/secret/masked (password); collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type OAUTH2 or BEARER_TOKEN | script |
| CRITICAL | Social/WhatsApp | 23001 | WHATSAPP_MESSAGE_SEND_TEXT | accessToken | Access Token | password | control type/format is password/secret/masked (password); collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type OAUTH2 or BEARER_TOKEN | script |
| CRITICAL | Social/WhatsApp | 23002 | WHATSAPP_MESSAGE_SEND_IMAGE | accessToken | Access Token | password | control type/format is password/secret/masked (password); collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type OAUTH2 or BEARER_TOKEN | script |
| CRITICAL | Social/WhatsApp | 23003 | WHATSAPP_MESSAGE_SEND_VIDEO | accessToken | Access Token | password | control type/format is password/secret/masked (password); collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type OAUTH2 or BEARER_TOKEN | script |
| CRITICAL | Social/WhatsApp | 23004 | WHATSAPP_MESSAGE_SEND_AUDIO | accessToken | Access Token | password | control type/format is password/secret/masked (password); collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type OAUTH2 or BEARER_TOKEN | script |
| CRITICAL | Social/WhatsApp | 23005 | WHATSAPP_MESSAGE_SEND_DOCUMENT | accessToken | Access Token | password | control type/format is password/secret/masked (password); collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type OAUTH2 or BEARER_TOKEN | script |
| CRITICAL | Social/WhatsApp | 23006 | WHATSAPP_MESSAGE_SEND_STICKER | accessToken | Access Token | password | control type/format is password/secret/masked (password); collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type OAUTH2 or BEARER_TOKEN | script |
| CRITICAL | Social/WhatsApp | 23007 | WHATSAPP_MESSAGE_SEND_LOCATION | accessToken | Access Token | password | control type/format is password/secret/masked (password); collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type OAUTH2 or BEARER_TOKEN | script |
| CRITICAL | Social/WhatsApp | 23008 | WHATSAPP_MESSAGE_SEND_CONTACTS | accessToken | Access Token | password | control type/format is password/secret/masked (password); collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type OAUTH2 or BEARER_TOKEN | script |
| CRITICAL | Social/WhatsApp | 23009 | WHATSAPP_MESSAGE_SEND_INTERACTIVE_BUTTONS | accessToken | Access Token | password | control type/format is password/secret/masked (password); collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type OAUTH2 or BEARER_TOKEN | script |
| CRITICAL | Social/WhatsApp | 23010 | WHATSAPP_MESSAGE_SEND_INTERACTIVE_LIST | accessToken | Access Token | password | control type/format is password/secret/masked (password); collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type OAUTH2 or BEARER_TOKEN | script |
| CRITICAL | Social/WhatsApp | 23011 | WHATSAPP_MESSAGE_SEND_REACTION | accessToken | Access Token | password | control type/format is password/secret/masked (password); collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type OAUTH2 or BEARER_TOKEN | script |
| CRITICAL | Social/WhatsApp | 23012 | WHATSAPP_MESSAGE_SEND_TEMPLATE | accessToken | Access Token | password | control type/format is password/secret/masked (password); collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type OAUTH2 or BEARER_TOKEN | script |
| CRITICAL | Social/WhatsApp | 23013 | WHATSAPP_MESSAGE_SEND_AND_WAIT | accessToken | Access Token | password | control type/format is password/secret/masked (password); collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type OAUTH2 or BEARER_TOKEN | script |
| CRITICAL | Social/WhatsApp | 23014 | WHATSAPP_MESSAGE_MARK_AS_READ | accessToken | Access Token | password | control type/format is password/secret/masked (password); collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type OAUTH2 or BEARER_TOKEN | script |
| CRITICAL | Social/WhatsApp | 23015 | WHATSAPP_MESSAGE_SEND_TYPING_INDICATOR | accessToken | Access Token | password | control type/format is password/secret/masked (password); collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type OAUTH2 or BEARER_TOKEN | script |
| CRITICAL | Social/WhatsApp | 23016 | WHATSAPP_MEDIA_UPLOAD | accessToken | Access Token | password | control type/format is password/secret/masked (password); collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type OAUTH2 or BEARER_TOKEN | script |
| CRITICAL | Social/WhatsApp | 23017 | WHATSAPP_MEDIA_DOWNLOAD | accessToken | Access Token | password | control type/format is password/secret/masked (password); collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type OAUTH2 or BEARER_TOKEN | script |
| CRITICAL | Social/WhatsApp | 23018 | WHATSAPP_MEDIA_DELETE | accessToken | Access Token | password | control type/format is password/secret/masked (password); collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type OAUTH2 or BEARER_TOKEN | script |
| CRITICAL | Social/WhatsApp | 23019 | WHATSAPP_MEDIA_GET_INFO | accessToken | Access Token | password | control type/format is password/secret/masked (password); collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type OAUTH2 or BEARER_TOKEN | script |
| CRITICAL | Social/WhatsApp | 23020 | WHATSAPP_TEMPLATE_SEND | accessToken | Access Token | password | control type/format is password/secret/masked (password); collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type OAUTH2 or BEARER_TOKEN | script |
| CRITICAL | Social/WhatsApp | 23021 | WHATSAPP_TEMPLATE_LIST | accessToken | Access Token | password | control type/format is password/secret/masked (password); collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type OAUTH2 or BEARER_TOKEN | script |
| CRITICAL | Social/WhatsApp | 23022 | WHATSAPP_TEMPLATE_GET | accessToken | Access Token | password | control type/format is password/secret/masked (password); collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type OAUTH2 or BEARER_TOKEN | script |
| CRITICAL | Social/WhatsApp | 23023 | WHATSAPP_TEMPLATE_CREATE | accessToken | Access Token | password | control type/format is password/secret/masked (password); collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type OAUTH2 or BEARER_TOKEN | script |
| CRITICAL | Social/WhatsApp | 23024 | WHATSAPP_TEMPLATE_UPDATE | accessToken | Access Token | password | control type/format is password/secret/masked (password); collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type OAUTH2 or BEARER_TOKEN | script |
| CRITICAL | Social/WhatsApp | 23025 | WHATSAPP_TEMPLATE_DELETE | accessToken | Access Token | password | control type/format is password/secret/masked (password); collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type OAUTH2 or BEARER_TOKEN | script |
| CRITICAL | Social/WhatsApp | 23026 | WHATSAPP_PROFILE_GET_CONTACT | accessToken | Access Token | password | control type/format is password/secret/masked (password); collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type OAUTH2 or BEARER_TOKEN | script |
| CRITICAL | Social/WhatsApp | 23027 | WHATSAPP_PROFILE_UPDATE_CONTACT_NAME | accessToken | Access Token | password | control type/format is password/secret/masked (password); collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type OAUTH2 or BEARER_TOKEN | script |
| CRITICAL | Social/WhatsApp | 23028 | WHATSAPP_PROFILE_GET_BUSINESS_PROFILE | accessToken | Access Token | password | control type/format is password/secret/masked (password); collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type OAUTH2 or BEARER_TOKEN | script |
| CRITICAL | Social/WhatsApp | 23029 | WHATSAPP_PROFILE_UPDATE_BUSINESS_PROFILE | accessToken | Access Token | password | control type/format is password/secret/masked (password); collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type OAUTH2 or BEARER_TOKEN | script |
| CRITICAL | Social/WhatsApp | 23030 | WHATSAPP_PROFILE_GET_ACCOUNT_INFO | accessToken | Access Token | password | control type/format is password/secret/masked (password); collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type OAUTH2 or BEARER_TOKEN | script |
| CRITICAL | Social/WhatsApp | 23031 | WHATSAPP_PROFILE_GET_VERIFICATION_STATUS | accessToken | Access Token | password | control type/format is password/secret/masked (password); collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type OAUTH2 or BEARER_TOKEN | script |
| CRITICAL | Social/WhatsApp | 23032 | WHATSAPP_PHONE_NUMBER_LIST | accessToken | Access Token | password | control type/format is password/secret/masked (password); collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type OAUTH2 or BEARER_TOKEN | script |
| CRITICAL | Social/WhatsApp | 23033 | WHATSAPP_PHONE_NUMBER_GET | accessToken | Access Token | password | control type/format is password/secret/masked (password); collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type OAUTH2 or BEARER_TOKEN | script |
| CRITICAL | Social/WhatsApp | 23034 | WHATSAPP_PHONE_NUMBER_REGISTER | accessToken | Access Token | password | control type/format is password/secret/masked (password); collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type OAUTH2 or BEARER_TOKEN | script |
| CRITICAL | Social/WhatsApp | 23034 | WHATSAPP_PHONE_NUMBER_REGISTER | pin | Two-Step PIN | password | control type/format is password/secret/masked (password); PIN value | remove field; require credentialID picker / remove; use credential type PIN_OR_PASSCODE (proposed) | script |
| CRITICAL | Social/WhatsApp | 23035 | WHATSAPP_PHONE_NUMBER_DEREGISTER | accessToken | Access Token | password | control type/format is password/secret/masked (password); collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type OAUTH2 or BEARER_TOKEN | script |
| CRITICAL | Social/WhatsApp | 23036 | WHATSAPP_PHONE_NUMBER_UPDATE_DISPLAY_NAME | accessToken | Access Token | password | control type/format is password/secret/masked (password); collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type OAUTH2 or BEARER_TOKEN | script |
| CRITICAL | Social/WhatsApp | 23037 | WHATSAPP_PHONE_NUMBER_REQUEST_VERIFICATION | accessToken | Access Token | password | control type/format is password/secret/masked (password); collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type OAUTH2 or BEARER_TOKEN | script |
| CRITICAL | Social/WhatsApp | 23038 | WHATSAPP_PHONE_NUMBER_VERIFY_CODE | accessToken | Access Token | password | control type/format is password/secret/masked (password); collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type OAUTH2 or BEARER_TOKEN | script |
| CRITICAL | Social/WhatsApp | 23038 | WHATSAPP_PHONE_NUMBER_VERIFY_CODE | code | Verification Code | password | control type/format is password/secret/masked (password) | remove field; require credentialID picker | script |
| CRITICAL | Social/WhatsApp | 23039 | WHATSAPP_QRCODE_CREATE | accessToken | Access Token | password | control type/format is password/secret/masked (password); collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type OAUTH2 or BEARER_TOKEN | script |
| CRITICAL | Social/WhatsApp | 23040 | WHATSAPP_QRCODE_LIST | accessToken | Access Token | password | control type/format is password/secret/masked (password); collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type OAUTH2 or BEARER_TOKEN | script |
| CRITICAL | Social/WhatsApp | 23041 | WHATSAPP_QRCODE_GET | accessToken | Access Token | password | control type/format is password/secret/masked (password); collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type OAUTH2 or BEARER_TOKEN | script |
| CRITICAL | Social/WhatsApp | 23042 | WHATSAPP_QRCODE_UPDATE | accessToken | Access Token | password | control type/format is password/secret/masked (password); collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type OAUTH2 or BEARER_TOKEN | script |
| CRITICAL | Social/WhatsApp | 23043 | WHATSAPP_QRCODE_DELETE | accessToken | Access Token | password | control type/format is password/secret/masked (password); collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type OAUTH2 or BEARER_TOKEN | script |
| CRITICAL | Social/WhatsApp | 23044 | WHATSAPP_GROUP_CREATE | accessToken | Access Token | password | control type/format is password/secret/masked (password); collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type OAUTH2 or BEARER_TOKEN | script |
| CRITICAL | Social/WhatsApp | 23045 | WHATSAPP_GROUP_GET | accessToken | Access Token | password | control type/format is password/secret/masked (password); collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type OAUTH2 or BEARER_TOKEN | script |
| CRITICAL | Social/WhatsApp | 23046 | WHATSAPP_GROUP_DELETE | accessToken | Access Token | password | control type/format is password/secret/masked (password); collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type OAUTH2 or BEARER_TOKEN | script |
| CRITICAL | Social/WhatsApp | 23047 | WHATSAPP_GROUP_UPDATE_NAME | accessToken | Access Token | password | control type/format is password/secret/masked (password); collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type OAUTH2 or BEARER_TOKEN | script |
| CRITICAL | Social/WhatsApp | 23048 | WHATSAPP_GROUP_GET_MEMBERS | accessToken | Access Token | password | control type/format is password/secret/masked (password); collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type OAUTH2 or BEARER_TOKEN | script |
| CRITICAL | Social/WhatsApp | 23049 | WHATSAPP_GROUP_ADD_MEMBER | accessToken | Access Token | password | control type/format is password/secret/masked (password); collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type OAUTH2 or BEARER_TOKEN | script |
| CRITICAL | Social/WhatsApp | 23050 | WHATSAPP_GROUP_REMOVE_MEMBER | accessToken | Access Token | password | control type/format is password/secret/masked (password); collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type OAUTH2 or BEARER_TOKEN | script |
| CRITICAL | Social/WhatsApp | 23051 | WHATSAPP_GROUP_PROMOTE_ADMIN | accessToken | Access Token | password | control type/format is password/secret/masked (password); collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type OAUTH2 or BEARER_TOKEN | script |
| CRITICAL | Social/WhatsApp | 23052 | WHATSAPP_GROUP_DEMOTE_ADMIN | accessToken | Access Token | password | control type/format is password/secret/masked (password); collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type OAUTH2 or BEARER_TOKEN | script |
| CRITICAL | Social/WhatsApp | 23053 | WHATSAPP_GROUP_GET_INVITE_LINK | accessToken | Access Token | password | control type/format is password/secret/masked (password); collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type OAUTH2 or BEARER_TOKEN | script |
| CRITICAL | Social/WhatsApp | 23054 | WHATSAPP_GROUP_SEND_MESSAGE | accessToken | Access Token | password | control type/format is password/secret/masked (password); collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type OAUTH2 or BEARER_TOKEN | script |
| CRITICAL | Social/WhatsApp | 23055 | WHATSAPP_COMMERCE_CREATE_CATALOG | accessToken | Access Token | password | control type/format is password/secret/masked (password); collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type OAUTH2 or BEARER_TOKEN | script |
| CRITICAL | Social/WhatsApp | 23056 | WHATSAPP_COMMERCE_GET_CATALOG | accessToken | Access Token | password | control type/format is password/secret/masked (password); collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type OAUTH2 or BEARER_TOKEN | script |
| CRITICAL | Social/WhatsApp | 23057 | WHATSAPP_COMMERCE_LIST_CATALOGS | accessToken | Access Token | password | control type/format is password/secret/masked (password); collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type OAUTH2 or BEARER_TOKEN | script |
| CRITICAL | Social/WhatsApp | 23058 | WHATSAPP_COMMERCE_DELETE_CATALOG | accessToken | Access Token | password | control type/format is password/secret/masked (password); collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type OAUTH2 or BEARER_TOKEN | script |
| CRITICAL | Social/WhatsApp | 23059 | WHATSAPP_COMMERCE_ADD_PRODUCT | accessToken | Access Token | password | control type/format is password/secret/masked (password); collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type OAUTH2 or BEARER_TOKEN | script |
| CRITICAL | Social/WhatsApp | 23060 | WHATSAPP_COMMERCE_GET_PRODUCT | accessToken | Access Token | password | control type/format is password/secret/masked (password); collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type OAUTH2 or BEARER_TOKEN | script |
| CRITICAL | Social/WhatsApp | 23061 | WHATSAPP_COMMERCE_LIST_PRODUCTS | accessToken | Access Token | password | control type/format is password/secret/masked (password); collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type OAUTH2 or BEARER_TOKEN | script |
| CRITICAL | Social/WhatsApp | 23062 | WHATSAPP_COMMERCE_UPDATE_PRODUCT | accessToken | Access Token | password | control type/format is password/secret/masked (password); collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type OAUTH2 or BEARER_TOKEN | script |
| CRITICAL | Social/WhatsApp | 23063 | WHATSAPP_COMMERCE_DELETE_PRODUCT | accessToken | Access Token | password | control type/format is password/secret/masked (password); collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type OAUTH2 or BEARER_TOKEN | script |
| CRITICAL | Social/WhatsApp | 23064 | WHATSAPP_COMMERCE_CREATE_COLLECTION | accessToken | Access Token | password | control type/format is password/secret/masked (password); collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type OAUTH2 or BEARER_TOKEN | script |
| CRITICAL | Social/WhatsApp | 23065 | WHATSAPP_COMMERCE_UPDATE_COLLECTION | accessToken | Access Token | password | control type/format is password/secret/masked (password); collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type OAUTH2 or BEARER_TOKEN | script |
| CRITICAL | Social/WhatsApp | 23066 | WHATSAPP_COMMERCE_DELETE_COLLECTION | accessToken | Access Token | password | control type/format is password/secret/masked (password); collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type OAUTH2 or BEARER_TOKEN | script |
| CRITICAL | Social/WhatsApp | 23067 | WHATSAPP_COMMERCE_SEND_SINGLE_PRODUCT | accessToken | Access Token | password | control type/format is password/secret/masked (password); collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type OAUTH2 or BEARER_TOKEN | script |
| CRITICAL | Social/WhatsApp | 23068 | WHATSAPP_COMMERCE_SEND_MULTI_PRODUCT | accessToken | Access Token | password | control type/format is password/secret/masked (password); collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type OAUTH2 or BEARER_TOKEN | script |
| CRITICAL | Social/WhatsApp | 23069 | WHATSAPP_COMMERCE_SEND_PRODUCT_TEMPLATE | accessToken | Access Token | password | control type/format is password/secret/masked (password); collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type OAUTH2 or BEARER_TOKEN | script |
| CRITICAL | Social/WhatsApp | 23070 | WHATSAPP_COMMERCE_ENABLE_COMMERCE | accessToken | Access Token | password | control type/format is password/secret/masked (password); collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type OAUTH2 or BEARER_TOKEN | script |
| CRITICAL | Social/WhatsApp | 23071 | WHATSAPP_COMMERCE_GET_COMMERCE_SETTINGS | accessToken | Access Token | password | control type/format is password/secret/masked (password); collects an auth/access/bot/bearer token value | remove field; require credentialID picker / remove field; use credential type OAUTH2 or BEARER_TOKEN | script |
| CRITICAL | Social/WhatsApp | 23072 | WHATSAPP_COMMERCE_RECEIVE_ORDER | appSecretVaultKey | App Secret Vault Key | text | collects a secret value (client secret / secret key / signing secret) | remove; use credential type API_KEY | script |
| CRITICAL | Social/WhatsApp | 23073 | WHATSAPP_TRIGGER_MESSAGES | appSecretVaultKey | App Secret Vault Key | text | collects a secret value (client secret / secret key / signing secret) | remove; use credential type API_KEY | script |
| CRITICAL | Social/WhatsApp | 23074 | WHATSAPP_TRIGGER_MESSAGE_STATUS | appSecretVaultKey | App Secret Vault Key | text | collects a secret value (client secret / secret key / signing secret) | remove; use credential type API_KEY | script |
| CRITICAL | Social/WhatsApp | 23075 | WHATSAPP_TRIGGER_TEMPLATE_STATUS | appSecretVaultKey | App Secret Vault Key | text | collects a secret value (client secret / secret key / signing secret) | remove; use credential type API_KEY | script |
| CRITICAL | Social/WhatsApp | 23076 | WHATSAPP_TRIGGER_ACCOUNT_UPDATE | appSecretVaultKey | App Secret Vault Key | text | collects a secret value (client secret / secret key / signing secret) | remove; use credential type API_KEY | script |
| CRITICAL | Social/WhatsApp | 23077 | WHATSAPP_TRIGGER_PHONE_QUALITY_UPDATE | appSecretVaultKey | App Secret Vault Key | text | collects a secret value (client secret / secret key / signing secret) | remove; use credential type API_KEY | script |
| CRITICAL | Social/WhatsApp | 23078 | WHATSAPP_TRIGGER_PHONE_NAME_UPDATE | appSecretVaultKey | App Secret Vault Key | text | collects a secret value (client secret / secret key / signing secret) | remove; use credential type API_KEY | script |
| CRITICAL | Standard/Ses | 35043 | SES_TEMPLATE_CREATE | secretAccessKey | AWS Secret Access Key | password | control type/format is password/secret/masked (password); collects a secret value (client secret / secret key / signing secret); collects an API/access/signing/license key value | remove field; require credentialID picker / remove; use credential type API_KEY / remove field; use credential type AWS_ACCESS_KEY (proposed) | script |
| CRITICAL | Standard/Ses | 35044 | SES_TEMPLATE_GET | secretAccessKey | AWS Secret Access Key | password | control type/format is password/secret/masked (password); collects a secret value (client secret / secret key / signing secret); collects an API/access/signing/license key value | remove field; require credentialID picker / remove; use credential type API_KEY / remove field; use credential type AWS_ACCESS_KEY (proposed) | script |
| CRITICAL | Standard/Ses | 35045 | SES_TEMPLATE_GETMANY | secretAccessKey | AWS Secret Access Key | password | control type/format is password/secret/masked (password); collects a secret value (client secret / secret key / signing secret); collects an API/access/signing/license key value | remove field; require credentialID picker / remove; use credential type API_KEY / remove field; use credential type AWS_ACCESS_KEY (proposed) | script |
| CRITICAL | Standard/Ses | 35046 | SES_TEMPLATE_UPDATE | secretAccessKey | AWS Secret Access Key | password | control type/format is password/secret/masked (password); collects a secret value (client secret / secret key / signing secret); collects an API/access/signing/license key value | remove field; require credentialID picker / remove; use credential type API_KEY / remove field; use credential type AWS_ACCESS_KEY (proposed) | script |
| CRITICAL | Standard/Ses | 35047 | SES_TEMPLATE_DELETE | secretAccessKey | AWS Secret Access Key | password | control type/format is password/secret/masked (password); collects a secret value (client secret / secret key / signing secret); collects an API/access/signing/license key value | remove field; require credentialID picker / remove; use credential type API_KEY / remove field; use credential type AWS_ACCESS_KEY (proposed) | script |
| CRITICAL | Standard/Ses | 35048 | SES_EMAIL_SEND | secretAccessKey | AWS Secret Access Key | password | control type/format is password/secret/masked (password); collects a secret value (client secret / secret key / signing secret); collects an API/access/signing/license key value | remove field; require credentialID picker / remove; use credential type API_KEY / remove field; use credential type AWS_ACCESS_KEY (proposed) | script |
| CRITICAL | Standard/Ses | 35049 | SES_EMAIL_SENDTEMPLATE | secretAccessKey | AWS Secret Access Key | password | control type/format is password/secret/masked (password); collects a secret value (client secret / secret key / signing secret); collects an API/access/signing/license key value | remove field; require credentialID picker / remove; use credential type API_KEY / remove field; use credential type AWS_ACCESS_KEY (proposed) | script |
| CRITICAL | Standard/Ses | 35050 | SES_CUSTOMVERIFICATION_CREATE | secretAccessKey | AWS Secret Access Key | password | control type/format is password/secret/masked (password); collects a secret value (client secret / secret key / signing secret); collects an API/access/signing/license key value | remove field; require credentialID picker / remove; use credential type API_KEY / remove field; use credential type AWS_ACCESS_KEY (proposed) | script |
| CRITICAL | Standard/Ses | 35051 | SES_CUSTOMVERIFICATION_GET | secretAccessKey | AWS Secret Access Key | password | control type/format is password/secret/masked (password); collects a secret value (client secret / secret key / signing secret); collects an API/access/signing/license key value | remove field; require credentialID picker / remove; use credential type API_KEY / remove field; use credential type AWS_ACCESS_KEY (proposed) | script |
| CRITICAL | Standard/Ses | 35052 | SES_CUSTOMVERIFICATION_GETMANY | secretAccessKey | AWS Secret Access Key | password | control type/format is password/secret/masked (password); collects a secret value (client secret / secret key / signing secret); collects an API/access/signing/license key value | remove field; require credentialID picker / remove; use credential type API_KEY / remove field; use credential type AWS_ACCESS_KEY (proposed) | script |
| CRITICAL | Standard/Ses | 35053 | SES_CUSTOMVERIFICATION_UPDATE | secretAccessKey | AWS Secret Access Key | password | control type/format is password/secret/masked (password); collects a secret value (client secret / secret key / signing secret); collects an API/access/signing/license key value | remove field; require credentialID picker / remove; use credential type API_KEY / remove field; use credential type AWS_ACCESS_KEY (proposed) | script |
| CRITICAL | Standard/Ses | 35054 | SES_CUSTOMVERIFICATION_SEND | secretAccessKey | AWS Secret Access Key | password | control type/format is password/secret/masked (password); collects a secret value (client secret / secret key / signing secret); collects an API/access/signing/license key value | remove field; require credentialID picker / remove; use credential type API_KEY / remove field; use credential type AWS_ACCESS_KEY (proposed) | script |
| CRITICAL | Standard/Ses | 35055 | SES_CUSTOMVERIFICATION_DELETE | secretAccessKey | AWS Secret Access Key | password | control type/format is password/secret/masked (password); collects a secret value (client secret / secret key / signing secret); collects an API/access/signing/license key value | remove field; require credentialID picker / remove; use credential type API_KEY / remove field; use credential type AWS_ACCESS_KEY (proposed) | script |
| CRITICAL | Standard/Smtp | 23090 | EMAIL_SMTP_EMAIL_SEND | password | Password | password | control type/format is password/secret/masked (password); collects a password/passphrase value | remove field; require credentialID picker / remove field; use credential type BASIC_AUTH (username+password) | script |
| HIGH | (db-only)/node-capability-datasource-editor | 12007 | NODECAP_DATASOURCE_PROPERTIES | connectionKey | Connection Key | text | names a secret-store / config key that holds the secret (indirect); not a credentialID | replace with credentialID picker so the secret is resolved from the credential vault | db-only |
| HIGH | (db-only)/node-form-http-request | 11059 | NODETYPE_HTTP_REQUEST | headers | Headers | textarea | free-form HTTP headers (can carry Authorization / X-Api-Key) | strip auth headers server-side; supply auth via credentialID; allow-list header names | db-only |
| HIGH | (db-only)/node-form-postgresql | 40567 | POSTGRESQL_NODE | connectionStringKey | Connection String Key | text | names a secret-store / config key that holds the secret (indirect); not a credentialID | replace with credentialID picker so the secret is resolved from the credential vault | db-only |
| HIGH | (db-only)/node-form-postgresql | 40567 | POSTGRESQL_NODE | destinationConnectionStringKey | Destination Connection String Key | text | names a secret-store / config key that holds the secret (indirect); not a credentialID | replace with credentialID picker so the secret is resolved from the credential vault | db-only |
| HIGH | (db-only)/node-form-postgresql | 40567 | POSTGRESQL_NODE | sourceConnectionStringKey | Source Connection String Key | text | names a secret-store / config key that holds the secret (indirect); not a credentialID | replace with credentialID picker so the secret is resolved from the credential vault | db-only |
| HIGH | (db-only)/node-form-postgresql-bulk-copy | 40561 | POSTGRESQL_BULK_COPY | destinationConnectionStringKey | Destination Connection String Key | text | names a secret-store / config key that holds the secret (indirect); not a credentialID | replace with credentialID picker so the secret is resolved from the credential vault | db-only |
| HIGH | (db-only)/node-form-postgresql-bulk-copy | 40561 | POSTGRESQL_BULK_COPY | sourceConnectionStringKey | Source Connection String Key | text | names a secret-store / config key that holds the secret (indirect); not a credentialID | replace with credentialID picker so the secret is resolved from the credential vault | db-only |
| HIGH | (db-only)/node-form-postgresql-bulk-insert | 40560 | POSTGRESQL_BULK_INSERT | connectionStringKey | Connection String Key | text | names a secret-store / config key that holds the secret (indirect); not a credentialID | replace with credentialID picker so the secret is resolved from the credential vault | db-only |
| HIGH | (db-only)/node-form-postgresql-procedure-execute | 40558 | POSTGRESQL_PROCEDURE_EXECUTE | connectionStringKey | Connection String Key | text | names a secret-store / config key that holds the secret (indirect); not a credentialID | replace with credentialID picker so the secret is resolved from the credential vault | db-only |
| HIGH | (db-only)/node-form-postgresql-procedure-list | 40559 | POSTGRESQL_PROCEDURE_LIST | connectionStringKey | Connection String Key | text | names a secret-store / config key that holds the secret (indirect); not a credentialID | replace with credentialID picker so the secret is resolved from the credential vault | db-only |
| HIGH | (db-only)/node-form-postgresql-query-execute | 40544 | POSTGRESQL_QUERY_EXECUTE | connectionStringKey | Connection String Key | text | names a secret-store / config key that holds the secret (indirect); not a credentialID | replace with credentialID picker so the secret is resolved from the credential vault | db-only |
| HIGH | (db-only)/node-form-postgresql-row-aggregate | 40600 | POSTGRESQL_ROW_AGGREGATE | connectionStringKey | Connection String Key | text | names a secret-store / config key that holds the secret (indirect); not a credentialID | replace with credentialID picker so the secret is resolved from the credential vault | db-only |
| HIGH | (db-only)/node-form-postgresql-row-applyrules | 40599 | POSTGRESQL_ROW_APPLYRULES | connectionStringKey | Connection String Key | text | names a secret-store / config key that holds the secret (indirect); not a credentialID | replace with credentialID picker so the secret is resolved from the credential vault | db-only |
| HIGH | (db-only)/node-form-postgresql-row-countwhere | 40601 | POSTGRESQL_ROW_COUNTWHERE | connectionStringKey | Connection String Key | text | names a secret-store / config key that holds the secret (indirect); not a credentialID | replace with credentialID picker so the secret is resolved from the credential vault | db-only |
| HIGH | (db-only)/node-form-postgresql-row-delete | 40548 | POSTGRESQL_ROW_DELETE | connectionStringKey | Connection String Key | text | names a secret-store / config key that holds the secret (indirect); not a credentialID | replace with credentialID picker so the secret is resolved from the credential vault | db-only |
| HIGH | (db-only)/node-form-postgresql-row-get | 40549 | POSTGRESQL_ROW_GET | connectionStringKey | Connection String Key | text | names a secret-store / config key that holds the secret (indirect); not a credentialID | replace with credentialID picker so the secret is resolved from the credential vault | db-only |
| HIGH | (db-only)/node-form-postgresql-row-getMany | 40550 | POSTGRESQL_ROW_GETMANY | connectionStringKey | Connection String Key | text | names a secret-store / config key that holds the secret (indirect); not a credentialID | replace with credentialID picker so the secret is resolved from the credential vault | db-only |
| HIGH | (db-only)/node-form-postgresql-row-insert | 40545 | POSTGRESQL_ROW_INSERT | connectionStringKey | Connection String Key | text | names a secret-store / config key that holds the secret (indirect); not a credentialID | replace with credentialID picker so the secret is resolved from the credential vault | db-only |
| HIGH | (db-only)/node-form-postgresql-row-update | 40546 | POSTGRESQL_ROW_UPDATE | connectionStringKey | Connection String Key | text | names a secret-store / config key that holds the secret (indirect); not a credentialID | replace with credentialID picker so the secret is resolved from the credential vault | db-only |
| HIGH | (db-only)/node-form-postgresql-row-updatewhere | 40598 | POSTGRESQL_ROW_UPDATEWHERE | connectionStringKey | Connection String Key | text | names a secret-store / config key that holds the secret (indirect); not a credentialID | replace with credentialID picker so the secret is resolved from the credential vault | db-only |
| HIGH | (db-only)/node-form-postgresql-row-upsert | 40547 | POSTGRESQL_ROW_UPSERT | connectionStringKey | Connection String Key | text | names a secret-store / config key that holds the secret (indirect); not a credentialID | replace with credentialID picker so the secret is resolved from the credential vault | db-only |
| HIGH | (db-only)/node-form-postgresql-schema-getTables | 40557 | POSTGRESQL_SCHEMA_GETTABLES | connectionStringKey | Connection String Key | text | names a secret-store / config key that holds the secret (indirect); not a credentialID | replace with credentialID picker so the secret is resolved from the credential vault | db-only |
| HIGH | (db-only)/node-form-postgresql-schema-list | 40556 | POSTGRESQL_SCHEMA_LIST | connectionStringKey | Connection String Key | text | names a secret-store / config key that holds the secret (indirect); not a credentialID | replace with credentialID picker so the secret is resolved from the credential vault | db-only |
| HIGH | (db-only)/node-form-postgresql-table-addcheckconstraint | 40610 | POSTGRESQL_TABLE_ADDCHECKCONSTRAINT | connectionStringKey | Connection String Key | text | names a secret-store / config key that holds the secret (indirect); not a credentialID | replace with credentialID picker so the secret is resolved from the credential vault | db-only |
| HIGH | (db-only)/node-form-postgresql-table-addcolumn | 40602 | POSTGRESQL_TABLE_ADDCOLUMN | connectionStringKey | Connection String Key | text | names a secret-store / config key that holds the secret (indirect); not a credentialID | replace with credentialID picker so the secret is resolved from the credential vault | db-only |
| HIGH | (db-only)/node-form-postgresql-table-addforeignkey | 40609 | POSTGRESQL_TABLE_ADDFOREIGNKEY | connectionStringKey | Connection String Key | text | names a secret-store / config key that holds the secret (indirect); not a credentialID | replace with credentialID picker so the secret is resolved from the credential vault | db-only |
| HIGH | (db-only)/node-form-postgresql-table-adduniqueconstraint | 40608 | POSTGRESQL_TABLE_ADDUNIQUECONSTRAINT | connectionStringKey | Connection String Key | text | names a secret-store / config key that holds the secret (indirect); not a credentialID | replace with credentialID picker so the secret is resolved from the credential vault | db-only |
| HIGH | (db-only)/node-form-postgresql-table-altercolumn | 40604 | POSTGRESQL_TABLE_ALTERCOLUMN | connectionStringKey | Connection String Key | text | names a secret-store / config key that holds the secret (indirect); not a credentialID | replace with credentialID picker so the secret is resolved from the credential vault | db-only |
| HIGH | (db-only)/node-form-postgresql-table-create | 40551 | POSTGRESQL_TABLE_CREATE | connectionStringKey | Connection String Key | text | names a secret-store / config key that holds the secret (indirect); not a credentialID | replace with credentialID picker so the secret is resolved from the credential vault | db-only |
| HIGH | (db-only)/node-form-postgresql-table-createindex | 40606 | POSTGRESQL_TABLE_CREATEINDEX | connectionStringKey | Connection String Key | text | names a secret-store / config key that holds the secret (indirect); not a credentialID | replace with credentialID picker so the secret is resolved from the credential vault | db-only |
| HIGH | (db-only)/node-form-postgresql-table-drop | 40552 | POSTGRESQL_TABLE_DROP | connectionStringKey | Connection String Key | text | names a secret-store / config key that holds the secret (indirect); not a credentialID | replace with credentialID picker so the secret is resolved from the credential vault | db-only |
| HIGH | (db-only)/node-form-postgresql-table-dropcolumn | 40603 | POSTGRESQL_TABLE_DROPCOLUMN | connectionStringKey | Connection String Key | text | names a secret-store / config key that holds the secret (indirect); not a credentialID | replace with credentialID picker so the secret is resolved from the credential vault | db-only |
| HIGH | (db-only)/node-form-postgresql-table-dropconstraint | 40612 | POSTGRESQL_TABLE_DROPCONSTRAINT | connectionStringKey | Connection String Key | text | names a secret-store / config key that holds the secret (indirect); not a credentialID | replace with credentialID picker so the secret is resolved from the credential vault | db-only |
| HIGH | (db-only)/node-form-postgresql-table-dropindex | 40607 | POSTGRESQL_TABLE_DROPINDEX | connectionStringKey | Connection String Key | text | names a secret-store / config key that holds the secret (indirect); not a credentialID | replace with credentialID picker so the secret is resolved from the credential vault | db-only |
| HIGH | (db-only)/node-form-postgresql-table-getColumns | 40555 | POSTGRESQL_TABLE_GETCOLUMNS | connectionStringKey | Connection String Key | text | names a secret-store / config key that holds the secret (indirect); not a credentialID | replace with credentialID picker so the secret is resolved from the credential vault | db-only |
| HIGH | (db-only)/node-form-postgresql-table-list | 40554 | POSTGRESQL_TABLE_LIST | connectionStringKey | Connection String Key | text | names a secret-store / config key that holds the secret (indirect); not a credentialID | replace with credentialID picker so the secret is resolved from the credential vault | db-only |
| HIGH | (db-only)/node-form-postgresql-table-profile | 40615 | POSTGRESQL_TABLE_PROFILE | connectionStringKey | Database connection | text | names a secret-store / config key that holds the secret (indirect); not a credentialID | replace with credentialID picker so the secret is resolved from the credential vault | db-only |
| HIGH | (db-only)/node-form-postgresql-table-renamecolumn | 40605 | POSTGRESQL_TABLE_RENAMECOLUMN | connectionStringKey | Connection String Key | text | names a secret-store / config key that holds the secret (indirect); not a credentialID | replace with credentialID picker so the secret is resolved from the credential vault | db-only |
| HIGH | (db-only)/node-form-postgresql-table-setdefault | 40611 | POSTGRESQL_TABLE_SETDEFAULT | connectionStringKey | Connection String Key | text | names a secret-store / config key that holds the secret (indirect); not a credentialID | replace with credentialID picker so the secret is resolved from the credential vault | db-only |
| HIGH | (db-only)/node-form-postgresql-table-truncate | 40553 | POSTGRESQL_TABLE_TRUNCATE | connectionStringKey | Connection String Key | text | names a secret-store / config key that holds the secret (indirect); not a credentialID | replace with credentialID picker so the secret is resolved from the credential vault | db-only |
| HIGH | (db-only)/node-form-postgresql-transaction-begin | 40562 | POSTGRESQL_TRANSACTION_BEGIN | connectionStringKey | Connection String Key | text | names a secret-store / config key that holds the secret (indirect); not a credentialID | replace with credentialID picker so the secret is resolved from the credential vault | db-only |
| HIGH | (db-only)/node-form-postgresql-transaction-executeInTx | 40565 | POSTGRESQL_TRANSACTION_EXECUTEINTX | connectionStringKey | Connection String Key | text | names a secret-store / config key that holds the secret (indirect); not a credentialID | replace with credentialID picker so the secret is resolved from the credential vault | db-only |
| HIGH | Ai/AI-Function | 21019 | AI_FUNCTION_DATA_HTTP_REQUEST | headers | Headers | enhanced-json-editor | free-form HTTP headers (can carry Authorization / X-Api-Key) | strip auth headers server-side; supply auth via credentialID; allow-list header names | script |
| HIGH | Ai/Ai-ToolServer | 11114 | NODEFORM_AI_TOOL_SERVER_HEADERS | headers | HTTP Headers | grid | free-form HTTP headers (can carry Authorization / X-Api-Key) | strip auth headers server-side; supply auth via credentialID; allow-list header names | script |
| HIGH | DB/ElasticSearch | 20300 | ELASTICSEARCH_INDEX_CREATE | username | Username | text | username collected on the same form as a password | move username and password together into credential BASIC_AUTH | script |
| HIGH | DB/ElasticSearch | 20301 | ELASTICSEARCH_INDEX_GET | username | Username | text | username collected on the same form as a password | move username and password together into credential BASIC_AUTH | script |
| HIGH | DB/ElasticSearch | 20302 | ELASTICSEARCH_INDEX_GETMANY | username | Username | text | username collected on the same form as a password | move username and password together into credential BASIC_AUTH | script |
| HIGH | DB/ElasticSearch | 20303 | ELASTICSEARCH_INDEX_DELETE | username | Username | text | username collected on the same form as a password | move username and password together into credential BASIC_AUTH | script |
| HIGH | DB/ElasticSearch | 20304 | ELASTICSEARCH_DOCUMENT_CREATE | username | Username | text | username collected on the same form as a password | move username and password together into credential BASIC_AUTH | script |
| HIGH | DB/ElasticSearch | 20305 | ELASTICSEARCH_DOCUMENT_GET | username | Username | text | username collected on the same form as a password | move username and password together into credential BASIC_AUTH | script |
| HIGH | DB/ElasticSearch | 20306 | ELASTICSEARCH_DOCUMENT_GETMANY | username | Username | text | username collected on the same form as a password | move username and password together into credential BASIC_AUTH | script |
| HIGH | DB/ElasticSearch | 20307 | ELASTICSEARCH_DOCUMENT_SEARCH | username | Username | text | username collected on the same form as a password | move username and password together into credential BASIC_AUTH | script |
| HIGH | DB/ElasticSearch | 20308 | ELASTICSEARCH_DOCUMENT_UPDATE | username | Username | text | username collected on the same form as a password | move username and password together into credential BASIC_AUTH | script |
| HIGH | DB/ElasticSearch | 20309 | ELASTICSEARCH_DOCUMENT_DELETE | username | Username | text | username collected on the same form as a password | move username and password together into credential BASIC_AUTH | script |
| HIGH | Distributed/Kafka | 21034 | KAFKA_MESSAGE_SEND | headers | Headers | code-editor | free-form HTTP headers (can carry Authorization / X-Api-Key) | strip auth headers server-side; supply auth via credentialID; allow-list header names | script |
| HIGH | Distributed/Redis | 5001 | REDIS_STRING_GET | connectionString |  | string | connection string / URI field - can embed user:password | accept host/port/db only and take user+password from a credentialID (BASIC_AUTH) | script |
| HIGH | Distributed/Redis | 5002 | REDIS_STRING_SET | connectionString |  | string | connection string / URI field - can embed user:password | accept host/port/db only and take user+password from a credentialID (BASIC_AUTH) | script |
| HIGH | Distributed/Redis | 5003 | REDIS_STRING_APPEND | connectionString |  | string | connection string / URI field - can embed user:password | accept host/port/db only and take user+password from a credentialID (BASIC_AUTH) | script |
| HIGH | Distributed/Redis | 5004 | REDIS_STRING_STRLEN | connectionString |  | string | connection string / URI field - can embed user:password | accept host/port/db only and take user+password from a credentialID (BASIC_AUTH) | script |
| HIGH | Distributed/Redis | 5005 | REDIS_STRING_INCR | connectionString |  | string | connection string / URI field - can embed user:password | accept host/port/db only and take user+password from a credentialID (BASIC_AUTH) | script |
| HIGH | Distributed/Redis | 5006 | REDIS_STRING_INCRBY | connectionString |  | string | connection string / URI field - can embed user:password | accept host/port/db only and take user+password from a credentialID (BASIC_AUTH) | script |
| HIGH | Distributed/Redis | 5007 | REDIS_STRING_DECR | connectionString |  | string | connection string / URI field - can embed user:password | accept host/port/db only and take user+password from a credentialID (BASIC_AUTH) | script |
| HIGH | Distributed/Redis | 5008 | REDIS_STRING_DECRBY | connectionString |  | string | connection string / URI field - can embed user:password | accept host/port/db only and take user+password from a credentialID (BASIC_AUTH) | script |
| HIGH | Distributed/Redis | 5009 | REDIS_STRING_GETSET | connectionString |  | string | connection string / URI field - can embed user:password | accept host/port/db only and take user+password from a credentialID (BASIC_AUTH) | script |
| HIGH | Distributed/Redis | 5010 | REDIS_STRING_MGET | connectionString |  | string | connection string / URI field - can embed user:password | accept host/port/db only and take user+password from a credentialID (BASIC_AUTH) | script |
| HIGH | Distributed/Redis | 5011 | REDIS_STRING_MSET | connectionString |  | string | connection string / URI field - can embed user:password | accept host/port/db only and take user+password from a credentialID (BASIC_AUTH) | script |
| HIGH | Distributed/Redis | 5012 | REDIS_LIST_LPUSH | connectionString |  | string | connection string / URI field - can embed user:password | accept host/port/db only and take user+password from a credentialID (BASIC_AUTH) | script |
| HIGH | Distributed/Redis | 5013 | REDIS_LIST_RPUSH | connectionString |  | string | connection string / URI field - can embed user:password | accept host/port/db only and take user+password from a credentialID (BASIC_AUTH) | script |
| HIGH | Distributed/Redis | 5014 | REDIS_LIST_LPOP | connectionString |  | string | connection string / URI field - can embed user:password | accept host/port/db only and take user+password from a credentialID (BASIC_AUTH) | script |
| HIGH | Distributed/Redis | 5015 | REDIS_LIST_RPOP | connectionString |  | string | connection string / URI field - can embed user:password | accept host/port/db only and take user+password from a credentialID (BASIC_AUTH) | script |
| HIGH | Distributed/Redis | 5016 | REDIS_LIST_LLEN | connectionString |  | string | connection string / URI field - can embed user:password | accept host/port/db only and take user+password from a credentialID (BASIC_AUTH) | script |
| HIGH | Distributed/Redis | 5017 | REDIS_LIST_LRANGE | connectionString |  | string | connection string / URI field - can embed user:password | accept host/port/db only and take user+password from a credentialID (BASIC_AUTH) | script |
| HIGH | Distributed/Redis | 5018 | REDIS_LIST_LINDEX | connectionString |  | string | connection string / URI field - can embed user:password | accept host/port/db only and take user+password from a credentialID (BASIC_AUTH) | script |
| HIGH | Distributed/Redis | 5019 | REDIS_LIST_LSET | connectionString |  | string | connection string / URI field - can embed user:password | accept host/port/db only and take user+password from a credentialID (BASIC_AUTH) | script |
| HIGH | Distributed/Redis | 5020 | REDIS_LIST_LTRIM | connectionString |  | string | connection string / URI field - can embed user:password | accept host/port/db only and take user+password from a credentialID (BASIC_AUTH) | script |
| HIGH | Distributed/Redis | 5021 | REDIS_LIST_LREM | connectionString |  | string | connection string / URI field - can embed user:password | accept host/port/db only and take user+password from a credentialID (BASIC_AUTH) | script |
| HIGH | Distributed/Redis | 5022 | REDIS_LIST_LINSERT | connectionString |  | string | connection string / URI field - can embed user:password | accept host/port/db only and take user+password from a credentialID (BASIC_AUTH) | script |
| HIGH | Distributed/Redis | 5023 | REDIS_LIST_BLPOP | connectionString |  | string | connection string / URI field - can embed user:password | accept host/port/db only and take user+password from a credentialID (BASIC_AUTH) | script |
| HIGH | Distributed/Redis | 5024 | REDIS_LIST_BRPOP | connectionString |  | string | connection string / URI field - can embed user:password | accept host/port/db only and take user+password from a credentialID (BASIC_AUTH) | script |
| HIGH | Distributed/Redis | 5025 | REDIS_LIST_RPOPLPUSH | connectionString |  | string | connection string / URI field - can embed user:password | accept host/port/db only and take user+password from a credentialID (BASIC_AUTH) | script |
| HIGH | Distributed/Redis | 5026 | REDIS_KEY_DEL | connectionString |  | string | connection string / URI field - can embed user:password | accept host/port/db only and take user+password from a credentialID (BASIC_AUTH) | script |
| HIGH | Distributed/Redis | 5027 | REDIS_KEY_EXISTS | connectionString |  | string | connection string / URI field - can embed user:password | accept host/port/db only and take user+password from a credentialID (BASIC_AUTH) | script |
| HIGH | Distributed/Redis | 5028 | REDIS_KEY_EXPIRE | connectionString |  | string | connection string / URI field - can embed user:password | accept host/port/db only and take user+password from a credentialID (BASIC_AUTH) | script |
| HIGH | Distributed/Redis | 5029 | REDIS_KEY_TTL | connectionString |  | string | connection string / URI field - can embed user:password | accept host/port/db only and take user+password from a credentialID (BASIC_AUTH) | script |
| HIGH | Distributed/Redis | 5030 | REDIS_KEY_PEXPIRE | connectionString |  | string | connection string / URI field - can embed user:password | accept host/port/db only and take user+password from a credentialID (BASIC_AUTH) | script |
| HIGH | Distributed/Redis | 5031 | REDIS_KEY_PTTL | connectionString |  | string | connection string / URI field - can embed user:password | accept host/port/db only and take user+password from a credentialID (BASIC_AUTH) | script |
| HIGH | Distributed/Redis | 5032 | REDIS_KEY_PERSIST | connectionString |  | string | connection string / URI field - can embed user:password | accept host/port/db only and take user+password from a credentialID (BASIC_AUTH) | script |
| HIGH | Distributed/Redis | 5033 | REDIS_KEY_TYPE | connectionString |  | string | connection string / URI field - can embed user:password | accept host/port/db only and take user+password from a credentialID (BASIC_AUTH) | script |
| HIGH | Distributed/Redis | 5034 | REDIS_KEY_KEYS | connectionString |  | string | connection string / URI field - can embed user:password | accept host/port/db only and take user+password from a credentialID (BASIC_AUTH) | script |
| HIGH | Distributed/Redis | 5035 | REDIS_KEY_SCAN | connectionString |  | string | connection string / URI field - can embed user:password | accept host/port/db only and take user+password from a credentialID (BASIC_AUTH) | script |
| HIGH | Distributed/Redis | 5036 | REDIS_KEY_RANDOMKEY | connectionString |  | string | connection string / URI field - can embed user:password | accept host/port/db only and take user+password from a credentialID (BASIC_AUTH) | script |
| HIGH | Distributed/Redis | 5037 | REDIS_KEY_RENAME | connectionString |  | string | connection string / URI field - can embed user:password | accept host/port/db only and take user+password from a credentialID (BASIC_AUTH) | script |
| HIGH | Distributed/Redis | 5038 | REDIS_KEY_UNLINK | connectionString |  | string | connection string / URI field - can embed user:password | accept host/port/db only and take user+password from a credentialID (BASIC_AUTH) | script |
| HIGH | Distributed/Redis | 5039 | REDIS_HASH_HSET | connectionString |  | string | connection string / URI field - can embed user:password | accept host/port/db only and take user+password from a credentialID (BASIC_AUTH) | script |
| HIGH | Distributed/Redis | 5040 | REDIS_HASH_HGET | connectionString |  | string | connection string / URI field - can embed user:password | accept host/port/db only and take user+password from a credentialID (BASIC_AUTH) | script |
| HIGH | Distributed/Redis | 5041 | REDIS_HASH_HMGET | connectionString |  | string | connection string / URI field - can embed user:password | accept host/port/db only and take user+password from a credentialID (BASIC_AUTH) | script |
| HIGH | Distributed/Redis | 5042 | REDIS_HASH_HGETALL | connectionString |  | string | connection string / URI field - can embed user:password | accept host/port/db only and take user+password from a credentialID (BASIC_AUTH) | script |
| HIGH | Distributed/Redis | 5043 | REDIS_HASH_HDEL | connectionString |  | string | connection string / URI field - can embed user:password | accept host/port/db only and take user+password from a credentialID (BASIC_AUTH) | script |
| HIGH | Distributed/Redis | 5044 | REDIS_HASH_HEXISTS | connectionString |  | string | connection string / URI field - can embed user:password | accept host/port/db only and take user+password from a credentialID (BASIC_AUTH) | script |
| HIGH | Distributed/Redis | 5045 | REDIS_HASH_HLEN | connectionString |  | string | connection string / URI field - can embed user:password | accept host/port/db only and take user+password from a credentialID (BASIC_AUTH) | script |
| HIGH | Distributed/Redis | 5046 | REDIS_HASH_HINCRBY | connectionString |  | string | connection string / URI field - can embed user:password | accept host/port/db only and take user+password from a credentialID (BASIC_AUTH) | script |
| HIGH | Distributed/Redis | 5047 | REDIS_HASH_HKEYS | connectionString |  | string | connection string / URI field - can embed user:password | accept host/port/db only and take user+password from a credentialID (BASIC_AUTH) | script |
| HIGH | Distributed/Redis | 5048 | REDIS_HASH_HVALS | connectionString |  | string | connection string / URI field - can embed user:password | accept host/port/db only and take user+password from a credentialID (BASIC_AUTH) | script |
| HIGH | Distributed/Redis | 5049 | REDIS_HASH_HSCAN | connectionString |  | string | connection string / URI field - can embed user:password | accept host/port/db only and take user+password from a credentialID (BASIC_AUTH) | script |
| HIGH | Distributed/Redis | 5050 | REDIS_SET_SADD | connectionString |  | string | connection string / URI field - can embed user:password | accept host/port/db only and take user+password from a credentialID (BASIC_AUTH) | script |
| HIGH | Distributed/Redis | 5051 | REDIS_SET_SMEMBERS | connectionString |  | string | connection string / URI field - can embed user:password | accept host/port/db only and take user+password from a credentialID (BASIC_AUTH) | script |
| HIGH | Distributed/Redis | 5052 | REDIS_SET_SISMEMBER | connectionString |  | string | connection string / URI field - can embed user:password | accept host/port/db only and take user+password from a credentialID (BASIC_AUTH) | script |
| HIGH | Distributed/Redis | 5053 | REDIS_SET_SCARD | connectionString |  | string | connection string / URI field - can embed user:password | accept host/port/db only and take user+password from a credentialID (BASIC_AUTH) | script |
| HIGH | Distributed/Redis | 5054 | REDIS_SET_SREM | connectionString |  | string | connection string / URI field - can embed user:password | accept host/port/db only and take user+password from a credentialID (BASIC_AUTH) | script |
| HIGH | Distributed/Redis | 5055 | REDIS_SET_SPOP | connectionString |  | string | connection string / URI field - can embed user:password | accept host/port/db only and take user+password from a credentialID (BASIC_AUTH) | script |
| HIGH | Distributed/Redis | 5056 | REDIS_SET_SRANDMEMBER | connectionString |  | string | connection string / URI field - can embed user:password | accept host/port/db only and take user+password from a credentialID (BASIC_AUTH) | script |
| HIGH | Distributed/Redis | 5057 | REDIS_SET_SINTER | connectionString |  | string | connection string / URI field - can embed user:password | accept host/port/db only and take user+password from a credentialID (BASIC_AUTH) | script |
| HIGH | Distributed/Redis | 5058 | REDIS_SET_SINTERSTORE | connectionString |  | string | connection string / URI field - can embed user:password | accept host/port/db only and take user+password from a credentialID (BASIC_AUTH) | script |
| HIGH | Distributed/Redis | 5059 | REDIS_SET_SUNION | connectionString |  | string | connection string / URI field - can embed user:password | accept host/port/db only and take user+password from a credentialID (BASIC_AUTH) | script |
| HIGH | Distributed/Redis | 5060 | REDIS_SET_SUNIONSTORE | connectionString |  | string | connection string / URI field - can embed user:password | accept host/port/db only and take user+password from a credentialID (BASIC_AUTH) | script |
| HIGH | Distributed/Redis | 5061 | REDIS_SET_SDIFF | connectionString |  | string | connection string / URI field - can embed user:password | accept host/port/db only and take user+password from a credentialID (BASIC_AUTH) | script |
| HIGH | Distributed/Redis | 5062 | REDIS_SET_SDIFFSTORE | connectionString |  | string | connection string / URI field - can embed user:password | accept host/port/db only and take user+password from a credentialID (BASIC_AUTH) | script |
| HIGH | Distributed/Redis | 5063 | REDIS_ZSET_ZADD | connectionString |  | string | connection string / URI field - can embed user:password | accept host/port/db only and take user+password from a credentialID (BASIC_AUTH) | script |
| HIGH | Distributed/Redis | 5064 | REDIS_ZSET_ZCARD | connectionString |  | string | connection string / URI field - can embed user:password | accept host/port/db only and take user+password from a credentialID (BASIC_AUTH) | script |
| HIGH | Distributed/Redis | 5065 | REDIS_ZSET_ZCOUNT | connectionString |  | string | connection string / URI field - can embed user:password | accept host/port/db only and take user+password from a credentialID (BASIC_AUTH) | script |
| HIGH | Distributed/Redis | 5066 | REDIS_ZSET_ZRANGE | connectionString |  | string | connection string / URI field - can embed user:password | accept host/port/db only and take user+password from a credentialID (BASIC_AUTH) | script |
| HIGH | Distributed/Redis | 5067 | REDIS_ZSET_ZREVRANGE | connectionString |  | string | connection string / URI field - can embed user:password | accept host/port/db only and take user+password from a credentialID (BASIC_AUTH) | script |
| HIGH | Distributed/Redis | 5068 | REDIS_ZSET_ZRANK | connectionString |  | string | connection string / URI field - can embed user:password | accept host/port/db only and take user+password from a credentialID (BASIC_AUTH) | script |
| HIGH | Distributed/Redis | 5069 | REDIS_ZSET_ZREVRANK | connectionString |  | string | connection string / URI field - can embed user:password | accept host/port/db only and take user+password from a credentialID (BASIC_AUTH) | script |
| HIGH | Distributed/Redis | 5070 | REDIS_ZSET_ZSCORE | connectionString |  | string | connection string / URI field - can embed user:password | accept host/port/db only and take user+password from a credentialID (BASIC_AUTH) | script |
| HIGH | Distributed/Redis | 5071 | REDIS_ZSET_ZINCRBY | connectionString |  | string | connection string / URI field - can embed user:password | accept host/port/db only and take user+password from a credentialID (BASIC_AUTH) | script |
| HIGH | Distributed/Redis | 5072 | REDIS_ZSET_ZREM | connectionString |  | string | connection string / URI field - can embed user:password | accept host/port/db only and take user+password from a credentialID (BASIC_AUTH) | script |
| HIGH | Distributed/Redis | 5073 | REDIS_ZSET_ZPOPMIN | connectionString |  | string | connection string / URI field - can embed user:password | accept host/port/db only and take user+password from a credentialID (BASIC_AUTH) | script |
| HIGH | Distributed/Redis | 5074 | REDIS_ZSET_ZPOPMAX | connectionString |  | string | connection string / URI field - can embed user:password | accept host/port/db only and take user+password from a credentialID (BASIC_AUTH) | script |
| HIGH | Distributed/Redis | 5075 | REDIS_ZSET_ZINTERSTORE | connectionString |  | string | connection string / URI field - can embed user:password | accept host/port/db only and take user+password from a credentialID (BASIC_AUTH) | script |
| HIGH | Distributed/Redis | 5076 | REDIS_ZSET_ZUNIONSTORE | connectionString |  | string | connection string / URI field - can embed user:password | accept host/port/db only and take user+password from a credentialID (BASIC_AUTH) | script |
| HIGH | Distributed/Redis | 5077 | REDIS_ZSET_ZRANGEBYSCORE | connectionString |  | string | connection string / URI field - can embed user:password | accept host/port/db only and take user+password from a credentialID (BASIC_AUTH) | script |
| HIGH | Distributed/Redis | 5078 | REDIS_ZSET_ZREVRANGEBYSCORE | connectionString |  | string | connection string / URI field - can embed user:password | accept host/port/db only and take user+password from a credentialID (BASIC_AUTH) | script |
| HIGH | Distributed/Redis | 5079 | REDIS_ZSET_ZREMRANGEBYRANK | connectionString |  | string | connection string / URI field - can embed user:password | accept host/port/db only and take user+password from a credentialID (BASIC_AUTH) | script |
| HIGH | Distributed/Redis | 5080 | REDIS_ZSET_ZREMRANGEBYSCORE | connectionString |  | string | connection string / URI field - can embed user:password | accept host/port/db only and take user+password from a credentialID (BASIC_AUTH) | script |
| HIGH | Distributed/Redis | 5081 | REDIS_STREAM_XADD | connectionString |  | string | connection string / URI field - can embed user:password | accept host/port/db only and take user+password from a credentialID (BASIC_AUTH) | script |
| HIGH | Distributed/Redis | 5082 | REDIS_STREAM_XLEN | connectionString |  | string | connection string / URI field - can embed user:password | accept host/port/db only and take user+password from a credentialID (BASIC_AUTH) | script |
| HIGH | Distributed/Redis | 5083 | REDIS_STREAM_XRANGE | connectionString |  | string | connection string / URI field - can embed user:password | accept host/port/db only and take user+password from a credentialID (BASIC_AUTH) | script |
| HIGH | Distributed/Redis | 5084 | REDIS_STREAM_XREVRANGE | connectionString |  | string | connection string / URI field - can embed user:password | accept host/port/db only and take user+password from a credentialID (BASIC_AUTH) | script |
| HIGH | Distributed/Redis | 5085 | REDIS_STREAM_XREAD | connectionString |  | string | connection string / URI field - can embed user:password | accept host/port/db only and take user+password from a credentialID (BASIC_AUTH) | script |
| HIGH | Distributed/Redis | 5086 | REDIS_STREAM_XGROUP | connectionString |  | string | connection string / URI field - can embed user:password | accept host/port/db only and take user+password from a credentialID (BASIC_AUTH) | script |
| HIGH | Distributed/Redis | 5087 | REDIS_STREAM_XREADGROUP | connectionString |  | string | connection string / URI field - can embed user:password | accept host/port/db only and take user+password from a credentialID (BASIC_AUTH) | script |
| HIGH | Distributed/Redis | 5088 | REDIS_STREAM_XACK | connectionString |  | string | connection string / URI field - can embed user:password | accept host/port/db only and take user+password from a credentialID (BASIC_AUTH) | script |
| HIGH | Distributed/Redis | 5089 | REDIS_STREAM_XPENDING | connectionString |  | string | connection string / URI field - can embed user:password | accept host/port/db only and take user+password from a credentialID (BASIC_AUTH) | script |
| HIGH | Distributed/Redis | 5090 | REDIS_STREAM_XTRIM | connectionString |  | string | connection string / URI field - can embed user:password | accept host/port/db only and take user+password from a credentialID (BASIC_AUTH) | script |
| HIGH | Distributed/Redis | 5091 | REDIS_PUBSUB_PUBLISH | connectionString |  | string | connection string / URI field - can embed user:password | accept host/port/db only and take user+password from a credentialID (BASIC_AUTH) | script |
| HIGH | Distributed/Redis | 5092 | REDIS_PUBSUB_SUBSCRIBE | connectionString |  | string | connection string / URI field - can embed user:password | accept host/port/db only and take user+password from a credentialID (BASIC_AUTH) | script |
| HIGH | Distributed/Redis | 5093 | REDIS_PUBSUB_UNSUBSCRIBE | connectionString |  | string | connection string / URI field - can embed user:password | accept host/port/db only and take user+password from a credentialID (BASIC_AUTH) | script |
| HIGH | Distributed/Redis | 5094 | REDIS_PUBSUB_PSUBSCRIBE | connectionString |  | string | connection string / URI field - can embed user:password | accept host/port/db only and take user+password from a credentialID (BASIC_AUTH) | script |
| HIGH | Distributed/Redis | 5095 | REDIS_PUBSUB_PUNSUBSCRIBE | connectionString |  | string | connection string / URI field - can embed user:password | accept host/port/db only and take user+password from a credentialID (BASIC_AUTH) | script |
| HIGH | Distributed/Redis | 5096 | REDIS_PUBSUB_PUBSUB | connectionString |  | string | connection string / URI field - can embed user:password | accept host/port/db only and take user+password from a credentialID (BASIC_AUTH) | script |
| HIGH | Distributed/Redis | 5097 | REDIS_SERVER_INFO | connectionString |  | string | connection string / URI field - can embed user:password | accept host/port/db only and take user+password from a credentialID (BASIC_AUTH) | script |
| HIGH | Distributed/Redis | 5098 | REDIS_SERVER_DBSIZE | connectionString |  | string | connection string / URI field - can embed user:password | accept host/port/db only and take user+password from a credentialID (BASIC_AUTH) | script |
| HIGH | Distributed/Redis | 5099 | REDIS_SERVER_FLUSHDB | connectionString |  | string | connection string / URI field - can embed user:password | accept host/port/db only and take user+password from a credentialID (BASIC_AUTH) | script |
| HIGH | Distributed/Redis | 5100 | REDIS_SERVER_SELECT | connectionString |  | string | connection string / URI field - can embed user:password | accept host/port/db only and take user+password from a credentialID (BASIC_AUTH) | script |
| HIGH | Distributed/Redis | 5101 | REDIS_SERVER_BGSAVE | connectionString |  | string | connection string / URI field - can embed user:password | accept host/port/db only and take user+password from a credentialID (BASIC_AUTH) | script |
| HIGH | Distributed/Redis | 5102 | REDIS_SERVER_CONFIG | connectionString |  | string | connection string / URI field - can embed user:password | accept host/port/db only and take user+password from a credentialID (BASIC_AUTH) | script |
| HIGH | Distributed/Redis | 5103 | REDIS_SERVER_SLOWLOG | connectionString |  | string | connection string / URI field - can embed user:password | accept host/port/db only and take user+password from a credentialID (BASIC_AUTH) | script |
| HIGH | FlowAiAgent/FlowAiAgent | 10000852 | FLOW_AI_AGENT_SQL_ADVANCED | sqlConnectionString | Connection String | password | connection string / URI field - can embed user:password | accept host/port/db only and take user+password from a credentialID (BASIC_AUTH) | script |
| HIGH | IaaS/Deploy | 40203 | DEPLOY | username | Username | text | username collected on the same form as a password | move username and password together into credential BASIC_AUTH | script |
| HIGH | IaaS/Deploy | 40385 | DEPLOY | username | Username | text | username collected on the same form as a password | move username and password together into credential BASIC_AUTH | script |
| HIGH | IaaS/Deploy | 40386 | DEPLOY | username | Username | text | username collected on the same form as a password | move username and password together into credential BASIC_AUTH | script |
| HIGH | IaaS/Deploy | 40387 | DEPLOY | username | Username | text | username collected on the same form as a password | move username and password together into credential BASIC_AUTH | script |
| HIGH | IaaS/Docker | 34001 | DOCKER_CONTAINER_LIST | tlsCertPath | TLS Cert Path | text | points at a key/cert/credential file on the server | remove; use credential type CERTIFICATE / PRIVATE_KEY (proposed) | script |
| HIGH | IaaS/Docker | 34002 | DOCKER_CONTAINER_INSPECT | tlsCertPath | TLS Cert Path | text | points at a key/cert/credential file on the server | remove; use credential type CERTIFICATE / PRIVATE_KEY (proposed) | script |
| HIGH | IaaS/Docker | 34003 | DOCKER_CONTAINER_CREATE | env | Env | code-editor | environment-variable map (values often hold secrets) | split: plain vars stay, secret vars come from a credential (SECRET_ENV_SET proposed) | script |
| HIGH | IaaS/Docker | 34003 | DOCKER_CONTAINER_CREATE | tlsCertPath | TLS Cert Path | text | points at a key/cert/credential file on the server | remove; use credential type CERTIFICATE / PRIVATE_KEY (proposed) | script |
| HIGH | IaaS/Docker | 34004 | DOCKER_CONTAINER_START | tlsCertPath | TLS Cert Path | text | points at a key/cert/credential file on the server | remove; use credential type CERTIFICATE / PRIVATE_KEY (proposed) | script |
| HIGH | IaaS/Docker | 34005 | DOCKER_CONTAINER_STOP | tlsCertPath | TLS Cert Path | text | points at a key/cert/credential file on the server | remove; use credential type CERTIFICATE / PRIVATE_KEY (proposed) | script |
| HIGH | IaaS/Docker | 34006 | DOCKER_CONTAINER_RESTART | tlsCertPath | TLS Cert Path | text | points at a key/cert/credential file on the server | remove; use credential type CERTIFICATE / PRIVATE_KEY (proposed) | script |
| HIGH | IaaS/Docker | 34007 | DOCKER_CONTAINER_REMOVE | tlsCertPath | TLS Cert Path | text | points at a key/cert/credential file on the server | remove; use credential type CERTIFICATE / PRIVATE_KEY (proposed) | script |
| HIGH | IaaS/Docker | 34008 | DOCKER_CONTAINER_EXEC | tlsCertPath | TLS Cert Path | text | points at a key/cert/credential file on the server | remove; use credential type CERTIFICATE / PRIVATE_KEY (proposed) | script |
| HIGH | IaaS/Docker | 34009 | DOCKER_CONTAINER_STATS | tlsCertPath | TLS Cert Path | text | points at a key/cert/credential file on the server | remove; use credential type CERTIFICATE / PRIVATE_KEY (proposed) | script |
| HIGH | IaaS/Docker | 34010 | DOCKER_CONTAINER_LOGS | tlsCertPath | TLS Cert Path | text | points at a key/cert/credential file on the server | remove; use credential type CERTIFICATE / PRIVATE_KEY (proposed) | script |
| HIGH | IaaS/Docker | 34011 | DOCKER_IMAGE_LIST | tlsCertPath | TLS Cert Path | text | points at a key/cert/credential file on the server | remove; use credential type CERTIFICATE / PRIVATE_KEY (proposed) | script |
| HIGH | IaaS/Docker | 34012 | DOCKER_IMAGE_INSPECT | tlsCertPath | TLS Cert Path | text | points at a key/cert/credential file on the server | remove; use credential type CERTIFICATE / PRIVATE_KEY (proposed) | script |
| HIGH | IaaS/Docker | 34013 | DOCKER_IMAGE_PULL | registryUsername | Registry Username | text | username collected on the same form as a password | move username and password together into credential BASIC_AUTH | script |
| HIGH | IaaS/Docker | 34013 | DOCKER_IMAGE_PULL | tlsCertPath | TLS Cert Path | text | points at a key/cert/credential file on the server | remove; use credential type CERTIFICATE / PRIVATE_KEY (proposed) | script |
| HIGH | IaaS/Docker | 34013 | DOCKER_IMAGE_PULL | userName | Username | text | username collected on the same form as a password | move username and password together into credential BASIC_AUTH | script |
| HIGH | IaaS/Docker | 34014 | DOCKER_IMAGE_REMOVE | tlsCertPath | TLS Cert Path | text | points at a key/cert/credential file on the server | remove; use credential type CERTIFICATE / PRIVATE_KEY (proposed) | script |
| HIGH | IaaS/Docker | 34015 | DOCKER_IMAGE_TAG | tlsCertPath | TLS Cert Path | text | points at a key/cert/credential file on the server | remove; use credential type CERTIFICATE / PRIVATE_KEY (proposed) | script |
| HIGH | IaaS/Docker | 34016 | DOCKER_VOLUME_LIST | tlsCertPath | TLS Cert Path | text | points at a key/cert/credential file on the server | remove; use credential type CERTIFICATE / PRIVATE_KEY (proposed) | script |
| HIGH | IaaS/Docker | 34017 | DOCKER_VOLUME_CREATE | tlsCertPath | TLS Cert Path | text | points at a key/cert/credential file on the server | remove; use credential type CERTIFICATE / PRIVATE_KEY (proposed) | script |
| HIGH | IaaS/Docker | 34018 | DOCKER_VOLUME_INSPECT | tlsCertPath | TLS Cert Path | text | points at a key/cert/credential file on the server | remove; use credential type CERTIFICATE / PRIVATE_KEY (proposed) | script |
| HIGH | IaaS/Docker | 34019 | DOCKER_VOLUME_REMOVE | tlsCertPath | TLS Cert Path | text | points at a key/cert/credential file on the server | remove; use credential type CERTIFICATE / PRIVATE_KEY (proposed) | script |
| HIGH | IaaS/Docker | 34020 | DOCKER_NETWORK_LIST | tlsCertPath | TLS Cert Path | text | points at a key/cert/credential file on the server | remove; use credential type CERTIFICATE / PRIVATE_KEY (proposed) | script |
| HIGH | IaaS/Docker | 34021 | DOCKER_NETWORK_CREATE | tlsCertPath | TLS Cert Path | text | points at a key/cert/credential file on the server | remove; use credential type CERTIFICATE / PRIVATE_KEY (proposed) | script |
| HIGH | IaaS/Docker | 34022 | DOCKER_NETWORK_INSPECT | tlsCertPath | TLS Cert Path | text | points at a key/cert/credential file on the server | remove; use credential type CERTIFICATE / PRIVATE_KEY (proposed) | script |
| HIGH | IaaS/Docker | 34023 | DOCKER_NETWORK_CONNECT | tlsCertPath | TLS Cert Path | text | points at a key/cert/credential file on the server | remove; use credential type CERTIFICATE / PRIVATE_KEY (proposed) | script |
| HIGH | IaaS/Docker | 34024 | DOCKER_NETWORK_DISCONNECT | tlsCertPath | TLS Cert Path | text | points at a key/cert/credential file on the server | remove; use credential type CERTIFICATE / PRIVATE_KEY (proposed) | script |
| HIGH | IaaS/Docker | 34025 | DOCKER_NETWORK_REMOVE | tlsCertPath | TLS Cert Path | text | points at a key/cert/credential file on the server | remove; use credential type CERTIFICATE / PRIVATE_KEY (proposed) | script |
| HIGH | IaaS/Docker | 34026 | DOCKER_SYSTEM_INFO | tlsCertPath | TLS Cert Path | text | points at a key/cert/credential file on the server | remove; use credential type CERTIFICATE / PRIVATE_KEY (proposed) | script |
| HIGH | IaaS/Docker | 34027 | DOCKER_SYSTEM_VERSION | tlsCertPath | TLS Cert Path | text | points at a key/cert/credential file on the server | remove; use credential type CERTIFICATE / PRIVATE_KEY (proposed) | script |
| HIGH | IaaS/Docker | 34028 | DOCKER_SYSTEM_PING | tlsCertPath | TLS Cert Path | text | points at a key/cert/credential file on the server | remove; use credential type CERTIFICATE / PRIVATE_KEY (proposed) | script |
| HIGH | IaaS/Docker | 40201 | DOCKER | env | Env | code-editor | environment-variable map (values often hold secrets) | split: plain vars stay, secret vars come from a credential (SECRET_ENV_SET proposed) | script |
| HIGH | IaaS/Docker | 40201 | DOCKER | registryUsername | Registry Username | text | username collected on the same form as a password | move username and password together into credential BASIC_AUTH | script |
| HIGH | IaaS/Docker | 40201 | DOCKER | tlsCertPath | TLS Cert Path | text | points at a key/cert/credential file on the server | remove; use credential type CERTIFICATE / PRIVATE_KEY (proposed) | script |
| HIGH | IaaS/DockerCompose | 40200 | DOCKER-COMPOSE | environmentVariables | Environment Variables | code-editor | environment-variable map (values often hold secrets) | split: plain vars stay, secret vars come from a credential (SECRET_ENV_SET proposed) | script |
| HIGH | IaaS/DockerCompose | 40350 | DOCKER-COMPOSE | environmentVariables | Environment Variables | code-editor | environment-variable map (values often hold secrets) | split: plain vars stay, secret vars come from a credential (SECRET_ENV_SET proposed) | script |
| HIGH | IaaS/DockerCompose | 40351 | DOCKER-COMPOSE | environmentVariables | Environment Variables | code-editor | environment-variable map (values often hold secrets) | split: plain vars stay, secret vars come from a credential (SECRET_ENV_SET proposed) | script |
| HIGH | IaaS/DockerCompose | 40356 | DOCKER-COMPOSE | environmentVariables | Environment Variables | code-editor | environment-variable map (values often hold secrets) | split: plain vars stay, secret vars come from a credential (SECRET_ENV_SET proposed) | script |
| HIGH | IaaS/Ssh | 40202 | SSH | username | Username | text | username collected on the same form as a password | move username and password together into credential BASIC_AUTH | script |
| HIGH | IaaS/Ssh | 40370 | SSH | username | Username | text | username collected on the same form as a password | move username and password together into credential BASIC_AUTH | script |
| HIGH | IaaS/Ssh | 40371 | SSH | username | Username | text | username collected on the same form as a password | move username and password together into credential BASIC_AUTH | script |
| HIGH | IaaS/Ssh | 40372 | SSH | username | Username | text | username collected on the same form as a password | move username and password together into credential BASIC_AUTH | script |
| HIGH | IaaS/Ssh | 40373 | SSH | username | Username | text | username collected on the same form as a password | move username and password together into credential BASIC_AUTH | script |
| HIGH | IaaS/Ssh | 40374 | SSH | username | Username | text | username collected on the same form as a password | move username and password together into credential BASIC_AUTH | script |
| HIGH | IaaS/Ssh | 40375 | SSH | username | Username | text | username collected on the same form as a password | move username and password together into credential BASIC_AUTH | script |
| HIGH | IaaS/Ssh | 40376 | SSH | username | Username | text | username collected on the same form as a password | move username and password together into credential BASIC_AUTH | script |
| HIGH | IaaS/Ssh | 40377 | SSH | username | Username | text | username collected on the same form as a password | move username and password together into credential BASIC_AUTH | script |
| HIGH | Mail/MailGun | 24000 | MAILGUN_MESSAGE_SEND | customHeaders | Custom Headers | text | free-form HTTP headers (can carry Authorization / X-Api-Key) | strip auth headers server-side; supply auth via credentialID; allow-list header names | script |
| HIGH | Mail/MailGun | 24001 | MAILGUN_MESSAGE_SEND_WITH_TEMPLATE | customHeaders | Custom Headers | text | free-form HTTP headers (can carry Authorization / X-Api-Key) | strip auth headers server-side; supply auth via credentialID; allow-list header names | script |
| HIGH | MySql/Forms | 25100 | MYSQL_QUERY_EXECUTE | connectionStringKey | Connection String Key | text | names a secret-store / config key that holds the secret (indirect); not a credentialID | replace with credentialID picker so the secret is resolved from the credential vault | script |
| HIGH | MySql/Forms | 25101 | MYSQL_BULK_COPY | destinationConnectionStringKey | Destination Connection String Key | text | names a secret-store / config key that holds the secret (indirect); not a credentialID | replace with credentialID picker so the secret is resolved from the credential vault | script |
| HIGH | MySql/Forms | 25101 | MYSQL_BULK_COPY | sourceConnectionStringKey | Source Connection String Key | text | names a secret-store / config key that holds the secret (indirect); not a credentialID | replace with credentialID picker so the secret is resolved from the credential vault | script |
| HIGH | MySql/Forms | 25102 | MYSQL_ROW_INSERT | connectionStringKey | Connection String Key | text | names a secret-store / config key that holds the secret (indirect); not a credentialID | replace with credentialID picker so the secret is resolved from the credential vault | script |
| HIGH | MySql/Forms | 25103 | MYSQL_ROW_UPDATE | connectionStringKey | Connection String Key | text | names a secret-store / config key that holds the secret (indirect); not a credentialID | replace with credentialID picker so the secret is resolved from the credential vault | script |
| HIGH | MySql/Forms | 25104 | MYSQL_ROW_UPSERT | connectionStringKey | Connection String Key | text | names a secret-store / config key that holds the secret (indirect); not a credentialID | replace with credentialID picker so the secret is resolved from the credential vault | script |
| HIGH | MySql/Forms | 25105 | MYSQL_ROW_DELETE | connectionStringKey | Connection String Key | text | names a secret-store / config key that holds the secret (indirect); not a credentialID | replace with credentialID picker so the secret is resolved from the credential vault | script |
| HIGH | MySql/Forms | 25106 | MYSQL_ROW_GET | connectionStringKey | Connection String Key | text | names a secret-store / config key that holds the secret (indirect); not a credentialID | replace with credentialID picker so the secret is resolved from the credential vault | script |
| HIGH | MySql/Forms | 25107 | MYSQL_ROW_GETMANY | connectionStringKey | Connection String Key | text | names a secret-store / config key that holds the secret (indirect); not a credentialID | replace with credentialID picker so the secret is resolved from the credential vault | script |
| HIGH | MySql/Forms | 25108 | MYSQL_ROW_UPDATEWHERE | connectionStringKey | Connection String Key | text | names a secret-store / config key that holds the secret (indirect); not a credentialID | replace with credentialID picker so the secret is resolved from the credential vault | script |
| HIGH | MySql/Forms | 25109 | MYSQL_ROW_APPLYRULES | connectionStringKey | Connection String Key | text | names a secret-store / config key that holds the secret (indirect); not a credentialID | replace with credentialID picker so the secret is resolved from the credential vault | script |
| HIGH | MySql/Forms | 25110 | MYSQL_ROW_AGGREGATE | connectionStringKey | Connection String Key | text | names a secret-store / config key that holds the secret (indirect); not a credentialID | replace with credentialID picker so the secret is resolved from the credential vault | script |
| HIGH | MySql/Forms | 25111 | MYSQL_ROW_COUNTWHERE | connectionStringKey | Connection String Key | text | names a secret-store / config key that holds the secret (indirect); not a credentialID | replace with credentialID picker so the secret is resolved from the credential vault | script |
| HIGH | MySql/Forms | 25112 | MYSQL_TABLE_CREATE | connectionStringKey | Connection String Key | text | names a secret-store / config key that holds the secret (indirect); not a credentialID | replace with credentialID picker so the secret is resolved from the credential vault | script |
| HIGH | MySql/Forms | 25113 | MYSQL_TABLE_DROP | connectionStringKey | Connection String Key | text | names a secret-store / config key that holds the secret (indirect); not a credentialID | replace with credentialID picker so the secret is resolved from the credential vault | script |
| HIGH | MySql/Forms | 25114 | MYSQL_TABLE_TRUNCATE | connectionStringKey | Connection String Key | text | names a secret-store / config key that holds the secret (indirect); not a credentialID | replace with credentialID picker so the secret is resolved from the credential vault | script |
| HIGH | MySql/Forms | 25115 | MYSQL_TABLE_LIST | connectionStringKey | Connection String Key | text | names a secret-store / config key that holds the secret (indirect); not a credentialID | replace with credentialID picker so the secret is resolved from the credential vault | script |
| HIGH | MySql/Forms | 25116 | MYSQL_TABLE_GETCOLUMNS | connectionStringKey | Connection String Key | text | names a secret-store / config key that holds the secret (indirect); not a credentialID | replace with credentialID picker so the secret is resolved from the credential vault | script |
| HIGH | MySql/Forms | 25117 | MYSQL_TABLE_ADDCOLUMN | connectionStringKey | Connection String Key | text | names a secret-store / config key that holds the secret (indirect); not a credentialID | replace with credentialID picker so the secret is resolved from the credential vault | script |
| HIGH | MySql/Forms | 25118 | MYSQL_TABLE_DROPCOLUMN | connectionStringKey | Connection String Key | text | names a secret-store / config key that holds the secret (indirect); not a credentialID | replace with credentialID picker so the secret is resolved from the credential vault | script |
| HIGH | MySql/Forms | 25119 | MYSQL_TABLE_ALTERCOLUMN | connectionStringKey | Connection String Key | text | names a secret-store / config key that holds the secret (indirect); not a credentialID | replace with credentialID picker so the secret is resolved from the credential vault | script |
| HIGH | MySql/Forms | 25120 | MYSQL_TABLE_RENAMECOLUMN | connectionStringKey | Connection String Key | text | names a secret-store / config key that holds the secret (indirect); not a credentialID | replace with credentialID picker so the secret is resolved from the credential vault | script |
| HIGH | MySql/Forms | 25121 | MYSQL_TABLE_CREATEINDEX | connectionStringKey | Connection String Key | text | names a secret-store / config key that holds the secret (indirect); not a credentialID | replace with credentialID picker so the secret is resolved from the credential vault | script |
| HIGH | MySql/Forms | 25122 | MYSQL_TABLE_DROPINDEX | connectionStringKey | Connection String Key | text | names a secret-store / config key that holds the secret (indirect); not a credentialID | replace with credentialID picker so the secret is resolved from the credential vault | script |
| HIGH | MySql/Forms | 25123 | MYSQL_TABLE_ADDFOREIGNKEY | connectionStringKey | Connection String Key | text | names a secret-store / config key that holds the secret (indirect); not a credentialID | replace with credentialID picker so the secret is resolved from the credential vault | script |
| HIGH | MySql/Forms | 25124 | MYSQL_TABLE_ADDUNIQUECONSTRAINT | connectionStringKey | Connection String Key | text | names a secret-store / config key that holds the secret (indirect); not a credentialID | replace with credentialID picker so the secret is resolved from the credential vault | script |
| HIGH | MySql/Forms | 25125 | MYSQL_TABLE_ADDCHECKCONSTRAINT | connectionStringKey | Connection String Key | text | names a secret-store / config key that holds the secret (indirect); not a credentialID | replace with credentialID picker so the secret is resolved from the credential vault | script |
| HIGH | MySql/Forms | 25126 | MYSQL_TABLE_DROPCONSTRAINT | connectionStringKey | Connection String Key | text | names a secret-store / config key that holds the secret (indirect); not a credentialID | replace with credentialID picker so the secret is resolved from the credential vault | script |
| HIGH | MySql/Forms | 25127 | MYSQL_TABLE_SETDEFAULT | connectionStringKey | Connection String Key | text | names a secret-store / config key that holds the secret (indirect); not a credentialID | replace with credentialID picker so the secret is resolved from the credential vault | script |
| HIGH | MySql/Forms | 25128 | MYSQL_SCHEMA_LIST | connectionStringKey | Connection String Key | text | names a secret-store / config key that holds the secret (indirect); not a credentialID | replace with credentialID picker so the secret is resolved from the credential vault | script |
| HIGH | MySql/Forms | 25129 | MYSQL_SCHEMA_GETTABLES | connectionStringKey | Connection String Key | text | names a secret-store / config key that holds the secret (indirect); not a credentialID | replace with credentialID picker so the secret is resolved from the credential vault | script |
| HIGH | MySql/Forms | 25130 | MYSQL_PROCEDURE_EXECUTE | connectionStringKey | Connection String Key | text | names a secret-store / config key that holds the secret (indirect); not a credentialID | replace with credentialID picker so the secret is resolved from the credential vault | script |
| HIGH | MySql/Forms | 25131 | MYSQL_PROCEDURE_LIST | connectionStringKey | Connection String Key | text | names a secret-store / config key that holds the secret (indirect); not a credentialID | replace with credentialID picker so the secret is resolved from the credential vault | script |
| HIGH | MySql/Forms | 25132 | MYSQL_BULK_INSERT | connectionStringKey | Connection String Key | text | names a secret-store / config key that holds the secret (indirect); not a credentialID | replace with credentialID picker so the secret is resolved from the credential vault | script |
| HIGH | MySql/Forms | 25133 | MYSQL_TRANSACTION_BEGIN | connectionStringKey | Connection String Key | text | names a secret-store / config key that holds the secret (indirect); not a credentialID | replace with credentialID picker so the secret is resolved from the credential vault | script |
| HIGH | MySql/Forms | 25136 | MYSQL_TRANSACTION_EXECUTEINTX | connectionStringKey | Connection String Key | text | names a secret-store / config key that holds the secret (indirect); not a credentialID | replace with credentialID picker so the secret is resolved from the credential vault | script |
| HIGH | PostgreSQL/Forms | ? |  | connectionStringKey | Connection String Key | text | names a secret-store / config key that holds the secret (indirect); not a credentialID | replace with credentialID picker so the secret is resolved from the credential vault | script |
| HIGH | PostgreSQL/Forms | ? |  | destinationConnectionStringKey | Destination Connection String Key | text | names a secret-store / config key that holds the secret (indirect); not a credentialID | replace with credentialID picker so the secret is resolved from the credential vault | script |
| HIGH | PostgreSQL/Forms | ? |  | sourceConnectionStringKey | Source Connection String Key | text | names a secret-store / config key that holds the secret (indirect); not a credentialID | replace with credentialID picker so the secret is resolved from the credential vault | script |
| HIGH | Productivity/GSheets | 23079 | GOOGLE_SHEETS | appSecretVaultKey | App Secret Vault Key | text | names a secret-store / config key that holds the secret (indirect); not a credentialID | replace with credentialID picker so the secret is resolved from the credential vault | script |
| HIGH | Productivity/Jira | 30021 | JIRA_USER_CREATE | username | Username | text | username collected on the same form as a password | move username and password together into credential BASIC_AUTH | script |
| HIGH | Productivity/Notion | 32045 | NOTION_TRIGGER_WEBHOOK | headers | Custom Headers | code-editor | free-form HTTP headers (can carry Authorization / X-Api-Key) | strip auth headers server-side; supply auth via credentialID; allow-list header names | db (script drift) |
| HIGH | ScrapeApi/Apify | 20200 | APIFY_ACTOR_RUN | customBody | Custom Input JSON | code-editor | free-form request body (may carry tokens/secrets) | keep but forbid secrets; use expression/credential references | script |
| HIGH | ScrapeApi/Apify | 20201 | APIFY_ACTOR_RUN_AND_GET_DATASET_ITEMS | customBody | Custom Input JSON | code-editor | free-form request body (may carry tokens/secrets) | keep but forbid secrets; use expression/credential references | script |
| HIGH | ScrapeApi/Apify | 20204 | APIFY_ACTOR_TASK_RUN | customBody | Custom Input JSON | code-editor | free-form request body (may carry tokens/secrets) | keep but forbid secrets; use expression/credential references | script |
| HIGH | ScrapeApi/Apify | 20205 | APIFY_ACTOR_TASK_RUN_AND_GET_DATASET_ITEMS | customBody | Custom Input JSON | code-editor | free-form request body (may carry tokens/secrets) | keep but forbid secrets; use expression/credential references | script |
| HIGH | Social/Instagram | 22002 | INSTAGRAM_TRIGGER_RECEIVE_EVENT | appSecretVaultKey | App Secret Vault Key | text | names a secret-store / config key that holds the secret (indirect); not a credentialID | replace with credentialID picker so the secret is resolved from the credential vault | script |
| HIGH | Social/Instagram | ? |  | appSecretVaultKey | App Secret Vault Key | text | names a secret-store / config key that holds the secret (indirect); not a credentialID | replace with credentialID picker so the secret is resolved from the credential vault | script |
| HIGH | Social/Instagram | 22020 | INSTAGRAM_AUTH_EXCHANGE_TOKEN | clientSecretVaultKey | Client Secret Vault Key | text | names a secret-store / config key that holds the secret (indirect); not a credentialID | replace with credentialID picker so the secret is resolved from the credential vault | script |
| HIGH | Social/Slack | 35002 | SLACK_MESSAGE_SEND | username | Username Override | text | username collected on the same form as a password | move username and password together into credential BASIC_AUTH | script |
| HIGH | Social/TikTok | 32072 | TIKTOK_ENGAGEMENT_SHARE | username | Username | text | username collected on the same form as a password | move username and password together into credential BASIC_AUTH | script |
| HIGH | Social/WhatsApp | 23072 | WHATSAPP_COMMERCE_RECEIVE_ORDER | appSecretVaultKey | App Secret Vault Key | text | names a secret-store / config key that holds the secret (indirect); not a credentialID | replace with credentialID picker so the secret is resolved from the credential vault | script |
| HIGH | Social/WhatsApp | 23073 | WHATSAPP_TRIGGER_MESSAGES | appSecretVaultKey | App Secret Vault Key | text | names a secret-store / config key that holds the secret (indirect); not a credentialID | replace with credentialID picker so the secret is resolved from the credential vault | script |
| HIGH | Social/WhatsApp | 23074 | WHATSAPP_TRIGGER_MESSAGE_STATUS | appSecretVaultKey | App Secret Vault Key | text | names a secret-store / config key that holds the secret (indirect); not a credentialID | replace with credentialID picker so the secret is resolved from the credential vault | script |
| HIGH | Social/WhatsApp | 23075 | WHATSAPP_TRIGGER_TEMPLATE_STATUS | appSecretVaultKey | App Secret Vault Key | text | names a secret-store / config key that holds the secret (indirect); not a credentialID | replace with credentialID picker so the secret is resolved from the credential vault | script |
| HIGH | Social/WhatsApp | 23076 | WHATSAPP_TRIGGER_ACCOUNT_UPDATE | appSecretVaultKey | App Secret Vault Key | text | names a secret-store / config key that holds the secret (indirect); not a credentialID | replace with credentialID picker so the secret is resolved from the credential vault | script |
| HIGH | Social/WhatsApp | 23077 | WHATSAPP_TRIGGER_PHONE_QUALITY_UPDATE | appSecretVaultKey | App Secret Vault Key | text | names a secret-store / config key that holds the secret (indirect); not a credentialID | replace with credentialID picker so the secret is resolved from the credential vault | script |
| HIGH | Social/WhatsApp | 23078 | WHATSAPP_TRIGGER_PHONE_NAME_UPDATE | appSecretVaultKey | App Secret Vault Key | text | names a secret-store / config key that holds the secret (indirect); not a credentialID | replace with credentialID picker so the secret is resolved from the credential vault | script |
| HIGH | SqlServer/Forms | 18500 | SQLSERVER_QUERY_EXECUTE | connectionStringKey | Connection String Key | text | names a secret-store / config key that holds the secret (indirect); not a credentialID | replace with credentialID picker so the secret is resolved from the credential vault | script |
| HIGH | SqlServer/Forms | 18501 | SQLSERVER_ROW_INSERT | connectionStringKey | Connection String Key | text | names a secret-store / config key that holds the secret (indirect); not a credentialID | replace with credentialID picker so the secret is resolved from the credential vault | script |
| HIGH | SqlServer/Forms | 18502 | SQLSERVER_ROW_UPDATE | connectionStringKey | Connection String Key | text | names a secret-store / config key that holds the secret (indirect); not a credentialID | replace with credentialID picker so the secret is resolved from the credential vault | script |
| HIGH | SqlServer/Forms | 18503 | SQLSERVER_ROW_UPSERT | connectionStringKey | Connection String Key | text | names a secret-store / config key that holds the secret (indirect); not a credentialID | replace with credentialID picker so the secret is resolved from the credential vault | script |
| HIGH | SqlServer/Forms | 18504 | SQLSERVER_ROW_DELETE | connectionStringKey | Connection String Key | text | names a secret-store / config key that holds the secret (indirect); not a credentialID | replace with credentialID picker so the secret is resolved from the credential vault | script |
| HIGH | SqlServer/Forms | 18505 | SQLSERVER_ROW_GET | connectionStringKey | Connection String Key | text | names a secret-store / config key that holds the secret (indirect); not a credentialID | replace with credentialID picker so the secret is resolved from the credential vault | script |
| HIGH | SqlServer/Forms | 18506 | SQLSERVER_ROW_GETMANY | connectionStringKey | Connection String Key | text | names a secret-store / config key that holds the secret (indirect); not a credentialID | replace with credentialID picker so the secret is resolved from the credential vault | script |
| HIGH | SqlServer/Forms | 18507 | SQLSERVER_ROW_UPDATEWHERE | connectionStringKey | Connection String Key | text | names a secret-store / config key that holds the secret (indirect); not a credentialID | replace with credentialID picker so the secret is resolved from the credential vault | script |
| HIGH | SqlServer/Forms | 18508 | SQLSERVER_ROW_APPLYRULES | connectionStringKey | Connection String Key | text | names a secret-store / config key that holds the secret (indirect); not a credentialID | replace with credentialID picker so the secret is resolved from the credential vault | script |
| HIGH | SqlServer/Forms | 18509 | SQLSERVER_ROW_AGGREGATE | connectionStringKey | Connection String Key | text | names a secret-store / config key that holds the secret (indirect); not a credentialID | replace with credentialID picker so the secret is resolved from the credential vault | script |
| HIGH | SqlServer/Forms | 18510 | SQLSERVER_ROW_COUNTWHERE | connectionStringKey | Connection String Key | text | names a secret-store / config key that holds the secret (indirect); not a credentialID | replace with credentialID picker so the secret is resolved from the credential vault | script |
| HIGH | SqlServer/Forms | 18511 | SQLSERVER_TABLE_CREATE | connectionStringKey | Connection String Key | text | names a secret-store / config key that holds the secret (indirect); not a credentialID | replace with credentialID picker so the secret is resolved from the credential vault | script |
| HIGH | SqlServer/Forms | 18512 | SQLSERVER_TABLE_DROP | connectionStringKey | Connection String Key | text | names a secret-store / config key that holds the secret (indirect); not a credentialID | replace with credentialID picker so the secret is resolved from the credential vault | script |
| HIGH | SqlServer/Forms | 18513 | SQLSERVER_TABLE_TRUNCATE | connectionStringKey | Connection String Key | text | names a secret-store / config key that holds the secret (indirect); not a credentialID | replace with credentialID picker so the secret is resolved from the credential vault | script |
| HIGH | SqlServer/Forms | 18514 | SQLSERVER_TABLE_LIST | connectionStringKey | Connection String Key | text | names a secret-store / config key that holds the secret (indirect); not a credentialID | replace with credentialID picker so the secret is resolved from the credential vault | script |
| HIGH | SqlServer/Forms | 18515 | SQLSERVER_TABLE_GETCOLUMNS | connectionStringKey | Connection String Key | text | names a secret-store / config key that holds the secret (indirect); not a credentialID | replace with credentialID picker so the secret is resolved from the credential vault | script |
| HIGH | SqlServer/Forms | 18516 | SQLSERVER_TABLE_ADDCOLUMN | connectionStringKey | Connection String Key | text | names a secret-store / config key that holds the secret (indirect); not a credentialID | replace with credentialID picker so the secret is resolved from the credential vault | script |
| HIGH | SqlServer/Forms | 18517 | SQLSERVER_TABLE_DROPCOLUMN | connectionStringKey | Connection String Key | text | names a secret-store / config key that holds the secret (indirect); not a credentialID | replace with credentialID picker so the secret is resolved from the credential vault | script |
| HIGH | SqlServer/Forms | 18518 | SQLSERVER_TABLE_ALTERCOLUMN | connectionStringKey | Connection String Key | text | names a secret-store / config key that holds the secret (indirect); not a credentialID | replace with credentialID picker so the secret is resolved from the credential vault | script |
| HIGH | SqlServer/Forms | 18519 | SQLSERVER_TABLE_RENAMECOLUMN | connectionStringKey | Connection String Key | text | names a secret-store / config key that holds the secret (indirect); not a credentialID | replace with credentialID picker so the secret is resolved from the credential vault | script |
| HIGH | SqlServer/Forms | 18520 | SQLSERVER_TABLE_CREATEINDEX | connectionStringKey | Connection String Key | text | names a secret-store / config key that holds the secret (indirect); not a credentialID | replace with credentialID picker so the secret is resolved from the credential vault | script |
| HIGH | SqlServer/Forms | 18521 | SQLSERVER_TABLE_DROPINDEX | connectionStringKey | Connection String Key | text | names a secret-store / config key that holds the secret (indirect); not a credentialID | replace with credentialID picker so the secret is resolved from the credential vault | script |
| HIGH | SqlServer/Forms | 18522 | SQLSERVER_TABLE_ADDFOREIGNKEY | connectionStringKey | Connection String Key | text | names a secret-store / config key that holds the secret (indirect); not a credentialID | replace with credentialID picker so the secret is resolved from the credential vault | script |
| HIGH | SqlServer/Forms | 18523 | SQLSERVER_TABLE_ADDUNIQUECONSTRAINT | connectionStringKey | Connection String Key | text | names a secret-store / config key that holds the secret (indirect); not a credentialID | replace with credentialID picker so the secret is resolved from the credential vault | script |
| HIGH | SqlServer/Forms | 18524 | SQLSERVER_TABLE_DROPCONSTRAINT | connectionStringKey | Connection String Key | text | names a secret-store / config key that holds the secret (indirect); not a credentialID | replace with credentialID picker so the secret is resolved from the credential vault | script |
| HIGH | SqlServer/Forms | 18525 | SQLSERVER_TABLE_SETDEFAULT | connectionStringKey | Connection String Key | text | names a secret-store / config key that holds the secret (indirect); not a credentialID | replace with credentialID picker so the secret is resolved from the credential vault | script |
| HIGH | SqlServer/Forms | 18526 | SQLSERVER_TABLE_ADDCHECKCONSTRAINT | connectionStringKey | Connection String Key | text | names a secret-store / config key that holds the secret (indirect); not a credentialID | replace with credentialID picker so the secret is resolved from the credential vault | script |
| HIGH | SqlServer/Forms | 18527 | SQLSERVER_SCHEMA_LIST | connectionStringKey | Connection String Key | text | names a secret-store / config key that holds the secret (indirect); not a credentialID | replace with credentialID picker so the secret is resolved from the credential vault | script |
| HIGH | SqlServer/Forms | 18528 | SQLSERVER_SCHEMA_GETTABLES | connectionStringKey | Connection String Key | text | names a secret-store / config key that holds the secret (indirect); not a credentialID | replace with credentialID picker so the secret is resolved from the credential vault | script |
| HIGH | SqlServer/Forms | 18529 | SQLSERVER_PROCEDURE_EXECUTE | connectionStringKey | Connection String Key | text | names a secret-store / config key that holds the secret (indirect); not a credentialID | replace with credentialID picker so the secret is resolved from the credential vault | script |
| HIGH | SqlServer/Forms | 18530 | SQLSERVER_PROCEDURE_LIST | connectionStringKey | Connection String Key | text | names a secret-store / config key that holds the secret (indirect); not a credentialID | replace with credentialID picker so the secret is resolved from the credential vault | script |
| HIGH | SqlServer/Forms | 18531 | SQLSERVER_BULK_INSERT | connectionStringKey | Connection String Key | text | names a secret-store / config key that holds the secret (indirect); not a credentialID | replace with credentialID picker so the secret is resolved from the credential vault | script |
| HIGH | SqlServer/Forms | 18532 |  | connectionStringKey |  | string | names a secret-store / config key that holds the secret (indirect); not a credentialID | replace with credentialID picker so the secret is resolved from the credential vault | script |
| HIGH | SqlServer/Forms | 18532 |  | destinationConnectionStringKey |  | string | names a secret-store / config key that holds the secret (indirect); not a credentialID | replace with credentialID picker so the secret is resolved from the credential vault | script |
| HIGH | SqlServer/Forms | 18532 |  | sourceConnectionStringKey |  | string | names a secret-store / config key that holds the secret (indirect); not a credentialID | replace with credentialID picker so the secret is resolved from the credential vault | script |
| HIGH | SqlServer/Forms | 18533 | SQLSERVER_TRANSACTION_BEGIN | connectionStringKey | Connection String Key | text | names a secret-store / config key that holds the secret (indirect); not a credentialID | replace with credentialID picker so the secret is resolved from the credential vault | script |
| HIGH | SqlServer/Forms | 18536 | SQLSERVER_TRANSACTION_EXECUTEINTX | connectionStringKey | Connection String Key | text | names a secret-store / config key that holds the secret (indirect); not a credentialID | replace with credentialID picker so the secret is resolved from the credential vault | script |
| HIGH | SqlServer/Forms | 25001 | SQLSERVER_BULK_COPY | destinationConnectionStringKey | Destination Connection String Key | text | names a secret-store / config key that holds the secret (indirect); not a credentialID | replace with credentialID picker so the secret is resolved from the credential vault | script |
| HIGH | SqlServer/Forms | 25001 | SQLSERVER_BULK_COPY | sourceConnectionStringKey | Source Connection String Key | text | names a secret-store / config key that holds the secret (indirect); not a credentialID | replace with credentialID picker so the secret is resolved from the credential vault | script |
| HIGH | Standard/HttpRequest | 11031 | HTTP_REQUEST_HTTP_REQUEST | headers | Headers | key-value-pairs | free-form HTTP headers (can carry Authorization / X-Api-Key) | strip auth headers server-side; supply auth via credentialID; allow-list header names | script |
| HIGH | Standard/Ses | 35043 | SES_TEMPLATE_CREATE | accessKeyId | AWS Access Key ID | text | access key ID (half of an access key pair) | move with its secret half into credential type AWS_ACCESS_KEY (proposed) | script |
| HIGH | Standard/Ses | 35044 | SES_TEMPLATE_GET | accessKeyId | AWS Access Key ID | text | access key ID (half of an access key pair) | move with its secret half into credential type AWS_ACCESS_KEY (proposed) | script |
| HIGH | Standard/Ses | 35045 | SES_TEMPLATE_GETMANY | accessKeyId | AWS Access Key ID | text | access key ID (half of an access key pair) | move with its secret half into credential type AWS_ACCESS_KEY (proposed) | script |
| HIGH | Standard/Ses | 35046 | SES_TEMPLATE_UPDATE | accessKeyId | AWS Access Key ID | text | access key ID (half of an access key pair) | move with its secret half into credential type AWS_ACCESS_KEY (proposed) | script |
| HIGH | Standard/Ses | 35047 | SES_TEMPLATE_DELETE | accessKeyId | AWS Access Key ID | text | access key ID (half of an access key pair) | move with its secret half into credential type AWS_ACCESS_KEY (proposed) | script |
| HIGH | Standard/Ses | 35048 | SES_EMAIL_SEND | accessKeyId | AWS Access Key ID | text | access key ID (half of an access key pair) | move with its secret half into credential type AWS_ACCESS_KEY (proposed) | script |
| HIGH | Standard/Ses | 35049 | SES_EMAIL_SENDTEMPLATE | accessKeyId | AWS Access Key ID | text | access key ID (half of an access key pair) | move with its secret half into credential type AWS_ACCESS_KEY (proposed) | script |
| HIGH | Standard/Ses | 35050 | SES_CUSTOMVERIFICATION_CREATE | accessKeyId | AWS Access Key ID | text | access key ID (half of an access key pair) | move with its secret half into credential type AWS_ACCESS_KEY (proposed) | script |
| HIGH | Standard/Ses | 35051 | SES_CUSTOMVERIFICATION_GET | accessKeyId | AWS Access Key ID | text | access key ID (half of an access key pair) | move with its secret half into credential type AWS_ACCESS_KEY (proposed) | script |
| HIGH | Standard/Ses | 35052 | SES_CUSTOMVERIFICATION_GETMANY | accessKeyId | AWS Access Key ID | text | access key ID (half of an access key pair) | move with its secret half into credential type AWS_ACCESS_KEY (proposed) | script |
| HIGH | Standard/Ses | 35053 | SES_CUSTOMVERIFICATION_UPDATE | accessKeyId | AWS Access Key ID | text | access key ID (half of an access key pair) | move with its secret half into credential type AWS_ACCESS_KEY (proposed) | script |
| HIGH | Standard/Ses | 35054 | SES_CUSTOMVERIFICATION_SEND | accessKeyId | AWS Access Key ID | text | access key ID (half of an access key pair) | move with its secret half into credential type AWS_ACCESS_KEY (proposed) | script |
| HIGH | Standard/Ses | 35055 | SES_CUSTOMVERIFICATION_DELETE | accessKeyId | AWS Access Key ID | text | access key ID (half of an access key pair) | move with its secret half into credential type AWS_ACCESS_KEY (proposed) | script |
| HIGH | Standard/Smtp | 23090 | EMAIL_SMTP_EMAIL_SEND | headers | Custom Headers (JSON) | textarea | free-form HTTP headers (can carry Authorization / X-Api-Key) | strip auth headers server-side; supply auth via credentialID; allow-list header names | script |
| HIGH | Standard/Smtp | 23090 | EMAIL_SMTP_EMAIL_SEND | username |  | string | username collected on the same form as a password | move username and password together into credential BASIC_AUTH | script |
| HIGH | Standard/Smtp | 23090 | EMAIL_SMTP_EMAIL_SEND | userName | Username | text | username collected on the same form as a password | move username and password together into credential BASIC_AUTH | script |


### 3.2 MEDIUM (security-threat surface, aggregated per node and category)

| Category | Group/Node | Forms (FormIDs) | Field IDs | Reason | Suggested fix |
|---|---|---|---|---|---|
| auth-disabled | (db-only)/node-capability-actor-in-loop-editor | 12015 | allowsAnonymous | flag that can disable/bypass authentication | remove or default to safe; require admin approval |
| auth-disabled | (db-only)/node-capability-server-editor | 12014 | allowAnonymousRead | flag that can disable/bypass authentication | remove or default to safe; require admin approval |
| auth-none-option | (db-only)/node-capability-mcp-editor | 12013 | authType | authentication selector offers "none" | default to an authenticated mode; audit use of "none" |
| auth-none-option | (db-only)/node-capability-service-editor | 12004 | authType | authentication selector offers "none" | default to an authenticated mode; audit use of "none" |
| auth-none-option | (db-only)/node-capability-webhook-editor | 12003 | authType | authentication selector offers "none" | default to an authenticated mode; audit use of "none" |
| auth-none-option | Blockchain/IPFS | 10000369, 10000370, 10000371, 10000372, 10000373, 10000374, 10000375, 10000376, 10000377, 10000378, 10000379, 10000380 (+45) | authMode | authentication selector offers "none" | default to an authenticated mode; audit use of "none" |
| auth-none-option | Productivity/Notion | 32045 | authentication | authentication selector offers "none" | default to an authenticated mode; audit use of "none" |
| code-exec | Ai/AI-Function | 11122 | script | script/code/shell command input (code execution) | sandbox/trusted-execution only; allow-list commands; never run on host |
| code-exec | Blockchain/Ethereum | 10000355, 10000357 | args | script/code/shell command input (code execution) | sandbox/trusted-execution only; allow-list commands; never run on host |
| code-exec | Core/Core/Script/CodeExecute | 11047 | script | script/code/shell command input (code execution) | sandbox/trusted-execution only; allow-list commands; never run on host |
| code-exec | Core/Core/Script/Function | 11126 | script | script/code/shell command input (code execution) | sandbox/trusted-execution only; allow-list commands; never run on host |
| code-exec | IaaS/Docker | 34003, 34008, 40201 | command, dockerfile | script/code/shell command input (code execution) | sandbox/trusted-execution only; allow-list commands; never run on host |
| code-exec | IaaS/DockerCompose | 40200, 40350, 40351, 40356 | dockerfile, command | script/code/shell command input (code execution) | sandbox/trusted-execution only; allow-list commands; never run on host |
| code-exec | IaaS/Ssh | 40202, 40370, 40371 | command, script | script/code/shell command input (code execution) | sandbox/trusted-execution only; allow-list commands; never run on host |
| code-exec | Mail/MailGun | 24000, 24011 | code | script/code/shell command input (code execution) | sandbox/trusted-execution only; allow-list commands; never run on host |
| code-exec | ScrapeApi/Browserless | 20600, 20605, 20607 | code | script/code/shell command input (code execution) | sandbox/trusted-execution only; allow-list commands; never run on host |
| code-exec | Social/WhatsApp | 23038 | code | script/code/shell command input (code execution) | sandbox/trusted-execution only; allow-list commands; never run on host |
| cors | Blockchain/Safe | 10000829, 10000837, 10000838, 10000839, 10000840 | origin | CORS origin setting (wildcard risk) | reject "*" with credentials; allow-list |
| debug-log | Blockchain/IPFS | 10000378 | verbose | debug/verbose logging toggle (may log secrets/payloads) | ensure secrets are redacted; default off |
| expression | (db-only)/node-capability-rule-editor | 12008 | condition | expression field (server-side evaluation) | evaluate in sandboxed engine with no I/O |
| expression | Core/Core/Data/CollectionOperation | 11008 | expression | expression field (server-side evaluation) | evaluate in sandboxed engine with no I/O |
| expression | Core/Core/Logic/IfCondition | 11127 | condition | expression field (server-side evaluation) | evaluate in sandboxed engine with no I/O |
| expression | Core/Core/Logic/Switch | 11128 | expression | expression field (server-side evaluation) | evaluate in sandboxed engine with no I/O |
| expression | Core/Forms | 10000304 | expression | expression field (server-side evaluation) | evaluate in sandboxed engine with no I/O |
| expression | MySql/Forms | 25125 | conditions | expression field (server-side evaluation) | evaluate in sandboxed engine with no I/O |
| expression | SqlServer/Forms | 18526 | conditions | expression field (server-side evaluation) | evaluate in sandboxed engine with no I/O |
| file-path | (db-only)/node-capabilities-editor | 10005 | path | file system path input (path traversal / arbitrary file access) | constrain to a sandbox root; reject .. and absolute paths |
| file-path | (db-only)/node-capability-editor | 12000 | path | file system path input (path traversal / arbitrary file access) | constrain to a sandbox root; reject .. and absolute paths |
| file-path | (db-only)/node-form-common | 10006 | path | file system path input (path traversal / arbitrary file access) | constrain to a sandbox root; reject .. and absolute paths |
| file-path | (db-only)/search | 30500 | originalFileName | file system path input (path traversal / arbitrary file access) | constrain to a sandbox root; reject .. and absolute paths |
| file-path | Ai/AI-Function | 21017, 21020 | filePath, audioFilePath | file system path input (path traversal / arbitrary file access) | constrain to a sandbox root; reject .. and absolute paths |
| file-path | Ai/Flow/FlowRag | 10000281, 10000283, ? | fileName | file system path input (path traversal / arbitrary file access) | constrain to a sandbox root; reject .. and absolute paths |
| file-path | Blockchain/HashiCorp | 10000430, 10000431, 10000432, 10000433, 10000434, 10000435, 10000436, 10000437, 10000438, 10000439, 10000440, 10000441 (+4) | appRolePath | file system path input (path traversal / arbitrary file access) | constrain to a sandbox root; reject .. and absolute paths |
| file-path | Blockchain/IPFS | 10000369, 10000370, 10000371, 10000372, 10000373, 10000385, 10000389, 10000424, 10000428 | fileName, path, mfsSourcePath, mfsDestPath | file system path input (path traversal / arbitrary file access) | constrain to a sandbox root; reject .. and absolute paths |
| file-path | Core/Core/Data/VariableAssignment | 11027 | sourceDataLeafPath | file system path input (path traversal / arbitrary file access) | constrain to a sandbox root; reject .. and absolute paths |
| file-path | IaaS/Deploy | 40203, 40385, 40386 | composeFilePath, localPath, backupDir | file system path input (path traversal / arbitrary file access) | constrain to a sandbox root; reject .. and absolute paths |
| file-path | IaaS/Docker | 40201 | hostPath, outputPath, inputPath | file system path input (path traversal / arbitrary file access) | constrain to a sandbox root; reject .. and absolute paths |
| file-path | IaaS/DockerCompose | 40200, 40350, 40351, 40352, 40353, 40354, 40355, 40356, 40357, 40358, 40359, 40360 (+3) | composeFilePath | file system path input (path traversal / arbitrary file access) | constrain to a sandbox root; reject .. and absolute paths |
| file-path | IaaS/Ssh | 40202, 40370, 40371, 40372, 40373 | workingDirectory, localPath | file system path input (path traversal / arbitrary file access) | constrain to a sandbox root; reject .. and absolute paths |
| file-path | Productivity/GoogleDrive | 40260 | fileName | file system path input (path traversal / arbitrary file access) | constrain to a sandbox root; reject .. and absolute paths |
| file-path | Productivity/Jira | 30015 | fileName | file system path input (path traversal / arbitrary file access) | constrain to a sandbox root; reject .. and absolute paths |
| file-path | Productivity/MicrosoftExcel | 40400 | folderPath, fileName, tenantId | file system path input (path traversal / arbitrary file access) | constrain to a sandbox root; reject .. and absolute paths |
| file-path | Productivity/MicrosoftPowerPoint | 40410 | path, folderPath, fileName, tenantId | file system path input (path traversal / arbitrary file access) | constrain to a sandbox root; reject .. and absolute paths |
| file-path | Productivity/MicrosoftWord | 40290 | path, folderPath, fileName, tenantId | file system path input (path traversal / arbitrary file access) | constrain to a sandbox root; reject .. and absolute paths |
| file-path | Productivity/S3 | 20505, 20509, 20510, 20511 | downloadPath, folderPath | file system path input (path traversal / arbitrary file access) | constrain to a sandbox root; reject .. and absolute paths |
| file-path | Social/Slack | 35026 | fileName | file system path input (path traversal / arbitrary file access) | constrain to a sandbox root; reject .. and absolute paths |
| file-path | Social/WhatsApp | 23005, 23016 | filename, fileName | file system path input (path traversal / arbitrary file access) | constrain to a sandbox root; reject .. and absolute paths |
| file-path | Standard/Smtp | 23090 | fileName | file system path input (path traversal / arbitrary file access) | constrain to a sandbox root; reject .. and absolute paths |
| iam-broad | (db-only)/node-form-common | 801001 | roles | IAM / permission selector (over-broad grant risk) | restrict to least-privilege presets |
| iam-broad | Cloud/AzureBlob | 10000302 | permissions | IAM / permission selector (over-broad grant risk) | restrict to least-privilege presets |
| iam-broad | Core/Core/Human/Approval | 11100 | roles | IAM / permission selector (over-broad grant risk) | restrict to least-privilege presets |
| public-access | (db-only)/node-capability-form-editor | 12005 | isPublic | public-access / ACL selector (public read/exposure) | default private; guard public option with confirmation |
| public-access | Productivity/GoogleCalendar | 40250 | visibility | public-access / ACL selector (public read/exposure) | default private; guard public option with confirmation |
| public-access | Productivity/S3 | 20500, 20504, 20506 | cannedAcl | public-access / ACL selector (public read/exposure) | default private; guard public option with confirmation |
| raw-query | (db-only)/node-capability-datasource-editor | 12007 | query | raw query/SQL/filter text (injection risk) | use parameterized values; restrict to SELECT; server-side validation |
| raw-query | (db-only)/node-form-postgresql | 40567 | sql, filter, orderBy | raw query/SQL/filter text (injection risk) | use parameterized values; restrict to SELECT; server-side validation |
| raw-query | (db-only)/node-form-postgresql-query-execute | 40544 | sql | raw query/SQL/filter text (injection risk) | use parameterized values; restrict to SELECT; server-side validation |
| raw-query | (db-only)/node-form-postgresql-row-aggregate | 40600 | filter | raw query/SQL/filter text (injection risk) | use parameterized values; restrict to SELECT; server-side validation |
| raw-query | (db-only)/node-form-postgresql-row-applyrules | 40599 | filter | raw query/SQL/filter text (injection risk) | use parameterized values; restrict to SELECT; server-side validation |
| raw-query | (db-only)/node-form-postgresql-row-countwhere | 40601 | filter | raw query/SQL/filter text (injection risk) | use parameterized values; restrict to SELECT; server-side validation |
| raw-query | (db-only)/node-form-postgresql-row-getMany | 40550 | filter, orderBy | raw query/SQL/filter text (injection risk) | use parameterized values; restrict to SELECT; server-side validation |
| raw-query | (db-only)/node-form-postgresql-row-updatewhere | 40598 | filter | raw query/SQL/filter text (injection risk) | use parameterized values; restrict to SELECT; server-side validation |
| raw-query | (db-only)/node-form-postgresql-table-addcheckconstraint | 40610 | filter | raw query/SQL/filter text (injection risk) | use parameterized values; restrict to SELECT; server-side validation |
| raw-query | Ai/AI-Function | 21002, 21010, 21011, 21012, 21022 | query, sql | raw query/SQL/filter text (injection risk) | use parameterized values; restrict to SELECT; server-side validation |
| raw-query | Blockchain/Centrifuge | 20401, 20402, 20403, 20404, 20405 | query | raw query/SQL/filter text (injection risk) | use parameterized values; restrict to SELECT; server-side validation |
| raw-query | DB/ElasticSearch | 20307 | query | raw query/SQL/filter text (injection risk) | use parameterized values; restrict to SELECT; server-side validation |
| raw-query | MySql/Forms | 25100, 25107, 25108, 25109, 25110, 25111 | sql, filter, orderBy | raw query/SQL/filter text (injection risk) | use parameterized values; restrict to SELECT; server-side validation |
| raw-query | PostgreSQL/Forms | ? | sql, filter, orderBy | raw query/SQL/filter text (injection risk) | use parameterized values; restrict to SELECT; server-side validation |
| raw-query | Productivity/GoogleCalendar | 40250 | query | raw query/SQL/filter text (injection risk) | use parameterized values; restrict to SELECT; server-side validation |
| raw-query | Productivity/GoogleDrive | 40260 | query, orderBy | raw query/SQL/filter text (injection risk) | use parameterized values; restrict to SELECT; server-side validation |
| raw-query | Productivity/MicrosoftExcel | 40400 | query | raw query/SQL/filter text (injection risk) | use parameterized values; restrict to SELECT; server-side validation |
| raw-query | Productivity/MicrosoftPowerPoint | 40410 | query | raw query/SQL/filter text (injection risk) | use parameterized values; restrict to SELECT; server-side validation |
| raw-query | Productivity/MicrosoftWord | 40290 | query | raw query/SQL/filter text (injection risk) | use parameterized values; restrict to SELECT; server-side validation |
| raw-query | Productivity/Notion | 32032, 32033 | query, filter | raw query/SQL/filter text (injection risk) | use parameterized values; restrict to SELECT; server-side validation |
| raw-query | Social/Instagram | 22015 | query | raw query/SQL/filter text (injection risk) | use parameterized values; restrict to SELECT; server-side validation |
| raw-query | Social/Slack | 35008 | query | raw query/SQL/filter text (injection risk) | use parameterized values; restrict to SELECT; server-side validation |
| raw-query | SqlServer/Forms | 18500, 18506, 18507, 18508, 18509, 18510 | sql, filter, orderBy | raw query/SQL/filter text (injection risk) | use parameterized values; restrict to SELECT; server-side validation |
| raw-query | Standard/Gmail | 10000703, 10000719 | query | raw query/SQL/filter text (injection risk) | use parameterized values; restrict to SELECT; server-side validation |
| redirects | (db-only)/node-form-http-request | 11059 | allow_redirects, max_redirects | redirect handling (unrestricted redirect / SSRF chaining) | cap redirects; re-validate target each hop |
| redirects | Standard/HttpRequest | 11031 | allowRedirects, maxRedirects | redirect handling (unrestricted redirect / SSRF chaining) | cap redirects; re-validate target each hop |
| secret-reference | Blockchain/HashiCorp | 10000430, 10000431, 10000432, 10000433, 10000434, 10000435, 10000436, 10000437 | path | reference to a secret (name/path/arn), not the value itself | confirm it is only a reference; prefer a credential picker |
| ssrf-url-host | (db-only)/node-capability-did-properties | 12018 | resolutionEndpoint, serviceEndpoint | arbitrary URL / host input (SSRF / unrestricted egress; may embed user:pass@) | validate scheme (https), block private/link-local ranges, reject userinfo, allow-list where possible |
| ssrf-url-host | (db-only)/node-capability-didcomm-editor | 12016 | protocolUri, serviceEndpoint | arbitrary URL / host input (SSRF / unrestricted egress; may embed user:pass@) | validate scheme (https), block private/link-local ranges, reject userinfo, allow-list where possible |
| ssrf-url-host | (db-only)/node-capability-identity-editor | 12012 | didHost | arbitrary URL / host input (SSRF / unrestricted egress; may embed user:pass@) | validate scheme (https), block private/link-local ranges, reject userinfo, allow-list where possible |
| ssrf-url-host | (db-only)/node-capability-mcp-editor | 12013 | serverUrl | arbitrary URL / host input (SSRF / unrestricted egress; may embed user:pass@) | validate scheme (https), block private/link-local ranges, reject userinfo, allow-list where possible |
| ssrf-url-host | (db-only)/node-capability-server-editor | 12014 | proxyTarget, customDomain | arbitrary URL / host input (SSRF / unrestricted egress; may embed user:pass@) | validate scheme (https), block private/link-local ranges, reject userinfo, allow-list where possible |
| ssrf-url-host | (db-only)/node-capability-service-editor | 12004 | baseUrl | arbitrary URL / host input (SSRF / unrestricted egress; may embed user:pass@) | validate scheme (https), block private/link-local ranges, reject userinfo, allow-list where possible |
| ssrf-url-host | (db-only)/node-capability-webhook-editor | 12003 | callbackUrl | arbitrary URL / host input (SSRF / unrestricted egress; may embed user:pass@) | validate scheme (https), block private/link-local ranges, reject userinfo, allow-list where possible |
| ssrf-url-host | (db-only)/node-form-http-request | 11059 | url | arbitrary URL / host input (SSRF / unrestricted egress; may embed user:pass@) | validate scheme (https), block private/link-local ranges, reject userinfo, allow-list where possible |
| ssrf-url-host | Ai/AI-Function | 11121, 21019 | url | arbitrary URL / host input (SSRF / unrestricted egress; may embed user:pass@) | validate scheme (https), block private/link-local ranges, reject userinfo, allow-list where possible |
| ssrf-url-host | Ai/Ai-ToolServer | 11113 | url | arbitrary URL / host input (SSRF / unrestricted egress; may embed user:pass@) | validate scheme (https), block private/link-local ranges, reject userinfo, allow-list where possible |
| ssrf-url-host | Blockchain/IPFS | 10000369, 10000370, 10000371, 10000372, 10000373, 10000374, 10000375, 10000376, 10000377, 10000378, 10000379, 10000380 (+49) | baseUrl, remoteServiceEndpoint, clusterBaseUrl | arbitrary URL / host input (SSRF / unrestricted egress; may embed user:pass@) | validate scheme (https), block private/link-local ranges, reject userinfo, allow-list where possible |
| ssrf-url-host | Cloud/AzureBlob | 10000296 | sourceUri | arbitrary URL / host input (SSRF / unrestricted egress; may embed user:pass@) | validate scheme (https), block private/link-local ranges, reject userinfo, allow-list where possible |
| ssrf-url-host | DB/ElasticSearch | 20300, 20301, 20302, 20303, 20304, 20305, 20306, 20307, 20308, 20309, 20310 | host | arbitrary URL / host input (SSRF / unrestricted egress; may embed user:pass@) | validate scheme (https), block private/link-local ranges, reject userinfo, allow-list where possible |
| ssrf-url-host | FlowAiAgent/FlowAiAgent | 10000848, 10000850, 10000853 | llmBaseUrl, toolWorkflowBaseUrl, streamCallbackUrl | arbitrary URL / host input (SSRF / unrestricted egress; may embed user:pass@) | validate scheme (https), block private/link-local ranges, reject userinfo, allow-list where possible |
| ssrf-url-host | IaaS/Deploy | 40203, 40385, 40386, 40387 | host | arbitrary URL / host input (SSRF / unrestricted egress; may embed user:pass@) | validate scheme (https), block private/link-local ranges, reject userinfo, allow-list where possible |
| ssrf-url-host | IaaS/Docker | 34001, 34002, 34003, 34004, 34005, 34006, 34007, 34008, 34009, 34010, 34011, 34012 (+18) | host, serverAddress | arbitrary URL / host input (SSRF / unrestricted egress; may embed user:pass@) | validate scheme (https), block private/link-local ranges, reject userinfo, allow-list where possible |
| ssrf-url-host | IaaS/DockerCompose | 40200, 40358 | serverHost | arbitrary URL / host input (SSRF / unrestricted egress; may embed user:pass@) | validate scheme (https), block private/link-local ranges, reject userinfo, allow-list where possible |
| ssrf-url-host | IaaS/Ssh | 40202, 40370, 40371, 40372, 40373, 40374, 40375, 40376, 40377 | host | arbitrary URL / host input (SSRF / unrestricted egress; may embed user:pass@) | validate scheme (https), block private/link-local ranges, reject userinfo, allow-list where possible |
| ssrf-url-host | Mail/MailGun | 24000, 24001, 24002, 24009, 24010, 24011, 24012, 24013, 24014, 24015, 24016, 24017 (+17) | domain, pageUrl, url | arbitrary URL / host input (SSRF / unrestricted egress; may embed user:pass@) | validate scheme (https), block private/link-local ranges, reject userinfo, allow-list where possible |
| ssrf-url-host | Productivity/GoogleDocs | 40270 | imageUri, linkUrl | arbitrary URL / host input (SSRF / unrestricted egress; may embed user:pass@) | validate scheme (https), block private/link-local ranges, reject userinfo, allow-list where possible |
| ssrf-url-host | Productivity/GoogleDrive | 40260 | domain | arbitrary URL / host input (SSRF / unrestricted egress; may embed user:pass@) | validate scheme (https), block private/link-local ranges, reject userinfo, allow-list where possible |
| ssrf-url-host | Productivity/Jira | 30001, 30002, 30003, 30004, 30005, 30006, 30007, 30008, 30009, 30010, 30011, 30012 (+11) | host | arbitrary URL / host input (SSRF / unrestricted egress; may embed user:pass@) | validate scheme (https), block private/link-local ranges, reject userinfo, allow-list where possible |
| ssrf-url-host | Productivity/MicrosoftWord | 40290 | imageUrl | arbitrary URL / host input (SSRF / unrestricted egress; may embed user:pass@) | validate scheme (https), block private/link-local ranges, reject userinfo, allow-list where possible |
| ssrf-url-host | Productivity/Notion | 32045 | webhookUrl | arbitrary URL / host input (SSRF / unrestricted egress; may embed user:pass@) | validate scheme (https), block private/link-local ranges, reject userinfo, allow-list where possible |
| ssrf-url-host | Productivity/S3 | 20513 | serviceURL | arbitrary URL / host input (SSRF / unrestricted egress; may embed user:pass@) | validate scheme (https), block private/link-local ranges, reject userinfo, allow-list where possible |
| ssrf-url-host | RealEstate/Odoo | 36000, 36001, 36002, 36003, 36004, 36005, 36006, 36007, 36008, 36009, 36010, 36011 (+23) | siteUrl, domain | arbitrary URL / host input (SSRF / unrestricted egress; may embed user:pass@) | validate scheme (https), block private/link-local ranges, reject userinfo, allow-list where possible |
| ssrf-url-host | ScrapeApi/Apify | 20202 | url | arbitrary URL / host input (SSRF / unrestricted egress; may embed user:pass@) | validate scheme (https), block private/link-local ranges, reject userinfo, allow-list where possible |
| ssrf-url-host | ScrapeApi/Browserless | 20600, 20601, 20602, 20603, 20604, 20605, 20606, 20607, 20608 | baseUrl, url | arbitrary URL / host input (SSRF / unrestricted egress; may embed user:pass@) | validate scheme (https), block private/link-local ranges, reject userinfo, allow-list where possible |
| ssrf-url-host | Social/Facebook | 32046, 32058, 32059 | picture, imageUrl, videoUrl | arbitrary URL / host input (SSRF / unrestricted egress; may embed user:pass@) | validate scheme (https), block private/link-local ranges, reject userinfo, allow-list where possible |
| ssrf-url-host | Social/Instagram | 22001, 22003, 22004 | imageUrl, videoUrl, coverUrl | arbitrary URL / host input (SSRF / unrestricted egress; may embed user:pass@) | validate scheme (https), block private/link-local ranges, reject userinfo, allow-list where possible |
| ssrf-url-host | Social/TikTok | 32061 | videoUrl | arbitrary URL / host input (SSRF / unrestricted egress; may embed user:pass@) | validate scheme (https), block private/link-local ranges, reject userinfo, allow-list where possible |
| ssrf-url-host | Social/WhatsApp | 23001, 23002, 23003, 23004, 23005, 23059 | previewUrl, mediaUrl, imageUrl | arbitrary URL / host input (SSRF / unrestricted egress; may embed user:pass@) | validate scheme (https), block private/link-local ranges, reject userinfo, allow-list where possible |
| ssrf-url-host | Standard/HttpRequest | 11031 | url | arbitrary URL / host input (SSRF / unrestricted egress; may embed user:pass@) | validate scheme (https), block private/link-local ranges, reject userinfo, allow-list where possible |
| ssrf-url-host | Standard/Ses | 35050, 35053 | successRedirectUrl, failureRedirectUrl | arbitrary URL / host input (SSRF / unrestricted egress; may embed user:pass@) | validate scheme (https), block private/link-local ranges, reject userinfo, allow-list where possible |
| ssrf-url-host | Standard/Smtp | 23090 | host | arbitrary URL / host input (SSRF / unrestricted egress; may embed user:pass@) | validate scheme (https), block private/link-local ranges, reject userinfo, allow-list where possible |
| tls-bypass | DB/ElasticSearch | 20300, 20301, 20302, 20303, 20304, 20305, 20306, 20307, 20308, 20309 | allowInsecure | TLS verification bypass / weakening toggle (default: undefined) | default to verify=true; require admin permission to disable; consider removing |
| tls-bypass | Standard/Smtp | 23090 | allowUnauthorized | TLS verification bypass / weakening toggle (default: undefined) | default to verify=true; require admin permission to disable; consider removing |


### 3.3 Secret-looking defaults / sample data (values NOT shown)

None found by the pattern rules (sk-, ghp_, AKIA, xox*, JWT eyJ, PEM blocks, long random defaults on secret-named fields).


### 3.4 Excluded from counts: credential editor/viewer and control-library forms

These forms legitimately contain secret inputs (they are the credential vault UI) or are UI-control test forms. Listed for completeness; NOT counted above and NOT proposed for removal (Binoy to confirm).

| FormID | FormCode | Why excluded | Flagged fields |
|---|---|---|---|
| 12019 | ALL_CONTROLS_V1 | control library / SDK test form (not a node form) | url_input:MEDIUM, password_input:CRITICAL |
| 20701 | API_KEY_CredentialEditor | credential editor/viewer form (expected to hold secret inputs: this IS the credential vault UI) | apiKey:CRITICAL, apiSecret:CRITICAL, baseUrl:MEDIUM |
| 20702 | OAUTH2_CredentialEditor | credential editor/viewer form (expected to hold secret inputs: this IS the credential vault UI) | clientSecret:CRITICAL, authorizationUrl:MEDIUM, tokenUrl:MEDIUM, redirectUrl:MEDIUM, accessToken:CRITICAL, refreshToken:CRITICAL |
| 20703 | BASIC_AUTH_CredentialEditor | credential editor/viewer form (expected to hold secret inputs: this IS the credential vault UI) | password:CRITICAL, baseUrl:MEDIUM, username:HIGH |
| 20704 | BEARER_TOKEN_CredentialEditor | credential editor/viewer form (expected to hold secret inputs: this IS the credential vault UI) | token:CRITICAL, baseUrl:MEDIUM |
| 20705 | DATABASE_CredentialEditor | credential editor/viewer form (expected to hold secret inputs: this IS the credential vault UI) | host:MEDIUM, password:CRITICAL, ssl:MEDIUM, connectionString:CRITICAL, username:HIGH |
| 20706 | CRYPTO_WALLET_CredentialEditor | credential editor/viewer form (expected to hold secret inputs: this IS the credential vault UI) | privateKey:CRITICAL, seedPhrase:CRITICAL, rpcUrl:MEDIUM |
| 20708 | API_KEY_CredentialViewer | credential editor/viewer form (expected to hold secret inputs: this IS the credential vault UI) | _apiKeyStatus:CRITICAL, baseUrl:MEDIUM |
| 20710 | BASIC_AUTH_CredentialViewer | credential editor/viewer form (expected to hold secret inputs: this IS the credential vault UI) | _passwordStatus:CRITICAL, baseUrl:MEDIUM, username:HIGH |
| 20711 | BEARER_TOKEN_CredentialViewer | credential editor/viewer form (expected to hold secret inputs: this IS the credential vault UI) | _tokenStatus:CRITICAL, baseUrl:MEDIUM |
| 20712 | DATABASE_CredentialViewer | credential editor/viewer form (expected to hold secret inputs: this IS the credential vault UI) | host:MEDIUM, _passwordStatus:CRITICAL, username:HIGH |
| 20713 | CRYPTO_WALLET_CredentialViewer | credential editor/viewer form (expected to hold secret inputs: this IS the credential vault UI) | _privateKeyStatus:CRITICAL, _seedPhraseStatus:CRITICAL, rpcUrl:MEDIUM |
| 20714 | BOT_TOKEN_CredentialEditor | credential editor/viewer form (expected to hold secret inputs: this IS the credential vault UI) | botToken:CRITICAL, baseUrl:MEDIUM |
| 20715 | BOT_TOKEN_CredentialViewer | credential editor/viewer form (expected to hold secret inputs: this IS the credential vault UI) | _tokenStatus:CRITICAL, baseUrl:MEDIUM |
| 20716 | SERVICE_URL_CredentialEditor | credential editor/viewer form (expected to hold secret inputs: this IS the credential vault UI) | serviceUrl:CRITICAL, serviceUrl:MEDIUM |
| 20717 | SERVICE_URL_CredentialViewer | credential editor/viewer form (expected to hold secret inputs: this IS the credential vault UI) | _serviceUrlStatus:MEDIUM |
| 10001138 | CONTROL_REF_TEXT_FAMILY | control library / SDK test form (not a node form) | url_minimal:MEDIUM, password_field:CRITICAL |


### 3.5 DB forms with no script (db-only) and script FormIDs missing from the DB

db-only forms (163): 10000 OUTPUT_PORT_MAPPING; 10002 APPROVAL_NODE_RUNTIME_FORM; 10005 NODECAP_CAPABILITIES_EDITOR; 10006 NODECAP_CAPABILITIES_LIST; 10007 ; 10008 NODE_COMMON_DESIGNER_CONFIG; 10009 ; 10010 ; 10011 customer-onboarding-v1; 10012 customer-onboarding-v1; 11032 NODETYPE_STRIPE_PAYMENT_WEBHOOK; 11059 NODETYPE_HTTP_REQUEST; 11060 HIL_EMPLOYEE_ONBOARDING; 11109 NODEFORM_COMMON_OBSERVABILITY; 11110 NODEFORM_COMMON_MERGE_CONFIG; 12000 NODECAP_SINGLE_EDITOR; 12001 FORM_NODE_RUNTIME_INPUT; 12002 FORM_TRIGGER_NODE_DESIGNER_CONFIG; 12003 NODECAP_WEBHOOK_PROPERTIES; 12004 NODECAP_SERVICE_PROPERTIES; 12005 NODECAP_FORM_PROPERTIES; 12006 NODECAP_ENTITY_PROPERTIES; 12007 NODECAP_DATASOURCE_PROPERTIES; 12008 NODECAP_RULE_PROPERTIES; 12009 NODECAP_PROCESS_PROPERTIES; 12010 NODECAP_WIDGET_PROPERTIES; 12011 NODECAP_MESSAGING_PROPERTIES; 12012 NODECAP_IDENTITY_PROPERTIES; 12013 NODECAP_MCP_PROPERTIES; 12014 NODECAP_SERVER_PROPERTIES; 12015 NODECAP_ACTOR_IN_LOOP_PROPERTIES; 12016 NODECAP_DIDCOMM_PROPERTIES; 12017 NODECAP_IDENTITY_AUTH_PROPERTIES; 12018 NODECAP_DID_PROPERTIES; 12019 ALL_CONTROLS_V1; 12020 NODECAP_A2A_PROPERTIES; 13000 NODEGUARDRAILS_LIST; 13001 NODEGUARDRAILS_TIMEOUT_PROPERTIES; 13002 NODEGUARDRAILS_INPUTVALIDATION_PROPERTIES; 13003 NODEGUARDRAILS_PIIDETECTION_PROPERTIES; 13004 NODEGUARDRAILS_PIIREDACTION_PROPERTIES; 13005 NODEGUARDRAILS_RATELIMITING_PROPERTIES; 13006 NODEGUARDRAILS_CIRCUITBREAKER_PROPERTIES; 13007 NODEGUARDRAILS_CUSTOMGUARD_PROPERTIES; 14000 NODEPOLICIES_FIELD_LIST; 14001 NODEPOLICIES_FIELD_EDITOR; 14002 NODEPOLICIES_SUSPENSION_POLICY; 14003 NODEPOLICIES_EXPRESSION_POLICY_EDITOR; 14004 NODEPOLICIES_DATAFLOW_POLICY_EDITOR; 14005 NODEPOLICIES_HIL_POLICY_EDITOR; 14006 NODEPOLICIES_SECURITY_POLICY_EDITOR; 20700 CREDENTIAL_BASE_CredentialEditor; 20701 API_KEY_CredentialEditor; 20702 OAUTH2_CredentialEditor; 20703 BASIC_AUTH_CredentialEditor; 20704 BEARER_TOKEN_CredentialEditor; 20705 DATABASE_CredentialEditor; 20706 CRYPTO_WALLET_CredentialEditor; 20707 CREDENTIAL_BASE_CredentialViewer; 20708 API_KEY_CredentialViewer; 20709 OAUTH2_CredentialViewer; 20710 BASIC_AUTH_CredentialViewer; 20711 BEARER_TOKEN_CredentialViewer; 20712 DATABASE_CredentialViewer; 20713 CRYPTO_WALLET_CredentialViewer; 20714 BOT_TOKEN_CredentialEditor; 20715 BOT_TOKEN_CredentialViewer; 20716 SERVICE_URL_CredentialEditor; 20717 SERVICE_URL_CredentialViewer; 20800 DEMO_IMPORT_BASE; 20801 DEMO_IMPORT_DERIVED; 20802 DEMO_OVERRIDE_BASE; 20803 DEMO_OVERRIDE_DERIVED; 25000 SLACK_ROOT; 30500 documents_search_results_edit_v2; 30501 documents_view_edit_v1; 30600 jobs_definitions_search_results_edit_v1; 30601 jobs_definitions_view_edit_v1; 40544 POSTGRESQL_QUERY_EXECUTE; 40545 POSTGRESQL_ROW_INSERT; 40546 POSTGRESQL_ROW_UPDATE; 40547 POSTGRESQL_ROW_UPSERT; 40548 POSTGRESQL_ROW_DELETE; 40549 POSTGRESQL_ROW_GET; 40550 POSTGRESQL_ROW_GETMANY; 40551 POSTGRESQL_TABLE_CREATE; 40552 POSTGRESQL_TABLE_DROP; 40553 POSTGRESQL_TABLE_TRUNCATE; 40554 POSTGRESQL_TABLE_LIST; 40555 POSTGRESQL_TABLE_GETCOLUMNS; 40556 POSTGRESQL_SCHEMA_LIST; 40557 POSTGRESQL_SCHEMA_GETTABLES; 40558 POSTGRESQL_PROCEDURE_EXECUTE; 40559 POSTGRESQL_PROCEDURE_LIST; 40560 POSTGRESQL_BULK_INSERT; 40561 POSTGRESQL_BULK_COPY; 40562 POSTGRESQL_TRANSACTION_BEGIN; 40563 POSTGRESQL_TRANSACTION_COMMIT; 40564 POSTGRESQL_TRANSACTION_ROLLBACK; 40565 POSTGRESQL_TRANSACTION_EXECUTEINTX; 40567 POSTGRESQL_NODE; 40598 POSTGRESQL_ROW_UPDATEWHERE; 40599 POSTGRESQL_ROW_APPLYRULES; 40600 POSTGRESQL_ROW_AGGREGATE; 40601 POSTGRESQL_ROW_COUNTWHERE; 40602 POSTGRESQL_TABLE_ADDCOLUMN; 40603 POSTGRESQL_TABLE_DROPCOLUMN; 40604 POSTGRESQL_TABLE_ALTERCOLUMN; 40605 POSTGRESQL_TABLE_RENAMECOLUMN; 40606 POSTGRESQL_TABLE_CREATEINDEX; 40607 POSTGRESQL_TABLE_DROPINDEX; 40608 POSTGRESQL_TABLE_ADDUNIQUECONSTRAINT; 40609 POSTGRESQL_TABLE_ADDFOREIGNKEY; 40610 POSTGRESQL_TABLE_ADDCHECKCONSTRAINT; 40611 POSTGRESQL_TABLE_SETDEFAULT; 40612 POSTGRESQL_TABLE_DROPCONSTRAINT; 40615 POSTGRESQL_TABLE_PROFILE; 100700 NODEFORM_COMMON_ITERATION_CONFIG; 100800 NODEFORM_COMMON_SOURCE_DATA_PATH; 100801 NODEFORM_COMMON_TARGET_DATA_PATH; 100802 NODEFORM_COMMON_ERROR_MANAGEMENT; 100803 NODEFORM_DATAMAPPING_INITIAL_DATA_SOURCE; 100804 NODEFORM_DATAMAPPING_INITIAL_DATA_SOURCE_GRID; 100805 NODEFORM_COMMON_OUTPUT_DATA; 100890 NODEFORM_AUTONOMOUS_IDENTITY; 801001 CROSSNODE_WATCHER_CONFIG; 801002 CROSSNODE_RESPONSE_ACTIONS; 801003 CROSSNODE_RENDER_OPTIONS; 801004 CROSSNODE_NOTIFICATIONS; 801005 CROSSNODE_DISPLAY_SETTINGS; 801006 CROSSNODE_NODE_POLICIES; 801007 CROSSNODE_HIL_BASICS; 801008 CROSSNODE_HIL_CONVERSATION; 801009 CROSSNODE_HIL_FEATURES; 10001112 ONDO_ASSETS_GETALLPRICES; 10001113 ONDO_ASSETS_GETPRICE; 10001114 ONDO_ASSETS_GETALLENHANCEDPRICES; 10001115 ONDO_ASSETS_GETOHLCPRICES; 10001116 ONDO_ASSETS_GETALLMARKETS; 10001117 ONDO_ASSETS_GETMARKET ...


Script FormIDs not present in the DB (21): 50001 ONDO_ASSETS_GETALLPRICES [Ondo/Forms/Atlas_Forms_50001_ondo_assets_getallprices.data.sql]; 50002 ONDO_ASSETS_GETPRICE [Ondo/Forms/Atlas_Forms_50002_ondo_assets_getprice.data.sql]; 50003 ONDO_ASSETS_GETALLENHANCEDPRICES [Ondo/Forms/Atlas_Forms_50003_ondo_assets_getallenhancedprices.data.sql]; 50004 ONDO_ASSETS_GETOHLCPRICES [Ondo/Forms/Atlas_Forms_50004_ondo_assets_getohlcprices.data.sql]; 50005 ONDO_ASSETS_GETALLMARKETS [Ondo/Forms/Atlas_Forms_50005_ondo_assets_getallmarkets.data.sql]; 50006 ONDO_ASSETS_GETMARKET [Ondo/Forms/Atlas_Forms_50006_ondo_assets_getmarket.data.sql]; 50007 ONDO_ASSETS_GETLATESTDIVIDEND [Ondo/Forms/Atlas_Forms_50007_ondo_assets_getlatestdividend.data.sql]; 50008 ONDO_ASSETS_GETALLASSETADDRESSES [Ondo/Forms/Atlas_Forms_50008_ondo_assets_getallassetaddresses.data.sql]; 50009 ONDO_ASSETS_GETASSETADDRESSES [Ondo/Forms/Atlas_Forms_50009_ondo_assets_getassetaddresses.data.sql]; 50010 ONDO_ASSETS_GETALLASSETMETADATA [Ondo/Forms/Atlas_Forms_50010_ondo_assets_getallassetmetadata.data.sql]; 50011 ONDO_ASSETS_GETSHARESMULTIPLIER [Ondo/Forms/Atlas_Forms_50011_ondo_assets_getsharesmultiplier.data.sql]; 50012 ONDO_ATTESTATIONS_CREATE [Ondo/Forms/Atlas_Forms_50012_ondo_attestations_create.data.sql]; 50013 ONDO_ATTESTATIONS_CREATESOFTQUOTE [Ondo/Forms/Atlas_Forms_50013_ondo_attestations_createsoftquote.data.sql]; 50014 ONDO_CHAINS_GETBALANCES [Ondo/Forms/Atlas_Forms_50014_ondo_chains_getbalances.data.sql]; 50015 ONDO_CHAINS_GETTOKENINFO [Ondo/Forms/Atlas_Forms_50015_ondo_chains_gettokeninfo.data.sql]; 50016 ONDO_LIMITS_GETTRADINGLIMITS [Ondo/Forms/Atlas_Forms_50016_ondo_limits_gettradinglimits.data.sql]; 50017 ONDO_LIMITS_GETSESSIONLIMITS [Ondo/Forms/Atlas_Forms_50017_ondo_limits_getsessionlimits.data.sql]; 50018 ONDO_STATUS_GETMARKETSTATUS [Ondo/Forms/Atlas_Forms_50018_ondo_status_getmarketstatus.data.sql]; 50019 ONDO_STATUS_GETASSETSTATUSES [Ondo/Forms/Atlas_Forms_50019_ondo_status_getassetstatuses.data.sql]; 50020 ONDO_TICKERS_GETALLTICKERS [Ondo/Forms/Atlas_Forms_50020_ondo_tickers_getalltickers.data.sql]; 18532  [SqlServer/Forms/Atlas_Forms_18532_sqlserver_bulk_copy.data.sql]


## 4. Compliant pattern: credential picker fields

Total compliant credential fields (credentialID / credential picker): **99** across **11** nodes (of 164 nodes/groups with forms).

| Group/Node | Credential fields | Forms with picker |
|---|---|---|
| RealEstate/Odoo | 35 | 35 |
| Blockchain/Safe | 26 | 17 |
| Blockchain/HashiCorp | 16 | 16 |
| Blockchain/Coinbase | 8 | 8 |
| Ai/Flow/FlowRag | 6 | 6 |
| MySql/Forms | 2 | 1 |
| SqlServer/Forms | 2 | 1 |
| FlowAiAgent/FlowAiAgent | 1 | 1 |
| Mail/MailGun | 1 | 1 |
| Productivity/S3 | 1 | 1 |
| (db-only)/node-capability-mcp-editor | 1 | 1 |


### 4.1 Nodes with CRITICAL/HIGH fields and NO credential picker yet (need a credential type wired in)

| Group/Node | CRITICAL | HIGH | Forms | Credential type(s) to use |
|---|---|---|---|---|
| Social/WhatsApp | 80 | 7 | 78 | BEARER_TOKEN, PIN_OR_PASSCODE (proposed), API_KEY |
| Social/Slack | 42 | 1 | 42 | BEARER_TOKEN, BASIC_AUTH |
| Productivity/Notion | 33 | 1 | 16 | API_KEY, BEARER_TOKEN, CUSTOM_HEADERS (proposed) |
| Social/Instagram | 26 | 3 | 23 | BEARER_TOKEN, API_KEY, OAUTH2 |
| Productivity/Jira | 23 | 1 | 23 | API_KEY, BASIC_AUTH |
| IaaS/Ssh | 18 | 9 | 9 | BASIC_AUTH, PRIVATE_KEY (proposed) |
| Social/Facebook | 15 | 0 | 15 | BEARER_TOKEN, API_KEY |
| Social/TikTok | 13 | 1 | 13 | BEARER_TOKEN, BASIC_AUTH |
| Standard/Ses | 13 | 13 | 13 | AWS_ACCESS_KEY (proposed), API_KEY |
| DB/ElasticSearch | 10 | 10 | 10 | BASIC_AUTH |
| ScrapeApi/Browserless | 9 | 0 | 9 | API_KEY |
| IaaS/Deploy | 8 | 4 | 4 | BASIC_AUTH, PRIVATE_KEY (proposed) |
| Blockchain/Centrifuge | 6 | 0 | 6 | CONNECTION_STRING (proposed) |
| Productivity/MongoDB | 5 | 0 | 5 | CONNECTION_STRING (proposed) |
| IaaS/DockerCompose | 4 | 4 | 5 | SECRET_ENV_SET (proposed), BASIC_AUTH, PRIVATE_KEY (proposed) |
| Ai/AI-Function | 2 | 1 | 2 | CONNECTION_STRING (proposed), CUSTOM_HEADERS (proposed), BEARER_TOKEN |
| Core/Core/Trigger/WebhookTrigger | 2 | 0 | 2 | SIGNING_SECRET (proposed) |
| IaaS/Docker | 2 | 34 | 29 | CERTIFICATE, SECRET_ENV_SET (proposed), BASIC_AUTH |
| Blockchain/IPFS | 1 | 0 | 1 | API_KEY |
| Productivity/GSheets | 1 | 1 | 1 | API_KEY |
| Productivity/MicrosoftPowerPoint | 1 | 0 | 1 | BASIC_AUTH |
| Productivity/MicrosoftWord | 1 | 0 | 1 | BASIC_AUTH |
| ScrapeApi/Apify | 1 | 4 | 5 | SIGNING_SECRET (proposed) |
| Standard/Smtp | 1 | 3 | 1 | BASIC_AUTH, CUSTOM_HEADERS (proposed) |
| (db-only)/node-form-stripe-payment-webhook | 1 | 0 | 1 | SIGNING_SECRET (proposed) |
| (db-only)/node-form-http-request | 1 | 1 | 1 | BEARER_TOKEN, CUSTOM_HEADERS (proposed) |
| (db-only)/node-capability-webhook-editor | 1 | 0 | 1 | API_KEY |
| (db-only)/node-form-slack-message | 1 | 0 | 1 | BEARER_TOKEN |
| Ai/Ai-ToolServer | 0 | 1 | 1 | CUSTOM_HEADERS (proposed) |
| Distributed/Kafka | 0 | 1 | 1 | CUSTOM_HEADERS (proposed) |
| Distributed/Redis | 0 | 103 | 103 | CONNECTION_STRING (proposed) |
| PostgreSQL/Forms | 0 | 3 | 1 | CONNECTION_STRING (proposed) |
| Standard/HttpRequest | 0 | 1 | 1 | CUSTOM_HEADERS (proposed) |
| (db-only)/node-capability-datasource-editor | 0 | 1 | 1 | CONNECTION_STRING (proposed) |
| (db-only)/node-form-postgresql-query-execute | 0 | 1 | 1 | CONNECTION_STRING (proposed) |
| (db-only)/node-form-postgresql-row-insert | 0 | 1 | 1 | CONNECTION_STRING (proposed) |
| (db-only)/node-form-postgresql-row-update | 0 | 1 | 1 | CONNECTION_STRING (proposed) |
| (db-only)/node-form-postgresql-row-upsert | 0 | 1 | 1 | CONNECTION_STRING (proposed) |
| (db-only)/node-form-postgresql-row-delete | 0 | 1 | 1 | CONNECTION_STRING (proposed) |
| (db-only)/node-form-postgresql-row-get | 0 | 1 | 1 | CONNECTION_STRING (proposed) |
| (db-only)/node-form-postgresql-row-getMany | 0 | 1 | 1 | CONNECTION_STRING (proposed) |
| (db-only)/node-form-postgresql-table-create | 0 | 1 | 1 | CONNECTION_STRING (proposed) |
| (db-only)/node-form-postgresql-table-drop | 0 | 1 | 1 | CONNECTION_STRING (proposed) |
| (db-only)/node-form-postgresql-table-truncate | 0 | 1 | 1 | CONNECTION_STRING (proposed) |
| (db-only)/node-form-postgresql-table-list | 0 | 1 | 1 | CONNECTION_STRING (proposed) |
| (db-only)/node-form-postgresql-table-getColumns | 0 | 1 | 1 | CONNECTION_STRING (proposed) |
| (db-only)/node-form-postgresql-schema-list | 0 | 1 | 1 | CONNECTION_STRING (proposed) |
| (db-only)/node-form-postgresql-schema-getTables | 0 | 1 | 1 | CONNECTION_STRING (proposed) |
| (db-only)/node-form-postgresql-procedure-execute | 0 | 1 | 1 | CONNECTION_STRING (proposed) |
| (db-only)/node-form-postgresql-procedure-list | 0 | 1 | 1 | CONNECTION_STRING (proposed) |
| (db-only)/node-form-postgresql-bulk-insert | 0 | 1 | 1 | CONNECTION_STRING (proposed) |
| (db-only)/node-form-postgresql-bulk-copy | 0 | 2 | 1 | CONNECTION_STRING (proposed) |
| (db-only)/node-form-postgresql-transaction-begin | 0 | 1 | 1 | CONNECTION_STRING (proposed) |
| (db-only)/node-form-postgresql-transaction-executeInTx | 0 | 1 | 1 | CONNECTION_STRING (proposed) |
| (db-only)/node-form-postgresql | 0 | 3 | 1 | CONNECTION_STRING (proposed) |
| (db-only)/node-form-postgresql-row-updatewhere | 0 | 1 | 1 | CONNECTION_STRING (proposed) |
| (db-only)/node-form-postgresql-row-applyrules | 0 | 1 | 1 | CONNECTION_STRING (proposed) |
| (db-only)/node-form-postgresql-row-aggregate | 0 | 1 | 1 | CONNECTION_STRING (proposed) |
| (db-only)/node-form-postgresql-row-countwhere | 0 | 1 | 1 | CONNECTION_STRING (proposed) |
| (db-only)/node-form-postgresql-table-addcolumn | 0 | 1 | 1 | CONNECTION_STRING (proposed) |
| (db-only)/node-form-postgresql-table-dropcolumn | 0 | 1 | 1 | CONNECTION_STRING (proposed) |
| (db-only)/node-form-postgresql-table-altercolumn | 0 | 1 | 1 | CONNECTION_STRING (proposed) |
| (db-only)/node-form-postgresql-table-renamecolumn | 0 | 1 | 1 | CONNECTION_STRING (proposed) |
| (db-only)/node-form-postgresql-table-createindex | 0 | 1 | 1 | CONNECTION_STRING (proposed) |
| (db-only)/node-form-postgresql-table-dropindex | 0 | 1 | 1 | CONNECTION_STRING (proposed) |
| (db-only)/node-form-postgresql-table-adduniqueconstraint | 0 | 1 | 1 | CONNECTION_STRING (proposed) |
| (db-only)/node-form-postgresql-table-addforeignkey | 0 | 1 | 1 | CONNECTION_STRING (proposed) |
| (db-only)/node-form-postgresql-table-addcheckconstraint | 0 | 1 | 1 | CONNECTION_STRING (proposed) |
| (db-only)/node-form-postgresql-table-setdefault | 0 | 1 | 1 | CONNECTION_STRING (proposed) |
| (db-only)/node-form-postgresql-table-dropconstraint | 0 | 1 | 1 | CONNECTION_STRING (proposed) |
| (db-only)/node-form-postgresql-table-profile | 0 | 1 | 1 | CONNECTION_STRING (proposed) |


### 4.2 Nodes that already have a credential picker but STILL have secret/credential-like fields on some form

| Group/Node | CRITICAL | HIGH | Forms | Credential fields already present |
|---|---|---|---|---|
| Mail/MailGun | 4 | 2 | 5 | 1 |
| FlowAiAgent/FlowAiAgent | 2 | 1 | 2 | 1 |
| Blockchain/HashiCorp | 1 | 0 | 1 | 16 |
| MySql/Forms | 0 | 36 | 35 | 2 |
| SqlServer/Forms | 0 | 39 | 36 | 2 |


## 5. Suggested additional security-threat fields (recommendations, no rule matched as a secret)

### 5.1 Write/delete/DDL style operations with no confirmation / dry-run guard field on the same form

| Group/Node | FormID | FormCode | Operation field | Risky options |
|---|---|---|---|---|
| Ai/AI-Function | 21019 | AI_FUNCTION_DATA_HTTP_REQUEST | method | DELETE |
| Ai/Flow/FlowRag | 10000282 | FLOW_RAG_KNOWLEDGE_DELETE | (whole form) | destructive operation form, no confirm/dryRun field |
| Blockchain/Centrifuge | 20405 | MONGODB_DOCUMENT_DELETE | (whole form) | destructive operation form, no confirm/dryRun field |
| Blockchain/Coinbase | 10000534 | COINBASE_ADVANCED_TRADE_PORTFOLIOS_DELETE | (whole form) | destructive operation form, no confirm/dryRun field |
| Blockchain/Coinbase | 10000549 | COINBASE_SERVER_WALLET_POLICY_DELETE | (whole form) | destructive operation form, no confirm/dryRun field |
| Blockchain/HashiCorp | 10000432 | HASHICORP_SECRETS_DELETE | (whole form) | destructive operation form, no confirm/dryRun field |
| Blockchain/HashiCorp | 10000433 | HASHICORP_SECRETS_UNDELETE | (whole form) | destructive operation form, no confirm/dryRun field |
| Blockchain/HashiCorp | 10000434 | HASHICORP_SECRETS_DESTROY | (whole form) | destructive operation form, no confirm/dryRun field |
| Blockchain/HashiCorp | 10000442 | HASHICORP_TOKEN_REVOKE_BY_ACCESSOR | (whole form) | destructive operation form, no confirm/dryRun field |
| Blockchain/HashiCorp | 10000444 | HASHICORP_LEASE_REVOKE | (whole form) | destructive operation form, no confirm/dryRun field |
| Blockchain/IPFS | 10000376 | IPFS_PIN_REMOVE | (whole form) | destructive operation form, no confirm/dryRun field |
| Blockchain/IPFS | 10000381 | IPFS_PIN_REMOTE_REMOVE | (whole form) | destructive operation form, no confirm/dryRun field |
| Blockchain/IPFS | 10000384 | IPFS_PIN_REMOTE_SERVICE_REMOVE | (whole form) | destructive operation form, no confirm/dryRun field |
| Blockchain/IPFS | 10000391 | IPFS_FILES_REMOVE | (whole form) | destructive operation form, no confirm/dryRun field |
| Blockchain/IPFS | 10000402 | IPFS_BLOCK_REMOVE | (whole form) | destructive operation form, no confirm/dryRun field |
| Blockchain/IPFS | 10000408 | IPFS_KEY_REMOVE | (whole form) | destructive operation form, no confirm/dryRun field |
| Blockchain/Safe | 10000835 | SAFE_TRANSACTION_DELETE | (whole form) | destructive operation form, no confirm/dryRun field |
| Blockchain/Safe | 10000838 | SAFE_OWNER_PROPOSEREMOVEOWNER | (whole form) | destructive operation form, no confirm/dryRun field |
| Cloud/AzureBlob | 10000285 | AZURE_BLOB_CONTAINER_DELETE | (whole form) | destructive operation form, no confirm/dryRun field |
| Cloud/AzureBlob | 10000293 | AZURE_BLOB_BLOB_DELETE | (whole form) | destructive operation form, no confirm/dryRun field |
| DB/ElasticSearch | 20303 | ELASTICSEARCH_INDEX_DELETE | (whole form) | destructive operation form, no confirm/dryRun field |
| DB/ElasticSearch | 20309 | ELASTICSEARCH_DOCUMENT_DELETE | (whole form) | destructive operation form, no confirm/dryRun field |
| Distributed/Kafka | 21024 | KAFKA_CONSUMERGROUP_DELETE | (whole form) | destructive operation form, no confirm/dryRun field |
| Distributed/Kafka | 21041 | KAFKA_TOPIC_DELETE | (whole form) | destructive operation form, no confirm/dryRun field |
| Enterprise/Salesforce | 32005 | SALESFORCE_LEAD_DELETE | (whole form) | destructive operation form, no confirm/dryRun field |
| Enterprise/Salesforce | 32011 | SALESFORCE_ACCOUNT_DELETE | (whole form) | destructive operation form, no confirm/dryRun field |
| Enterprise/Salesforce | 32016 | SALESFORCE_CONTACT_DELETE | (whole form) | destructive operation form, no confirm/dryRun field |
| IaaS/Docker | 34007 | DOCKER_CONTAINER_REMOVE | (whole form) | destructive operation form, no confirm/dryRun field |
| IaaS/Docker | 34014 | DOCKER_IMAGE_REMOVE | (whole form) | destructive operation form, no confirm/dryRun field |
| IaaS/Docker | 34019 | DOCKER_VOLUME_REMOVE | (whole form) | destructive operation form, no confirm/dryRun field |
| IaaS/Docker | 34025 | DOCKER_NETWORK_REMOVE | (whole form) | destructive operation form, no confirm/dryRun field |
| IaaS/DockerCompose | 40352 | DOCKER-COMPOSE | (whole form) | destructive operation form, no confirm/dryRun field |
| IaaS/DockerCompose | 40363 | DOCKER-COMPOSE | (whole form) | destructive operation form, no confirm/dryRun field |
| IaaS/Kubernetes | 33003 | KUBERNETES_POD_DELETE | (whole form) | destructive operation form, no confirm/dryRun field |
| IaaS/Kubernetes | 33009 | KUBERNETES_DEPLOYMENT_DELETE | (whole form) | destructive operation form, no confirm/dryRun field |
| IaaS/Kubernetes | 33016 | KUBERNETES_SERVICE_DELETE | (whole form) | destructive operation form, no confirm/dryRun field |
| IaaS/Kubernetes | 33021 | KUBERNETES_CONFIGMAP_DELETE | (whole form) | destructive operation form, no confirm/dryRun field |
| IaaS/Kubernetes | 33026 | KUBERNETES_SECRET_DELETE | (whole form) | destructive operation form, no confirm/dryRun field |
| IaaS/Kubernetes | 33030 | KUBERNETES_NAMESPACE_DELETE | (whole form) | destructive operation form, no confirm/dryRun field |
| IaaS/Kubernetes | 33034 | KUBERNETES_JOB_DELETE | (whole form) | destructive operation form, no confirm/dryRun field |
| IaaS/Kubernetes | 33040 | KUBERNETES_CRONJOB_DELETE | (whole form) | destructive operation form, no confirm/dryRun field |
| IaaS/Kubernetes | 33049 | KUBERNETES_INGRESS_DELETE | (whole form) | destructive operation form, no confirm/dryRun field |
| IaaS/Kubernetes | 33054 | KUBERNETES_STATEFULSET_DELETE | (whole form) | destructive operation form, no confirm/dryRun field |
| IaaS/Kubernetes | 33060 | KUBERNETES_RESOURCE_DELETE | (whole form) | destructive operation form, no confirm/dryRun field |
| IaaS/Ssh | 40375 | SSH | (whole form) | destructive operation form, no confirm/dryRun field |
| Mail/MailGun | 24008 | MAILGUN_DOMAIN_DELETE | (whole form) | destructive operation form, no confirm/dryRun field |
| Mail/MailGun | 24012 | MAILGUN_BOUNCE_DELETE | (whole form) | destructive operation form, no confirm/dryRun field |
| Mail/MailGun | 24016 | MAILGUN_COMPLAINT_DELETE | (whole form) | destructive operation form, no confirm/dryRun field |
| Mail/MailGun | 24020 | MAILGUN_UNSUBSCRIBE_DELETE | (whole form) | destructive operation form, no confirm/dryRun field |
| Mail/MailGun | 24027 | MAILGUN_TEMPLATE_DELETE | (whole form) | destructive operation form, no confirm/dryRun field |
| Mail/MailGun | 24033 | MAILGUN_MAILING_LIST_DELETE | (whole form) | destructive operation form, no confirm/dryRun field |
| Mail/MailGun | 24039 | MAILGUN_MAILING_LIST_DELETE_MEMBER | (whole form) | destructive operation form, no confirm/dryRun field |
| Mail/MailGun | 24046 | MAILGUN_ROUTE_DELETE | (whole form) | destructive operation form, no confirm/dryRun field |
| Mail/MailGun | 24052 | MAILGUN_WEBHOOK_DOMAIN_DELETE | (whole form) | destructive operation form, no confirm/dryRun field |
| Mail/MailGun | 24055 | MAILGUN_WEBHOOK_DOMAIN_DELETE_V4 | (whole form) | destructive operation form, no confirm/dryRun field |
| Mail/MailGun | 24060 | MAILGUN_WEBHOOK_ACCOUNT_DELETE | (whole form) | destructive operation form, no confirm/dryRun field |
| Mail/MailGun | 24063 | MAILGUN_DOMAIN_KEY_ACCOUNT_DELETE | (whole form) | destructive operation form, no confirm/dryRun field |
| MySql/Forms | 25105 | MYSQL_ROW_DELETE | (whole form) | destructive operation form, no confirm/dryRun field |
| Productivity/GSheets | 23081 | GOOGLE_SHEETS_SPREADSHEET_DELETE | (whole form) | destructive operation form, no confirm/dryRun field |
| Productivity/GSheets | 23084 | GOOGLE_SHEETS_SHEET_CLEAR | (whole form) | destructive operation form, no confirm/dryRun field |
| Productivity/GSheets | 23086 | GOOGLE_SHEETS_SHEET_DELETE | (whole form) | destructive operation form, no confirm/dryRun field |
| Productivity/GSheets | 23087 | GOOGLE_SHEETS_SHEET_DELETEROWSORCOLUMNS | (whole form) | destructive operation form, no confirm/dryRun field |
| Productivity/Jira | 30005 | JIRA_ISSUE_DELETE | (whole form) | destructive operation form, no confirm/dryRun field |
| Productivity/Jira | 30014 | JIRA_COMMENT_REMOVE | (whole form) | destructive operation form, no confirm/dryRun field |
| Productivity/Jira | 30018 | JIRA_ATTACHMENT_REMOVE | (whole form) | destructive operation form, no confirm/dryRun field |
| Productivity/Jira | 30023 | JIRA_USER_DELETE | (whole form) | destructive operation form, no confirm/dryRun field |
| Productivity/MongoDB | 20410 | MONGODB_SEARCHINDEX_DROP | (whole form) | destructive operation form, no confirm/dryRun field |
| Productivity/S3 | 20501 | S3_BUCKET_DELETE | (whole form) | destructive operation form, no confirm/dryRun field |
| Productivity/S3 | 20507 | S3_OBJECT_DELETE | (whole form) | destructive operation form, no confirm/dryRun field |
| Productivity/S3 | 20510 | S3_FOLDER_DELETE | (whole form) | destructive operation form, no confirm/dryRun field |
| Providers/Cloudflare | 31005 | CLOUDFLARE_ZONE_PURGEALL | (whole form) | destructive operation form, no confirm/dryRun field |
| Providers/Cloudflare | 31010 | CLOUDFLARE_DNS_DELETE | (whole form) | destructive operation form, no confirm/dryRun field |
| Providers/Cloudflare | 31019 | CLOUDFLARE_SSL_DELETECERT | (whole form) | destructive operation form, no confirm/dryRun field |
| Providers/Cloudflare | 31020 | CLOUDFLARE_CACHE_PURGEBYURL | (whole form) | destructive operation form, no confirm/dryRun field |
| Providers/Cloudflare | 31021 | CLOUDFLARE_CACHE_PURGEBYTAG | (whole form) | destructive operation form, no confirm/dryRun field |
| Providers/Cloudflare | 31022 | CLOUDFLARE_CACHE_PURGEALL | (whole form) | destructive operation form, no confirm/dryRun field |
| RealEstate/Odoo | 36004 | ODOO_CONTACT_DELETE | (whole form) | destructive operation form, no confirm/dryRun field |
| RealEstate/Odoo | 36009 | ODOO_LEAD_DELETE | (whole form) | destructive operation form, no confirm/dryRun field |
| RealEstate/Odoo | 36019 | ODOO_ACTIVITY_DELETE | (whole form) | destructive operation form, no confirm/dryRun field |
| RealEstate/Odoo | 36033 | ODOO_CUSTOM_DELETE | (whole form) | destructive operation form, no confirm/dryRun field |
| ScrapeApi/Browserless | 20600 | BROWSERLESS | operation | execute |
| Social/Facebook | 32057 | FACEBOOK_MODERATION_DELETECOMMENT | (whole form) | destructive operation form, no confirm/dryRun field |
| Social/Instagram | 22009 | INSTAGRAM_COMMENTS_DELETE | (whole form) | destructive operation form, no confirm/dryRun field |
| Social/Slack | 35006 | SLACK_MESSAGE_DELETE | (whole form) | destructive operation form, no confirm/dryRun field |
| Social/Slack | 35031 | SLACK_REACTION_REMOVE | (whole form) | destructive operation form, no confirm/dryRun field |
| Social/TikTok | 32064 | TIKTOK_VIDEO_DELETE | (whole form) | destructive operation form, no confirm/dryRun field |
| Social/TikTok | 32068 | TIKTOK_COMMENT_DELETE | (whole form) | destructive operation form, no confirm/dryRun field |
| Social/WhatsApp | 23018 | WHATSAPP_MEDIA_DELETE | (whole form) | destructive operation form, no confirm/dryRun field |
| Social/WhatsApp | 23025 | WHATSAPP_TEMPLATE_DELETE | (whole form) | destructive operation form, no confirm/dryRun field |
| Social/WhatsApp | 23043 | WHATSAPP_QRCODE_DELETE | (whole form) | destructive operation form, no confirm/dryRun field |
| Social/WhatsApp | 23046 | WHATSAPP_GROUP_DELETE | (whole form) | destructive operation form, no confirm/dryRun field |
| Social/WhatsApp | 23050 | WHATSAPP_GROUP_REMOVE_MEMBER | (whole form) | destructive operation form, no confirm/dryRun field |
| Social/WhatsApp | 23058 | WHATSAPP_COMMERCE_DELETE_CATALOG | (whole form) | destructive operation form, no confirm/dryRun field |
| Social/WhatsApp | 23063 | WHATSAPP_COMMERCE_DELETE_PRODUCT | (whole form) | destructive operation form, no confirm/dryRun field |
| Social/WhatsApp | 23066 | WHATSAPP_COMMERCE_DELETE_COLLECTION | (whole form) | destructive operation form, no confirm/dryRun field |
| SqlServer/Forms | 18504 | SQLSERVER_ROW_DELETE | (whole form) | destructive operation form, no confirm/dryRun field |
| Standard/Gmail | 10000704 | EMAIL_GMAIL_MESSAGE_DELETE | (whole form) | destructive operation form, no confirm/dryRun field |
| Standard/Gmail | 10000713 | EMAIL_GMAIL_DRAFT_DELETE | (whole form) | destructive operation form, no confirm/dryRun field |
| Standard/Gmail | 10000717 | EMAIL_GMAIL_LABEL_DELETE | (whole form) | destructive operation form, no confirm/dryRun field |
| Standard/Gmail | 10000720 | EMAIL_GMAIL_THREAD_DELETE | (whole form) | destructive operation form, no confirm/dryRun field |
| Standard/Gmail | 10000724 | EMAIL_GMAIL_THREAD_REMOVELABEL | (whole form) | destructive operation form, no confirm/dryRun field |
| Standard/HttpRequest | 11031 | HTTP_REQUEST_HTTP_REQUEST | method | DELETE |
| Standard/Ses | 35047 | SES_TEMPLATE_DELETE | (whole form) | destructive operation form, no confirm/dryRun field |
| Standard/Ses | 35055 | SES_CUSTOMVERIFICATION_DELETE | (whole form) | destructive operation form, no confirm/dryRun field |
| Standard/Smtp | 23090 | EMAIL_SMTP_EMAIL_SEND | operation | send |
| (db-only)/node-form-http-request | 11059 | NODETYPE_HTTP_REQUEST | method | DELETE |
| (db-only)/node-capability-webhook-editor | 12003 | NODECAP_WEBHOOK_PROPERTIES | method | DELETE |
| (db-only)/node-form-slack-message | 25000 | SLACK_ROOT | operation | send, sendAndWait, sendEphemeral, update, delete, create, remove, updateProfile |
| (db-only)/node-form-postgresql-row-delete | 40548 | POSTGRESQL_ROW_DELETE | (whole form) | destructive operation form, no confirm/dryRun field |
| (db-only)/node-form-postgresql-table-dropindex | 40607 | POSTGRESQL_TABLE_DROPINDEX | (whole form) | destructive operation form, no confirm/dryRun field |
| (db-only)/node-form-postgresql-table-dropconstraint | 40612 | POSTGRESQL_TABLE_DROPCONSTRAINT | (whole form) | destructive operation form, no confirm/dryRun field |


### 5.2 Recommended new guard fields / server-side controls

- `confirmDestructive` (boolean, default false) on every node operation that deletes, drops, truncates, overwrites or transfers value; block execution unless true or an approval node precedes it.
- `dryRun` / `readOnly` (boolean) on database, storage, IaaS and Kubernetes nodes.
- `allowedHosts` / egress allow-list (or tenant-level policy) for every arbitrary URL/host field; always resolve and block loopback, link-local (169.254.x.x), RFC1918 unless an admin enables it.
- `maxResponseBytes`, `timeoutSeconds`, `maxRedirects` on every HTTP-style node.
- Raw SQL / query fields: switch to parameterized form (`query` + `parameters[]`) and add `allowWrite` (default false).
- Code/script/shell nodes: force `enableTrustedExecutionEnvironment` = true and non-editable for non-admins; add `allowedCommands`.
- File-path fields: add `sandboxRoot` and reject `..`, absolute and UNC paths.
- Storage nodes: add `acl` default `private`, and require confirmation for public-read.
- Webhook trigger nodes: make signature/secret validation mandatory (`requireSignature` true, secret from credential), never optional.
- Logging: `redactSecrets` non-optional; remove any user-facing `logRequestBody`/`debug` toggles that could print headers.
- Blockchain nodes: `maxTransferAmount` / `allowedRecipients` guards and a mandatory approval step for value-moving operations.

## 6. Proposed remediation plan

### 6.1 Existing credential types (AIExt_CredentialTypes, non-deleted)

| Code | Name | Description |
|---|---|---|
| GOOGLE_OAUTH2 | Google OAuth 2.0 | Google OAuth 2.0 authorization code flow for Gmail and Google Workspace services |
| API_KEY | API Key | API Key + Secret + Base URL |
| BASIC_AUTH | Basic Auth | Username + Password + Base URL |
| OAUTH2 | OAuth 2.0 | OAuth 2.0 authorization code flow |
| BEARER_TOKEN | Bearer Token | Static bearer token + Base URL |
| CERTIFICATE | Certificate | TLS/mTLS certificate |


(2 additional placeholder rows named "Sample Name ..." with codes such as AIE70948 exist and are test data, not usable types.)


### 6.2 Field -> credential type mapping

| Field category | Credential type | Status | Fields | Nodes |
|---|---|---|---|---|
| password-control+token | BEARER_TOKEN | exists | 177 | 8 |
| secret-key-reference | CONNECTION_STRING (proposed) | NEW type needed | 119 | 41 |
| connection-string | CONNECTION_STRING (proposed) | NEW type needed | 105 | 3 |
| password-control+api-key+token | API_KEY | exists | 48 | 3 |
| password-control | BASIC_AUTH | exists | 32 | 7 |
| username-with-password | BASIC_AUTH | exists | 31 | 8 |
| key-file-path | CERTIFICATE | exists | 29 | 1 |
| private-key+certificate-key-material | PRIVATE_KEY (proposed) | NEW type needed | 15 | 3 |
| access-key-id | AWS_ACCESS_KEY (proposed) | NEW type needed | 13 | 1 |
| password-control+secret+api-key | API_KEY | exists | 13 | 1 |
| password-control+connection-string | CONNECTION_STRING (proposed) | NEW type needed | 11 | 2 |
| secret | API_KEY | exists | 11 | 4 |
| secret-key-reference | API_KEY | exists | 11 | 3 |
| headers | CUSTOM_HEADERS (proposed) | NEW type needed | 9 | 8 |
| password-control | API_KEY | exists | 7 | 4 |
| env-map | SECRET_ENV_SET (proposed) | NEW type needed | 6 | 2 |
| password-control+secret | SIGNING_SECRET (proposed) | NEW type needed | 4 | 3 |
| password | BASIC_AUTH | exists | 2 | 2 |
| password-control+secret | API_KEY | exists | 2 | 2 |
| authorization-header | BEARER_TOKEN | exists | 1 | 1 |
| api-key | API_KEY | exists | 1 | 1 |
| cookie-session | SESSION_COOKIE (proposed) | NEW type needed | 1 | 1 |
| secret | OAUTH2 | exists | 1 | 1 |
| password-control+pin | PIN_OR_PASSCODE (proposed) | NEW type needed | 1 | 1 |


Proposed new types (add to AIExt_CredentialTypes with a FieldsSchema each): CONNECTION_STRING (proposed), CUSTOM_HEADERS (proposed), SIGNING_SECRET (proposed), SESSION_COOKIE (proposed), PRIVATE_KEY (proposed), SECRET_ENV_SET (proposed), PIN_OR_PASSCODE (proposed), AWS_ACCESS_KEY (proposed). Alternative: keep to the 5 existing types and add generic `SECRET_VALUE` (single masked value) + `SECRET_FIELDS` (named masked fields) if Binoy prefers fewer types.


### 6.3 Node config schemas and palette templates (defining config keys)

- `Process_ProcessElementTypes.ConfigurationSchema`: 115 rows scanned, 38 sensitive-name property hits in 26 node types.
- `Template_DataTemplates.ContentData`: 1447 rows scanned, 1 CRITICAL/HIGH key-name hits in 1 templates (key names only; template content is not executed).

ConfigurationSchema hits:

| Node code | ProcessElementTypeID | Property | Severity | Category |
|---|---|---|---|---|
| apify | 283 | customBody | HIGH | custom-body |
| apify-trigger | 284 | webhookSecret | CRITICAL | secret |
| aws-s3 | 281 | AccessKey | CRITICAL | api-key |
| aws-s3 | 281 | SecretKey | CRITICAL | secret |
| aws-s3 | 281 | SecretKey | CRITICAL | api-key |
| browserless | 285 | ApiKey | CRITICAL | api-key |
| cloudflare | 282 | apiToken | CRITICAL | api-key |
| cloudflare | 282 | apiToken | CRITICAL | token |
| coinbase-server-wallet | 312 | token | CRITICAL | token |
| discord | 286 | BotToken | CRITICAL | token |
| elasticsearch | 269 | Password | CRITICAL | password |
| email-imap-trigger | 296 | password | CRITICAL | password |
| email-smtp | 129 | password | CRITICAL | password |
| email-smtp | 129 | allowUnauthorized | MEDIUM | tls-bypass |
| email-smtp | 129 | headers | HIGH | headers |
| facebook | 287 | pageAccessToken | CRITICAL | token |
| flow-ai-agent | 273 | sessionId | CRITICAL | cookie-session |
| flow-ai-agent | 273 | sqlConnectionString | HIGH | connection-string |
| http-request | 294 | headers | HIGH | headers |
| http-request | 294 | bearerToken | CRITICAL | token |
| ipfs | 324 | authMode | MEDIUM | auth-none-option |
| jira | 278 | apiToken | CRITICAL | api-key |
| jira | 278 | apiToken | CRITICAL | token |
| kubernetes | 275 | kubeConfig | CRITICAL | kubeconfig |
| microsoft-powerpoint | 335 | linkPassword | CRITICAL | password |
| microsoft-word | 336 | linkPassword | CRITICAL | password |
| mongodb | 279 | ConnectionString | HIGH | connection-string |
| mysql | 339 | connectionStringKey | HIGH | secret-key-reference |
| notion | 280 | ApiToken | CRITICAL | api-key |
| notion | 280 | ApiToken | CRITICAL | token |
| notion | 280 | Headers | HIGH | headers |
| notion | 280 | Authentication | HIGH | inline-credentials |
| redis | 271 | connectionString | HIGH | connection-string |
| salesforce | 272 | ClientSecret | CRITICAL | secret |
| salesforce | 272 | Password | CRITICAL | password |
| sqlserver | 338 | connectionStringKey | HIGH | secret-key-reference |
| standard | 302 | Headers | HIGH | headers |
| tiktok | 290 | accessToken | CRITICAL | token |


Palette template hits (grouped):

| Template | DataTemplateID | Sensitive keys |
|---|---|---|
| Docker - Create Elastic Search Container | 20000186 | env (HIGH) |


### 6.4 Order of work

1. Add the missing credential types to AIExt_CredentialTypes (section 6.2) and confirm the credential picker control can be reused on every node form.
2. Fix nodes in this order (weight = 3 x CRITICAL + HIGH): Social/WhatsApp (247); Social/Slack (127); Distributed/Redis (103); Productivity/Notion (100); Social/Instagram (81); Productivity/Jira (70); IaaS/Ssh (63); Standard/Ses (52); Social/Facebook (45); DB/ElasticSearch (40); IaaS/Docker (40); Social/TikTok (40); SqlServer/Forms (39); MySql/Forms (36); IaaS/Deploy (28); ScrapeApi/Browserless (27); Blockchain/Centrifuge (18); IaaS/DockerCompose (16); Productivity/MongoDB (15); Mail/MailGun (14); Ai/AI-Function (7); FlowAiAgent/FlowAiAgent (7); ScrapeApi/Apify (7); Core/Core/Trigger/WebhookTrigger (6); Standard/Smtp (6).
3. Per node: add `credentialID` picker (if the node has none), remove the offending fields from every form of the node (all operations), remove the config keys from ConfigurationSchema, update executors to resolve secrets from the credential only, and add a Sync_ script + DevelopmentHistoryLog entry.
4. Then HIGH items (connection strings, headers, env maps): keep non-secret parts (host/port/db name) and move user/password into credentials.
5. Then MEDIUM items: URL/host validation, TLS-bypass defaults, raw SQL/code guards (section 5).
6. Re-run `scan-form-secrets.js` after each batch; target is zero CRITICAL and zero HIGH (except decisions in section 7).

## 7. Needs Binoy decision (ambiguous or downgraded fields)

Fields whose NAME looks sensitive but the control is a toggle/select/number, blockchain fields called "token", and secret references (names/paths/ARNs rather than values):

| Kind | Group/Node | FormID | Field ID | Label | Type | Why |
|---|---|---|---|---|---|---|
| ambiguous | Blockchain/Coinbase | 10000537 | token | Token | text | field "token" in a blockchain node - probably an asset token address/symbol, not an auth token |
| ambiguous | Blockchain/Coinbase | 10000539 | token | Token | text | field "token" in a blockchain node - probably an asset token address/symbol, not an auth token |
| ambiguous | Blockchain/Coinbase | 10000542 | token | Token | text | field "token" in a blockchain node - probably an asset token address/symbol, not an auth token |
| review | Blockchain/IPFS | 10000369 | pin | Pin | switch | name matches but control is switch (not a free-value input): PIN value |
| review | Blockchain/IPFS | 10000395 | pin | Pin | switch | name matches but control is switch (not a free-value input): PIN value |
| review | Blockchain/IPFS | 10000397 | pinRoots | Pin Roots | switch | name matches but control is switch (not a free-value input): PIN value |
| review | Blockchain/IPFS | 10000401 | pin | Pin | switch | name matches but control is switch (not a free-value input): PIN value |


Other decisions:

- Connection-string fields (HIGH): is a host:port-only connection string acceptable on the form if user/password come from a credential? (Redis forms already use `host:port` patterns.)
- Blockchain `token` / address fields: asset selectors or auth tokens? (see AMBIGUOUS rows above).
- Plain `username` fields: keep on form when the credential holds only the password, or move both into the credential? (Proposal: move both.)
- Free-form headers/custom body: remove entirely, or keep with a server-side strip of Authorization/X-Api-Key?
- Secret references (name/ARN/path): allowed as references, or force a credential picker? (8 fields)

## 8. Appendix: scan script

Saved at `C:\BizFirstGO_FI_AI\Documentation\Employees\agentic-development-engineers\workflow-development-node-forms\audit\scan-form-secrets.js`. Re-run: `node scan-form-secrets.js <reportPath>` (needs Node 20 and sqlcmd on PATH; read-only). Full source follows.

```javascript
#!/usr/bin/env node
/*
 * scan-form-secrets.js  (read-only security audit of node config forms)
 *
 * Usage:  node scan-form-secrets.js [reportPath]
 *   - scans every Atlas_Forms script under the projects folder (excluding obsolete/backup/unapproved/unsorted)
 *   - cross-checks the live DB (sqlcmd, read-only SELECTs only): Atlas_Forms, Process_ProcessElementTypes
 *     (ConfigurationSchema), Template_DataTemplates (ContentData) and AIExt_CredentialTypes
 *   - writes a Markdown report (default: ../audit/form-secrets-audit-<date>.md next to this script)
 * It never modifies scripts, code or the database. Secret-looking values are never printed
 * (only first 4 chars + '***').
 */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = 'C:/BizFirstGO_FI_AI/BizFirstFiDB/BizFirstFiV3DB/BizFirstFiV3DB/dbo/Data/projects';
const SQL_SERVER = '.\\SQLEXPRESS';
const SQL_DB = 'data-ocean-platform-prod';
const EXCLUDED_DIRS = /^(obsolete|backup|unapproved|unsorted)$/i;
const REPORT = process.argv[2] || path.join(__dirname, 'form-secrets-audit-2026-09-20.md');
const SELF = __filename;

// ---------------------------------------------------------------- file walking
function walk(dir, out, excluded) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (EXCLUDED_DIRS.test(e.name)) countExcluded(p, excluded);
      else walk(p, out, excluded);
    } else if (/\.sql$/i.test(e.name)) out.push(p);
  }
}
function countExcluded(dir, excluded) {
  const rel = path.relative(ROOT, dir).replace(/\\/g, '/');
  const kind = path.basename(dir).toLowerCase();
  let n = 0;
  (function rec(d) {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      if (e.isDirectory()) rec(path.join(d, e.name));
      else if (/\.sql$/i.test(e.name)) n++;
    }
  })(dir);
  excluded.byKind[kind] = (excluded.byKind[kind] || 0) + n;
  excluded.total += n;
  excluded.dirs.push(rel + ' (' + n + ')');
}

// ---------------------------------------------------------------- T-SQL literal extraction
function extractLiterals(text) {
  const lits = [];
  const re = /(?<![A-Za-z0-9_])N?'(?=\s*[\[{])/g;
  let m;
  while ((m = re.exec(text))) {
    let i = m.index + m[0].length, s = '';
    for (; i < text.length; i++) {
      const ch = text[i];
      if (ch === "'") {
        if (text[i + 1] === "'") { s += "'"; i++; } else break;
      } else s += ch;
    }
    lits.push(s);
    re.lastIndex = i + 1;
  }
  return lits;
}

// ---------------------------------------------------------------- field collection
const NON_INPUT = /^(heading|header|divider|separator|alert|info|infobox|html|markdown|label|section|group|tabs|tab|panel|card|row|column|columns|container|paragraph|text-block|textblock|description|note|banner|spacer|button|link|step|wizard|fieldset|accordion|expression-builder-info)$/i;
function str(v) { return typeof v === 'string' ? v : (typeof v === 'number' || typeof v === 'boolean' ? String(v) : ''); }
function optionValues(o) {
  const cfg = o.config || o.options || o.enum || o.values || o.choices;
  let arr = null;
  if (Array.isArray(cfg)) arr = cfg;
  else if (cfg && Array.isArray(cfg.options)) arr = cfg.options;
  else if (Array.isArray(o.enum)) arr = o.enum;
  if (!arr) return [];
  return arr.map(x => (x && typeof x === 'object') ? str(x.value !== undefined ? x.value : x.label) : str(x)).slice(0, 60);
}
function makeField(o, id) {
  const cfg = (o.config && typeof o.config === 'object') ? o.config : {};
  const sub = [o.inputType, cfg.inputType, o.format, cfg.format, o.variant, cfg.variant, o.widget, o['ui:widget'], cfg.type]
    .map(str).filter(Boolean).join(',').toLowerCase();
  const masked = !!(o.masked || o.mask || cfg.masked || cfg.mask || o.writeOnly || o.secret || o.sensitive || cfg.secret || o.isSecret);
  return {
    id: String(id),
    type: str(o.type).toLowerCase() || 'string',
    sub, masked,
    label: str(o.label || o.title),
    placeholder: str(o.placeholder || cfg.placeholder),
    help: str(o.helpText || o.description || o.hint || cfg.helpText),
    def: o.defaultValue !== undefined ? o.defaultValue : (o.default !== undefined ? o.default : (cfg.defaultValue !== undefined ? cfg.defaultValue : undefined)),
    options: optionValues(o),
  };
}
function collectFields(root, out) {
  (function rec(n, isPropsMap) {
    if (Array.isArray(n)) { n.forEach(x => rec(x, false)); return; }
    if (!n || typeof n !== 'object') return;
    if (isPropsMap) {
      for (const k of Object.keys(n)) {
        const v = n[k];
        if (v && typeof v === 'object' && !Array.isArray(v) && (v.type !== undefined || v.title !== undefined || v.description !== undefined || v.format !== undefined)) {
          const f = makeField(v, k);
          if (typeof v.type !== 'string') f.type = 'string';
          out.push(f);
        }
        rec(v, false);
      }
      return;
    }
    const idv = n.id !== undefined ? n.id : (n.name !== undefined ? n.name : n.key);
    if (typeof idv === 'string' && typeof n.type === 'string' && !NON_INPUT.test(n.type)) out.push(makeField(n, idv));
    for (const k of Object.keys(n)) {
      const v = n[k];
      if (k === 'properties' && v && typeof v === 'object' && !Array.isArray(v)) rec(v, true);
      else rec(v, false);
    }
  })(root, false);
}
function fallbackFields(text, out) {
  const ids = [...text.matchAll(/"(?:id|name|key)"\s*:\s*"([^"]+)"/g)];
  for (let i = 0; i < ids.length; i++) {
    const start = ids[i].index, end = i + 1 < ids.length ? ids[i + 1].index : Math.min(text.length, start + 800);
    const win = text.slice(start, Math.min(end, start + 800));
    const g = (k) => { const mm = win.match(new RegExp('"' + k + '"\\s*:\\s*"([^"]*)"')); return mm ? mm[1] : ''; };
    const type = g('type');
    if (!type || NON_INPUT.test(type)) continue;
    out.push({ id: ids[i][1], type: type.toLowerCase(), sub: (g('inputType') + ',' + g('format')).toLowerCase(), masked: /"(masked|secret|writeOnly)"\s*:\s*true/.test(win),
      label: g('label') || g('title'), placeholder: g('placeholder'), help: g('helpText') || g('description'), def: (win.match(/"(?:defaultValue|default)"\s*:\s*"([^"]*)"/) || [])[1], options: [] });
  }
}

// ---------------------------------------------------------------- classification
const compact = s => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
const wordsOf = s => String(s || '').replace(/([a-z0-9])([A-Z])/g, '$1 $2').toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
const BENIGN = new Set(['boolean', 'switch', 'checkbox', 'toggle', 'select', 'radio', 'multiselect', 'multi-select', 'slider', 'date', 'datetime', 'time', 'color', 'number', 'integer', 'enum', 'radiogroup', 'segmented', 'buttongroup']);
const TEXTY = new Set(['text', 'textarea', 'string', 'password', 'code', 'json', 'editor', 'expression', 'sql', 'url', 'uri', 'email', 'rich-text-editor', 'keyvalue', 'key-value', 'object', 'array', 'map', 'file', 'json-editor', 'code-editor', 'sql-editor', 'expression-builder', 'tags', 'kv', 'headers']);
const BLOCKCHAIN_GROUPS = new Set(['Blockchain', 'Ondo']);
const SECRETY_LITERAL = /((?<![A-Za-z0-9])sk-[A-Za-z0-9_-]{16,}|sk_(live|test)_[A-Za-z0-9]{10,}|ghp_[A-Za-z0-9]{20,}|gho_[A-Za-z0-9]{20,}|AKIA[0-9A-Z]{16}|xox[abposr]-[A-Za-z0-9-]{10,}|eyJ[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{10,}|-----BEGIN [A-Z ]*(PRIVATE KEY|CERTIFICATE)-----|AIza[0-9A-Za-z_-]{30,})/;
const CRED_EMBED = /((password|pwd|pass)=[^;&\s"]+|:\/\/[^\/\s:@"]+:[^\/\s@"]+@|user(name)?\s*:\s*pass(word)?@|<password>|:password@|:pass@)/i;
const SECRET_TEXT_HINT = /\b(password|passwd|secret|api[ _-]?key|access[ _-]?key|private[ _-]?key|bearer|access token|refresh token|bot token|auth token|seed phrase|mnemonic|passphrase)\b/i;

function hit(sev, cat, reason, fix, credType) { return { sev, cat, reason, fix, credType: credType || '' }; }
const CT = {
  BASIC: 'BASIC_AUTH', API: 'API_KEY', BEARER: 'BEARER_TOKEN', OAUTH: 'OAUTH2', CERT: 'CERTIFICATE',
  CONN: 'CONNECTION_STRING (proposed)', PK: 'PRIVATE_KEY (proposed)', MNEMONIC: 'WALLET_MNEMONIC (proposed)', SSH: 'SSH_KEY (proposed)',
  AWS: 'AWS_ACCESS_KEY (proposed)', HMAC: 'SIGNING_SECRET (proposed)', COOKIE: 'SESSION_COOKIE (proposed)', SA: 'SERVICE_ACCOUNT_JSON (proposed)',
  KUBE: 'KUBECONFIG (proposed)', PIN: 'PIN_OR_PASSCODE (proposed)', ENV: 'SECRET_ENV_SET (proposed)', HDR: 'CUSTOM_HEADERS (proposed)',
};

function classify(f, ctx) {
  const hits = [];
  const c = compact(f.id), l = compact(f.label), hay = c + '|' + l;
  const lw = wordsOf(f.label), iw = wordsOf(f.id);
  const t = f.type, isBenign = BENIGN.has(t) && !f.masked && !/password|secret|masked/.test(f.sub);
  const compliant = /credential(id)?$|^credential/.test(c) || /credential/.test(t);
  if (compliant) return { compliant: true, hits };
  const pt = (f.placeholder + ' ' + f.help);
  const valueRule = (sev, cat, reason, fix, cred) => {
    if (isBenign) hits.push(hit('REVIEW', cat, 'name matches but control is ' + t + ' (not a free-value input): ' + reason, 'confirm no secret is stored in this control', cred));
    else hits.push(hit(sev, cat, reason, fix, cred));
  };
  // control-type based
  if (t === 'password' || t === 'secret' || t === 'masked' || t === 'secure-text' || t === 'secret-text' || /(password|secret|masked|protected)/.test(f.sub) || f.masked) {
    hits.push(hit('CRITICAL', 'password-control', 'control type/format is password/secret/masked (' + (f.masked && !/password|secret|masked/.test(t + f.sub) ? 'masked flag' : (t + ' ' + f.sub).trim()) + ')', 'remove field; require credentialID picker', ''));
  }
  // password
  if (/passw(or)?d|passwd|pwd|passphrase|passcode/.test(hay) && !/(reset|forgot|change|policy|length|complexity|strength|expir)/.test(hay)) valueRule('CRITICAL', 'password', 'collects a password/passphrase value', 'remove field; use credential type BASIC_AUTH (username+password)', CT.BASIC);
  // secret
  if (/secret/.test(hay)) {
    if (/(secretname|secretref|secretid|secretarn|secretpath|secretmanager|secretsmanager|secretengine|secretversion|secretlength|secretstore|secretkeyref|secretsfrom)/.test(hay)) hits.push(hit('MEDIUM', 'secret-reference', 'reference to a secret (name/path/arn), not the value itself', 'confirm it is only a reference; prefer a credential picker', ''));
    else valueRule('CRITICAL', 'secret', 'collects a secret value (client secret / secret key / signing secret)', /webhook|signing/.test(hay) ? 'remove; use credential type SIGNING_SECRET (proposed)' : (/client|oauth/.test(hay) ? 'remove; use credential type OAUTH2' : 'remove; use credential type API_KEY'), /webhook|signing/.test(hay) ? CT.HMAC : (/client|oauth/.test(hay) ? CT.OAUTH : CT.API));
  }
  // indirect: vault/connection key NAME instead of a credential
  if (/(vaultkey|connectionstringkey|connectionkey|secretkeyname|passwordkey|tokenkey)$/.test(c)) {
    hits.push(hit('HIGH', 'secret-key-reference', 'names a secret-store / config key that holds the secret (indirect); not a credentialID', 'replace with credentialID picker so the secret is resolved from the credential vault', /connection/.test(c) ? CT.CONN : CT.API));
    return { compliant: false, hits };
  }
  // api / access / license keys
  if (/apikey|xapikey|apisecret|subscriptionkey|accountkey|sharedkey|sharedaccesskey|accesskey(?!id)|secretkey|secretaccesskey|masterkey|encryptionkey|licen[sc]ekey|authkey|signingkey|signaturekey|hmac|clientkey|appkey|sastoken|connectionkey|activationkey|adminkey|integrationkey|webhookkey|apitoken/.test(hay)) {
    const cred = /hmac|signing|signature/.test(hay) ? CT.HMAC : (/accesskey|secretaccesskey/.test(hay) ? CT.AWS : CT.API);
    valueRule('CRITICAL', 'api-key', 'collects an API/access/signing/license key value', 'remove field; use credential type ' + cred, cred);
  }
  if (/accesskeyid/.test(hay)) valueRule('HIGH', 'access-key-id', 'access key ID (half of an access key pair)', 'move with its secret half into credential type AWS_ACCESS_KEY (proposed)', CT.AWS);
  // private key / mnemonic
  if (/privatekey|sshkey|walletkey|keypair|secretkeybase|signerkey|deployerkey|privkey|privatekeyhex|sshprivate/.test(hay)) valueRule('CRITICAL', 'private-key', 'collects a private key', 'remove field; use credential type ' + (/ssh/.test(hay) ? CT.SSH : CT.PK), /ssh/.test(hay) ? CT.SSH : CT.PK);
  if (/mnemonic|seedphrase|recoveryphrase|seedwords|secretphrase|walletphrase|keyphrase/.test(hay)) valueRule('CRITICAL', 'mnemonic', 'collects a mnemonic / seed phrase', 'remove field; use credential type WALLET_MNEMONIC (proposed)', CT.MNEMONIC);
  // certificates / key files / service-account json / kubeconfig
  if (/kubeconfig/.test(hay) && !/(path|file)/.test(hay)) valueRule('CRITICAL', 'kubeconfig', 'kubeconfig content (contains tokens/certs)', 'remove; use credential type KUBECONFIG (proposed)', CT.KUBE);
  else if (/(privatekeypath|keyfilepath|keyfile|certpath|certificatepath|pempath|kubeconfigpath|credentialsfile|credentialspath|serviceaccountfile|keypath|pfxpath|p12path)/.test(hay)) valueRule('HIGH', 'key-file-path', 'points at a key/cert/credential file on the server', 'remove; use credential type CERTIFICATE / PRIVATE_KEY (proposed)', CT.CERT);
  else if (/(certificate|pem|pfx|p12|keystore|cacert|clientcert|serviceaccountjson|serviceaccountkey|credentialsjson|googlecredentials|serviceaccount)/.test(hay) && !/(certificateid|certificatetype|certificatename|validate|verify|certificatearn|certificatevalidation|certificateurl|certificatestore|certificatesource|certificatethumb|certificatepolicy|certificateauthorityid)/.test(hay)) {
    if (TEXTY.has(t) || t === 'textarea') valueRule(/serviceaccount|credentials/.test(hay) ? 'CRITICAL' : 'CRITICAL', 'certificate-key-material', 'collects certificate / PEM / PFX / service-account key material', /serviceaccount|credentials/.test(hay) ? 'remove; use credential type SERVICE_ACCOUNT_JSON (proposed)' : 'remove; use credential type CERTIFICATE', /serviceaccount|credentials/.test(hay) ? CT.SA : CT.CERT);
  }
  // tokens
  const tokenNeg = /(max|min|total|prompt|completion|input|output|context|usage|budget|reserved|stop|logit|bad|sampling|new|response)tokens?|token(count|limit|usage|budget|address|symbol|decimals?|contract|amount|uri|url|endpoint|expir|type|ttl|lifetime|id|in|out|standard|name|price|list|metadata|balance|transfer|supply|pair|pool|mint|swap|burn|chunk|size|estimate|counter|window|penalty|ids|index|offset|a|b|0|1|filter|meta|bucket|limits)|tokenizer|tokenization|numtokens|nctx/;
  if (/token|bearer|jwt/.test(hay) && !tokenNeg.test(hay)) {
    const strong = /(access|refresh|auth|bot|bearer|api|session|idtoken|personal|oauth|csrf|verification|webhook|security|jwt|sas|service|user|app|channel|installation|secret|private|pat)token|bearer|jwt/.test(hay);
    const bareToken = /^token(\||$)|^token$/.test(hay) || /\|token$/.test(hay);
    if (strong || bareToken) {
      const bcCtx = BLOCKCHAIN_GROUPS.has(ctx.group) && !strong;
      if (bcCtx && !/(auth|bearer|access|api|secret|bot|jwt)/i.test(pt)) hits.push(hit('AMBIGUOUS', 'token', 'field "token" in a blockchain node - probably an asset token address/symbol, not an auth token', 'decide: if asset selector keep, if auth token move to credential', CT.BEARER));
      else valueRule('CRITICAL', 'token', 'collects an auth/access/bot/bearer token value', 'remove field; use credential type ' + (/oauth|refresh|access/.test(hay) ? 'OAUTH2 or BEARER_TOKEN' : 'BEARER_TOKEN'), /oauth|refresh/.test(hay) ? CT.OAUTH : CT.BEARER);
    }
  }
  // authorization header value
  if (/authorization|authheader|authorisation/.test(hay) && !/(authorizationurl|authorizationtype|authorizationmethod|authorizationcode|authorizationendpoint|authorizationscope|authorizationmode|authorizationgrant|authorizationstatus|authorizationpolicy|authorizationrule|authorizationtype|authorizationlevel)/.test(hay)) valueRule('CRITICAL', 'authorization-header', 'authorization header value supplied on form', 'remove; use credential type BEARER_TOKEN / API_KEY', CT.BEARER);
  // cookie / session
  if (/cookie|sessionid|sessionkey|csrf|xsrf|sessiontoken/.test(hay) && !/(cookiename|cookiepolicy|cookiedomain|cookiepath|cookiesamesite|cookieexpir)/.test(hay)) valueRule('CRITICAL', 'cookie-session', 'cookie / session value', 'remove; use credential type SESSION_COOKIE (proposed)', CT.COOKIE);
  // pin
  if ((lw.includes('pin') || iw.includes('pin') || /pincode|securitypin/.test(hay)) && iw.length <= 3 && !iw.concat(lw).some(w => /^(name|type|status|hash|cid|file|json|list|pinned|service|remote|options|ipfs|count|policy|replication)$/.test(w))) valueRule('CRITICAL', 'pin', 'PIN value', 'remove; use credential type PIN_OR_PASSCODE (proposed)', CT.PIN);
  // connection strings
  if (/connectionstring|connstr|connectionuri|(^|\|)dsn|databaseurl|dburl|mongouri|mongodburi|redisurl|amqpurl|brokerurl|jdbc|connectionurl|connurl|(^|\|)conn(ection)?$/.test(hay)) {
    if (CRED_EMBED.test(pt + ' ' + str(f.def))) hits.push(hit('CRITICAL', 'connection-string', 'connection string whose placeholder/help/default embeds credentials (Password=/user:pass@)', 'remove; use credential type CONNECTION_STRING (proposed) or BASIC_AUTH', CT.CONN));
    else hits.push(hit('HIGH', 'connection-string', 'connection string / URI field - can embed user:password', 'accept host/port/db only and take user+password from a credentialID (BASIC_AUTH)', CT.CONN));
  }
  // placeholder/default embedding creds in any text field
  if (!hits.some(h => h.cat === 'connection-string') && TEXTY.has(t) && CRED_EMBED.test(f.placeholder + ' ' + str(f.def))) hits.push(hit('CRITICAL', 'embedded-credentials', 'placeholder/default shows credentials embedded in a value (user:pass@ or Password=)', 'remove or forbid userinfo; use credentialID', CT.BASIC));
  // secret-hint in placeholder/help only
  if (!hits.length && TEXTY.has(t) && t !== 'url' && !/(type|method|mode|name|id|path|mount|namespace|data|properties|derivation|status|kind|scheme|label|prefix)$/.test(c) && SECRET_TEXT_HINT.test(pt) && !/tokens\b/i.test(pt) && !/(credential|do not|don't|never|instead|reference|picker|vault)/i.test(pt)) hits.push(hit('HIGH', 'secret-hint-text', 'placeholder/help text suggests a secret is typed here', 'review; likely remove and require credentialID', ''));
  // inline credentials object
  if (/^(credentials?|creds|auth|authentication|authdata|authconfig|authjson|authparams|authparameters|customauth)(\||$)|\|(credentials?|creds)$/.test(hay) && TEXTY.has(t) && t !== 'text-select') hits.push(hit('HIGH', 'inline-credentials', 'free-form auth/credentials object on the form', 'remove; require credentialID', CT.API));
  // headers / custom body
  if (/^(headers|customheaders|requestheaders|httpheaders|extraheaders|additionalheaders|headerparams|headerparameters|headersjson|authheaders|header)(\||$)/.test(hay) && !isBenign) hits.push(hit('HIGH', 'headers', 'free-form HTTP headers (can carry Authorization / X-Api-Key)', 'strip auth headers server-side; supply auth via credentialID; allow-list header names', CT.HDR));
  if (/^(custombody|rawbody)(\||$)/.test(hay) && !isBenign) hits.push(hit('HIGH', 'custom-body', 'free-form request body (may carry tokens/secrets)', 'keep but forbid secrets; use expression/credential references', ''));
  // env maps
  if (/^(env|envvars|envvariables|environmentvariables|envvar|extraenv|dockerenv|containerenv|envfile|dotenv|environment|envs)(\||$)/.test(hay) && !isBenign) hits.push(hit('HIGH', 'env-map', 'environment-variable map (values often hold secrets)', 'split: plain vars stay, secret vars come from a credential (SECRET_ENV_SET proposed)', CT.ENV));
  // base64 key material
  if (/(base64|b64)/.test(hay) && /(cert|key|pfx|pem|credential|secret)/.test(hay) && !isBenign) hits.push(hit('HIGH', 'base64-keymaterial', 'base64 encoded key/cert material', 'remove; use CERTIFICATE credential', CT.CERT));

  // ---- MEDIUM ----
  const url = t === 'url' || t === 'uri' || /(url|uri|endpoint|hostname|host|server|proxy|webhook|domain|baseurl|apiurl|serveraddress|remoteaddress)$/.test(c) || /(url|endpoint|hostname|host|server|proxy|domain)$/.test(l);
  if (url && !isBenign && !hits.some(h => h.cat === 'connection-string')) {
    if (/https?:\/\/[^\/\s:@"]+:[^\/\s@"]+@|user:pass@|:\/\/[^\/\s]*@/i.test(f.placeholder + ' ' + f.help + ' ' + str(f.def))) hits.push(hit('HIGH', 'url-userinfo', 'URL field whose placeholder/help shows userinfo (user:pass@host)', 'reject userinfo in URL; take credentials from credentialID', CT.BASIC));
    else hits.push(hit('MEDIUM', 'ssrf-url-host', 'arbitrary URL / host input (SSRF / unrestricted egress; may embed user:pass@)', 'validate scheme (https), block private/link-local ranges, reject userinfo, allow-list where possible', ''));
  }
  if (/^(query|sql|sqlquery|rawsql|statement|sqlstatement|customquery|whereclause|where|orderby|rawquery|commandtext|querytext|selectquery|updatequery|insertquery|deletequery|customsql|filter)(\||$)/.test(hay) && !isBenign) hits.push(hit('MEDIUM', 'raw-query', 'raw query/SQL/filter text (injection risk)', 'use parameterized values; restrict to SELECT; server-side validation', ''));
  if (/^(code|script|scriptbody|jscode|javascript|pythoncode|python|functionbody|functioncode|sourcecode|snippet|shellscript|bashscript|command|cmd|commandline|shellcommand|args|arguments|entrypoint|dockerfile|initscript|userdata|startupscript|handler|lambdacode|customcode)(\||$)/.test(hay) && !isBenign) hits.push(hit('MEDIUM', 'code-exec', 'script/code/shell command input (code execution)', 'sandbox/trusted-execution only; allow-list commands; never run on host', ''));
  if (/^(expression|expressions|customexpression|condition|conditions)(\||$)/.test(hay) && !isBenign) hits.push(hit('MEDIUM', 'expression', 'expression field (server-side evaluation)', 'evaluate in sandboxed engine with no I/O', ''));
  if (/(filepath|dirpath|directory|folderpath|localpath|outputpath|inputpath|sourcepath|destinationpath|destpath|workingdirectory|workdir|filename|savepath|downloadpath|uploadpath|mountpath|hostpath|(^|\|)path$|\|path)/.test(hay) && !/(jsonpath|xpath|propertypath|fieldpath|datapath|objectpath|urlpath|apipath|resourcepath|routepath|selectorpath|keypath|nodepath|expressionpath|parentpath|folderid|fileid)/.test(hay) && !isBenign && !hits.some(h => h.cat === 'key-file-path')) hits.push(hit('MEDIUM', 'file-path', 'file system path input (path traversal / arbitrary file access)', 'constrain to a sandbox root; reject .. and absolute paths', ''));
  if (/(ignore|skip|disable|allow|accept|trustall|bypass)(ssl|tls|cert|certs|certificate|certificates|verification|verify|unauthorized|selfsigned|hostname)|rejectunauthorized|verifyssl|verifytls|verifycert|insecure|trustallcert|sslverify|strictssl|checkcertificate|unsafessl|selfsigned|allowselfsigned/.test(hay)) hits.push(hit('MEDIUM', 'tls-bypass', 'TLS verification bypass / weakening toggle (default: ' + String(f.def) + ')', 'default to verify=true; require admin permission to disable; consider removing', ''));
  if (/(skip|disable|no|bypass|without)(auth|authentication|authorization)|anonymous|allowanonymous|noauth/.test(hay)) hits.push(hit('MEDIUM', 'auth-disabled', 'flag that can disable/bypass authentication', 'remove or default to safe; require admin approval', ''));
  if (/^(auth|authentication|authtype|authmethod|authmode)(\||$)/.test(hay) && f.options.some(o => /^(none|no|anonymous|noauth)$/i.test(o))) hits.push(hit('MEDIUM', 'auth-none-option', 'authentication selector offers "none"', 'default to an authenticated mode; audit use of "none"', ''));
  if (/^(acl|publicread|ispublic|public|publicaccess|makepublic|cannedacl|accesslevel|visibility|sharingscope)(\||$)/.test(hay) && !/(email|user)/.test(hay)) hits.push(hit('MEDIUM', 'public-access', 'public-access / ACL selector (public read/exposure)', 'default private; guard public option with confirmation', ''));
  if (/(policydocument|iampolicy|rolearn|assumerole|(^|\|)permissions$|(^|\|)roles$)/.test(hay)) hits.push(hit('MEDIUM', 'iam-broad', 'IAM / permission selector (over-broad grant risk)', 'restrict to least-privilege presets', ''));
  if (/cors|alloworigin|allowedorigins|(^|\|)origins?$/.test(hay)) hits.push(hit('MEDIUM', 'cors', 'CORS origin setting (wildcard risk)', 'reject "*" with credentials; allow-list', ''));
  if (/followredirect|maxredirect|allowredirect|(^|\|)redirects$/.test(hay)) hits.push(hit('MEDIUM', 'redirects', 'redirect handling (unrestricted redirect / SSRF chaining)', 'cap redirects; re-validate target each hop', ''));
  if ((/(^|\|)(usessl|usetls|secureconnection|secure|ssl|tls|https|starttls|encrypt|encrypted|enablessl|enabletls|sslenabled|tlsenabled)(\||$)/.test(hay)) && BENIGN.has(t) && (f.def === false || f.def === 'false')) hits.push(hit('MEDIUM', 'cleartext-default', 'TLS/SSL toggle defaults to false (cleartext)', 'default to true', ''));
  if (/(^|\|)(protocol|scheme|transport)(\||$)/.test(hay) && f.options.some(o => /^(http|ftp|telnet|ws|smtp|imap|pop3|ldap)$/i.test(o))) hits.push(hit('MEDIUM', 'cleartext-protocol', 'protocol selector offers a cleartext protocol (' + f.options.filter(o => /^(http|ftp|telnet|ws|smtp|imap|pop3|ldap)$/i.test(o)).join('/') + ')', 'default to TLS variant; warn on cleartext', ''));
  if (/(^|\|)(debug|verbose|logsecrets|logrequest|logresponse|logbody|logheaders|tracing|logpayload|dumprequest|debugmode|enabledebug|verboselogging)(\||$)/.test(hay)) hits.push(hit('MEDIUM', 'debug-log', 'debug/verbose logging toggle (may log secrets/payloads)', 'ensure secrets are redacted; default off', ''));
  if (/trustedexecution/.test(hay)) hits.push(hit('MEDIUM', 'trusted-exec', 'trusted-execution-environment toggle (default: ' + String(f.def) + ')', 'default to enabled; lock for non-admins', ''));
  return { compliant: false, hits };
}

// ---------------------------------------------------------------- misc helpers
function trunc(v) { const s = String(v); return s.slice(0, 4) + '***'; }
function secretDefaults(text, fields) {
  const found = [];
  const m = text.match(new RegExp(SECRETY_LITERAL.source, 'g'));
  if (m) m.forEach(x => found.push('pattern ' + trunc(x)));
  for (const f of fields) {
    const d = f.def;
    if (typeof d !== 'string' || d.length < 16) continue;
    const c = compact(f.id + f.label);
    if (!/(password|secret|apikey|token|privatekey|mnemonic|passphrase|signingkey|accesskey|bearer|authorization|cookie|hmac|licensekey)/.test(c)) continue;
    if (/\s|\{\{|\$\{|^https?:|^\$|^<|^\*+$/.test(d)) continue;
    found.push('field ' + f.id + ' default ' + trunc(d));
  }
  return found;
}
function sqlcmd(query, outFile) {
  execFileSync('sqlcmd', ['-S', SQL_SERVER, '-d', SQL_DB, '-E', '-C', '-b', '-y', '0', '-f', '65001', '-Q', 'SET NOCOUNT ON; ' + query, '-o', outFile], { stdio: 'pipe', maxBuffer: 1 << 28 });
  return fs.readFileSync(outFile, 'utf8').replace(/^\uFEFF/, '');
}
function dbRows(name, expr, from) {
  const tmp = path.join(os.tmpdir(), 'formaudit_' + name + '.txt');
  const raw = sqlcmd("SELECT 'ROW~|~'+X FROM (SELECT " + expr + " " + from + ") T(X)", tmp);
  return raw.split(/\r?\n/).filter(l => l.startsWith('ROW~|~')).map(l => l.slice(6).split('~|~'));
}
const REPL = e => "REPLACE(REPLACE(ISNULL(" + e + ",''),CHAR(13),' '),CHAR(10),' ')";
function tryJson(s) { try { return JSON.parse(s); } catch (e) { return undefined; } }

// ---------------------------------------------------------------- main
function main() {
  const excluded = { total: 0, byKind: {}, dirs: [] };
  const files = [];
  walk(ROOT, files, excluded);
  const isTemplateScript = p => /(^|[\\/])00_DataTemplates[\\/]/.test(p) || /Sync_DataTemplates|Template_DataTemplates/.test(path.basename(p));

  // live DB
  let dbForms = [], peRows = [], palRows = [], credTypes = [], dbOk = true, dbErr = '';
  try {
    dbForms = dbRows('forms', "CAST(FormID AS varchar)+'~|~'+ISNULL(FormCode,'')+'~|~'+ISNULL(PrimaryUsage,'')+'~|~'+ISNULL(Name,'')+'~|~'+" + REPL('CAST([Schema] AS nvarchar(max))') + "+'~|~'+" + REPL("ISNULL(CAST(SampleData AS nvarchar(max)),'')+' '+ISNULL(CAST(InitialData AS nvarchar(max)),'')"), 'FROM Atlas_Forms WHERE Deleted=0');
    peRows = dbRows('pe', "CAST(ProcessElementTypeID AS varchar)+'~|~'+ISNULL(Code,'')+'~|~'+ISNULL(Name,'')+'~|~'+" + REPL('CAST(ConfigurationSchema AS nvarchar(max))'), 'FROM Process_ProcessElementTypes WHERE ConfigurationSchema IS NOT NULL');
    palRows = dbRows('pal', "CAST(DataTemplateID AS varchar)+'~|~'+ISNULL(TemplateName,'')+'~|~'+" + REPL('CAST(ContentData AS nvarchar(max))'), 'FROM Template_DataTemplates WHERE ContentData IS NOT NULL');
    credTypes = dbRows('ct', "Code+'~|~'+Name+'~|~'+ISNULL(Description,'')", 'FROM AIExt_CredentialTypes WHERE Deleted=0');
  } catch (e) { dbOk = false; dbErr = String(e.message).slice(0, 200); }
  const dbById = new Map(dbForms.map(r => [r[0], { formID: r[0], code: r[1], usage: r[2], name: r[3], schema: r[4], data: r[5] }]));
  const dbByCode = new Map(dbForms.map(r => [r[1], r[0]]));

  const stats = { scriptsTotal: files.length, formScripts: 0, nonFormScripts: 0, templateScripts: 0, literalsParsed: 0, formsParsed: 0, fieldsInspected: 0, fallbackFiles: [], noSchemaFiles: [], compliantFields: 0 };
  const units = new Map(); // key formKey -> {group,node,formID,formCode,usage,fields[],files[]}
  const secretDefaultFindings = [];
  const scriptFormIDs = new Set();

  for (const file of files) {
    const rel = path.relative(ROOT, file).replace(/\\/g, '/');
    if (isTemplateScript(rel)) { stats.templateScripts++; continue; }
    let text;
    try { text = fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, ''); } catch (e) { text = fs.readFileSync(file, 'latin1'); }
    if (!/Atlas_Forms/i.test(text)) { stats.nonFormScripts++; continue; }
    stats.formScripts++;
    const parts = rel.split('/');
    const group = parts[0];
    const formsIdx = parts.findIndex(p => /^forms$/i.test(p));
    let nodeParts = formsIdx > 1 ? parts.slice(1, formsIdx) : parts.slice(1, -1);
    const node = nodeParts.length ? nodeParts.join('/') : '(group-level sync script)';
    let formID = (text.match(/FormID:\s*(\d+)/i) || path.basename(file).match(/Atlas_Forms_(\d+)_/i) || text.match(/FormID\s*=\s*(\d+)/i) || [])[1] || '';
    let formCode = (text.match(/FormCode:\s*([A-Za-z0-9_\-]+)/i) || text.match(/FormCode\s*=\s*N?'([^']+)'/i) || [])[1] || '';
    if (!formID && formCode && dbByCode.has(formCode)) formID = dbByCode.get(formCode);
    const key = formID ? 'F' + formID : 'file:' + rel;
    const lits = extractLiterals(text);
    const fields = [];
    let parsed = 0, fell = false;
    for (const lit of lits) {
      const j = tryJson(lit);
      if (j !== undefined) { parsed++; stats.literalsParsed++; collectFields(j, fields); }
      else if (/"(id|name|key)"\s*:/.test(lit) && /"type"\s*:/.test(lit)) { fell = true; fallbackFields(lit, fields); }
    }
    if (!lits.length && /"controls"|"properties"/.test(text)) { fell = true; fallbackFields(text, fields); }
    if (fell) stats.fallbackFiles.push(rel);
    if (!fields.length) stats.noSchemaFiles.push(rel);
    let u = units.get(key);
    if (!u) { u = { key, group, node, formID, formCode, usage: '', fields: new Map(), files: [] }; units.set(key, u); }
    if (!u.formCode && formCode) u.formCode = formCode;
    u.files.push(rel);
    for (const f of fields) if (!u.fields.has(f.id)) u.fields.set(f.id, Object.assign({ from: 'script' }, f));
    if (formID) scriptFormIDs.add(formID);
    const sd = secretDefaults(text, fields);
    if (sd.length) secretDefaultFindings.push({ where: rel, group, node, formID, items: sd });
  }

  // DB forms: merge / add DB-only
  const dbOnly = [];
  let dbDefaultHits = [];
  for (const d of dbById.values()) {
    let u = units.get('F' + d.formID);
    const j = tryJson(d.schema);
    const fields = [];
    if (j !== undefined) collectFields(j, fields); else if (d.schema) fallbackFields(d.schema, fields);
    if (!u) {
      const g = (d.usage || d.code || 'db-only');
      u = { key: 'F' + d.formID, group: '(db-only)', node: g, formID: d.formID, formCode: d.code, usage: d.usage, fields: new Map(), files: [], dbOnly: true };
      units.set(u.key, u); dbOnly.push(d);
    }
    u.usage = d.usage; if (!u.formCode) u.formCode = d.code; u.inDB = true; u.name = d.name;
    for (const f of fields) if (!u.fields.has(f.id)) u.fields.set(f.id, Object.assign({ from: 'db' }, f));
    const sd = secretDefaults(d.data + ' ' + d.schema, fields);
    if (sd.length) dbDefaultHits.push({ where: 'DB FormID ' + d.formID + ' ' + d.code, group: u.group, node: u.node, formID: d.formID, items: sd });
  }
  const scriptOnly = [...units.values()].filter(u => u.formID && !u.dbOnly && !dbById.has(u.formID));

  // classification
  const exemptFindings = [], findings = [], compliantByNode = new Map(), reviewList = [], perNodeFields = new Map();
  stats.formsParsed = units.size;
  for (const u of units.values()) {
    const nodeKey = u.group + '/' + u.node;
    u.exempt = /credential(editor|viewer)$/i.test(u.formCode || '') || /^credential-(editor|viewer)/i.test(u.usage || '') ? 'credential editor/viewer form (expected to hold secret inputs: this IS the credential vault UI)'
      : (/^(ALL_CONTROLS|CONTROL_REF)/i.test(u.formCode || '') || /(sdk testing|control library)/i.test(u.name || '') ? 'control library / SDK test form (not a node form)' : '');
    const ctx = { group: u.group };
    const hasPw = [];
    let uHits = [];
    for (const f of u.fields.values()) {
      stats.fieldsInspected++;
      perNodeFields.set(nodeKey, (perNodeFields.get(nodeKey) || 0) + 1);
      const r = classify(f, ctx);
      if (r.compliant) { stats.compliantFields++; const c = compliantByNode.get(nodeKey) || { fields: 0, forms: new Set() }; c.fields++; c.forms.add(u.formID || u.key); compliantByNode.set(nodeKey, c); continue; }
      for (const h of r.hits) {
        const rec = { group: u.group, node: u.node, formID: u.formID || '?', formCode: u.formCode || '', fieldID: f.id, label: f.label, type: f.type + (f.sub ? ' [' + f.sub + ']' : ''), sev: h.sev, cat: h.cat, reason: h.reason, fix: h.fix, credType: h.credType, src: u.dbOnly ? 'db-only' : (f.from === 'db' ? 'db (script drift)' : 'script'), def: f.def };
        if (h.cat === 'password' || h.cat === 'password-control') hasPw.push(rec);
        uHits.push(rec);
      }
      // sensitive default (report only)
    }
    if (hasPw.length) {
      for (const f of u.fields.values()) {
        if (/^(username|user|userlogin|login|loginname|accountname|adminuser|dbuser|dbusername|smtpuser|smtpusername|serveruser|registryusername)$/.test(compact(f.id)) && BENIGN.has(f.type) === false) {
          uHits.push({ group: u.group, node: u.node, formID: u.formID || '?', formCode: u.formCode || '', fieldID: f.id, label: f.label, type: f.type, sev: 'HIGH', cat: 'username-with-password', reason: 'username collected on the same form as a password', fix: 'move username and password together into credential BASIC_AUTH', credType: CT.BASIC, src: u.dbOnly ? 'db-only' : 'script' });
        }
      }
    }
    // destructive ops without confirm guard (suggestion section)
    const opField = [...u.fields.values()].find(f => /(operation|action|mode|method|command)$/i.test(f.id) && f.options.length);
    if (opField) {
      const bad = opField.options.filter(o => /(delete|drop|truncate|remove|destroy|purge|write|update|create|alter|overwrite|terminate|revoke|transfer|send|execute|exec)/i.test(o));
      const hasConfirm = [...u.fields.values()].some(f => /(confirm|dryrun|approval|requireapproval|safemode|readonly|acknowledge)/i.test(compact(f.id)));
      if (bad.length && !hasConfirm) reviewList.push({ kind: 'unguarded-op', group: u.group, node: u.node, formID: u.formID, formCode: u.formCode, field: opField.id, ops: bad.slice(0, 8).join(', ') });
    }
    // operation-specific forms (one form per operation): destructive verb in FormCode/file name and no guard field
    if (!u.exempt && /(delete|drop|truncate|purge|destroy|remove|wipe|clear|revoke|terminate)/i.test((u.formCode || '') + ' ' + (u.files[0] || ''))) {
      const guarded = [...u.fields.values()].some(f => /(confirm|dryrun|approval|safemode|readonly|acknowledge)/i.test(compact(f.id)));
      if (!guarded) reviewList.push({ kind: 'unguarded-op', group: u.group, node: u.node, formID: u.formID, formCode: u.formCode, field: '(whole form)', ops: 'destructive operation form, no confirm/dryRun field' });
    }
    // unique dedupe
    const seen = new Set();
    for (const r of uHits) {
      const k = r.formID + '|' + r.fieldID + '|' + r.cat;
      if (seen.has(k)) continue; seen.add(k);
      if (u.exempt) { if (r.sev !== 'REVIEW' && r.sev !== 'AMBIGUOUS') exemptFindings.push(Object.assign({ exempt: u.exempt }, r)); }
      else if (r.sev === 'REVIEW' || r.sev === 'AMBIGUOUS') reviewList.push(Object.assign({ kind: r.sev.toLowerCase() }, r)); else findings.push(r);
    }
  }

  // ---- config schemas + palette
  const cfgFindings = [];
  for (const r of peRows) {
    const [id, code, name, schema] = r;
    const j = tryJson(schema); if (j === undefined) { cfgFindings.push({ src: 'ConfigurationSchema', code, id, note: 'unparseable JSON' }); continue; }
    const fields = [];
    collectFields(j, fields);
    const names = new Set();
    (function keys(n) { if (Array.isArray(n)) n.forEach(keys); else if (n && typeof n === 'object') for (const k of Object.keys(n)) { if (k === 'properties' && n[k] && typeof n[k] === 'object') Object.keys(n[k]).forEach(x => names.add(x)); keys(n[k]); } })(j);
    for (const nm of names) if (!fields.some(f => f.id === nm)) fields.push({ id: nm, type: 'string', sub: '', masked: false, label: '', placeholder: '', help: '', options: [] });
    const seen = new Set();
    for (const f of fields) {
      const res = classify(f, { group: '' });
      for (const h of res.hits) {
        if (h.sev === 'MEDIUM' && !/tls|auth-none|cleartext/.test(h.cat)) continue; // keep the cfg list focused on secrets + TLS/auth
        const k = f.id + h.cat; if (seen.has(k)) continue; seen.add(k);
        cfgFindings.push({ src: 'Process_ProcessElementTypes.ConfigurationSchema', code, id, fieldID: f.id, type: f.type, sev: h.sev, cat: h.cat });
      }
    }
    stats.cfgTypes = (stats.cfgTypes || 0) + 1;
  }
  const palFindings = [], palKeysSeen = new Map();
  for (const r of palRows) {
    const [id, tname, content] = r;
    const j = tryJson(content); if (j === undefined) { palFindings.push({ id, tname, note: 'unparseable ContentData' }); continue; }
    const fields = [];
    collectFields(j, fields);
    const names = new Set();
    (function keys(n, d) { if (d > 12) return; if (Array.isArray(n)) n.forEach(x => keys(x, d + 1)); else if (n && typeof n === 'object') for (const k of Object.keys(n)) { names.add(k); keys(n[k], d + 1); } })(j, 0);
    for (const nm of names) if (!fields.some(f => f.id === nm)) fields.push({ id: nm, type: 'string', sub: '', masked: false, label: '', placeholder: '', help: '', options: [] });
    const seen = new Set();
    for (const f of fields) {
      const res = classify(f, { group: '' });
      for (const h of res.hits) {
        if (!(h.sev === 'CRITICAL' || h.sev === 'HIGH')) continue;
        const k = f.id + h.cat; if (seen.has(k)) continue; seen.add(k);
        palFindings.push({ id, tname, fieldID: f.id, sev: h.sev, cat: h.cat });
      }
    }
    stats.palTemplates = (stats.palTemplates || 0) + 1;
  }

  // merge duplicate hits per (form, field, severity class): one row, reasons joined
  const merged = new Map();
  for (const r of findings) {
    const k = r.formID + '|' + r.fieldID + '|' + (r.sev === 'MEDIUM' ? r.cat : r.sev);
    const m = merged.get(k);
    if (!m) merged.set(k, Object.assign({}, r));
    else { if (!m.reason.includes(r.reason)) m.reason += '; ' + r.reason; if (!m.cat.includes(r.cat)) m.cat += '+' + r.cat; if (!m.credType && r.credType) m.credType = r.credType; if (m.fix !== r.fix && !m.fix.includes(r.fix)) m.fix += ' / ' + r.fix; }
  }
  findings.length = 0; merged.forEach(v => { if (!v.credType && /password-control/.test(v.cat)) v.credType = CT.API; findings.push(v); });
  return { exemptFindings, files, stats, excluded, units, findings, compliantByNode, reviewList, secretDefaultFindings, dbDefaultHits, dbOnly, scriptOnly, dbForms, dbById, cfgFindings, palFindings, credTypes, dbOk, dbErr, perNodeFields, peCount: peRows.length, palCount: palRows.length };
}

// ---------------------------------------------------------------- report
const SEV_ORDER = { CRITICAL: 0, HIGH: 1, MEDIUM: 2 };
const esc = s => String(s === undefined ? '' : s).replace(/\|/g, '/').replace(/\r?\n/g, ' ').replace(/[^\x20-\x7E]/g, '?');
function tbl(headers, rows) { return '| ' + headers.join(' | ') + ' |\n|' + headers.map(() => '---').join('|') + '|\n' + rows.map(r => '| ' + r.map(esc).join(' | ') + ' |').join('\n') + '\n'; }

function buildReport(R) {
  const F = R.findings;
  const by = (arr, fn) => { const m = new Map(); arr.forEach(x => { const k = fn(x); m.set(k, (m.get(k) || 0) + 1); }); return m; };
  const sevCount = by(F, x => x.sev);
  const formsWith = sev => new Set(F.filter(x => x.sev === sev).map(x => x.formID)).size;
  const L = [];
  L.push('# Node Config Form Secrets Audit - 2026-09-20\n');
  L.push('Status: READ-ONLY review for Binoy. No form script, code or database row was changed. Secret values are never printed (first 4 chars + `***` at most).\n');
  L.push('Company rule under test: passwords, API keys, tokens, private keys, mnemonics/seed phrases and certificates reach a node ONLY through a credential (credentialID picker); a form must never hold the secret itself.\n');

  // 1 method
  L.push('## 1. Method and scope\n');
  L.push('- Source of truth: every `.sql` under `' + ROOT + '` (excluding folders named obsolete/backup/unapproved/unsorted). JSON form schemas are pulled out of the T-SQL `N\'...\'` literals (`\'\'` undoubled), parsed with `JSON.parse`, then walked recursively; a field is any object with id/name/key + type (controls[] style) or any entry of a `properties` map (JSON-schema style). Non-input widgets (heading, divider, group, ...) are ignored.');
  L.push('- Classification is name/label/placeholder/help/type/default based (regex rules in the appendix script). Numeric/boolean/select controls whose NAME looks sensitive are downgraded to REVIEW (section 7), not counted as findings.');
  L.push('- Live DB cross-check (read-only SELECTs via sqlcmd on `' + SQL_DB + '`): `Atlas_Forms` (' + R.dbForms.length + ' non-deleted forms), `Process_ProcessElementTypes.ConfigurationSchema` (' + R.peCount + ' rows), `Template_DataTemplates.ContentData` (' + R.palCount + ' rows), `AIExt_CredentialTypes`.');
  L.push('- Forms in the DB but with NO script are also scanned from their live schema and flagged `db-only` (they are included in all counts below).' + (R.dbOk ? '' : ' **DB was not reachable: ' + R.dbErr + '**') + '\n');
  L.push(tbl(['Metric', 'Value'], [
    ['.sql files under projects root (all)', R.stats.scriptsTotal + R.excluded.total],
    ['Excluded (obsolete/backup/unapproved/unsorted) - not scanned', R.excluded.total + ' (' + Object.entries(R.excluded.byKind).map(([k, v]) => k + ' ' + v).join(', ') + ')'],
    ['In-scope .sql files', R.stats.scriptsTotal],
    ['  - DataTemplate/palette scripts (covered via DB ContentData, section 6.3)', R.stats.templateScripts],
    ['  - scripts that touch Atlas_Forms (scanned)', R.stats.formScripts],
    ['  - other scripts (no Atlas_Forms)', R.stats.nonFormScripts],
    ['JSON literals parsed cleanly', R.stats.literalsParsed],
    ['Scripts using parse-fallback (regex)', R.stats.fallbackFiles.length],
    ['Scripts where no fields were found (patch/sync scripts)', R.stats.noSchemaFiles.length],
    ['Distinct forms analysed (script FormIDs + DB-only)', R.stats.formsParsed],
    ['Fields / properties inspected', R.stats.fieldsInspected],
    ['Compliant credential-picker fields', R.stats.compliantFields],
    ['Forms in DB (non-deleted)', R.dbForms.length],
    ['DB forms with no script (db-only)', R.dbOnly.length],
    ['Script FormIDs not found in DB', R.scriptOnly.length],
    ['ConfigurationSchema rows scanned', R.peCount],
    ['Palette template ContentData rows scanned', R.palCount],
  ]));
  if (R.stats.fallbackFiles.length) L.push('\nParse-fallback scripts (first 40): ' + R.stats.fallbackFiles.slice(0, 40).map(x => '`' + x + '`').join(', ') + '\n');
  L.push('\nExcluded folders (file counts): ' + R.excluded.dirs.map(x => '`' + x + '`').join(', ') + '\n');

  // 2 summary
  L.push('## 2. Summary counts\n');
  L.push(tbl(['Severity', 'Findings (field hits)', 'Distinct forms affected'], [
    ['CRITICAL', sevCount.get('CRITICAL') || 0, formsWith('CRITICAL')],
    ['HIGH', sevCount.get('HIGH') || 0, formsWith('HIGH')],
    ['MEDIUM', sevCount.get('MEDIUM') || 0, formsWith('MEDIUM')],
    ['REVIEW / AMBIGUOUS (need decision, section 7)', R.reviewList.filter(x => x.kind === 'review' || x.kind === 'ambiguous').length, ''],
  ]));
  const catMap = new Map(); F.forEach(x => x.cat.split('+').forEach(c => { const k = x.sev + ' / ' + c; catMap.set(k, (catMap.get(k) || 0) + 1); }));
  const cats = [...catMap.entries()].sort();
  L.push('\nBy category:\n');
  L.push(tbl(['Severity / category', 'Count'], cats));
  const grp = new Map();
  F.forEach(x => { const g = grp.get(x.group) || { CRITICAL: 0, HIGH: 0, MEDIUM: 0 }; g[x.sev]++; grp.set(x.group, g); });
  L.push('\nBy node group:\n');
  L.push(tbl(['Group', 'CRITICAL', 'HIGH', 'MEDIUM'], [...grp.entries()].sort((a, b) => (b[1].CRITICAL - a[1].CRITICAL) || (b[1].HIGH - a[1].HIGH)).map(([g, v]) => [g, v.CRITICAL, v.HIGH, v.MEDIUM])));

  // 3 main table
  L.push('\n## 3. Findings\n');
  const cr = F.filter(x => x.sev === 'CRITICAL' || x.sev === 'HIGH').sort((a, b) => (SEV_ORDER[a.sev] - SEV_ORDER[b.sev]) || (a.group + a.node).localeCompare(b.group + b.node) || (Number(a.formID) - Number(b.formID)) || a.fieldID.localeCompare(b.fieldID));
  L.push('### 3.1 CRITICAL and HIGH (every field listed)\n');
  L.push('Sorted by severity then node. `Src`: script = found in a repo script (also in DB unless noted in section 1), db-only = form has no script.\n');
  L.push(tbl(['Severity', 'Group/Node', 'FormID', 'FormCode', 'Field ID', 'Label', 'Control type', 'Reason', 'Suggested fix', 'Src'], cr.map(x => [x.sev, x.group + '/' + x.node, x.formID, x.formCode, x.fieldID, x.label, x.type, x.reason, x.fix, x.src])));
  L.push('\n### 3.2 MEDIUM (security-threat surface, aggregated per node and category)\n');
  const med = new Map();
  F.filter(x => x.sev === 'MEDIUM').forEach(x => { const k = x.group + '/' + x.node + '||' + x.cat; const m = med.get(k) || { x, forms: new Set(), fields: new Set() }; m.forms.add(x.formID); m.fields.add(x.fieldID); med.set(k, m); });
  const medRows = [...med.values()].sort((a, b) => (a.x.cat.localeCompare(b.x.cat)) || (a.x.group + a.x.node).localeCompare(b.x.group + b.x.node));
  L.push(tbl(['Category', 'Group/Node', 'Forms (FormIDs)', 'Field IDs', 'Reason', 'Suggested fix'], medRows.map(m => [m.x.cat, m.x.group + '/' + m.x.node, [...m.forms].slice(0, 12).join(', ') + (m.forms.size > 12 ? ' (+' + (m.forms.size - 12) + ')' : ''), [...m.fields].slice(0, 10).join(', ') + (m.fields.size > 10 ? ' (+' + (m.fields.size - 10) + ')' : ''), m.x.reason, m.x.fix])));

  // secret-looking defaults
  L.push('\n### 3.3 Secret-looking defaults / sample data (values NOT shown)\n');
  const sdAll = R.secretDefaultFindings.concat(R.dbDefaultHits);
  if (!sdAll.length) L.push('None found by the pattern rules (sk-, ghp_, AKIA, xox*, JWT eyJ, PEM blocks, long random defaults on secret-named fields).\n');
  else L.push(tbl(['Where', 'Group/Node', 'FormID', 'Hits (truncated)'], sdAll.map(x => [x.where, x.group + '/' + x.node, x.formID, x.items.join('; ')])));

  L.push('\n### 3.4 Excluded from counts: credential editor/viewer and control-library forms\n');
  L.push('These forms legitimately contain secret inputs (they are the credential vault UI) or are UI-control test forms. Listed for completeness; NOT counted above and NOT proposed for removal (Binoy to confirm).\n');
  const ex = new Map(); R.exemptFindings.forEach(x => { const k = x.formID + '|' + x.formCode; const m = ex.get(k) || { x, fields: new Set() }; m.fields.add(x.fieldID + ':' + x.sev); ex.set(k, m); });
  L.push(tbl(['FormID', 'FormCode', 'Why excluded', 'Flagged fields'], [...ex.values()].map(m => [m.x.formID, m.x.formCode, m.x.exempt, [...m.fields].slice(0, 14).join(', ')])));
  L.push('\n### 3.5 DB forms with no script (db-only) and script FormIDs missing from the DB\n');
  L.push('db-only forms (' + R.dbOnly.length + '): ' + R.dbOnly.map(d => d.formID + ' ' + d.code).slice(0, 140).join('; ') + (R.dbOnly.length > 140 ? ' ...' : '') + '\n');
  L.push('\nScript FormIDs not present in the DB (' + R.scriptOnly.length + '): ' + R.scriptOnly.map(u => u.formID + ' ' + (u.formCode || '') + ' [' + u.files[0] + ']').slice(0, 60).join('; ') + '\n');

  // 4 compliant
  L.push('\n## 4. Compliant pattern: credential picker fields\n');
  const nodesAll = new Set([...R.perNodeFields.keys()]);
  const critNodes = new Map();
  F.filter(x => x.sev === 'CRITICAL' || x.sev === 'HIGH').forEach(x => { const k = x.group + '/' + x.node; const m = critNodes.get(k) || { c: 0, h: 0, cred: new Set(), forms: new Set() }; if (x.sev === 'CRITICAL') m.c++; else m.h++; if (x.credType) m.cred.add(x.credType); m.forms.add(x.formID); critNodes.set(k, m); });
  L.push('Total compliant credential fields (credentialID / credential picker): **' + R.stats.compliantFields + '** across **' + R.compliantByNode.size + '** nodes (of ' + nodesAll.size + ' nodes/groups with forms).\n');
  L.push(tbl(['Group/Node', 'Credential fields', 'Forms with picker'], [...R.compliantByNode.entries()].sort((a, b) => b[1].fields - a[1].fields).map(([k, v]) => [k, v.fields, v.forms.size])));
  const needCred = [...critNodes.entries()].filter(([k]) => !R.compliantByNode.has(k));
  L.push('\n### 4.1 Nodes with CRITICAL/HIGH fields and NO credential picker yet (need a credential type wired in)\n');
  L.push(tbl(['Group/Node', 'CRITICAL', 'HIGH', 'Forms', 'Credential type(s) to use'], needCred.sort((a, b) => b[1].c - a[1].c).map(([k, v]) => [k, v.c, v.h, v.forms.size, [...v.cred].join(', ')])));
  const partial = [...critNodes.entries()].filter(([k]) => R.compliantByNode.has(k));
  L.push('\n### 4.2 Nodes that already have a credential picker but STILL have secret/credential-like fields on some form\n');
  L.push(tbl(['Group/Node', 'CRITICAL', 'HIGH', 'Forms', 'Credential fields already present'], partial.sort((a, b) => b[1].c - a[1].c).map(([k, v]) => [k, v.c, v.h, v.forms.size, R.compliantByNode.get(k).fields])));

  // 5 suggestions
  L.push('\n## 5. Suggested additional security-threat fields (recommendations, no rule matched as a secret)\n');
  const un = R.reviewList.filter(x => x.kind === 'unguarded-op');
  L.push('### 5.1 Write/delete/DDL style operations with no confirmation / dry-run guard field on the same form\n');
  L.push(un.length ? tbl(['Group/Node', 'FormID', 'FormCode', 'Operation field', 'Risky options'], un.map(x => [x.group + '/' + x.node, x.formID, x.formCode, x.field, x.ops])) : 'None.\n');
  L.push('\n### 5.2 Recommended new guard fields / server-side controls\n');
  [
    '`confirmDestructive` (boolean, default false) on every node operation that deletes, drops, truncates, overwrites or transfers value; block execution unless true or an approval node precedes it.',
    '`dryRun` / `readOnly` (boolean) on database, storage, IaaS and Kubernetes nodes.',
    '`allowedHosts` / egress allow-list (or tenant-level policy) for every arbitrary URL/host field; always resolve and block loopback, link-local (169.254.x.x), RFC1918 unless an admin enables it.',
    '`maxResponseBytes`, `timeoutSeconds`, `maxRedirects` on every HTTP-style node.',
    'Raw SQL / query fields: switch to parameterized form (`query` + `parameters[]`) and add `allowWrite` (default false).',
    'Code/script/shell nodes: force `enableTrustedExecutionEnvironment` = true and non-editable for non-admins; add `allowedCommands`.',
    'File-path fields: add `sandboxRoot` and reject `..`, absolute and UNC paths.',
    'Storage nodes: add `acl` default `private`, and require confirmation for public-read.',
    'Webhook trigger nodes: make signature/secret validation mandatory (`requireSignature` true, secret from credential), never optional.',
    'Logging: `redactSecrets` non-optional; remove any user-facing `logRequestBody`/`debug` toggles that could print headers.',
    'Blockchain nodes: `maxTransferAmount` / `allowedRecipients` guards and a mandatory approval step for value-moving operations.',
  ].forEach(x => L.push('- ' + x));

  // 6 plan
  L.push('\n## 6. Proposed remediation plan\n');
  L.push('### 6.1 Existing credential types (AIExt_CredentialTypes, non-deleted)\n');
  const real = R.credTypes.filter(r => !/^Sample Name/.test(r[1]));
  L.push(tbl(['Code', 'Name', 'Description'], real.map(r => [r[0], r[1], r[2]])));
  const samples = R.credTypes.length - real.length;
  if (samples) L.push('\n(' + samples + ' additional placeholder rows named "Sample Name ..." with codes such as AIE70948 exist and are test data, not usable types.)\n');
  L.push('\n### 6.2 Field -> credential type mapping\n');
  const m2 = new Map();
  F.filter(x => (x.sev === 'CRITICAL' || x.sev === 'HIGH') && x.credType).forEach(x => { const k = x.cat + '||' + x.credType; const m = m2.get(k) || { cat: x.cat, cred: x.credType, n: 0, nodes: new Set() }; m.n++; m.nodes.add(x.group + '/' + x.node); m2.set(k, m); });
  L.push(tbl(['Field category', 'Credential type', 'Status', 'Fields', 'Nodes'], [...m2.values()].sort((a, b) => b.n - a.n).map(m => [m.cat, m.cred, /proposed/.test(m.cred) ? 'NEW type needed' : 'exists', m.n, m.nodes.size])));
  L.push('\nProposed new types (add to AIExt_CredentialTypes with a FieldsSchema each): ' + [...new Set([...m2.values()].map(m => m.cred).filter(c => /proposed/.test(c)))].join(', ') + '. Alternative: keep to the 5 existing types and add generic `SECRET_VALUE` (single masked value) + `SECRET_FIELDS` (named masked fields) if Binoy prefers fewer types.\n');
  L.push('\n### 6.3 Node config schemas and palette templates (defining config keys)\n');
  const cf = R.cfgFindings.filter(x => x.sev);
  const pf = R.palFindings.filter(x => x.sev);
  L.push('- `Process_ProcessElementTypes.ConfigurationSchema`: ' + R.peCount + ' rows scanned, ' + cf.length + ' sensitive-name property hits in ' + new Set(cf.map(x => x.code)).size + ' node types' + (R.cfgFindings.some(x => x.note) ? ' (' + R.cfgFindings.filter(x => x.note).length + ' unparseable)' : '') + '.');
  L.push('- `Template_DataTemplates.ContentData`: ' + R.palCount + ' rows scanned, ' + pf.length + ' CRITICAL/HIGH key-name hits in ' + new Set(pf.map(x => x.id)).size + ' templates (key names only; template content is not executed).\n');
  L.push('ConfigurationSchema hits:\n');
  L.push(cf.length ? tbl(['Node code', 'ProcessElementTypeID', 'Property', 'Severity', 'Category'], cf.sort((a, b) => a.code.localeCompare(b.code)).map(x => [x.code, x.id, x.fieldID, x.sev, x.cat])) : 'None.\n');
  L.push('\nPalette template hits (grouped):\n');
  const pg = new Map(); pf.forEach(x => { const k = x.tname; const m = pg.get(k) || { id: x.id, keys: new Set() }; m.keys.add(x.fieldID + ' (' + x.sev + ')'); pg.set(k, m); });
  L.push(pf.length ? tbl(['Template', 'DataTemplateID', 'Sensitive keys'], [...pg.entries()].sort().map(([k, v]) => [k, v.id, [...v.keys].slice(0, 12).join(', ')])) : 'None.\n');
  L.push('\n### 6.4 Order of work\n');
  const rank = [...critNodes.entries()].map(([k, v]) => [k, v.c * 3 + v.h]).sort((a, b) => b[1] - a[1]);
  L.push('1. Add the missing credential types to AIExt_CredentialTypes (section 6.2) and confirm the credential picker control can be reused on every node form.');
  L.push('2. Fix nodes in this order (weight = 3 x CRITICAL + HIGH): ' + rank.slice(0, 25).map(([k, w]) => k + ' (' + w + ')').join('; ') + '.');
  L.push('3. Per node: add `credentialID` picker (if the node has none), remove the offending fields from every form of the node (all operations), remove the config keys from ConfigurationSchema, update executors to resolve secrets from the credential only, and add a Sync_ script + DevelopmentHistoryLog entry.');
  L.push('4. Then HIGH items (connection strings, headers, env maps): keep non-secret parts (host/port/db name) and move user/password into credentials.');
  L.push('5. Then MEDIUM items: URL/host validation, TLS-bypass defaults, raw SQL/code guards (section 5).');
  L.push('6. Re-run `scan-form-secrets.js` after each batch; target is zero CRITICAL and zero HIGH (except decisions in section 7).\n');

  // 7 decisions
  L.push('## 7. Needs Binoy decision (ambiguous or downgraded fields)\n');
  const rv = R.reviewList.filter(x => x.kind === 'review' || x.kind === 'ambiguous');
  L.push('Fields whose NAME looks sensitive but the control is a toggle/select/number, blockchain fields called "token", and secret references (names/paths/ARNs rather than values):\n');
  L.push(tbl(['Kind', 'Group/Node', 'FormID', 'Field ID', 'Label', 'Type', 'Why'], rv.slice(0, 400).map(x => [x.kind, x.group + '/' + x.node, x.formID, x.fieldID, x.label, x.type, x.reason])));
  if (rv.length > 400) L.push('\n(' + (rv.length - 400) + ' more not shown; re-run the script and inspect `reviewList`.)\n');
  const sr = F.filter(x => x.cat === 'secret-reference');
  L.push('\nOther decisions:\n');
  L.push('- Connection-string fields (HIGH): is a host:port-only connection string acceptable on the form if user/password come from a credential? (Redis forms already use `host:port` patterns.)');
  L.push('- Blockchain `token` / address fields: asset selectors or auth tokens? (see AMBIGUOUS rows above).');
  L.push('- Plain `username` fields: keep on form when the credential holds only the password, or move both into the credential? (Proposal: move both.)');
  L.push('- Free-form headers/custom body: remove entirely, or keep with a server-side strip of Authorization/X-Api-Key?');
  L.push('- Secret references (name/ARN/path): allowed as references, or force a credential picker? (' + sr.length + ' fields)');

  // 8 appendix
  L.push('\n## 8. Appendix: scan script\n');
  L.push('Saved at `C:\\BizFirstGO_FI_AI\\Documentation\\Employees\\agentic-development-engineers\\workflow-development-node-forms\\audit\\scan-form-secrets.js`. Re-run: `node scan-form-secrets.js <reportPath>` (needs Node 20 and sqlcmd on PATH; read-only). Full source follows.\n');
  L.push('```javascript\n' + fs.readFileSync(SELF, 'utf8') + '\n```\n');
  return L.join('\n');
}

const R = main();
const report = buildReport(R).replace(/[^\x09\x0A\x0D\x20-\x7E]/g, '?');
fs.mkdirSync(path.dirname(REPORT), { recursive: true });
fs.writeFileSync(REPORT, report, 'utf8');
const F = R.findings;
const cnt = s => F.filter(x => x.sev === s).length;
const nodeScore = new Map();
F.forEach(x => { if (x.sev === 'MEDIUM') return; const k = x.group + '/' + x.node; const m = nodeScore.get(k) || { c: 0, h: 0 }; if (x.sev === 'CRITICAL') m.c++; else m.h++; nodeScore.set(k, m); });
console.log(JSON.stringify({
  report: REPORT, forms: R.stats.formsParsed, fields: R.stats.fieldsInspected, scripts: R.stats.formScripts, fallback: R.stats.fallbackFiles.length,
  critical: cnt('CRITICAL'), high: cnt('HIGH'), medium: cnt('MEDIUM'), review: R.reviewList.filter(x => x.kind === 'review' || x.kind === 'ambiguous').length,
  compliant: R.stats.compliantFields, dbForms: R.dbForms.length, dbOnly: R.dbOnly.length, scriptOnly: R.scriptOnly.length, excluded: R.excluded.total,
  top: [...nodeScore.entries()].sort((a, b) => (b[1].c * 3 + b[1].h) - (a[1].c * 3 + a[1].h)).slice(0, 12).map(([k, v]) => k + ' C' + v.c + ' H' + v.h),
}, null, 1));

```
