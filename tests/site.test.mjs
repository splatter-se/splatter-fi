import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");
const [home, thankYou, copy, config, landingScript, thankYouScript, analytics, storage, css, robots, sitemap, productionEnv, setupDocs] =
  await Promise.all([
    read("../src/pages/index.astro"),
    read("../src/pages/kiitos.astro"),
    read("../src/content/fi.ts"),
    read("../src/config/site.ts"),
    read("../src/scripts/landing.ts"),
    read("../src/scripts/thank-you.ts"),
    read("../src/lib/analytics.ts"),
    read("../src/lib/survey-storage.ts"),
    read("../src/styles/global.css"),
    read("../public/robots.txt"),
    read("../public/sitemap.xml"),
    read("../.env.production"),
    read("../docs/finland-prelaunch-setup.md"),
  ]);

test("uses honest, centrally managed Finland planning copy", () => {
  assert.match(copy, /Kauhu saapuu/);
  assert.match(copy, /Suomen-lanseeraus suunnitteilla/);
  assert.match(copy, /Suunnittelemme laajentumista Suomeen/);
  assert.doesNotMatch(copy, /Pian Suomessa|nyt pian|lanseeraamme pian/i);
  assert.match(home, /import \{ fi \} from "\.\.\/content\/fi"/);
});

test("keeps the native Mailchimp waitlist and required consent", () => {
  assert.match(home, /action=\{signupReady \? mailchimpConfig\.action : undefined\}/);
  assert.match(home, /name="EMAIL"[\s\S]*?required/);
  assert.match(home, /name=\{mailchimpConfig\.consentName\}[\s\S]*?required/);
  assert.match(home, /name="tags" value=\{mailchimpConfig\.tagId\}/);
  assert.match(config, /const signupReady = Boolean/);
  assert.doesNotMatch(landingScript, /fetch\([^)]*mailchimp|list-manage/i);
});

test("ships the existing Mailchimp audience identifiers without a secret", () => {
  assert.match(productionEnv, /PUBLIC_MAILCHIMP_ACTION=https:\/\/splatter\.us11\.list-manage\.com/);
  assert.match(productionEnv, /PUBLIC_MAILCHIMP_CONSENT_NAME=FICONSENT/);
  assert.match(productionEnv, /PUBLIC_MAILCHIMP_TAG_ID=10285197/);
  assert.doesNotMatch(productionEnv, /API[_-]?KEY|Bearer |password/i);
});

test("shows the thank-you survey only after the success redirect marker", () => {
  assert.match(thankYou, /data-unverified/);
  assert.match(thankYou, /data-confirmed hidden/);
  assert.match(thankYouScript, /confirmSignupFromRedirect\(\)/);
  assert.match(thankYouScript, /if \(confirmed\)/);
  assert.match(landingScript, /markSignupPending\(\)/);
  assert.doesNotMatch(landingScript, /location\.(?:href|assign|replace).*kiitos/i);
});

test("implements all questions and enforces at most three genres", () => {
  assert.match(copy, /Mikä saisi sinut todennäköisimmin tilaamaan Splatters\?/);
  assert.match(copy, /Kuinka usein katsot kauhuelokuvia\?/);
  assert.match(copy, /Mitä haluaisit katsoa\? Valitse enintään kolme\./);
  assert.match(copy, /Millä laitteella todennäköisimmin katsoisit\?/);
  assert.match(thankYouScript, /selected >= 3/);
  assert.match(thankYouScript, /genres\.length > 3/);
  assert.match(thankYouScript, /input\.disabled = atLimit && !input\.checked/);
});

test("survey storage fails honestly when no endpoint is configured", () => {
  assert.match(storage, /if \(!siteConfig\.surveyEndpoint\) return \{ stored: false, reason: "not_configured" \}/);
  assert.match(thankYouScript, /fi\.thankYou\.storageUnavailable/);
  assert.match(thankYouScript, /if \(result\.stored\)/);
  assert.match(copy, /Vastauksia ei lähetetty/);
});

test("tracks the requested funnel with first-touch session attribution", () => {
  for (const event of ["finland_landing_view", "finland_signup_start", "finland_signup_success", "finland_signup_error", "finland_survey_start", "finland_survey_complete"]) {
    assert.match(analytics, new RegExp(event));
  }
  for (const key of ["utm_source", "utm_medium", "utm_campaign", "utm_content"]) {
    assert.match(analytics, new RegExp(key));
  }
  assert.match(analytics, /window\.sessionStorage/);
  assert.doesNotMatch(analytics + storage, /localStorage/);
  assert.doesNotMatch(analytics + storage, /EMAIL|email/i);
});

test("renders accessible survey controls and visible focus styles", () => {
  assert.match(thankYou, /<fieldset>/);
  assert.match(thankYou, /<legend>/);
  assert.match(thankYou, /aria-live="polite"/);
  assert.match(thankYou, /type="radio"/);
  assert.match(thankYou, /type="checkbox"/);
  assert.match(css, /\.survey-option input:focus-visible \+ span/);
});

test("preserves Splatter identity and responsive poster artwork", () => {
  assert.match(css, /--red:\s*#c1121f/);
  assert.match(css, /--bone:\s*#f2ede6/);
  assert.match(css, /font-family:\s*"Unbounded"/);
  assert.match(home, /hero-poster-wall-960x540\.webp 960w/);
  assert.match(home, /hero-poster-wall-3840x2160\.webp 3840w/);
});

test("uses local, lazy-loaded Swedish product proof without Finland promises", () => {
  for (const image of ["product-home.webp", "product-detail.webp", "product-collection.webp"]) {
    assert.match(copy, new RegExp(image));
  }
  assert.match(home, /loading="lazy"/);
  assert.match(copy, /esimerkkejä Ruotsissa käytössä olevasta palvelusta/);
  assert.match(copy, /Suomen valikoima ja ominaisuudet arvioidaan erikseen/);
});

test("keeps Finnish SEO, canonical, social metadata and sitemap", () => {
  assert.match(home, /<html lang="fi-FI">/);
  assert.match(home, /rel="canonical" href="https:\/\/splatter\.fi\/"/);
  assert.match(home, /property="og:locale" content="fi_FI"/);
  assert.match(home, /application\/ld\+json/);
  assert.match(thankYou, /content="noindex,follow"/);
  assert.match(robots, /Sitemap: https:\/\/splatter\.fi\/sitemap\.xml/);
  assert.match(sitemap, /<loc>https:\/\/splatter\.fi\/<\/loc>/);
  assert.doesNotMatch(sitemap, /kiitos/);
});

test("documents the manual Mailchimp, survey, contact and editorial steps", () => {
  assert.match(setupDocs, /https:\/\/splatter\.fi\/kiitos/);
  assert.match(setupDocs, /hei@splatter\.fi/);
  assert.match(setupDocs, /3–4 relevanta mejl per år/);
  assert.match(setupDocs, /Cloudflare Worker \+ D1/);
  assert.match(setupDocs, /Kauhuelokuvien suoratoisto Suomessa/);
});
