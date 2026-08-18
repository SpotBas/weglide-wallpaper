# WeGlide Vlucht Wallpaper

Een losstaande, client-side HTML-tool die van een WeGlide-vlucht automatisch een
wallpaper maakt: een fotocollage met daarover de gevlogen route, piloot, vliegtuig,
datum en vluchtduur. Alles draait volledig in de browser — geen server, geen
build-stap, geen dependencies.

## Gebruik

1. Open de site (zie live-URL hieronder, of open `index.html` lokaal in een browser).
2. Vul een **vlucht-ID** in (bv. `2874213`) of plak een volledige **WeGlide-link**
   (bv. `https://www.weglide.org/flight/2874213`) — het ID wordt automatisch uit de
   link gehaald.
3. De **WeGlide API-key** is **optioneel**. Zonder key werkt de tool prima voor
   openbare vluchten. Met een key krijg je een hogere rate limit en kun je ook je
   eigen prive vluchten ophalen. De key wordt uitsluitend als `X-API-Key`-header
   meegestuurd (via de CORS-proxy, zie hieronder) naar `api.weglide.org` en
   nergens anders naartoe gestuurd.
4. Kies een resolutie (1920×1080, 2560×1440, 3840×2160 of 1080×1920 voor mobiel).
5. Klik op **"Wallpaper genereren"**. De tool haalt de vluchtgegevens, de route
   (via het IGC-bestand) en eventuele foto's op, en tekent alles op een canvas.
6. Klik op **"Downloaden als PNG"** om het resultaat op te slaan.

Geen foto's beschikbaar voor de vlucht? Dan gebruikt de tool automatisch een
subtiele gradient-achtergrond in plaats van een lege pagina.

## Hoe het werkt

- **Vluchtgegevens**: `GET https://api.weglide.org/v1/flightdetail/{id}` levert
  piloot, vliegtuig, starttijd, vluchtduur en het pad naar het IGC-bestand.
- **Route**: het IGC-bestand wordt gedownload van de WeGlide CDN en client-side
  geparsed (B-records) tot een lijst van lat/lon/hoogte-punten — geen apart
  track-endpoint nodig.
- **Foto's**: `GET https://api.weglide.org/v1/story/{id}` levert de foto's van de
  vlucht, gesorteerd op tijdstip binnen de vlucht.
- Alles wordt samengevoegd op een `<canvas>` en geëxporteerd naar PNG via
  `canvas.toBlob`.

## Achtergrond over de WeGlide API

Zie de officiële developer-documentatie:
[docs.weglide.org/creators/developers.html](https://docs.weglide.org/creators/developers.html)

## CORS-proxy

`api.weglide.org` en de CDN (`weglidefiles.b-cdn.net`) sturen geen
CORS-headers mee, waardoor browsers directe `fetch()`-calls vanaf een
`github.io`-origin blokkeren (`Failed to fetch`). Daarom staat er een kleine
Cloudflare Worker tussen: [`cors-proxy/worker.js`](cors-proxy/worker.js).

Deze Worker doet niets anders dan requests doorsturen naar **uitsluitend**
`api.weglide.org` (pad `/api/...`) en `weglidefiles.b-cdn.net` (pad
`/cdn/...`), de optionele `X-API-Key`-header meegeven, en de CORS-headers
toevoegen die de browser vereist. `index.html` verwijst naar de gedeployde
Worker via de `PROXY_BASE`-constante bovenin het `<script>`-blok.

Zelf (opnieuw) deployen (gratis, geen CLI nodig):
1. [dash.cloudflare.com](https://dash.cloudflare.com) → **Workers & Pages** →
   **Create application** → **Start with Hello World!**
2. **Edit code**, plak de inhoud van `cors-proxy/worker.js`, **Deploy**.
3. Zet de resulterende `*.workers.dev`-URL in `PROXY_BASE` in `index.html`.

## Bekende beperking

Zonder de CORS-proxy hierboven kan de PNG-export (`canvas.toBlob`) mislukken
met een `SecurityError` doordat foto's van de CDN de canvas "tainten", ook al
toont de preview de foto's gewoon. De tool vangt dit op met een duidelijke
foutmelding en het advies om in dat geval een schermafbeelding van de preview
te maken. Met de proxy (die alles van `Access-Control-Allow-Origin: *`
voorziet) zou dit niet meer moeten optreden.
