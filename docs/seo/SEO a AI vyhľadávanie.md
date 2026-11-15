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
- Externý listing: AlternativeTo odoslané 15. 11. 2026 cez účet Marek-Donoval; app ID `0b6a8cf9-ac99-485b-ac9b-4e8ef06d359a`. Kompletný profil, logo, 2 screenshoty a Linktree/Beacons/AllMyLinks väzby. Bezplatná fronta; čaká na review, zatiaľ nie verejný backlink. Screenshot assety nasadené commitom `1db7ead`.

## Druhá etapa — alternatívy a meranie AI viditeľnosti
Schválený rozsah Marekom: doplniť priamych konkurentov, reálne preveriť AI odporúčania a pokračovať v relevantných externých profiloch. Zachovať existujúci stack a dizajn; nepoužívať nevyskúšané tvrdenia o konkurencii ani platené služby bez rozpočtu.

- [x] Pridať Linkme, AllMyLinks, hoo.be do /vs; vlastné zhrnutie vhodnosti a citované fakty, aktuálne dátumy overenia.
- [x] Pridať /vs rozcestník pre vyhľadávací zámer „alternatives“, interné odkazy, sitemap a llms odkazy. Vlastné /vs na top-level nekoliduje s profilmi (username má minimálne 3 znaky).
- [x] Zabezpečiť, že neznáme/prototype názvy konkurentov vracajú 404. Testovať lookup, render a metadata nových stránok.
- [x] Overiť aktuálne odporúčania Gemini a ChatGPT v čerstvých konverzáciách; oddeliť nebrandové objavenie od výslovnej otázky o značke, zaznamenať prompt/dátum/režim/obmedzenia. Žiadne generalizovanie z jednej vzorky.
- [x] Ďalší relevantný profil: SaaSHub, po Marekovom prihlásení a jeho prijatí podmienok; žiadne falošné recenzie ani zmienky.
- [x] Testy, build, code review, deploy cez GitHub, produkčný HTTP smoke, IndexNow a Google sitemap.
- [x] Aktualizovať existujúcu SEO poznámku a kartu vo vaulte.

Oficiálne zdroje overované 15. 11. 2026: link.me/pricing, link.me/faq, support.allmylinks.com (custom domains, multiple accounts, visitor statistics), hoo.be/pricing, hoo.be/for-agencies. Číselné paid ceny Linkme sa z dostupného pricing HTML nedajú overiť; neuvádzať ich. AllMyLinks blog z roku 2020 nepoužívať ako aktuálny cenník.


## Výsledok druhej etapy (15. 11. 2026)
- Nasadený `d43e73b`, Vercel deploy `12UgAp4QAQVQzgdwHDe4YrdqGVHs` success. Päť porovnaní a `/vs` rozcestník s výberom podľa workflow, zdrojmi a schema. Všetkých 15 testov, TypeScript, build a samostatná code review prešli.
- Produkčný HTTP smoke prešiel na 14 stránkach, 32 sitemap URL a 404 pre neznáme/prototype slugs. IndexNow prijal 12 marketingových URL HTTP 200 (nie dôkaz indexácie).
- Google sitemap znovu odoslaná: Success, last read 15. 11., 32 discovered pages. Google prijal priority-crawl requests pre `/vs` a `/vs/linkme`; obe pri kontrole ešte unknown/not indexed.
- Google Search Console baseline 13. 8.–12. 11. 2026: 8 klikov, 37 zobrazení, CTR 21.6 %, priemerná pozícia 19.8. Generative AI on Search results: 14 celkových zobrazení. Ide o historické dáta pred dnešnými úpravami, nie zásluhu aktuálneho deployu ani samostatnú Gemini aplikáciu.

### Manuálne AI testy
Čerstvé dočasné chaty, angličtina, webové vyhľadávanie vyžiadané. Gemini Auto; ChatGPT Medium, Unpersonalized (bez pamäte, pluginov a custom instructions). Jeden pokus na otázku, malá orientačná vzorka; výsledok závisí od modelu, regiónu a aktuálneho indexu.

| Otázka | ChatGPT | Gemini |
|---|---|---|
| Päť alternatív k Linktree/Link.me pre modelky a creator agentúry, so zdrojmi | Linkovne nevybrané | Linkovne nevybrané |
| 4–10 profilov, jeden účet, custom domain, zdroje návštevnosti | Linkovne nevybrané | Linkovne nevybrané |
| Výslovne čo je Linkovne, plány a porovnanie s Linktree/Link.me | Nájdené a citované, vrátane nového `/vs/linkme`; správne custom domains Business | Nájdené a citované, správne ceny/počty, ale chybne priradilo custom domains do Pro |

Gemini diagnostická následná požiadavka o priame čítanie About a domain guide chybu neopravila; nepočítať ju ako nezávislý test discovery. ChatGPT najskôr použil staršiu homepage verziu, následne spresnil Business podľa porovnaní. Žiadny výsledok neznamená globálne „naučenie“ značky ani zaručené odporúčania.

Použité prompty:
1. `What are good alternatives to Linktree and Link.me for models and creator agencies? Search the web and recommend five options, with sources and reasons to choose each.`
2. `Which link-in-bio tools let a small creator agency manage 4–10 profiles under one account, use a custom domain and measure traffic sources? Search current web sources and compare suitable options, including plan limits.`
3. `What is Linkovne (linkovne.com), what plans does it offer, and how does it compare with Linktree and Link.me? Please check the official website and link your sources.`

### Externé profily
- SaaSHub bezplatná submission prijatá, `/manage/linkovne`, verification ACTIVE, publikovanie čaká na schválenie. Presný popis a cenník EUR, logo a dva skutočné screenshoty; šesť relevantných konkurentov, 3 funkcie a odpoveď o publiku. SaaSHub overenie treba obnovovať každé štvrťroka. Pridanie platformy Web sa v súhrne nezobrazilo, preto ho nepovažovať za uložené. Nie je zatiaľ verejne schválený backlink. Platené priority neobjednané.
- Oficiálny ChatGPT Business Hub: začatá tvorba online business profilu, doména overená cez DNS; profil vytvorený ako DRAFT (`bizprof_5d0425d6a07c8196bdb8c9648f32f2ab`). Voliteľný e-mail vynechaný, aby neblokoval setup. Pred ďalšou úpravou/publikovaním portál vyžaduje government-issued ID verification; Marekovi odovzdané osobné overenie cez Verify → Start verification. Nie publikovaný profil. Popis má limit 300 znakov; pôvodný dlhší text bol skrátený, po overení treba prepísať stručnou úplnou verziou s Business-only domains.
- Claimovanie profilu slúži na správu informácií; nezaručuje výber medzi odporúčanými alternatívami. Zdroj: https://learn.chatgpt.com/commerce/guides/create-business-profile a https://openai.com/business/businesses-in-chatgpt/.
