/** No Google resource is requested until a same-origin, consented parent starts it. */
export const ADS_FRAME_HTML = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Linkovne optional measurement</title></head><body><script>
(function () {
  var origin = 'https://linkovne.com';
  var started = false;
  var tag = 'AW-18577399281';
  function validId(id) { return typeof id === 'string' && /^([a-f0-9]{64}|[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12})$/i.test(id); }
  window.addEventListener('message', function (event) {
    if (event.source !== parent || event.origin !== origin || parent === window) return;
    var data = event.data || {};
    if (data.type === 'linkovne:ads-start' && !started) {
      var page;
      try { page = new URL(data.location); } catch (_) { return; }
      if (page.origin !== origin || !/^(\\/|\\/(about|pricing|features|guides|vs)(\\/[a-z0-9-]+)?|\\/(register|login|onboarding|privacy|terms))$/.test(page.pathname)) return;
      // Parent only passes the sanitized page URL; recheck at the document boundary.
      Array.from(page.searchParams.keys()).forEach(function (key) { if (!['gclid','wbraid','gbraid'].includes(key)) page.searchParams.delete(key); });
      page.hash = '';
      started = true;
      window.dataLayer = [];
      window.gtag = function () { dataLayer.push(arguments); };
      gtag('consent', 'default', {ad_storage:'denied', analytics_storage:'denied', ad_user_data:'denied', ad_personalization:'denied'});
      gtag('set', 'ads_data_redaction', true);
      gtag('consent', 'update', {ad_storage:'granted', analytics_storage:'denied', ad_user_data:'granted', ad_personalization:'denied'});
      gtag('js', new Date());
      gtag('config', tag, {send_page_view:false, allow_google_signals:false, allow_ad_personalization_signals:false, cookie_domain:'linkovne.com', page_location:page.href, page_referrer:'', page_title:'Linkovne'});
      var script = document.createElement('script');
      script.async = true; script.src = 'https://www.googletagmanager.com/gtag/js?id=' + tag;
      script.onload = function () { parent.postMessage({type:'linkovne:ads-ready'}, origin); };
      document.head.appendChild(script);
    }
    if (data.type === 'linkovne:ads-convert' && started && validId(data.id)) {
      var id = data.id;
      gtag('event', 'conversion', {send_to:tag+'/eY1nCMyWlLkdEPG7sppF', transaction_id:id, page_location:origin+'/onboarding', page_referrer:'', page_title:'Linkovne', event_callback:function () { parent.postMessage({type:'linkovne:ads-sent', id:id}, origin); }});
    }
  });
})();
</script></body></html>`;
