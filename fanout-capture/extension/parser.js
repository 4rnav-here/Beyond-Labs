// Shared parser: runs in the extension (background + panel) and in Node (cli/parse.js).
// Raw streams are always kept, so a format change only needs a parser fix and a re-parse.

export function parseSSE(text) {
  const events = [];
  for (const line of text.split(/\r?\n/)) {
    if (!line.startsWith('data:')) continue;
    const d = line.slice(5).trim();
    if (!d || d === '[DONE]') continue;
    try { events.push(JSON.parse(d)); } catch { /* partial or non-JSON frame */ }
  }
  return events;
}

export function walk(node, fn, path = '') {
  if (Array.isArray(node)) node.forEach((v, i) => walk(v, fn, path + '[' + i + ']'));
  else if (node && typeof node === 'object') {
    fn(node, path);
    for (const k of Object.keys(node)) walk(node[k], fn, path + '/' + k);
  }
}

const cleanUrl = (u) => {
  try {
    const x = new URL(u);
    [...x.searchParams.keys()].filter((k) => k.startsWith('utm_')).forEach((k) => x.searchParams.delete(k));
    return x.toString();
  } catch { return u; }
};
const host = (u) => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return ''; } };
const isoDate = (t) => (typeof t === 'number' && t > 0 ? new Date(t * 1000).toISOString() : null);
const uniq = (a) => [...new Set(a.filter(Boolean))];

/* ---------------- ChatGPT ---------------- */

// ChatGPT sends a custom patch protocol: {p: path, o: op, v: value, c: message index}.
// A frame with no "o" and a list value is a batch; a frame with no "c" reuses the last one.
function setPath(root, path, op, value) {
  const keys = path.split('/').filter((k) => k !== '');
  if (!keys.length) return value;
  let node = root;
  for (let i = 0; i < keys.length - 1; i++) {
    const k = keys[i];
    if (node[k] == null) node[k] = /^\d+$/.test(keys[i + 1]) ? [] : {};
    node = node[k];
  }
  const last = keys[keys.length - 1];
  const cur = node[last];
  if (op === 'append') {
    if (typeof cur === 'string') node[last] = cur + value;
    else if (Array.isArray(cur)) node[last] = cur.concat(value);
    else if (cur && typeof cur === 'object' && value && typeof value === 'object') Object.assign(cur, value);
    else node[last] = value;
  } else if (op === 'remove') {
    if (Array.isArray(node)) node.splice(Number(last), 1); else delete node[last];
  } else if (op === 'truncate') {
    if (typeof cur === 'string' || Array.isArray(cur)) node[last] = cur.slice(0, value);
  } else node[last] = value; // add, replace
  return root;
}

export function replayChatGPT(events) {
  const msgs = {};
  let c = 0, lastP = '', lastO = 'add';
  const apply = (p, o, v) => {
    if (o === 'patch') { (v || []).forEach((s) => apply(s.p ?? '', s.o ?? 'add', s.v)); return; }
    try { msgs[c] = setPath(msgs[c] ?? {}, p, o, v); } catch { /* tolerate unknown shapes */ }
  };
  for (const e of events) {
    if (!e || typeof e !== 'object' || (e.type && !('v' in e))) continue;
    if (typeof e.c === 'number') c = e.c;
    let p = e.p, o = e.o;
    if (p === undefined && o === undefined) {
      if (Array.isArray(e.v)) { p = ''; o = 'patch'; }
      else if (e.v && typeof e.v === 'object' && e.v.message) { p = ''; o = 'add'; }
      else { p = lastP; o = lastO; }
    } else { p = p ?? ''; o = o ?? (Array.isArray(e.v) ? 'patch' : 'add'); }
    if (o !== 'patch') { lastP = p; lastO = o; }
    apply(p, o, e.v);
  }
  return Object.values(msgs).map((m) => m.message).filter(Boolean);
}

