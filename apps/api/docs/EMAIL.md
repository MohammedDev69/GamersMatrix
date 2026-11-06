# Email adapter

`MailService` (`apps/api/src/mail`) is the only email entry point.

## Modes

| Mode | When | Behavior |
|------|------|----------|
| **preview** | `SMTP_HOST` / `SMTP_USER` / `SMTP_PASS` empty | Logs message to API logger and stores a short in-memory preview (`GET /admin/mail/preview`, ADMIN) |
| **smtp-env-present** | SMTP vars set | Currently still preview until a production transport (e.g. nodemailer) is wired — never claims delivery succeeded without a real send |

## Configure later

```env
SMTP_HOST=""
SMTP_PORT="587"
SMTP_USER=""
SMTP_PASS=""
```

Do not claim customer email notifications work until a real transport is implemented and verified.
