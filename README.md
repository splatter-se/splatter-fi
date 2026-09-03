# Splatter.fi

Kevyt, staattinen lanseeraussivu Splattersin Suomen-julkaisun odotuslistalle.
Sivu noudattaa Splatter.se:n Premium Pulp -ilmettä, käyttää paikallisia fontteja
ja lähettää ilmoittautumiset Mailchimpin julkiseen lomakkeeseen. Lomake pysyy
turvallisesti pois käytöstä, kunnes Suomen-listan oikeat asetukset on annettu.
Sivulla ei ole analytiikkaa eikä muita kuin toiminnan kannalta välttämättömiä evästeitä.

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

## Mailchimp

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

## one.com

Lataa `dist/`-hakemiston sisältö (ei itse hakemistoa) splatter.fi:n
dokumenttijuureen File Managerissa. `.htaccess` pakottaa HTTPS:n ja apex-osoitteen
kanoniseksi sekä lisää tärkeimmät tietoturvaotsakkeet.
