# Publish the app

Publishing makes the current version of the app live. Do it only after the user has reviewed every
page ([`create-website.md`](create-website.md) step 8) and says **yes** to publishing.

## Current state: no MCP tool publishes an app

The App Studio MCP tools (checked with `tools/list`) have no publish tool. The module's own history
log deferred publishing to a later version and classed it as a human-only action. Publishing
exists only as the REST endpoint `POST /api/v1/app-studio/apps/{id}/publish` behind the designer's
**Publish** button, which requires a **TenantAdmin or Admin** account. A normal user gets a 403. Under the rules in [`create-website.md`](create-website.md), the agent never clicks that
button and never calls REST endpoints for writes.

So, until a publish tool is added:

1. Tell the user the site is ready and that publishing is their own step.
2. Say where it is: the **Publish** button in the App Studio designer toolbar, with the app open.
   If they aren't a tenant admin, they need one to publish it.
3. After they say they've published, reload App Player
   ([`preview-and-focus.md`](preview-and-focus.md)) and confirm the live site shows the latest
   content.

When a publish tool appears in `tools/list`, call it after the user's explicit yes instead, and
update this file.
