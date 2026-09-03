import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const page = await readFile(new URL("../src/pages/index.astro", import.meta.url), "utf8");
const css = await readFile(new URL("../src/styles/global.css", import.meta.url), "utf8");

test("uses the intended Finland launch message", () => {
  assert.match(page, /Kauhu saapuu/);
  assert.match(page, /Pian Suomessa/);
  assert.doesNotMatch(page, /snart i Sverige/i);
});

test("requires email and explicit consent", () => {
  assert.match(page, /name="EMAIL"[\s\S]*?required/);
  assert.match(page, /name="splatter_fi_consent"[\s\S]*?required/);
});

test("preserves Splatter brand tokens", () => {
  assert.match(css, /--red:\s*#c1121f/);
  assert.match(css, /--bone:\s*#f2ede6/);
  assert.match(css, /font-family:\s*"Unbounded"/);
});

test("ships Finnish SEO and privacy copy", () => {
  assert.match(page, /<html lang="fi">/);
  assert.match(page, /Tietosuojaseloste/);
  assert.match(page, /Niche en scène AB/);
});
