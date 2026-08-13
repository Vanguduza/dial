/**
 * Compose-up bootstrap: ensure Meili spare_offers index settings.
 * Prefer: pnpm --filter @dial/search-indexer run bootstrap
 */
import { bootstrapLocalSearchIndex } from "@dial/search-indexer";

const result = await bootstrapLocalSearchIndex();
console.log(JSON.stringify({ ok: true, ...result }));
