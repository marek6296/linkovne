/**
 * Tvrdy escape z in-app prehliadaca BEZ bliknutia profilu.
 *
 * Renderuje sa uz na SERVERI (ked ma profil funkciu zapnutu), takze gate aj
 * skript su v HTML od zaciatku. Inline skript bezi SYNCHRONNE pocas parsovania
 * — este pred vykreslenim obsahu profilu — a ak ide o in-app prehliadac:
 *   1) prida triedu `lk-escaping` na <html> → CSS okamzite skryje obsah a ukaze
 *      gate (ziadne cakanie na React hydrataciu = ziadny flash),
 *   2) skusi vyskocit do realneho prehliadaca (Android `intent://` spolahlivo;
 *      iOS `x-safari-` best-effort — inak ostane blokujuci gate + navod).
 *
 * Pokryte in-app prehliadace: Instagram (vlastna extbrowser schema), Facebook /
 * Messenger, TikTok, Snapchat, LinkedIn a X/Twitter (iOS „Twitter for iPhone",
 * Android „TwitterAndroid"). Instagram ma vlastnu vetvu; X ide cez spolocnu
 * iOS/Android vetvu (x-safari-https / intent) — tie su preň spolahlive.
 *
 * Detekcia je v skripte, nie v CSS, takze normalny prehliadac gate nikdy
 * neuvidi (ostane `display:none`) a obsah sa zobrazi bezo zmeny.
 */
const SCRIPT = `(function(){try{
var ua=navigator.userAgent;
// X (Twitter) in-app webview sa hlasi ako "Twitter for iPhone" (iOS) /
// "TwitterAndroid" (Android) — zamerne NIE holy "twitter", nech nechytime
// crawler "Twitterbot". iOS X escapuje cez x-safari-https, Android cez intent.
if(!/instagram|fban|fbav|fb_iab|musical_ly|bytedance|tiktok|snapchat|linkedinapp|twitter for iphone|twitterandroid/i.test(ua))return;
document.documentElement.classList.add('lk-escaping');
var here=location.href;
var isIOS=/iphone|ipad|ipod/i.test(ua);
var esc=null,manual=null;
if(/instagram/i.test(ua)){
  // Instagramova VLASTNA schema — appka otvori URL v EXTERNOM prehliadaci.
  // Funguje aj na najnovsom iOS (nie je to blokovany x-safari hack).
  esc='instagram://extbrowser/?url='+encodeURIComponent(here);
  manual=esc;
}else if(/android/i.test(ua)){
  var u=new URL(here);
  esc='intent://'+u.host+u.pathname+u.search+'#Intent;scheme='+u.protocol.replace(':','')+';action=android.intent.action.VIEW;S.browser_fallback_url='+encodeURIComponent(here)+';end';
  manual=esc;
}else if(isIOS){
  // TikTok / Snapchat / X (Twitter) iOS — x-safari-https (pre X spolahlive,
  // appka nas pusti do Safari); manualne tlacidlo skusi Chrome.
  esc='x-safari-'+here;
  manual='googlechromes://'+location.host+location.pathname+location.search;
}else{
  manual=here;
}
var a=document.getElementById('lk-gate-link');if(a&&manual){a.setAttribute('href',manual);}
// Auto-escape len RAZ za session, nech to necyklime (v Safari uz UA nie je
// in-app, takze sa skript aj tak nespusti).
var did=false;try{did=sessionStorage.getItem('lk_escaped')==='1';}catch(e){}
if(esc&&!did){try{sessionStorage.setItem('lk_escaped','1');}catch(e){}location.replace(esc);}
}catch(e){}})();`;

export function InAppEscape() {
  return (
    <>
      <a
        id="lk-gate-link"
        href="#"
        className="lk-gate"
        role="dialog"
        aria-label="Open in your browser"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 2147483647,
          placeItems: "center",
          padding: "1.5rem",
          background: "#faf9f6",
          color: "#191813",
          textAlign: "center",
          textDecoration: "none",
        }}
      >
        <div style={{ maxWidth: "22rem" }}>
          <p style={{ fontSize: "0.95rem", opacity: 0.7, margin: "0 0 1rem" }}>
            This page opens in your browser.
          </p>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.95rem 1.6rem",
              borderRadius: "999px",
              background: "#191813",
              color: "#faf9f6",
              fontWeight: 600,
              fontSize: "1rem",
            }}
          >
            Open in browser <span aria-hidden>↗</span>
          </span>
          <p
            style={{
              marginTop: "1.4rem",
              fontSize: "0.82rem",
              lineHeight: 1.5,
              opacity: 0.65,
            }}
          >
            If nothing happens, tap the menu (⋯ / ⋮) at the top-right and choose
            “Open in browser”.
          </p>
        </div>
      </a>
      <script dangerouslySetInnerHTML={{ __html: SCRIPT }} />
    </>
  );
}
