# Media placeholders (display-only)

`image-gallery`, `document-viewer`, `enhanced-video-player`, `audio-playlist`, `map` all
render through **one shared code block** in the base renderer — a dashed placeholder box
with a type-specific emoji icon and the bound `value` echoed as text underneath. **No
`config` keys are read by any of them** in the base build; they exist as reserved slots for
a richer media component to be swired in later, not as functional widgets today.

Do not invent config for these (no `images[]`, `videoUrl`, `autoplay`, etc.) — the only
thing that currently varies output is the bound `value`, and the only thing that varies
between types is the icon shown.

| type | icon shown |
|---|---|
| `image-gallery` | 🖼️ |
| `document-viewer` | 📄 |
| `enhanced-video-player` | 🎬 |
| `audio-playlist` | 🎬 (same as video — not a distinct icon) |
| `map` | 🗺️ (same icon `location-picker` uses) |

## Example

```json
{ "id": "product_gallery", "type": "image-gallery", "label": "Product Photos", "order": 6 }
```
