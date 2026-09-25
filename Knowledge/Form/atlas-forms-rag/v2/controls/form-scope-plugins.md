# Form-scope plugins (`scope: "form"`, non-visual)

9 control types apply a side effect to the whole form instead of rendering a field. Each is
a **singleton** (at most one instance per form) and requires `"scope": "form"` on the
control object (in addition to `type`). Source:
`player-components-react/src/controls/ControlRegistry.ts` (`registerFormScopePlugins`).

Registered `defaultConfig` for each — use these as the authoritative key list; do not add
keys not shown here:

| type | purpose | `config` keys (with defaults) |
|---|---|---|
| `seo-settings` | meta tags, Open Graph, robots | `metaTitle, metaDescription, ogTitle, ogDescription, ogImage, robotsDirective:"index", canonicalUrl, slugUrl, faviconUrl` (all default `""` unless noted) |
| `analytics-settings` | GA/GTM/Pixel tracking | `googleAnalyticsId, googleTagManagerId, facebookPixelId, linkedInInsightTagId, conversionEventName, utmCaptureEnabled:false, trackPartialSubmissions:false` |
| `security-settings` | CAPTCHA, honeypot, rate limiting | `captchaType:"none", honeypotEnabled:false, passwordProtected:false, formPassword, submissionsPerIpLimit:0, rateLimitWindowMinutes:60, closedAfterDate, closedAfterCount:0` |
| `compliance-settings` | GDPR, HIPAA, retention | `gdprConsentEnabled:false, gdprConsentText, dataRetentionDays:0, hipaaMode:false, auditTrailEnabled:false, privacyPolicyUrl, termsUrl` |
| `branding-settings` | logo, colors, header/footer HTML | `logoUrl, logoPosition:"left", primaryColor, accentColor, backgroundColor, fontFamily, headerHtml, footerHtml, hidePoweredByBadge:false` |
| `behavior-settings` | confirmation, redirect, autosave | `confirmationType:"message", confirmationMessage:"Thank you!", redirectUrl, redirectDelaySeconds:0, allowMultipleSubmissions:true, autoSaveEnabled:false, showProgressBar:false` |
| `notification-settings` | email notifications | `notificationSubject, autoResponderEnabled:false, autoResponderEmailField, autoResponderSubject` |
| `embed-settings` | embed/popup/share/QR | `embedType:"inline", popupTrigger:"load", popupDelaySeconds:0, iframeAutoResize:true, shareLinkEnabled:false, qrCodeEnabled:false` |
| `custom-code` | raw injected HTML/CSS | `headHtml, bodyStartHtml, bodyEndHtml, inlineStyles` |

## Example

```json
{ "id": "form_seo", "type": "seo-settings", "scope": "form", "order": 0,
  "config": { "metaTitle": "Contact Us", "metaDescription": "Get in touch with our team." } }
```
