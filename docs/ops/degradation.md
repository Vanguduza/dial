# Degradation paths

Neutral status only — never instructional helper text on customer UI.

| Dependency | Customer-visible | Ops |
| --- | --- | --- |
| Auth | Sign-in unavailable | `/api/health/live` up; integrations 401 without secret |
| Meili | Search empty | Fail closed on indexer; browse can still use durable offers |
| PSP | Checkout refused | Adapter fail-closed without keys; COD still available when policy allows |
| WhatsApp | Cloud API quiet | No unofficial clients; retry templates when WABA returns |
| Maps | Raster basemap chip | `DialMap` watchdog + OpenFreeMap Liberty; never a blank GL surface |
