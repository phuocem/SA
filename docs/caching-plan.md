# Caching Plan

## Cache Keys & TTL
- Events list: `events:list:<page>:<size>:<keyword>` — TTL 120s
- Event detail: `events:<id>` — TTL 300s
- Event registrations: `events:<id>:registrations` — TTL 60s
- Roles list: `roles:all` — TTL 600s
- Roles detail: `roles:<id>` — TTL 600s

## Invalidation Strategy
- On create/update/delete event:
  - `del events:<id>` (where applicable)
  - `del events:<id>:registrations`
  - `delPattern events:list:*`
- On registrations change:
  - `del events:<eventId>:registrations`
- On roles change (seed/admin ops):
  - `del roles:all`
  - `del roles:<id>`

## HTTP Caching
- Interceptor adds ETag + Cache-Control.
- Defaults (examples):
  - `/events` → `public, max-age=300`
  - `/roles` → `public, max-age=600`
  - `/users/me` → `no-cache, no-store` (@NoCache)
- 304 returned when `If-None-Match` matches server ETag.

## Notes
- Cache store: in-memory (cache-manager). Redis can be configured via store if needed.
- Pattern deletion for in-memory is best-effort; consider explicit keys or Redis SCAN in production.
