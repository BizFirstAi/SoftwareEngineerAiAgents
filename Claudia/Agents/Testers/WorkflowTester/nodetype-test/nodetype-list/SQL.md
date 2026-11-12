# Node type: SQL / databases (discovered 2026-11-09, scope: relational SQL nodes)
Source: live registry; category is NULL for all (see Notification.md). Candidate set picked by code.

| Name (code) | TypeID | RequiresCredentials | Registry schema | Test status | Note |
|---|---|---|---|---|---|
| postgresql | 149 | no | empty (no properties) | BLOCKED | executor takes `connectionStringKey` resolved from server config `ConnectionStrings:PostgreSqlNode:<key>`; no such key in the Consolidated WebApi appsettings. Pilot operations: query/execute, row/insert, schema/list |
| sqlserver | 338 | yes | `connectionStringKey, resource, operation` | PENDING (config check not done) | |
| mysql | 339 | yes | `connectionStringKey, resource, operation` | PENDING (no local MySQL seen) | |
| mongodb | 279 | yes | not inspected | not proposed | NoSQL |
Local Postgres is listening on 5432 (credentials unknown to the agent; not opened).
