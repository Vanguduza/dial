# Meta WhatsApp template IDs (Phase 0 / ENH-021)

**Status:** OPEN for live Meta approval — eng uses **names** from `DIAL_WhatsApp_Flows_and_Templates.md`; fill `meta_template_id` when ops lands.

| Template name (companion) | Category | `meta_template_id` | Notes |
| --- | --- | --- | --- |
| `auth_otp_wa` | AUTHENTICATION | _pending_ | |
| `spare_welcome_menu` | UTILITY | _pending_ | |
| `spare_order_confirmed` | UTILITY | _pending_ | |
| `spare_awaiting_supplier` | UTILITY | _pending_ | |
| `spare_failover_choice` | UTILITY | _pending_ | |
| `spare_shipped` | UTILITY | _pending_ | |
| `spare_delivered` | UTILITY | _pending_ | |
| `spare_payment_link` | UTILITY | _pending_ | |
| `spare_cart_resume` | MARKETING* | _pending_ | consent required |
| `support_offline_ack` | UTILITY | _pending_ | |
| `tech_job_received` | UTILITY | _pending_ | |
| `tech_emergency_ack` | UTILITY | _pending_ | |
| `tech_quote_ready` | UTILITY | _pending_ | |
| `tech_reserve_held` | UTILITY | _pending_ | |
| `tech_assigned` | UTILITY | _pending_ | |

\*Does not block eng S10/S11 — blocks customer-open (Appendix C).

Owner: ops (ENH-021). Eng: never hardcode fake live IDs into production send paths.
