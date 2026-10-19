# Finland: efterfrågetest, fi-demand-2026-01

Beslut 19 oktober 2026: undersök om finska skräckfans vill köpa Splatter till ett
angivet pris och om det går att nå dem ekonomiskt. Tidigare 0 kontakter under
`Finland launch` är ingen konverteringsgrad; historisk besökstrafik saknas.

## Genomförande och beslut

1. Intervjua 8–10 vuxna finska skräckfans. Granska erbjudande och finska med
   personer som faktiskt betalar för film. Rekrytera både entusiaster och mindre
   aktiva tittare, inte bara befintliga Splatter-följare. Ersättningar ingår inte
   i annonsbudgeten och måste bestämmas separat.
2. Fastställ månadspris i euro, minst sex representativa filmer med verifierade
   rättigheter för Finland, verkliga undertextspråk och tillgängliga enheter.
   Använd helst 12–20 filmer om rättighetsläget tillåter det. Finska undertexter
   får inte utlovas utifrån svenska undertexter eller osäkrade licenser.
3. Aktivera erbjudandet i `src/config/experiment.json`. `approved` är medvetet
   `false` och priset `null` tills dessa beslut finns. Byt `offerVersion` när
   pris, katalog eller villkor ändras. Starta en ny experimentidentitet för ett
   separat test; ändra inte villkor mitt i ett jämförelsefönster.
4. Verifiera en riktig, kontrollerad registrering inklusive bekräftelsemejl,
   statusövergång från `pending` till `subscribed`, sparat prisintresse och
   rapportavstämning. Enhetstester med simulerad Mailchimp ersätter inte detta.
5. Börja med högst 2 000 SEK annonskostnad, 1 000 per budskap. Bedöm mätning,
   faktiska landningar, geografisk kvalitet och kostnad innan återstående
   högst 6 000 SEK används. Beloppen är den godkända planens tak, inte en order
   att starta kampanjer med ett ofärdigt erbjudande. Kampanjunderlaget är pausat.
6. Bedöm efter 500 uppmätta finska sessioner. Avsluta även om 8 000 SEK eller
   21 annonsdagar nås först; redovisa då otillräcklig volym. Mätningen gäller
   dem som samtycker, inte hela Finlands befolkning eller alla sidbesök.

Preliminär gräns för att gå vidare: minst 40 unika bekräftade leads och minst
10 av dem som aktivt väljer pilot till visat pris. Siffrorna är arbetshypoteser,
inte branschbenchmark, statistiskt säkerställd efterfrågan eller lönsamhet.
Vid 40/500 är punktestimatet 8 %, med ett ungefärligt 95-procentigt Wilsonintervall
på 5,9–10,7 %. Beräkna faktisk osäkerhet utifrån slutlig kohort.

Många leads men svagt prisintresse: intervjua kring katalog, språk och pris.
Svagt inflöde trots bra trafik och fungerande flöde: ändra ett erbjudandeled och
gör ett separat test. Ofullständig mätning är ett mätproblem, inte ett marknadsnej.

Den slutliga valideringen är en levererbar betald pilot: första betalning,
faktiskt tittande, återbetalningar och nästa betalning. Intresseknappen tar inga
betalningar och startar inga abonnemang.

## Vad måtten betyder

| Mått | Källa och begränsning |
| --- | --- |
| Annonskostnad, klick | Annonskonto; avstäm dag för dag, SEK |
| Uppmätta sessioner | `finland_landing_view`, frivilligt mätsamtycke, unikt session-ID i sessionStorage |
| Formulärskickning | `finland_signup_submit`; inget bevis för registrering |
| Formuläråterkomst | `finland_signup_return`; inget bevis för e-postbekräftelse |
| Bekräftad lead | Servern har observerat `pending` → `subscribed` i Mailchimp |
| Kvalificerad lead | Bekräftad lead + aktivt ja + samma offerVersion och serverlagrat pris |
| Betalande kund | Separat verklig betalning; finns inte i detta test |

`worker/report.sql` skiljer baseline utan pris från erbjudandeversionen, finska
från andra länders sessioner, och QA från deltagare. Den räknar leads kopplade
till uppmätta sessioner separat från bekräftade leads utan mätsamtycke. Summera
inte källornas sessioner till unika människor. Flera sessioner och enheter per
person förekommer. Adblockers, nekad mätning och borttappad session ger bortfall.
Använd annonsklick jämfört med uppmätta sessioner som en täckningsindikator,
aldrig som en exakt samtyckesgrad eller ett antal verkliga besökare.

Kostnad per bekräftad lead = attribuerbar annonskostnad / bekräftade leads i
samma kampanjkohort. Redovisa kostnaden mot den uppmätta kohorten som partiell
attribution, inte fullständig total-CPL. Blanda inte organiskt inflöde och betalt.
Antagen kund-CAC = leadkostnad / lead-till-betalare-konvertering. Exempel:
50 SEK per lead och 10 % betalande ger 500 SEK per kund. Ett tillåtet CAC måste
fastställas utifrån finskt nettobidrag efter moms, rättigheter, leverans och
betalningskostnader; svenskt brutto-ARPU är inte ett tillåtet CAC.

## Intervju, 20 minuter

Inled utan att presentera Splatter. Be om konkreta senaste händelser.

