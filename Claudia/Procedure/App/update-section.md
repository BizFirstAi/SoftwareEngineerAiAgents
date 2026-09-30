# Update a section

Used when the user wants to change a section that already exists: new words, the other style,
or a section removed. Every change goes through MCP ([`connect-to-mcp.md`](connect-to-mcp.md)).

## 1. Find the section

Call `list_widgets_in_app` with the AppID. Each placement gives its `appWidgetID`, `widgetID`,
`sectionName`, `appPageID` and `displayOrder` (no name and no style, so identify sections by
their order). **A `displayOrder` of 9000 or more means the placement was hidden** by an earlier
update (step 3 below), so skip it. On a page built by
[`create-website.md`](create-website.md), each section of the page is one `content` widget in
section `main` for that `appPageID`. Its order on the page matches `displayOrder`.
If unsure which one the user means, show the section list for that page and ask.

## 2. Agree the change

Show the current text and the new text side by side as plain text, and get a yes.

## 3. Apply it

**If `update_widget_definition` is available** (check `tools/list`, see
[`connect-to-mcp.md`](connect-to-mcp.md), "Known tool gaps"): call it with the widget's
`widgetID` and the new configuration (read its `inputSchema` for the exact parameter names).
Keep `"allowScripts": true`.

**If it is not available** (the current build), replace the section:

1. `create_widget`: a new `content` widget with the new HTML, same section `main`, same
   `appPageID`.
2. `update_widget_placement` on the **new** placement: `displayOrder` = the old placement's
   value, every other field null.
3. `update_widget_placement` on the **old** placement: `styleConfiguration` =
   `{"widgetContainer":{"css":"display:none"}}`, `displayOrder` = 9000 + its old value (the
   marker step 1 relies on), every other field **null** (null leaves a field
   unchanged; see [`connect-to-mcp.md`](connect-to-mcp.md), "Calling a tool"). No MCP tool can
   delete a widget placement yet, so the hidden placement stays in the database
   (`site-building-lessons.md` §15).

To **remove** a section, do only step 3.

To **add** a section between two others, create it and give it a `displayOrder` between theirs
(e.g. 15 between 10 and 20).

## 4. Show it

[`preview-and-focus.md`](preview-and-focus.md): reload and scroll to the changed section, then
ask whether it is right. Also re-read neighbouring sections: if another section's text refers to
what changed, point that out (`site-building-lessons.md` §15).
