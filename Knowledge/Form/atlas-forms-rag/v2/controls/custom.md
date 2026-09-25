Type: `custom`
Category: Other Controls — reserved escape hatch for a host-application-registered React component (`ReactControlRegistry`/`getGlobalReactRegistry()`). It has **no fixed schema and no default renderer** in the base build; the platform falls back to a plain text input if nothing is registered for it.
Common properties: see `01-common-properties.md`.

Only emit `type: "custom"` if you know the target application has registered a handler for it — never invent `config` properties for it. If you don't have that confirmation, use one of the other 100+ real control types instead. See `advanced-capabilities.md` §1 for how the plugin registry works.
