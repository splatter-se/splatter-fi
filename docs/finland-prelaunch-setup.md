# Finland pre-launch: extern konfiguration och drift

Sajten är statisk och publiceras med GitHub Pages. Den befintliga väntelistan
postar direkt till Mailchimps publika formulär och behöver ingen API-nyckel i
webbläsaren. Ändra inte till ett klientbaserat API-anrop: den native-post som
finns nu är den robustaste vägen och fungerar även utan JavaScript.

## Mailchimp

Nuvarande, redan verifierade värden:

- Audience: befintlig Splatter-audience (single opt-in).
- Tag: `Finland launch`, ID `10285197`.
- Consent merge field: `FICONSENT`.
- Consentversion i sajten: `fi-prelaunch-v2-2026-09-04`.

Gör följande manuellt i Mailchimp:

1. Öppna audience-formulärets `Signup form` och ange den externa success-URL:en
   `https://splatter.fi/kiitos`. Det ska endast vara formulärets lyckade
   registrering som skickar besökaren dit.
2. Stäng av Mailchimps JavaScript-validering för embed-formuläret när den externa
   redirecten används. Sajten behåller HTML-validering och skickar fortfarande
   formuläret direkt till Mailchimp.
3. Testa med en kontrollerad adress: en valideringsmiss eller ett Mailchimp-fel
   får inte leda till `/kiitos`, medan en lyckad registrering ska göra det.
4. Kontrollera att taggen `Finland launch` och värdet i `FICONSENT` finns på
   testkontakten.

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

Aktivera sekvensen i Mailchimp, inte i sajtkoden:

1. Direkt: bekräfta registreringen, tacka och länka till
   `https://splatter.fi/kiitos` om personen inte redan svarat på frågorna.
2. Efter cirka sju dagar: ställ en enda kort fråga om filmer eller genrer som
   saknas i Finland.
3. Därefter: endast några få relevanta utvecklingsuppdateringar per år.

Planera för totalt cirka 3–4 relevanta mejl per år. Varje mejl ska ha Mailchimps
fungerande avregistreringslänk. Skriv inte in något lanseringsdatum, pris,
Finlandrättighet eller löfte om finska undertexter innan det är verifierat.

## Enkätlagring

Enkätgränssnittet och ett litet lagringsinterface är färdiga, men ingen endpoint
är aktiverad. Därför visar sidan inte en falsk sparbekräftelse: användaren får ett
tydligt meddelande om att svaren inte skickades. E-postadressen ingår aldrig i
enkätpayloaden, URL:en, `sessionStorage` eller analysen.

Välj senare ett av dessa kostnadsfria first-party-alternativ:

- En befintlig one.com-miljö med PHP och SQLite/MySQL, om sådan hosting redan
  ingår eller aktiveras.
- Cloudflare Worker + D1 på kostnadsfri nivå, om ett Cloudflare-konto väljs för
  projektet.

Inget alternativ har valts automatiskt eftersom båda kräver ett externt konto,
driftval och serverkonfiguration. När en endpoint finns sätts
`PUBLIC_SURVEY_ENDPOINT` till dess HTTPS-adress. Endpointen ska:

- endast acceptera `POST application/json`,
- validera alla svar mot samma fasta värdelistor som i sajten,
- avvisa fler än tre genrer och orimligt stora payloads,
- spara endast svar, ISO-tidsstämpel, anonymt sessions-ID, UTM-fält och variant,
- ha snäv CORS för `https://splatter.fi`, rate limiting och inga cookies,
- returnera 2xx först efter att datan faktiskt har sparats.

Om one.com-reservpaketet används måste `connect-src` i `public/.htaccess` också
få endpointens exakta origin. Lägg inte till ett generellt jokertecken.

Exportera surveydata som CSV eller JSON från vald databas. Koppla inte samman
exporten med Mailchimp via e-postadress.

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

Utan konfigurerad endpoint skickas eller sparas inga analysevents; sajten använder
inga analyscookies och behöver inget nytt samtyckesbanner. `/kiitos` kan ändå ses
som den enklaste konverteringssidan i eventuell befintlig hoststatistik. Om en
first-party-endpoint senare väljs anges den som `PUBLIC_ANALYTICS_ENDPOINT` och
funnelstegen kan summeras per UTM och `landing_variant`.

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
