# IDOR audit (DIAL-tuned)

```text
For every route with an object id, require AuthN then AuthZ against that row
(ownership, assignment, supplier scope, or admin). Prioritize DELETE/PATCH on
job_reserves, ledger-adjacent tables, delivery_jobs, promo_credits. Cache keys
that hold user-specific data must include userId; authorize before cache read.
Report only; do not fix yet.
```
