/**
 * Test-only handles onto the same package instances the API routes use.
 * Kept out of `route.ts` files: Next rejects non-route exports in a production build.
 */
import {
  __resetLedgerForTests,
  drainMoneyOutbox,
  enqueueMoneyOutbox,
  listMoneyOutbox,
} from "@dial/ledger";
import {
  __resetPaymentsForTests,
  getPaymentIntent,
  runE1aMoneySpine,
  runPd4MoneySpine,
} from "@dial/payments";

export const __testMoneyOutbox = {
  reset: __resetLedgerForTests,
  enqueue: enqueueMoneyOutbox,
  list: listMoneyOutbox,
  drain: drainMoneyOutbox,
};

export const __testPaynowPayments = {
  reset: __resetPaymentsForTests,
  runE1aMoneySpine,
  runPd4MoneySpine,
  getPaymentIntent,
};
