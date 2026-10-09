import { extract, platformFromHost } from './parser.js';

const KEEP = 40;
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => {});

let queue = Promise.resolve(); // serialise writes so two streams finishing together don't clobber each other
export function saveCapture({ platform, url, body, partial, ts, page }) {
  queue = queue.then(async () => {
    let parsed;
    try { parsed = extract(platform, body); } catch (e) { parsed = { platform, error: String(e), queries: [], sources: [], counts: {} }; }
    const { captures = [] } = await chrome.storage.local.get('captures');
    const id = ts + '-' + Math.random().toString(36).slice(2, 7);
    captures.unshift({ id, ts, platform, url, page, partial: !!partial, bytes: body.length, parsed });
    for (const old of captures.splice(KEEP)) await chrome.storage.local.remove('raw:' + old.id);
    await chrome.storage.local.set({ captures, ['raw:' + id]: body });
  }).catch(() => {});
  return queue;
}

chrome.runtime.onMessage.addListener((msg) => {
  if (msg && msg.type === 'capture' && msg.body) saveCapture({ ...msg, platform: platformFromHost(msg.host) });
  if (msg && msg.type === 'import' && msg.body) saveCapture({ platform: 'auto', url: 'imported file', body: msg.body, ts: Date.now(), page: msg.name });
});
