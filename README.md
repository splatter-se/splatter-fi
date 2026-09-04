# Splatter.fi

Kevyt, staattinen ennakkosivu Splattersin mahdollisen Suomen-laajentumisen odotuslistalle.
Sivu noudattaa Splatter.se:n Premium Pulp -ilmettä, käyttää paikallisia fontteja
ja lähettää ilmoittautumiset Mailchimpin julkiseen lomakkeeseen. Lomake pysyy
turvallisesti pois käytöstä, kunnes Suomen-listan oikeat asetukset on annettu.
Sivulla ei ole analytiikkaevästeitä. Ensimmäisen käynnin UTM-tiedot ja anonyymi
istuntotunniste säilyvät vain selaimen `sessionStorage`-muistissa. Kiitossivun
kysely ei väitä tallentaneensa vastauksia ennen kuin turvallinen endpoint on
konfiguroitu.

## Kehitys

```bash
npm install
npm run dev
```

## Tarkistus ja build

```bash
npm run verify
npm run deploy:bundle
```

Valmis one.com-paketti syntyy tiedostoon `onecom-bundle.zip`.

## Mailchimp ja Suomen ennakkovalmistelut

Ennen julkaisua Mailchimpissä pitää:

1. luoda erillinen upotettu lomake ja automaattinen `Finland launch` -tagi,
2. luoda `FICONSENT`-yleisökenttä suostumuksen version tallentamista varten,
3. kopioida embed-koodin form action, tagin tunniste ja bottiloukun nimi
   vastaaviin `PUBLIC_MAILCHIMP_*`-ympäristömuuttujiin,
4. rakentaa sivu uudelleen ja tarkistaa testiliittyminen.

Tuotantoarvot ovat julkisia lomaketunnisteita, eivät API-avaimia. Nykyinen
Mailchimp-yleisö käyttää single opt-inia, jotta tämän lomakkeen käyttöönotto ei
muuta olemassa olevien ruotsalaisten lomakkeiden vahvistuspolkua. Pakollinen
suostumus tallennetaan `FICONSENT`-kenttään ja liittymiset saavat automaattisesti
`Finland launch` -tagin.

Mailchimp API -avainta ei koskaan tarvita selaimessa eikä tähän repoon pidä
lisätä salaisuuksia.

Kaikki ulkoiset asetukset, kyselydatan vaihtoehdot ja manuaaliset tarkistukset:
[`docs/finland-prelaunch-setup.md`](docs/finland-prelaunch-setup.md).

## Publicering

Sivu julkaistaan GitHub Pagesissa `.github/workflows/deploy-pages.yml`-työn avulla.
`splatter.fi` pysyy rekisteröitynä one.comissa, jossa apex-DNS osoittaa GitHub
Pagesin A-tietueisiin ja `www` CNAME-tietueella osoitteeseen `splatter-se.github.io`.

`npm run deploy:bundle` tuottaa lisäksi `onecom-bundle.zip`-paketin siltä varalta,
että domainiin lisätään myöhemmin one.com-webbhotelli.
