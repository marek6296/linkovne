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
 * Detekcia je v skripte, nie v CSS, takze normalny prehliadac gate nikdy
 * neuvidi (ostane `display:none`) a obsah sa zobrazi bezo zmeny.
 */
const SCRIPT = `(function(){try{
var ua=navigator.userAgent;
if(!/instagram|fban|fbav|fb_iab|musical_ly|bytedance|tiktok|snapchat|linkedinapp/i.test(ua))return;
document.documentElement.classList.add('lk-escaping');
var here=location.href,url=null;
if(/iphone|ipad|ipod/i.test(ua)){url='x-safari-'+here;}
else if(/android/i.test(ua)){var u=new URL(here);url='intent://'+u.host+u.pathname+u.search+'#Intent;scheme='+u.protocol.replace(':','')+';action=android.intent.action.VIEW;S.browser_fallback_url='+encodeURIComponent(here)+';end';}
var a=document.getElementById('lk-gate-link');if(a&&url){a.setAttribute('href',url);}
if(url){location.href=url;}
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
