# `http-request`

Makes an outbound HTTP request to an external API or service and returns the response
(status code, headers, content-type, body, and — when the response is JSON — a parsed `items`
array) to downstream nodes. Supports all standard HTTP methods, custom headers, a request body,
timeout/redirect knobs, and an optional Bearer token (inline or resolved from a bound credential).
Built-in SSRF protection blocks requests to localhost, link-local/metadata IPs
(`169.254.169.254`, `metadata.google.internal`), and private IP ranges (`10.0.0.0/8`,
`127.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `169.254.0.0/16`) unless the host is listed in
the app-level `HttpRequestNode:SsrfAllowedHosts` setting — this allowlist is a global app setting,
not a node `Configuration` field.

Node type code: `http-request`. Output ports: `main`/`success` (2xx response received —
success is judged purely by HTTP status code, *not* by any `Success` flag), `error` (validation
failure, non-2xx response, timeout, connection failure, or SSRF block). Credentials are optional
(`RequiresCredentials = 0` in the DB row) — supports Bearer-token auth via a bound credential or an
inline token.

## Config

| Field (JSON key) | Type | Required | Default | Notes |
|---|---|---|---|---|
| `url` | string | **Yes** | — | Must be an absolute URI with scheme `http` or `https`. Trimmed before validation. |
| `method` | string | No | `"GET"` | Upper-cased automatically. One of `GET`, `POST`, `PUT`, `DELETE`, `PATCH`, `HEAD`, `OPTIONS`, `TRACE`. Any other value fails validation. |
| `headers` | object (`{string: string}`) | No | `{}` | Read as a JSON object and merged into the outgoing request headers (case-insensitive keys). |
| `body` | any | No | `null` | Sent only when `method` is `POST`, `PUT`, or `PATCH` — silently ignored for `GET`/`DELETE`/`HEAD`/`OPTIONS`/`TRACE` even if set. If the value is a JSON string it is sent as-is; any other JSON value is `JsonSerializer.Serialize`d first. Content-Type defaults to `application/json` unless a `Content-Type` key is already present in `headers`. |
| `bearerToken` | string | No | (none) | Inline Bearer token. Added as `Authorization: Bearer {token}` — overridden by a resolved vault credential if one is bound to the node (see Gotchas). |
| `timeoutSeconds` | integer | No | `30` | Must be `1`–`300` inclusive. |
| `allowRedirects` | boolean | No | `true` | **Parsed but not applied to request behavior** — see Gotchas. |
| `maxRedirects` | integer | No | `10` | Must be `0`–`50` inclusive. **Parsed but not applied to request behavior** — see Gotchas. |
| `credentialId` | integer | No | (none) | **Parsed and round-tripped but never consulted by credential resolution** — see Gotchas. |

## Example

```json
{
  "url": "https://api.example.com/v1/customers",
  "method": "POST",
  "headers": { "Content-Type": "application/json", "X-Request-Source": "bizfirst-flow" },
  "body": { "name": "Acme Corp", "plan": "enterprise" },
  "timeoutSeconds": 45,
  "allowRedirects": true,
  "maxRedirects": 5
}
```

## Gotchas

- Positive counter-example: the DB seed's `ConfigurationSchema`
  (`Process_ProcessElementTypes_HttpRequest.data.sql`) is **accurate and complete** for `url`,
  `method` (with the correct enum), `headers`, `body`, `bearerToken`, `timeoutSeconds` (min/max
  1–300), `allowRedirects`, `maxRedirects` (min/max 0–50), and `credentialId`, and correctly marks
  `url` as the only `required` field. This is one of the rare node types where trusting the DB
  schema directly would not mislead you on field names/types — unlike most other node types
  audited so far.
- `credentialId` in `Configuration` does nothing on its own. It is parsed into
  `HttpRequestConnectionInfo.CredentialId` and echoed back by `ToDictionary()`, but nothing in the
  executor ever reads that property to resolve a credential. The actual Bearer token used at
  runtime comes from `ReadCredentialValuePrimaryAsync()` — the node's bound "primary" credential
  alias (assigned through the node's credential picker / `INodeCredentialsFactory`, a separate
  binding from this `Configuration` JSON) — which, if present, **overrides** any inline
  `bearerToken`. Setting `"credentialId": 5` in the JSON config, with no credential actually bound
  to the node, has zero effect.
- `allowRedirects` and `maxRedirects` are validated (range-checked) but never actually wired into
  the outbound request. `HttpRequestService.ExecuteAsync` calls
  `_httpClientFactory.CreateClient()` and never reads `settings.AllowRedirects` or
  `settings.MaxRedirects` — the resulting `HttpClient` uses whatever redirect behavior its
  `IHttpClientFactory`-configured handler defaults to (typically auto-follow redirects with the
  .NET default cap), regardless of what you set here. Don't rely on these fields to actually
  disable or cap redirect-following.
- Success/failure routing is judged purely by HTTP status code (`IsHttpStatusSuccess`: 200–299),
  not by any `success`/`Success` field in the result — a well-formed 4xx/5xx HTTP response still
  routes to `error`.
- Response body is only auto-parsed into the `items` array when the response `Content-Type`
  contains `application/json`; otherwise the raw string body is wrapped as-is. A `JsonException`
  while parsing a body declared as `application/json` routes to `error` with a parse-failure
  message rather than falling back to raw text.
