import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const page = await readFile(new URL("../src/pages/index.astro", import.meta.url), "utf8");
const css = await readFile(new URL("../src/styles/global.css", import.meta.url), "utf8");
const robots = await readFile(new URL("../public/robots.txt", import.meta.url), "utf8");
const productionEnv = await readFile(new URL("../.env.production", import.meta.url), "utf8");

test("uses the intended Finland launch message", () => {
  assert.match(page, /Kauhu saapuu/);
  assert.match(page, /Pian Suomessa/);
  assert.doesNotMatch(page, /snart i Sverige/i);
});

test("requires email and the real Mailchimp consent field", () => {
  assert.match(page, /name="EMAIL"[\s\S]*?required/);
  assert.match(page, /name=\{mailchimpConsentName\}[\s\S]*?required/);
  assert.match(page, /const signupReady = Boolean/);
  assert.doesNotMatch(page, /novalidate/);
});

test("ships the Finland form, tag and consent configuration", () => {
  assert.match(productionEnv, /PUBLIC_MAILCHIMP_ACTION=https:\/\/splatter\.us11\.list-manage\.com/);
  assert.match(productionEnv, /PUBLIC_MAILCHIMP_CONSENT_NAME=FICONSENT/);
  assert.match(productionEnv, /PUBLIC_MAILCHIMP_TAG_ID=10285197/);
  assert.match(page, /name="tags" value=\{mailchimpTagId\}/);
});

test("preserves Splatter brand tokens", () => {
  assert.match(css, /--red:\s*#c1121f/);
  assert.match(css, /--bone:\s*#f2ede6/);
  assert.match(css, /font-family:\s*"Unbounded"/);
});

test("uses the responsive production poster wall in the hero", () => {
  assert.match(page, /hero-poster-wall-960x540\.webp 960w/);
  assert.match(page, /hero-poster-wall-1920x1080\.webp 1920w/);
  assert.match(page, /hero-poster-wall-3840x2160\.webp 3840w/);
  assert.match(page, /sizes="100vw"/);
});

test("ships Finnish SEO and privacy copy", () => {
  assert.match(page, /<html lang="fi">/);
  assert.match(page, /Tietosuojaseloste/);
  assert.match(page, /Niche en scène AB/);
});

test("does not advertise a sitemap that does not exist", () => {
  assert.doesNotMatch(robots, /Sitemap:/i);
});
