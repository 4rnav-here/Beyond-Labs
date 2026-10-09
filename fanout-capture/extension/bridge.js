// Isolated-world relay: page -> extension. The page cannot reach chrome.runtime directly.
window.addEventListener('message', (ev) => {
  if (ev.source !== window || !ev.data || ev.data.__fanoutCapture !== true) return;
  const { url, body, partial, host, ts } = ev.data;
  try { chrome.runtime.sendMessage({ type: 'capture', url, body, partial, host, ts, page: location.href }); } catch { /* extension reloaded */ }
});
