# linkovne — kam s tým ísť (stratégia)

_Posledná revízia: 2026-08-16. Podklad: prieskum konkurencie + audit toho, čo linkovne už reálne vie._

---

## TL;DR (jedna veta)

**Prestať súťažiť ako „krajší/bezpečnejší Linktree" (to je prehratá, komoditná hra proti free nástrojom) a stať sa _conversion & compliance vrstvou_ pre OnlyFans/Fanvue modelky a agentúry — teda bezpečným, meraným mostom zo sociálnej siete → Telegram/DM → paywall, s agentúrnym multi-account ovládaním.**

---

## 1. Brutálna realita trhu (z prieskumu)

- **Link-in-bio je komodita.** V „kompletnom stacku" agentúry, ktorá robí €10k/mesiac, je link-in-bio uvedený ako **free položka** (Frog.tech, Beacons, AllMyLinks). AllMyLinks je zadarmo a roky de-facto štandard pre adult; Beacons Pro je $10. Nikto neplatí veľa za samotnú link stránku.
- **Kde sú reálne peniaze:** chatting/CRM tvorí **75–85 % obratu** OF účtu. Preto tam tečie kapitál: Infloww ~$99/mesiac/model, AI chatteri (Desirely €0–89 + **8,5–20 % rev-share**), acquisition (anti-detect browsery GoLogin $24–49, residenčné proxy, virtuálne čísla).
- **Najlepší funnel je Instagram → Telegram → OnlyFans**, nie priamy skok. Telegram je medzikrok, ktorý výrazne dvíha konverziu (engagement pred platbou). Toto je pre nás kľúč.
- **Hlavná bolesť modeliek = Instagram ich banuje/shadowbanuje.** IG OCR číta watermarky aj „0nlyf@ns" triky a flaguje. Priamy OF link v bio = ban. Riešenie, za ktoré ľudia platia: cloaking, referrer hiding, custom domény, in-app escape.
- **Agentúry platia per-creator.** Majú rozpočty a spravujú 20–100 modeliek. To je náš kupujúci, nie solo modelka, ktorá porovnáva s free.

## 2. Konkurencia — kto čo robí a kde je diera

| Hráč | Čo robí | Diera / slabina |
|---|---|---|
| **Linktree** | mainstream link-in-bio | banuje adult účty, žiadny anti-ban |
| **AllMyLinks** | free, adult-friendly štandard | vyzerá ako holý zoznam liniek, žiadny funnel/atribúcia |
| **Beacons** | link-in-bio + email capture + shop, $10 | nie je stavaný na adult anti-ban, generický |
| **Linko.me / oopsie.bio / zori.bio** | cloaking, in-app escape, custom domény, referrer hiding | úzko len „safe link" — bez funnelu, atribúcie, agentúry |
| **Infloww / Supercreator / CreatorHero / Substy** | OF chatting CRM + AI chatteri | riešia chat, NIE traffic/funnel pred paywallom |
| **Dropp.fans / Exclu** | priamy predaj obsahu v DM (PPV) | mimo linku; príležitosť prepojiť s naším gate/VIP |

**Záver:** „safe link" hráči (Linko/oopsie/zori) majú anti-ban, ale nemajú funnel + atribúciu + agentúru. CRM hráči majú chat, ale nie traffic vrstvu. **Nikto nespája anti-ban + funnel (IG→Telegram→OF) + atribúciu až k revenue + agentúrne ovládanie do jednej vrstvy. To je naša medzera.**

## 3. Naša nespravodlivá výhoda (čo už máme hotové)

- **Stealth / Creator mode** — čistá stránka pre crawlery, cloak bio/blokov, neutrálne metadata → IG nedeteguje adult linky.
- **In-app escape** — Instagram aj X vyskočia do reálneho prehliadača (rieši rozbité loginy/platby v in-app webview). Toto väčšina „krajších" nástrojov nemá.
- **Link Shield** — 18+ gateway, cieľová URL nie je v HTML → nižšie riziko auto-flagovania. + **referrer hiding**.
- **VIP lock** — linky na prístupový kód.
- **Native deep links** — otvorí Telegram/IG appku priamo.
- **Multi-profil / agency základ**, AI draft builder, import (aj z našej stránky), **atribúcia kanál→link** (nová v analytike).

