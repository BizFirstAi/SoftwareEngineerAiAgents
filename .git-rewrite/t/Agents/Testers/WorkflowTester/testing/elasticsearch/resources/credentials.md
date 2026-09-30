# Elasticsearch Node — Credential Model

## What the node needs

Basic Auth against a real Elasticsearch cluster/endpoint:

| Field | Where it's supplied | Notes |
|---|---|---|
| Host (endpoint URL) | inline config (`host`) or satellite node (`host`) | Not a secret — always plain config, never vault. Must include scheme (`https://` or `http://`). |
| Username | inline config (`username`), satellite node (`userName`), or vault credential's `Username` | |
| Password | inline config (`password`), or vault credential's `Password` | Never round-tripped back into the form/config once saved (`BaseElasticSearchOperationInfo.ToDictionary()` intentionally omits it). |
| Allow Insecure SSL | inline config (`allowInsecure`) | Not a credential — a TLS-validation toggle for self-signed/private certs. |

## Two supported resolution paths (`ElasticSearchNodeExecutor.Credentials.cs`)

`ApplyCredentialsAsync(BaseElasticSearchOperationInfo info, ct)`, called by every feature partial
right after settings load, resolves credentials in this priority order:

1. **Vault lookup** — `ReadCredentialKeyValuePrimaryAsync(isMandatory: false, ct)`. If the node
   instance (`Process_ProcessElements.CredentialID`) has a vault credential attached, its
   `Username`/`Password` key-value pair overwrites whatever was inline in config (only for
   non-blank values — a vault entry with a blank username doesn't clobber an inline one).
2. **Inline config fallback** — if no vault credential is attached (or it didn't supply a value),
   the `username`/`password` typed directly into the node's Atlas Form are used as-is.

After that merge, if `Username` is still blank → `CFG_MISSING_USERNAME`; if `Password` is still
blank → `CFG_MISSING_PASSWORD`. Both are clean `NodeExecutionResult` errors through the node's
`error` output port (`GetBuildErrorOutput_NodeExecutionResult_WithWarningLogger`), not exceptions —
this is exactly test-plan category 4 (credential failure handling)'s "clean, specific auth error"
requirement, and it's checkable **without** a real Elasticsearch instance (a blank-credential case
never reaches the network call).

The satellite node (`satellite-elasticsearch-server`) declares
`"acceptedCredentialTypes": [{"code": "BASIC_AUTH"}]` — i.e. it is designed to carry a vault
`BASIC_AUTH`-type credential centrally and merge it into every connected operation node, the
intended production pattern for a workflow with many Elasticsearch nodes sharing one connection.

## What this test round needs from Binoy

To run any **live** category-2/4/5 case (happy path, real auth-failure round-trip, real
write-then-read-back) against an actual Elasticsearch cluster, the following real values are
required — there is no way to fabricate or mock these credibly:

1. **Elasticsearch host URL** — e.g. `https://your-cluster:9200` (must include scheme).
2. **Username** — the Basic Auth username (commonly `elastic`).
3. **Password** — the Basic Auth password for that user.
4. **Whether the cluster uses a self-signed/private TLS certificate** — determines whether
   `allowInsecure` needs to be `true` for the test round to connect at all.
5. **A test index name** the round is allowed to write to/delete from freely** — the round plan
   (`test-plan.md`) creates, writes, updates, searches, and deletes documents/indices as part of its
   normal cases; this must **not** be a production index. If none is supplied, the round will create
   and use its own throwaway index (name below) and delete it at the end — confirm this is
   acceptable, or provide a specific index name/prefix to use instead.

Suggested throwaway index name (used unless Binoy specifies otherwise):
`agentic-testing-nodes-elasticsearch-{yyyyMMdd}`

**No live execution against a real cluster will be attempted, and no Pass will be recorded for any
category-2/4/5 case, until these are supplied.** Everything else in this folder (schema
documentation, Atlas Form rendering checks, invalid-config cases, credential-missing cases,
workflow-build automation itself) does not need them and is built/verified independently.
