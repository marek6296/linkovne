# Linkovne — SEO a AI vyhľadávanie

Dátum: 2026-11-15. Cieľ potvrdený Marekom: globálne, angličtina, modelky a creator agentúry.

## Návrh
Spojiť technické SEO, pravdivé produktové odpovede a distribúciu cez Google/Bing. Samotné robots.txt nerieši dôveryhodnosť ani dopyt; masová tvorba článkov bez pridanej hodnoty by vytvárala slabý obsah. Existujúci Next.js web a vizuálny štýl zostávajú základom.

Prvá verzia: presné FAQ a ceny/funkcie, Organization/SoftwareApplication graph, samostatné OG URL pre podstránky, Bing overenie, tri vecné príručky pre modelky a agentúry s internými odkazmi, sitemap a jednoduchý llms.txt rozcestník. Žiadne fake recenzie, garancie ban protection či garantované AI odporúčania. Llms.txt je len doplnkový navigačný súbor, nie predpoklad indexácie.

## Zistenia pred úpravami
- Produkčná homepage, robots a sitemap vracajú 200; `/vs/linktree` tiež 200.
- Google Search Console: 5 indexovaných, 14 neindexovaných (stav reportu 9. 11.). 3 redirecty, 1 noindex, 9 discovered, 1 crawled not indexed. Deväť discovered sú používateľské profily, nie produktové landing pages.
- Homepage „URL is on Google“. Sitemap úspešne znovu odoslaná 15. 11.; posledné čítanie v reporte 26. 7., 15 objavených URL.
- Robots povoľuje všeobecné crawlery už teraz. Nie je dôvod predstierať, že nový AI allow blok je nutný.
- FAQ neuvádza Business podmienku vlastnej domény, preceňuje úspešnosť in-app escape, porovnanie zamieňa výpadok domény za platformové blokovanie.
- Súčasný kód: Free 1 profil, Pro 4, Business 10. Custom domains iba Business; Pro €4.99/mes., Business €14.99/mes.
- Bing prihlásený; manuálne overenie cez web.

## Implementačný plán
- [x] Overiť, že nové verejné cesty nekolidujú s existujúcimi profilmi; rezervovať nové názvy pre budúcnosť.
- [x] Opraviť konkrétne nepresné texty a podstránkové Open Graph URL; pridať pravdivú identitu produktu.
- [x] Pridať príručky: link in bio for models, agency workflow, own domain and failure handling. Jasné limity funkcií; žiadne tvrdenia o tržbách bez integrácie.
- [x] Pridať sitemap odkazy, footer navigáciu, llms.txt a Bing meta overenie.
- [x] Overiť testami, TypeScriptom, buildom a HTTP kontrolami HTML/canonical/JSON-LD/404 na izolovanom porte.
- [x] Commit/push cez GitHub, overiť produkčný deploy a dokončiť Bing + odoslanie URL/sitemap.
- [x] Uložiť výsledky, východiskové metriky a ďalšie kroky do pamäte.

## Čo merať a čo zostáva dlhodobé
Google/Bing impressions, nebrandové dopyty, kliky na registráciu a aktivované účty. AI citácie závisia od dostupných reportov; manuálne otázky sú iba orientačná vzorka, nie spoľahlivý ranking.

Po nasadení: skutočné zákaznícke príklady so súhlasom, dôveryhodné produktové katalógy a relevantné zmienky/odkazy, aktualizované porovnania konkurencie a obsah podľa skutočných query dát. Žiadne platené kampane ani platené služby bez osobitného rozpočtu.

Oficiálne podklady:
- https://developers.google.com/search/docs/appearance/ai-features
- https://developers.openai.com/api/docs/bots
- https://www.bing.com/webmasters/help/ai-performance-9f8e7d6c

## Overenie implementácie
- Izolovaný worktree, žiadne zmeny schémy ani DB oprávnení. Nové /guides a /about pred úpravou 404; zarezervované pre budúce profily.
- 14 testov prešlo. Produkčný Next.js build s ostrou SITE_URL prešiel. Read-only HTTP smoke check: 10 stránok, canonical, OG URL, description, H1, JSON-LD, robots, llms, sitemap, Googlebot/bingbot/OAI-SearchBot/ChatGPT-User a skutočná 404 neznámej príručky.
- Samostatný reviewer skontroloval zmeny. Opravený pricing browser-opening sľub a nesprávne zaradenie source trackingu len do Pro. Opravené OG URL profilov a právnych stránok.
- Sitemap pre Creator mode používa existujúci public_profile RPC v dávkach po 10; anon nemá SELECT creator_mode. Žiadne rozšírenie práv. Pri tisícoch profilov zmeniť na úzke hromadné RPC.
- Pridaný IndexNow proof a scripts/submit-indexnow.mjs. Spustiť po overenom produkčnom deployi; odosiela iba produktové/marketingové URL, nie používateľské profily. HTTP 200/202 znamená prijatie, nie potvrdenú indexáciu.
- Ceny a počty profilov pre schema, About a príručky vychádzajú z PLANS. Dátumy príručiek sú dátumy skutočného publikovania/úpravy, nie každého buildu.
- Linktree číslo ceny sa z aktuálneho oficiálneho HTML nepodarilo overiť, verejné porovnanie preto neuvádza starých $6. Beacons údaje overené z oficiálneho plánu.


## Produkčný výsledok
- Funkčné zmeny nasadené commitom `2ff7211`; Vercel deploy `3sYAC4fScJg8reVmBiuec5s3bPGn` úspešný.
- Produkčný smoke check prešiel. Aktuálna sitemap má 28 URL.
- Google prijal samostatné žiadosti o nové indexovanie homepage a /guides; sitemap znovu odoslaná aj po deployi. Žiadosti sú prijaté, nie dôkaz už dokončenej indexácie nových stránok.
- Bing doména úspešne overená meta tagom; sitemap prijatá, Processing.
- IndexNow prijal 8 marketingových URL s HTTP 202 (key validation pending).
- PageSpeed API vrátilo 429, performance skóre preto nezmerané.
- Externý listing: pripravený podklad, AlternativeTo čaká na Marekovo prihlásenie a overený email. Nič na AlternativeTo neodoslané ani schválené.
