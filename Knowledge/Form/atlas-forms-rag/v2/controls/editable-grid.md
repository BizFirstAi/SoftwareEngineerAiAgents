Type: `editable-grid`
Category: Layout Controls — declared in the `FormControlType` union and fully implemented in the `controls-form-actions-react` package (`EditableGridControl`), but **not wired into the shipping app's `registerAllControls()`** — it has no confirmed render path today. Do not emit this type; use `controls/grid.md` (`type: "grid"`) instead, which is the actively maintained, fully-wired repeating-row control with equivalent (and richer) functionality.
Common properties: see `01-common-properties.md`.
