# Endpoint audit (DIAL-tuned)

```text
Audit DIAL API routes for auth gaps. Flag any handler that: (1) mutates state,
sends WhatsApp/email, calls PSP/FDMS/Gemini, or enqueues work without verified
JWT, webhook signature, or fail-closed INTERNAL_API_SECRET; (2) trusts userId/
role/email from body/query; (3) lacks object-level checks for :id on jobs,
orders, vehicles, promo credits, delivery offers. Report only; do not fix yet.
Respect: AI never writes money; official WhatsApp only; ledger SoR stays DIAL.
```
