# Scheduled publisher

Gamers Matrix uses NestJS `@nestjs/schedule` (`PublishingScheduler`) to promote
`SCHEDULED` content pages and products to `PUBLISHED` once `scheduledAt` is due.

## Behavior

- Runs every minute **inside the API process**.
- Uses store timezone from `StoreSettings` for audit notes; comparison uses UTC timestamps.
- On failure, sets `scheduleError` on the record and leaves status `SCHEDULED`.
- Operators can retry via `POST /admin/publishing/content/:id/retry-schedule` or
  `POST /admin/publishing/products/:id/retry-schedule`, or run a catch-up with
  `POST /admin/publishing/run-due`.

## Limitations

- Requires the API process to be running; missed windows catch up on the next tick after restart.
- Not distributed-lock safe across multiple API replicas — run a single scheduler instance or add an external queue/lock before horizontal scale-out.
- Browser tabs are never required for scheduled publish.