Tieto assety presne sadajú na dve najdrahšie bolesti trhu: **anti-ban** a **funnel konverzia**. To je wedge.

## 4. Positioning

> **„Link tool, ktorý prežije Instagram."**
> Nie krajšia vizitka — bezpečný funnel engine: dostane klik von z in-app prehliadača, skryje ho pred Instagramom, prevedie ho cez Telegram/DM a odmeria ho až po predaj.

## 5. Smer / roadmapa (podľa páky, najvyššia hore)

1. **Funnel IG → Telegram → OF (natívne).** Blok „Telegram gate" — návštevník najprv vstúpi do Telegramu (kanál/bot), tam sa zohreje, a odtiaľ na OF. Zachytávanie Telegram odberateľov + jednoduchý broadcast. Máme escape aj tg:// deep link — sme na to najbližšie zo všetkých.
2. **Atribúcia až k revenue.** Unikátne per-kampaň/per-post tracked linky (`?s=`), UTM presety na platformu, „ktorý IG post priniesol subov". Rozšíriť súčasnú kanál→link atribúciu. Toto je náš dátový moat, ktorý AllMyLinks/Beacons nemajú.
3. **Anti-ban ako produkt.** Rotácia domén (auto-swap keď jednu flagnú), viac alt domén, custom domény per model, health monitoring (cron už máme). Predávať „tvoj link nikdy nezomrie."
4. **Agency layer.** Tímové seaty, roly, per-model analytika, white-label / custom doména per model, fakturácia per-creator. Máme multi-profil — dotiahnuť do agentúrneho produktu.
5. **Lead capture (Telegram/email).** Nech modelka nie je rukojemník IG algoritmu — vlastní publikum. Beacons robí email; my môžeme Telegram (pre túto niku silnejšie).
6. **Content-locker / PPV micro-predaj** (à la Dropp.fans) — predaj jedného kúska cez linkovne link s age gate + VIP lockom, ktoré už máme. Malá **provízia → recurring revenue** nad rámec predplatného.

## 6. Prečo „to nejde ako by malo" (biznis model)

Predávame **komoditu** (link stránku) **solo modelke**, ktorá to porovnáva s **free** (AllMyLinks/Beacons). To sa nedá vyhrať cenou ani dizajnom. Fix:

- **Cieliť agentúry** (B2B2C): jedna podpísaná agentúra = 20–100 modeliek naraz. Platia per-creator (Infloww $99 ukazuje ochotu platiť).
- **Rev-share / provízia** na content-locker predajoch (Desirely berie 8,5–20 % — je to normálne v nike).
- **Anti-ban + atribúcia ako premium** — to je to, za čo zaplatia, nie za „viac tém".

## 7. Go-to-market

- **Nika ostro:** „link, čo prežije Instagram" pre OF/Fanvue modelky a ich agentúry. Nie generický creator trh.
- **Kanál = agentúry.** Predávať agentúram (jedna = desiatky modeliek). Case study: koľko subov navyše cez IG→Telegram→OF funnel + o koľko menej banov.
- **EU/SK/CZ beachhead** — lokálne agentúry, tvoj jazyk, tvoja sieť; odtiaľ škálovať.

## 8. Prvé 3 kroky (30 dní)

1. **Postaviť „Telegram gate" funnel blok + capture** — najvyššia páka, sedí na náš escape/deep-link.
2. **Per-kampaň tracked linky + „revenue" stĺpec v atribúcii** (aj keď revenue zadá modelka manuálne / cez OF export) — spraví z analytiky moat.
3. **Agency pricing + tímové seaty** — otvorí platiaceho zákazníka s rozpočtom.

---

### Zdroje (prieskum 2026)
- Exclu — Best link in bio for OnlyFans; Beacons vs (SirenCY); Stan blog
- Linko.me — bypass OnlyFans link bans / deep link
- Desirely — 21 Best OnlyFans Agency Tools 2026 (stack + pricing)
- Inrō — best automation/CRM tools; Substy — OnlyFans CRM comparison
