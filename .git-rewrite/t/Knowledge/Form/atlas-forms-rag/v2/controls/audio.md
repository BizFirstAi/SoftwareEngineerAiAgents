Type: `audio`
Category: Display Controls — embeds a native `<audio>` element with default browser controls.
Common properties: see `01-common-properties.md`.

## `config`

No `config.src` is read by this control in the base renderer — it reads the control's own value directly. Set the audio URL via `defaultValue` or `binding`, not `config`.

## Minimal example

```json
{ "id": "podcast_clip", "type": "audio", "label": "Episode Preview", "order": 1,
  "defaultValue": "https://cdn.example.com/clip.mp3" }
```
