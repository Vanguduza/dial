import assert from "node:assert/strict";
import { test } from "node:test";
import {
  OPENFREEMAP_LIBERTY,
  resolveStyleUrl,
  resumeGlRebindDelayMs,
  resumeShouldReloadStyle,
  shouldCommitStyleCallback,
  shouldWaitForMapLayout,
  stallRetryMs,
} from "./mapLayout.js";

test("never setStyle at 0×0", () => {
  assert.equal(
    shouldWaitForMapLayout({ width: 0, height: 0, attempt: 0 }),
    true,
  );
  assert.equal(
    shouldWaitForMapLayout({ width: 320, height: 240, attempt: 0 }),
    false,
  );
  assert.equal(
    shouldWaitForMapLayout({ width: 0, height: 0, attempt: 24 }),
    false,
  );
});

test("resume reloads style only when getStyle is null", () => {
  assert.equal(resumeShouldReloadStyle(true), true);
  assert.equal(resumeShouldReloadStyle(false), false);
  assert.equal(shouldCommitStyleCallback(true), true);
  assert.equal(stallRetryMs(), 2500);
  assert.equal(resumeGlRebindDelayMs(), 120);
});

test("loopback and RFC1918 style URLs fall back to OpenFreeMap", () => {
  assert.equal(resolveStyleUrl("http://127.0.0.1:8081/style.json"), OPENFREEMAP_LIBERTY);
  assert.equal(resolveStyleUrl("http://10.0.0.8:8081/style.json"), OPENFREEMAP_LIBERTY);
  assert.equal(
    resolveStyleUrl("https://tiles.openfreemap.org/styles/liberty"),
    "https://tiles.openfreemap.org/styles/liberty",
  );
});
