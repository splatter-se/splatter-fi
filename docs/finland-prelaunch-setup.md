# Finland pre-launch: extern konfiguration och drift

Uppdatering 25 oktober 2026: aktuell implementation och lanseringsordning finns i
[`finland-demand-test.md`](finland-demand-test.md). Sajten är statisk och
publiceras med GitHub Pages. Registreringar går med JavaScript via Splatters
Cloudflare Worker, som begär dubbel opt-in från Mailchimp och aldrig exponerar
API-nyckeln för webbläsaren. Det befintliga publika Mailchimp-formuläret ligger
kvar som reserv när JavaScript saknas. Ändra inte den globala audience-inställningen
från single opt-in; Worker-vägen begär `pending` per ny finsk kontakt.

## Mailchimp

Nuvarande, redan verifierade värden:

- Audience: befintlig Splatter-audience (single opt-in).
- Tag: `Finland launch`, ID `10285197`.
- Consent merge field: `FICONSENT`.
- Consentversion i Worker-flödet: `fi-demand-v1-2026-10-19`.
- Reservformulärets consentversion: `fi-prelaunch-v2-2026-09-04`.
- API-nyckeln finns endast som `MAILCHIMP_API_KEY` i Worker-secrets.
- Nuvarande API-nyckel löper ut 25 oktober 2027 och ska roteras före dess.

Produktionstestet den 25 oktober 2026 bekräftade `pending` → `subscribed`,
serververifiering och lagring av prisintresse. Följande återstår manuellt:

1. Språkgranska Mailchimps bekräftelsemejl och bekräftelsesida på finska. Den
   äldre systemmejlsredigeraren fastnade på laddningsvyn under QA och copy kunde
   därför inte visuellt godkännas.
2. Gör ett separat mobiltest där länken öppnas från en vanlig e-postapp och den
   ursprungliga `/kiitos`-fliken ligger kvar.
3. Kontrollera att testkontakten har taggen `Finland launch` och värdet
   `fi-demand-v1-2026-10-19` i `FICONSENT`.
4. Behåll success-URL `https://splatter.fi/kiitos` på reservformuläret. Ett
   validerings- eller Mailchimp-fel får aldrig skicka besökaren dit.

Officiell vägledning: [Mailchimp – Design and host your own thank you pages](https://mailchimp.com/help/design-and-host-your-own-thank-you-pages/).

### Kampanjfält i Mailchimp

För att även få första trafikkällan på själva Mailchimp-kontakten kan följande
dolda Text-fält skapas i audience-inställningarna:

- `utm_source`
- `utm_medium`
- `utm_campaign`
- `utm_content`
- `landing_variant`

Hitta inte på merge tags eller HTML-namn. Kopiera de verkliga `name`-värdena från
Mailchimps genererade embed-kod till:

- `PUBLIC_MAILCHIMP_UTM_SOURCE_NAME`
- `PUBLIC_MAILCHIMP_UTM_MEDIUM_NAME`
- `PUBLIC_MAILCHIMP_UTM_CAMPAIGN_NAME`
- `PUBLIC_MAILCHIMP_UTM_CONTENT_NAME`
- `PUBLIC_MAILCHIMP_VARIANT_NAME`

Tomma variabler renderar inga fält och påverkar därför inte dagens fungerande
registreringar.

## Välkomstmejl och kontaktfrekvens

Färdig finsk copy, ämnesrader, förhandsvisningar och kontrollista finns i
[`finland-mailchimp-copy.md`](finland-mailchimp-copy.md). Aktivera sekvensen i
Mailchimp, inte i sajtkoden:

1. Direkt: bekräfta registreringen och tacka. Be mottagaren återvända till den
   ursprungliga fliken om den fortfarande är öppen och frågorna inte är besvarade.
   En generell mejllänk till `/kiitos` kan inte återställa flikens anonyma bevis.
2. Efter cirka sju dagar: ställ en enda kort fråga om filmer eller genrer som
   saknas i Finland.
3. Därefter: endast några få relevanta utvecklingsuppdateringar per år.

Planera för totalt cirka 3–4 relevanta mejl per år. Varje mejl ska ha Mailchimps
fungerande avregistreringslänk. Skriv inte in något lanseringsdatum, pris,
Finlandrättighet eller löfte om finska undertexter innan det är verifierat.

## Enkätlagring

Enkäten använder nu befintlig Cloudflare Worker + D1 på kostnadsfri nivå.
`PUBLIC_SURVEY_ENDPOINT` pekar på `/v1/surveys`. E-postadressen ingår aldrig i
enkätpayloaden, URL:en, `sessionStorage` eller analysen. Endpointen:

- endast acceptera `POST application/json`,
- validera alla svar mot samma fasta värdelistor som i sajten,
- avvisa fler än tre genrer och orimligt stora payloads,
- spara endast svar, ISO-tidsstämpel, anonymt sessions-ID, UTM-fält och variant,
- ha snäv CORS för `https://splatter.fi`, rate limiting och inga cookies,
- returnera 2xx först efter att datan faktiskt har sparats.

Om one.com-reservpaketet används måste `connect-src` i `public/.htaccess` också
få endpointens exakta origin. Lägg inte till ett generellt jokertecken.

Exportera aggregerad funneldata med `node scripts/finland-report.mjs`. Exportera
rå enkätdata från D1 endast när svaren behöver analyseras, och koppla aldrig
exporten till Mailchimp via e-postadress.

## Funnel och trafikkällor

Sajten har en central analysabstraktion med följande events:

- `finland_landing_view`
- `finland_signup_start`
- `finland_signup_success`
- `finland_signup_error`
- `finland_survey_start`
- `finland_survey_complete`

Första besökets `utm_source`, `utm_medium`, `utm_campaign` och `utm_content`, plus
landningssidevariant, lagras i `sessionStorage`. Där finns också ett anonymt
sessions-ID. Ingen e-post eller annan direkt personuppgift lagras eller skickas.

Efter aktivt mätsamtycke skickas event till Splatters first-party Worker via
`PUBLIC_ANALYTICS_ENDPOINT`. Utan samtycke skickas eller sparas inga analysevents.
Sajten använder inga analyscookies och behöver inget separat cookieverktyg.
Funnelstegen kan summeras per UTM och `landing_variant`; leads utan mätsamtycke
redovisas separat.

## Kontaktadress

Footern använder `PUBLIC_CONTACT_EMAIL` och står kvar på `hej@splatter.se`.
Skapa `hei@splatter.fi` som alias i one.com, testa både mottagning och sändning
och uppdatera därefter variabeln. Byt inte adressen på sajten före testet.

## Finsk språkgranskning

All ny finsk användarcopy finns samlad i `src/content/fi.ts`. Låt en infödd
finskspråkig person språkgranska särskilt:

- hero, väntelisterubrik, samtycke och integritetstext,
- formulärets validation- och felmeddelanden,
- alla enkätfrågor och svarsalternativ,
- formuleringarna kring planerad/utvärderad lansering,
- märkningen av skärmbilderna från den svenska tjänsten.

## SEO senare

Startsidan har finsk title och meta description, canonical, `fi-FI`, Open Graph,
strukturerad data, robots och sitemap. `/kiitos` är `noindex,follow` och ligger
inte i sitemap.

Den första redaktionella sidan bör senare vara en saklig, researchad guide om
`Kauhuelokuvien suoratoisto Suomessa`. Bygg den först när det finns ordentligt
redaktionellt underlag; skapa inte en tunn, generell SEO-text.
