import { toCSV } from './parser.js';

const $ = (s) => document.querySelector(s);
const el = (tag, props = {}, ...kids) => {
  const n = Object.assign(document.createElement(tag), props);
  kids.flat().forEach((k) => k != null && n.append(k));
  return n;
};
let captures = [], selected = null;

const searched = (c) => (c.parsed.queries || []).length || (c.parsed.sources || []).length;
const label = (c) => c.parsed.prompt || (c.parsed.queries || [])[0] || c.platform + ' response';
const time = (ts) => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

function download(name, text, type) {
  const a = el('a', { href: URL.createObjectURL(new Blob([text], { type })), download: name });
  a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

function renderList() {
  const shown = captures.filter((c) => !$('#onlySearch').checked || searched(c));
  if (!shown.find((c) => c.id === selected)) selected = shown[0]?.id ?? null;
  $('#list').replaceChildren(...shown.map((c) => {
    const k = c.parsed.counts || {};
    const b = el('button', { className: 'item', onclick: () => { selected = c.id; renderList(); } },
      el('span', { className: 'q', textContent: label(c) }), el('span', { className: 'sub', textContent: time(c.ts) }),
      el('span', { className: 'm', textContent: `${c.platform} · ${k.queries ?? 0} ${k.queries === 1 ? 'query' : 'queries'} · ${k.retrieved ?? 0} retrieved${k.cited != null ? ' · ' + k.cited + ' cited' : ''}` }));
    b.setAttribute('aria-current', String(c.id === selected));
    return b;
  }));
  renderDetail(shown.find((c) => c.id === selected));
}

function renderDetail(c) {
  const d = $('#detail');
  if (!c) { d.replaceChildren(el('p', { className: 'empty', textContent: captures.length ? 'No captured answer used web search yet. Untick the filter to see every response.' : 'Ask a question that needs a web search in ChatGPT, Perplexity, Gemini, Claude or Grok. Captures appear here when the answer finishes.' })); return; }
  const p = c.parsed, k = p.counts || {};
  const kids = [
    el('div', { className: 'prompt', textContent: label(c) }),
    el('div', { className: 'sub', textContent: [c.platform, p.model, new Date(c.ts).toLocaleString(), c.partial ? 'stream cut short' : null].filter(Boolean).join(' · ') }),
    el('div', { className: 'stats' },
      el('div', { className: 'stat' }, el('b', { textContent: k.queries ?? 0 }), el('span', { textContent: 'fan-out queries' })),
      el('div', { className: 'stat' }, el('b', { textContent: k.retrieved ?? 0 }), el('span', { textContent: 'sources retrieved' })),
      el('div', { className: 'stat' }, el('b', { textContent: k.cited ?? '–' }), el('span', { textContent: 'sources cited' }))),
  ];
  if (p.verified === false) kids.push(el('div', { className: 'note', textContent: `The ${c.platform} reader is a best-effort guess at the format. Check it against the raw stream. ${p.note || ''}` }));
  if (p.personalization?.used) kids.push(el('div', { className: 'note', textContent: 'This answer was personalised from past chats (' + p.personalization.past_chats.join(', ') + '), so the queries may not match what another user would get.' }));

  kids.push(el('h2', { textContent: 'What it searched for' }));
  kids.push((p.queries || []).length ? el('ol', { className: 'queries' }, p.queries.map((q) => el('li', { textContent: q }))) : el('p', { className: 'sub', textContent: 'No search queries found in this response.' }));
  if ((p.image_queries || []).length) kids.push(el('h2', { textContent: 'Image lookups' }), el('ol', { className: 'queries' }, p.image_queries.map((q) => el('li', { textContent: q }))));

  kids.push(el('h2', { textContent: 'Sources' }));
  const sorted = [...(p.sources || [])].sort((a, b) => Number(!!b.cited) - Number(!!a.cited));
  kids.push(...sorted.map((s) => el('div', { className: 'src' },
    el('div', { className: 'top' },
      s.cited === true ? el('span', { className: 'tag cited', textContent: 'Cited' }) : s.cited === false ? el('span', { className: 'tag miss', textContent: 'Retrieved only' }) : null,
      s.ref_type ? el('span', { className: 'tag plain', textContent: s.ref_type + (s.ref_index != null ? ' #' + s.ref_index : '') }) : null,
      el('a', { href: s.url, target: '_blank', rel: 'noreferrer', textContent: s.title || s.url })),
    el('div', { className: 'meta', textContent: [s.domain, s.published ? 'published ' + s.published.slice(0, 10) : 'no date', s.snippet_length ? s.snippet_length + '-character snapshot' : 'no snapshot text'].join(' · ') }),
    s.youtube ? el('div', { className: 'meta', textContent: 'YouTube: ' + Object.entries(s.youtube).filter(([key, v]) => v && key !== 'description').map(([key, v]) => key + ' ' + v).join(' · ') }) : null,
    s.snippet ? el('div', { className: 'snip', textContent: s.snippet }) : null)));
  if (!sorted.length) kids.push(el('p', { className: 'sub', textContent: 'No sources found in this response.' }));
  if ((p.links_not_retrieved || []).length) kids.push(el('h2', { textContent: 'Linked in the answer but never retrieved' }), el('ul', { className: 'plain' }, p.links_not_retrieved.map((u) => el('li', { textContent: u }))));

  const base = `${c.platform}-${new Date(c.ts).toISOString().slice(0, 19).replace(/[:T]/g, '-')}`;
  kids.push(el('div', { className: 'row' },
    el('button', { className: 'btn primary', textContent: 'Download JSON', onclick: () => download(base + '.json', JSON.stringify(p, null, 2), 'application/json') }),
    el('button', { className: 'btn', textContent: 'Download CSV', onclick: () => download(base + '.csv', toCSV(p), 'text/csv') }),
    el('button', { className: 'btn', textContent: 'Download raw stream', onclick: async () => { const key = 'raw:' + c.id; download(base + '-raw.txt', (await chrome.storage.local.get(key))[key] || '', 'text/plain'); } })));
  d.replaceChildren(...kids);
}

async function load() { captures = (await chrome.storage.local.get('captures')).captures || []; renderList(); }
chrome.storage.onChanged.addListener((ch) => { if (ch.captures) { captures = ch.captures.newValue || []; selected = captures[0]?.id ?? selected; renderList(); } });
$('#onlySearch').addEventListener('change', renderList);
$('#clear').addEventListener('click', async () => { if (confirm('Delete all captures stored in this browser?')) { await chrome.storage.local.clear(); captures = []; renderList(); } });
$('#file').addEventListener('change', async (e) => { const f = e.target.files[0]; if (f) chrome.runtime.sendMessage({ type: 'import', body: await f.text(), name: f.name }); e.target.value = ''; });
load();
