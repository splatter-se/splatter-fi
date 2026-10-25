# Finland: Mailchimp-copykit

Version 25 oktober 2026. Texterna är skrivna för en vuxen, filmkunnig och
återhållsam Splatter-ton. De ska språkgranskas av en infödd finskspråkig person
innan de aktiveras i Mailchimp.

## Grundinställningar

- Avsändarnamn: `Splatter`.
- From och reply-to: använd `hej@splatter.se` tills `hei@splatter.fi` är skapat,
  verifierat i Mailchimp och testat för både mottagning och sändning.
- Segment/tagg: `Finland launch`.
- Total kontaktfrekvens: bekräftelse, välkomstmejl, en fråga efter cirka sju
  dagar och därefter högst 1–2 relevanta uppdateringar per år.
- Varje kampanj ska innehålla Mailchimps fungerande avregistreringslänk.

Använd Mailchimps inbyggda bekräftelselänk i dubbel opt-in-knappen. Gissa inte
ett merge-fält. Lägg aldrig e-postadressen i en URL, analysparameter eller
enkätlänk.

`/kiitos` använder ett anonymt bevis i den ursprungliga webbläsarfliken. Länka
därför inte dit från ett senare mejl som om enkäten säkert kunde återupptas.
Välkomstmejlet kan i stället be mottagaren återvända till den ursprungliga
fliken om den fortfarande är öppen.

## 1. Double opt-in

**Ämne**

> Vahvista liittymisesi Splatterin Suomen odotuslistalle

**Förhandsvisning**

> Vahvista sähköpostiosoitteesi, niin pysyt mukana.

**Brödtext, plain text**

> Hei,
>
> kiitos kiinnostuksestasi Splatterin Suomen odotuslistaa kohtaan.
>
> Vahvista sähköpostiosoitteesi alla olevasta painikkeesta, niin voimme lähettää
> sinulle muutaman viestin vuodessa Suomeen laajentumisen suunnittelusta.
>
> [MAILCHIMPIN VAHVISTUSPAINIKE]
>
> Jos et pyytänyt tätä viestiä, voit jättää sen huomiotta.
>
> Splatter

**Knapp**

> Vahvista sähköpostiosoitteeni

Knappen ska använda Mailchimps egen confirmation action, inte en vanlig länk
till sajten.

## 2. Välkomstmejl direkt efter bekräftelsen

**Ämne**

> Tervetuloa Splatterin Suomen odotuslistalle

**Förhandsvisning**

> Kiitos — olet mukana suunnittelemassa, millainen palvelu voisi toimia Suomessa.

**Brödtext, plain text**

> Hei,
>
> kiitos, että vahvistit liittymisesi Splatterin Suomen odotuslistalle.
>
> Selvitämme mahdollisuutta tuoda Splatter Suomeen. Listalla saat muutaman
> viestin vuodessa suunnittelun etenemisestä, lyhyitä kyselyitä ja mahdollisia
> kutsuja käyttäjätesteihin.
>
> Jos alkuperäinen Splatter-välilehti on vielä auki, voit palata siihen ja vastata
> kolmeen lyhyeen kysymykseen. Vastaukset auttavat meitä ymmärtämään, millaiselle
> kauhupalvelulle Suomessa olisi kysyntää.
>
> Voit poistua odotuslistalta milloin tahansa tämän viestin lopussa olevasta
> linkistä.
>
> Ystävällisin terveisin,
> Splatter

Mejlet behöver ingen CTA. Undvik en generisk `/kiitos`-knapp eftersom den inte
kan återställa den ursprungliga webbläsarens anonyma verifieringsbevis.

## 3. En fråga efter cirka sju dagar

**Ämne**

> Mikä kauhuelokuva jäi sinulta löytämättä?

**Förhandsvisning**

> Yksi kysymys Splatterin Suomen palvelun suunnitteluun.

**Brödtext, plain text**

> Hei,
>
> yksi kysymys Suomen palvelun suunnittelua varten:
>
> Minkä kauhuelokuvan tai kauhun alalajin olet halunnut löytää Suomessa, mutta et
> ole löytänyt?
>
> Voit vastata suoraan tähän viestiin.
>
> Kiitos avustasi,
> Splatter

Använd en bevakad reply-to-adress. Lägg inte till fler frågor i detta mejl.

## 4. Utvecklingsuppdatering, högst 1–2 gånger per år

Skicka bara när det finns något verifierat och relevant att berätta. Ersätt alla
hakparenteser och radera rader som inte passar innan utskick.

### Mall A: konkret framsteg

**Ämne**

> Uutisia Splatterin Suomen palvelun suunnittelusta

**Förhandsvisning**

> [LYHYT KUVAUS VAHVISTETUSTA EDISTYSASKELEESTA]

**Brödtext, plain text**

> Hei,
>
> olemme edistäneet Splatterin Suomen palvelun suunnittelua: [KUVAILE YKSI
> VAHVISTETTU EDISTYSASKEL LYHYESTI].
>
> [KERRO TARVITTAESSA YHDELLÄ VIRKKEELLÄ, MITÄ TÄMÄ TARKOITTAA ODOTUSLISTALLA
> OLEVILLE.]
>
> Suomen palvelua suunnitellaan edelleen, eikä se ole vielä saatavilla Suomessa.
>
> Kiitos, että olet mukana.
>
> Ystävällisin terveisin,
> Splatter

### Mall B: en ny avgränsad fråga

**Ämne**

> Auta meitä suunnittelemaan Splatterin Suomen palvelua

**Förhandsvisning**

> [LYHYT KUVAUS TÄMÄN VIESTIN AIHEESTA]

**Brödtext, plain text**

> Hei,
>
> selvitämme parhaillaan [VAHVISTETTU SUUNNITTELUN AIHE]. Haluaisimme kuulla,
> mitä ajattelet siitä.
>
> [ESITÄ YKSI LYHYT KYSYMYS. PYYDÄ VASTAAMAAN SUORAAN VIESTIIN.]
>
> Kiitos, että autat meitä suunnittelemaan palvelua.
>
> Ystävällisin terveisin,
> Splatter

## Kontroll före varje aktivering eller utskick

- Inga hakparenteser eller interna kommentarer finns kvar.
- Avsändar- och reply-to-adresser fungerar och bevakas.
- Mailchimps bekräftelse- respektive avregistreringsfunktion används korrekt.
- Alla katalog-, rättighets-, språk-, pris- och tidsuppgifter är verifierade.
- Ingen formulering antyder att Finlandslanseringen är beslutad eller nära.
- Finsk copy är mänskligt språkgranskad.
