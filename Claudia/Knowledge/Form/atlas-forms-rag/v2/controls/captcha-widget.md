# `captcha-widget`

Currently a static visual placeholder ("🔒 Captcha") in the base renderer — no real CAPTCHA
challenge (reCAPTCHA/hCaptcha/etc.) is wired in, and no `config` keys are read. Do not
represent this as functional bot protection in a generated schema description; use it only
to reserve the field's position, and note to the user that real CAPTCHA verification needs
host-app wiring (see the `security-settings` form-scope plugin's `captchaType`, which is a
separate, form-level setting).

## Example

```json
{ "id": "captcha", "type": "captcha-widget", "order": 10 }
```