1. Vilken skräckfilm såg du senast och var hittade du den?
2. Vad har du betalat för att se den senaste månaden? Vad kostade det?
3. Vilken film ville du se men kunde inte hitta? Vad gjorde du då?
4. Vilka abonnemang har du sagt upp, och vad utlöste beslutet?
5. Visa filmurvalet: vilka tre skulle du faktiskt börja med? Varför?
6. Vilka undertextspråk fungerar? Vad händer om finska saknas?
7. Visa exakt pris och enheter: vad skulle få dig att välja bort erbjudandet?
8. Låt personen använda sidan själv. Kan hen förstå villkor och registrera sig
   utan förklaring? Fråga därefter om en konkret pilotinbjudan.

Dokumentera observationer och hinder, inte hela samtal eller personuppgifter i
projektet. Intervjupersoners godkännanden och kontaktuppgifter hanteras separat.

Rekryteringsutkast på finska, ännu inte skickat:

> Katsotko kauhuelokuvia Suomessa? Suunnittelemme mahdollista kauhuelokuvien
> suoratoistopalvelua ja etsimme aikuisia elokuvaharrastajia noin 20 minuutin
> haastatteluun. Haluamme kuulla, miten löydät elokuvia ja mistä olet valmis
> maksamaan. Palvelu ei ole vielä saatavilla Suomessa. Kiinnostaisiko osallistua?

## Drift och återställning

Sidan ligger kvar på GitHub Pages. Worker `splatter-fi-demand` och D1 i EU ligger
i Splatters befintliga Cloudflare-konto. Inga annonsplattformspixlar har lagts till.
Rapporter nås via autentiserad Wrangler/D1, inte ett publikt statistik-API.
Samtycke lagras bara under aktuell browser-session och kan ändras i integritetsdialogen.
Mailchimp har fortfarande samma audience och `Finland launch`-tagg.

En saknad Mailchimp-nyckel eller ett ej godkänt erbjudande stänger nya API-signups
och prisintresse. Det befintliga publika väntelisteformuläret fungerar fortsatt.
Inga globala opt-in-inställningar i den svenska audiencen behöver ändras.
Den nya API-vägen skickar endast `status_if_new: pending`. Existerande abonnenter
eller avregistrerade kontakter får inte automatiskt räknas som nya bekräftade
leads; de behöver separat manuell uppföljning. Detta ger avsiktligt en konservativ
räkning och kan underräkna människor som redan finns i den svenska audiencen.

Bekräftelsen måste kontrolleras från den ursprungliga fliken där beviset finns i
sessionStorage. Besök i en annan browser eller en stängd flik kan inte återskapa
kopplingen. Vi gissar inte attribution vid sådant bortfall. Testa därför även
vanlig mobil e-postläsare under den riktiga genomgången innan annonser startas.

Worker-loggning är avstängd. Händelser sparas utan e-post, IP, user agent eller
full URL. Endast fastställda kampanjvärden accepteras. Leadtabellens Mailchimp-
hash och kontrolltoken är fortfarande personuppgifter/pseudonymer. Bevis lagras
hashat och lämnas aldrig i URL. Cloudflares hastighetsbegränsning använder IP
vid edge, utan att vi lagrar den. GitHub-flödet `retention.yml` begär dagligen
gallring av alla testtabeller efter 90 dagar; faktisk gallring kan ske något
senare om schemakörningar fördröjs. Dess publika `/maintenance`-endpoint kan bara
radera poster som redan är äldre än 90 dagar, utan valbar tidsgräns eller tabell.
Den kan inte läsa eller radera aktuella poster. Ingen ny Cloudflare-cron används
eftersom kontots fem fria cronplatser redan är upptagna.
E-postadresser ligger kvar i Mailchimp enligt väntelistans samtycke.

Installera Worker-verktyget enligt befintlig miljö. Från reporoten:

```sh
wrangler d1 execute DB --remote --config worker/wrangler.jsonc --file worker/schema.sql
wrangler deploy --config worker/wrangler.jsonc
wrangler secret put MAILCHIMP_API_KEY --config worker/wrangler.jsonc
node scripts/finland-report.mjs
```

Rapportskriptet kör de fasta SELECT-frågorna med `--command`; D1:s `--file` är
en importväg som inte returnerar rapportens rader. Sätt `WRANGLER_BIN` till din
befintliga Wrangler-binär om kommandot inte finns i PATH. I denna arbetsmiljö
finns den i `../splatter-main/node_modules/.bin/wrangler` från reporoten.

Lägg aldrig nyckeln i PUBLIC-variabler, repot eller rapporter. Nyckeln behöver
anslutas genom en säker inmatning av kontoägaren, inte kopieras från browserns
session. En eventuell ny nyckel ska skapas av kontoägaren.

`PUBLIC_ANALYTICS_ENDPOINT` ska sluta på `/v1/events`, `PUBLIC_SURVEY_ENDPOINT`
på `/v1/surveys`, och `PUBLIC_DEMAND_API` vara samma Workers-origin utan suffix.
Kör `npm run verify` före frontendpublicering och Worker dry-run före deploy.
API- och sidversion ska rullas ut tillsammans vid ändringar av erbjudandet.

Återställ först till `approved: false` vid fel i erbjudande/bekräftelse. För att
stänga mätningen: töm de tre endpointvariablerna och bygg/publicera om sidan.
Stoppa även berörda annonser. Radera inte databasen för att stänga insamlingen.

## Kvar före trafiktest

- Fastställt europris, finska rättigheter, undertextspråk och enheter.
- Finsk språkgranskning och 8–10 intervjuer; observerade hinder åtgärdade.
- Mailchimp API-nyckel via säker konfiguration.
- Riktig dubbel opt-in-genomgång, inklusive finsk bekräftelsecopy och mobilflöde.
- Beslutat CAC-tak och konkreta, pausade annonsutkast granskade mot erbjudandet.

Budgeten används inte för att köpa trafik till baseline-sidan.
