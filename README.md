# Splatter.fi

Kevyt, staattinen lanseeraussivu Splattersin Suomen-julkaisun odotuslistalle.
Sivu noudattaa Splatter.se:n Premium Pulp -ilmettä, käyttää paikallisia fontteja
ja lähettää ilmoittautumiset Mailchimpin julkiseen lomakkeeseen. Sivulla ei ole
analytiikkaa eikä muita kuin toiminnan kannalta välttämättömiä evästeitä.

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

Sivu käyttää oletuksena Splattersin nykyisen yleisön julkista lomakeosoitetta.
Ennen julkaisua Mailchimpissä pitää:

1. luoda piilotettu ryhmä `Market / Finland launch`,
2. ottaa double opt-in ja reCAPTCHA käyttöön,
3. kääntää vahvistus- ja kiitossivut suomeksi,
4. kopioida embed-koodin ryhmäkentän nimi ja arvo ympäristömuuttujiin
   `PUBLIC_MAILCHIMP_GROUP_NAME` ja `PUBLIC_MAILCHIMP_GROUP_VALUE`,
5. rakentaa sivu uudelleen.

Mailchimp API -avainta ei koskaan tarvita selaimessa eikä tähän repoon pidä
lisätä salaisuuksia.

## one.com

Lataa `dist/`-hakemiston sisältö (ei itse hakemistoa) splatter.fi:n
dokumenttijuureen File Managerissa. `.htaccess` pakottaa HTTPS:n ja apex-osoitteen
kanoniseksi sekä lisää tärkeimmät tietoturvaotsakkeet.
