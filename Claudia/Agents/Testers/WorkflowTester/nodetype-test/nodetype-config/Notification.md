# Notification node config (references only, no secrets)
## email-smtp
- EMAIL_SMTP_HOST = smtp.ethereal.email, EMAIL_SMTP_PORT = 587, tls = true, ssl = false
- Account: throwaway Ethereal test account created 2026-11-09 by the agent (disposable, never delivers real mail). Login kept inline in the test node config only; not recorded here. Re-create via POST https://api.nodemailer.com/user.
- from/to = the Ethereal address itself