const refKey = (r) => (r && r.ref_type != null ? r.ref_type + ':' + r.ref_index : null);
const refKeyFromId = (id) => {
  const m = /^turn\d+([a-z_]+?)(\d+)$/.exec(id || '');
  return m ? m[1] + ':' + Number(m[2]) : null;
};

// The post this task is based on reports YouTube snippets shaped like:
// "# Title / By: Channel 1650000 followers / Verified / Published: 2026-06-13 56729 views 1400 likes / ## Description ..."
export function parseYouTubeSnippet(s) {
  if (!s) return null;
  const g = (re) => { const m = re.exec(s); return m ? m[1].trim() : null; };
  const out = {
    channel: g(/By:\s*(.+?)\s+[\d,.]+\s*(?:followers|subscribers)/i),
    followers: g(/([\d,.]+)\s*(?:followers|subscribers)/i),
    verified: /\bverified\b/i.test(s),
    published: g(/Published:\s*([0-9-]{8,10})/i),
    views: g(/([\d,.]+)\s*views/i),
    likes: g(/([\d,.]+)\s*likes/i),
    description: g(/##\s*Description\s*([\s\S]*)$/i),
  };
  return Object.values(out).some((v) => v && v !== false) ? out : null;
}

export function extractChatGPT(text) {
  const events = parseSSE(text);
  const messages = replayChatGPT(events);
  const everything = [events, messages];

  // 1. fan-out queries
  const queries = [];
  walk(everything, (n) => {
    for (const k of ['search_model_queries', 'search_queries']) {
      const v = n[k];
      const list = Array.isArray(v) ? v : v && Array.isArray(v.queries) ? v.queries : null;
      if (list) list.forEach((q) => queries.push(typeof q === 'string' ? q : q && (q.q || q.query)));
    }
  });

  // 2. retrieved sources. The list is sent several times; only some copies carry snippets, so merge.
  const sources = new Map();
  const upsert = (key, patch) => {
    const cur = sources.get(key) || { key, cited: false };
    for (const [k, v] of Object.entries(patch)) {
      if (v == null || v === '') continue;
      if (k === 'snippet' && (cur.snippet || '').length >= v.length) continue;
      cur[k] = v;
    }
    sources.set(key, cur);
  };
  walk(everything, (n) => {
    if (!Array.isArray(n.search_result_groups)) return;
    for (const grp of n.search_result_groups) for (const e of grp.entries || []) {
      if (!e || !e.url) continue;
      upsert(refKey(e.ref_id) || refKeyFromId(e.ref_id) || cleanUrl(e.url), {
        url: cleanUrl(e.url), title: e.title, domain: host(e.url), ref_type: e.ref_id && e.ref_id.ref_type,
        ref_index: e.ref_id && e.ref_id.ref_index, snippet: e.snippet, published: isoDate(e.pub_date),
        attribution: e.attribution,
      });
    }
  });

  // 3. cited = any source reference that appears in the answer or in a resolved Cite component
  const cited = new Set();
  const links = [];
  walk(everything, (n) => {
    if (n.componentName === 'Cite' && n.state) for (const it of n.state.items || []) {
      const keys = (it.refs || []).map(refKey).concat(refKeyFromId(it.ref_id)).filter(Boolean);
      keys.forEach((k) => {
        cited.add(k);
        upsert(k, { url: cleanUrl(it.url), title: it.title, domain: host(it.url), published: isoDate(it.pub_timestamp), attribution: it.source_label });
      });
    }
    if (n.componentName === 'Link' && n.state && n.state.url) links.push({ url: n.state.url, title: n.state.title });
  });
  const answerMsgs = messages.filter((m) => m.author && m.author.role === 'assistant' && m.content && Array.isArray(m.content.parts));
  const answer = answerMsgs.map((m) => m.content.parts.filter((p) => typeof p === 'string').join('')).sort((a, b) => b.length - a.length)[0] || '';
  for (const m of answer.matchAll(/turn\d+[a-z_]+?\d+/g)) { const k = refKeyFromId(m[0]); if (k) cited.add(k); }
  for (const s of sources.values()) {
    s.cited = cited.has(s.key);
    s.snippet_length = (s.snippet || '').length;
    if (/youtube\.com|youtu\.be/.test(s.domain || '')) s.youtube = parseYouTubeSnippet(s.snippet);
  }

  // 4. context around the search
  const prompt = (events.find((e) => e.type === 'input_message')?.input_message?.content?.parts || []).join(' ') ||
    (messages.find((m) => m.author?.role === 'user')?.content?.parts || []).join(' ');
  const personal = [];
  walk(everything, (n) => {
    if (Array.isArray(n.conversation_context_citation_metadata))
      n.conversation_context_citation_metadata.forEach((c) => c.citation && personal.push(c.citation.title));
  });
  const toolCalls = messages
    .filter((m) => m.author?.role === 'assistant' && m.recipient && m.recipient !== 'all' && m.content?.text)
    .map((m) => ({ recipient: m.recipient, input: m.content.text }));
  const meta = events.find((e) => e.type === 'server_ste_metadata')?.metadata || {};
  const list = [...sources.values()].sort((a, b) => (a.ref_index ?? 99) - (b.ref_index ?? 99));
  const retrievedUrls = new Set(list.map((s) => s.url));

  return {
    platform: 'chatgpt',
    prompt,
    model: meta.model_slug || messages.find((m) => m.metadata?.model_slug)?.metadata.model_slug || null,
    conversation_id: events.find((e) => e.conversation_id)?.conversation_id || null,
    queries: uniq(queries),
    image_queries: uniq([...answer.matchAll(/<AsyncImage query="([^"]+)"/g)].map((m) => m[1])),
    sources: list,
    counts: { queries: uniq(queries).length, retrieved: list.length, cited: list.filter((s) => s.cited).length },
    links_not_retrieved: uniq(links.map((l) => l.url)).filter((u) => !retrievedUrls.has(cleanUrl(u))),
    personalization: { used: personal.length > 0, past_chats: uniq(personal), tool_calls: toolCalls },
    reasoning_titles: uniq(messages.flatMap((m) => m.metadata?.reasoning_titles || [])),
    turn_use_case: meta.turn_use_case || null,
    answer,
  };
}

/* ---------------- Other assistants (best effort, not yet verified on live traffic) ---------------- */

function genericFromTrees(platform, trees, extraQueries = []) {
  const sources = new Map();
  const queries = [...extraQueries];
  walk(trees, (n, path) => {
    const url = n.url || n.link || n.uri;
    const title = n.title || n.name;
    if (typeof url === 'string' && /^https?:/.test(url) && typeof title === 'string') {
      const key = cleanUrl(url);
      const cur = sources.get(key) || { key, url: key, domain: host(url), title, cited: null };
      const snip = n.snippet || n.preview || n.description || n.text || n.cited_text;
      if (typeof snip === 'string' && snip.length > (cur.snippet || '').length) cur.snippet = snip;
      const d = n.timestamp || n.published_date || n.page_age || n.date || n.pub_date;
      if (d && !cur.published) cur.published = typeof d === 'number' ? isoDate(d > 1e12 ? d / 1000 : d) : String(d);
      cur.found_at = cur.found_at || path.replace(/\[\d+\]/g, '[]').slice(-80);
      sources.set(key, cur);
    }
    for (const [k, v] of Object.entries(n)) {
      if (!/quer(y|ies)/i.test(k) || /query_str|params|source/i.test(k)) continue;
      if (typeof v === 'string' && v.length < 300) queries.push(v);
      else if (Array.isArray(v)) v.forEach((q) => {
        if (typeof q === 'string') queries.push(q);
        else if (q && typeof (q.query || q.q) === 'string') queries.push(q.query || q.q);
      });
    }
  });
  const list = [...sources.values()].map((s) => ({ ...s, snippet_length: (s.snippet || '').length }));
  return { platform, prompt: null, queries: uniq(queries), sources: list,
    counts: { queries: uniq(queries).length, retrieved: list.length, cited: null }, verified: false };
}

export function extractClaude(text) {
  // Anthropic-style typed blocks: a search tool call streams its input as partial JSON.
  const events = parseSSE(text);
  const blocks = {}; const q = [];
  for (const e of events) {
    if (e.type === 'content_block_start') blocks[e.index] = { name: e.content_block?.name, json: '' };
    if (e.type === 'content_block_delta' && e.delta?.type === 'input_json_delta' && blocks[e.index]) blocks[e.index].json += e.delta.partial_json || '';
    if (e.type === 'content_block_stop' && blocks[e.index]?.json) {
      try { const inp = JSON.parse(blocks[e.index].json); if (inp.query) q.push(inp.query); (inp.queries || []).forEach((x) => q.push(x)); } catch {}
    }
  }
  return genericFromTrees('claude', events, q);
}

export function extractGemini(text) {
  // )]}' guard, then length-prefixed chunks; the "wrb.fr" chunk holds a JSON string to decode again.
  const payloads = [];
  for (const line of text.replace(/^\)\]\}'\s*/, '').split('\n')) {
    if (!line.trim().startsWith('[')) continue;
    try { for (const ch of JSON.parse(line)) if (Array.isArray(ch) && ch[0] === 'wrb.fr' && ch[2]) payloads.push(JSON.parse(ch[2])); } catch {}
  }
  const urls = new Set();
  const visit = (n) => { if (typeof n === 'string') { if (/^https?:\/\//.test(n) && !/gstatic|googleusercontent|ggpht|encrypted-tbn|fonts\.|google\.com\/(imgres|url)/.test(n)) urls.add(n.split('#:~:text=')[0]); } else if (Array.isArray(n)) n.forEach(visit); };
  visit(payloads);
  const list = [...urls].map((u) => ({ key: u, url: u, domain: host(u), title: null, cited: null, snippet_length: 0 }));
  return { platform: 'gemini', prompt: null, queries: [], sources: list,
    counts: { queries: 0, retrieved: list.length, cited: null }, verified: false,
    note: 'Gemini payload is positional arrays with no key names; sub-queries are not identifiable from structure alone.' };
}

export function extractLines(platform, text) {
  // Perplexity (SSE) and Grok (one JSON object per line) both reduce to "a list of JSON trees".
  let trees = parseSSE(text);
  if (!trees.length) trees = text.split('\n').map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
  return genericFromTrees(platform, trees);
}

export function platformFromHost(h = '') {
  if (/chatgpt\.com|chat\.openai\.com/.test(h)) return 'chatgpt';
  if (/perplexity\.ai/.test(h)) return 'perplexity';
  if (/gemini\.google\.com/.test(h)) return 'gemini';
  if (/claude\.ai/.test(h)) return 'claude';
  if (/grok\.com|x\.ai/.test(h)) return 'grok';
  return 'unknown';
}

export function extract(platform, text) {
  if (platform === 'auto') platform = /"search_result_groups"|"p":"\/message\//.test(text) || /"type":"input_message"/.test(text) ? 'chatgpt'
    : text.startsWith(")]}'") ? 'gemini' : /content_block_start/.test(text) ? 'claude' : 'perplexity';
  if (platform === 'chatgpt') return { ...extractChatGPT(text), verified: true };
  if (platform === 'claude') return extractClaude(text);
  if (platform === 'gemini') return extractGemini(text);
  return extractLines(platform, text);
}

export function toCSV(result) {
  const cols = ['platform', 'cited', 'ref_type', 'ref_index', 'domain', 'title', 'url', 'published', 'snippet_length', 'snippet'];
  const esc = (v) => '"' + String(v ?? '').replace(/"/g, '""').replace(/\r?\n/g, ' ') + '"';
  return [cols.join(',')].concat(result.sources.map((s) => cols.map((c) => esc(c === 'platform' ? result.platform : s[c])).join(','))).join('\n');
}
