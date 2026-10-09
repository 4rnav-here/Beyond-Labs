// Runs in the page's own JavaScript world before any page script, so the page's
// fetch/XHR calls pass through these wrappers. It only copies responses; it never changes them.
(() => {
  if (window.__fanoutCaptureInstalled) return;
  window.__fanoutCaptureInstalled = true;
  const MAX = 12 * 1024 * 1024;
  const URL_HINT = /\/(backend-(api|anon)\/(f\/)?conversation(\?|$)|rest\/sse\/perplexity_ask|StreamGenerate|chat_conversations\/[^/]+\/completion|rest\/app-chat\/conversations)/;
  const want = (url, ctype) => URL_HINT.test(url) || /text\/event-stream/i.test(ctype || '');
  const send = (url, body, partial) => {
    if (!body) return;
    window.postMessage({ __fanoutCapture: true, url, body, partial: !!partial, host: location.hostname, ts: Date.now() }, location.origin);
  };

  const origFetch = window.fetch;
  window.fetch = async function (...args) {
    const res = await origFetch.apply(this, args);
    try {
      const url = String((args[0] && args[0].url) || args[0] || '');
      if (res.body && want(url, res.headers.get('content-type'))) {
        const reader = res.clone().body.getReader();
        const dec = new TextDecoder();
        let buf = '';
        (async () => {
          try {
            for (;;) {
              const { done, value } = await reader.read();
              if (done) break;
              if (buf.length < MAX) buf += dec.decode(value, { stream: true });
            }
            send(url, buf, false);
          } catch { send(url, buf, true); } // stream aborted: keep what arrived
        })();
      }
    } catch { /* never break the page */ }
    return res;
  };

  const open = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function (method, url, ...rest) {
    this.__fanoutUrl = String(url || '');
    this.addEventListener('loadend', () => {
      try {
        if (!want(this.__fanoutUrl, this.getResponseHeader('content-type'))) return;
        if (this.responseType === '' || this.responseType === 'text') send(this.__fanoutUrl, this.responseText.slice(0, MAX), false);
      } catch { /* ignore */ }
    });
    return open.call(this, method, url, ...rest);
  };
})();
