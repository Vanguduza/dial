# `@dial/promotions`

In-repo promotions engine for DIAL ERP.

**Sources (pattern only, MIT):** [Medusa Promotion Module](https://docs.medusajs.com/resources/commerce-modules/promotion) (`computeActions`, application methods, campaign budgets) + [OfferKit](https://github.com/offerkit/offerkit) (referrals, stackable redeem, credit ledger, validation traces).

**Not adopted as runtime:** OfferKit Docker service, `@medusajs/*` packages.

**Authority:** `DIAL_Promotions_Package_Design.md` · v4 §4.1.1 · D-41a / D-42.

Payable amounts are applied only by `@dial/pricing` into `price_quotes`. Promo credit never cash-outs.
