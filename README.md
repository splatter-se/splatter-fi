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

1. luoda Suomen lanseerauslista tai piilotettu ryhmä `Market / Finland launch`,
2. ottaa double opt-in ja reCAPTCHA käyttöön,
3. kääntää vahvistus- ja kiitossivut suomeksi,
4. kopioida embed-koodin form action, GDPR-valintaruudun nimi ja bottiloukun nimi
   vastaaviin `PUBLIC_MAILCHIMP_*`-ympäristömuuttujiin,
5. täyttää ryhmäkentän nimi ja arvo vain, jos käytössä on sama yleisö ja piilotettu ryhmä,
6. rakentaa sivu uudelleen ja tarkistaa testiliittyminen.

Mailchimp API -avainta ei koskaan tarvita selaimessa eikä tähän repoon pidä
lisätä salaisuuksia.

## one.com

Lataa `dist/`-hakemiston sisältö (ei itse hakemistoa) splatter.fi:n
dokumenttijuureen File Managerissa. `.htaccess` pakottaa HTTPS:n ja apex-osoitteen
kanoniseksi sekä lisää tärkeimmät tietoturvaotsakkeet.
