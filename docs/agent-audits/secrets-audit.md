# Secrets audit (DIAL-tuned)

```text
Treat secrets as radioactive. Never read, cat, print, echo, log, or paste
.env / .env.* or credential files. Refer to secrets by NAME only
(e.g. SUPABASE_SERVICE_ROLE_KEY, PAYNOW_INTEGRATION_KEY). In code always
process.env / server secrets manager — never inline. Never put secrets under
NEXT_PUBLIC_ / VITE_. Grep client bundles and NEXT_PUBLIC_ usage for
service_role, sk_live, PSP keys, WA tokens, FDMS activation. Report only;
if a live secret may have been exposed, stop and ask a human to rotate.
```
