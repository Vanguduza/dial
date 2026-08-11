---
name: dial-rls-idor-audit
description: >-
  Audits DIAL APIs for IDOR/BOLA and object-level AuthZ on top of RLS. Use when
  reviewing routes with :id, jobs, orders, vehicles, promo credits, delivery
  offers, or when the user asks for an IDOR/RLS security audit.
---

# DIAL RLS / IDOR audit

## Workflow

1. Enumerate handlers with object ids or list filters.
2. For each: AuthN present? AuthZ against **that row** (ownership, assignment, supplier scope, admin)?
3. Flag body/query `userId`/`role`/`email` trust.
4. Flag cache keys missing `userId` for user-scoped data.
5. **Report only** unless asked to fix.

## Priority surfaces

`job_reserves`, ledger-adjacent tables, `delivery_jobs` / offers, `promo_credits`, orders, vehicles, `courier_locations`.

## Checklist

- [ ] No identity from request body
- [ ] Object check after AuthN (helper e.g. `assertResourceAccess`)
- [ ] Internal routes fail closed without `INTERNAL_API_SECRET` / signature
- [ ] RLS policies exist **and** API layer does not rely on RLS alone for admin impersonation edges
- [ ] Cross-tenant IDOR tests planned for top resources (T9)

## Prompts

See `docs/agent-audits/idor-audit.md` and `endpoint-audit.md`.
