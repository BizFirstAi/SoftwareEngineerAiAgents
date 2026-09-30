# profileName -> Form Contract

## The rule

```
connector.configuration.profileName  ==  Atlas_Forms.PrimaryUsage  with the leading 'node-form-' removed
```

`'node-form-'` is 10 characters, so in T-SQL: `STUFF(PrimaryUsage, 1, 10, '')`.

| Form `PrimaryUsage` | Required `profileName` |
|---|---|
| `node-form-sqlserver-query-execute` | `sqlserver-query-execute` |
| `node-form-odoo-contact-create` | `odoo-contact-create` |
| `node-form-odoo-contact-get-all` | `odoo-contact-get-all` (NOT `odoo-contact-getAll`) |
| `node-form-apify-key-value-store-get-record` | `apify-key-value-store-get-record` |

## Matching is exact

- The resolver builds `'node-form-' + profileName` and looks up `PrimaryUsage`. Any difference in hyphens, camelCase or
  underscores means no match, and the Profile tier silently contributes 0 forms.
- Casing: SQL Server default collations are case-insensitive so a SQL `=` may say "equal" when the C# side does not
  (whether the lookup is case-sensitive end to end is unverified). **Always compare with `COLLATE Latin1_General_100_BIN2`**
  in audits and generate profileName from `PrimaryUsage` mechanically, never by hand.
- Known casing/shape mismatch: template profileName `odoo-contact-getAll` vs form `node-form-odoo-contact-get-all`.
- An empty or missing profileName skips the tier, leaving only the 24 Common forms.

## Where profileName comes from

Not typed by the user. It is copied onto the node from the palette data template's
`settings.data.connector.configuration.profileName` when the node is dropped/saved (`data-template-anatomy.md`).
Nodes already on a canvas keep whatever connector config they saved; a stale value there produces the WRONG form.

## Related config keys in the same block

`resource`, `operation` (derived from the profile tokens, informational for the executor), `flowPath`, `alias`,
`enableTrustedExecutionEnvironment`, `acceptedCredentialTypes` (e.g. `[{"code":"DATABASE"}]`).

## Derivation used for generation

```
profileName = PrimaryUsage.substring('node-form-'.length)       // e.g. sqlserver-query-execute
tokens      = profileName.split('-')                            // [sqlserver, query, execute]
resource    = tokens[1]; operation = tokens.slice(2).join('-')  // multi-word ops keep hyphens; verify against the form's real operation name
```
Multi-token resources (e.g. `key-value-store`) break the naive split: read the form's FormCode/name or the executor's
route table to split correctly, and review the output.
