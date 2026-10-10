# 6. The extension

A Chrome extension that captures the response while an assistant is answering, pulls out the queries and sources, and shows them in a side panel.

## Install

1. Open `chrome://extensions` and turn on Developer mode.
2. Click "Load unpacked" and pick the `extension/` folder. That is the folder with `manifest.json` in it, not the repo root.
3. Reload any open ChatGPT or Gemini tab. The hook has to load before the page does.
4. Click the extension icon. A side panel opens.
5. Ask something that needs a web search. The capture appears when the answer finishes.

## What the side panel shows

| ChatGPT capture | Gemini capture |
|---|---|
| ![Side panel showing a ChatGPT capture](img/panel-chatgpt.png) | ![Side panel showing a Gemini capture](img/panel-gemini.png) |

- The prompt, with three counts: fan-out queries, sources retrieved, sources cited
- A warning when the answer was personalised from past chats
- The search queries
- Image lookups, if any
- Every source, cited ones first. Each has a "Cited" or "Retrieved only" tag, its channel and position, site, publish date and the snapshot text
- Products, when the assistant used product results
- Links that are in the answer but were never retrieved
- Buttons to download the result as JSON or CSV, or to download the raw response

Other controls:

- **Only answers that searched** hides responses with no queries and no sources.
- **Open saved stream** parses a response you copied out of the Network tab yourself.
- **Re-parse all** runs the current parser again over every stored raw response. This is for after a parser fix.
- **Clear all** deletes everything the extension has stored.

## How it works

```
page (ChatGPT, Gemini ...)
   │   inject.js wraps fetch and XMLHttpRequest, copies streamed responses
   ▼
bridge.js            passes the copy from the page to the extension
   ▼
background.js        runs the parser, stores the result and the raw text
   ▼
panel.html / .js     shows it
```

| File | Job |
|---|---|
| `manifest.json` | Says which sites the extension runs on and what it may do |
| `inject.js` | Runs inside the page, before the page's own scripts. It wraps the two ways a page makes network requests. When a response is a stream, or its address matches a known pattern, it reads a copy. It never changes what the page receives |
| `bridge.js` | The page cannot talk to the extension directly. This small script relays the message |
| `background.js` | Picks the reader for the site, parses, and stores |
| `parser.js` | All the parsing. One reader per assistant. Also used by the command-line script |
| `panel.html`, `panel.js`, `panel.css` | The side panel |

Sites covered: chatgpt.com, gemini.google.com, claude.ai, www.perplexity.ai, grok.com.

## Privacy

- Nothing leaves the browser. There is no server.
- Captures are stored in the extension's own local storage. Only the last 40 are kept.
- The raw response is stored too. For ChatGPT this includes a session token on the first line and can include titles of your older chats. Remove those before sharing a raw file.

## Command line

The same parser runs without the browser:

    node cli/parse.js saved-stream.txt                # JSON
    node cli/parse.js saved-stream.txt --csv          # one row per source
    node cli/parse.js saved-stream.txt gemini         # force a reader
    node cli/parse.js saved-stream.txt --full         # include the answer text

It needs Node 18 or newer and no packages.

## Output shape

```json
{
  "platform": "chatgpt",
  "prompt": "Find the best chairs under 10k",
  "queries": ["..."],
  "image_queries": ["..."],
  "sources": [
    {
      "url": "...", "title": "...", "domain": "...",
      "ref_type": "search", "ref_index": 1,
      "published": "2026-08-20T00:00:00.000Z",
      "snippet": "...", "snippet_length": 204,
      "cited": true
    }
  ],
  "products": [],
  "counts": { "queries": 1, "retrieved": 10, "cited": 4, "products": 0 },
  "links_not_retrieved": ["..."],
  "personalization": { "used": true, "past_chats": ["..."], "tool_calls": ["..."] },
  "turn_use_case": "personal context"
}
```

Every assistant's reader returns this same shape, so anything built on top does not need to know which assistant the data came from.

## Design choices

**Keep it simple.** No build step, no libraries, plain JavaScript. The whole extension is about 550 lines.

**An extension, not a scraper.** It reads my own session in my own browser. There is no bot detection to get past, and it works on any assistant I can log in to.

**Hook before the page loads.** Other people found that a hook added after the page had started could miss the stream. Mine is injected at the very start of page load.

**Always keep the raw response.** ChatGPT's format changed several times this year. With the raw text stored, fixing the parser fixes old captures too. The "Re-parse all" button exists for this.

**Search by field name, not by position.** For ChatGPT, the parser walks the whole response looking for known field names wherever they are. Fields get moved between releases, and this survives that.

**Merge every copy of the source list.** ChatGPT sends it three times with different contents. See [05-stream-format.md](05-stream-format.md).

**Label what is unverified.** The Gemini, Claude, Perplexity and Grok readers return `"verified": false`, and the panel shows a warning on those captures.

## How I tested it

| Test | Result |
|---|---|
| Parser on the raw response I copied by hand (run 1) | 1 query, 10 retrieved, 4 cited. Matches what I counted by reading the file |
| Extension in a test browser, replaying that response through a stand-in page | Capture, storage and panel all worked |
| Extension live on chatgpt.com | Runs 2 and 3 were captured this way |
| Extension live on gemini.google.com | Captured. Links found, no queries |
| Gemini product split (0.2.0), on a response rebuilt from the links in my real capture | 6 web sources and 10 products, as expected |
| "Re-parse all", in the test browser | Restored wiped results from the stored raw responses |
| Claude, Perplexity, Grok | Not run |

## Versions

**0.2.0**

- Gemini: Google Shopping links are now listed as products, not mixed in with web sources.
- ChatGPT: internal "search this product" links are no longer listed under "linked but never retrieved".
- ChatGPT: added a reader for product results. Written from the answer template, not tested on a real product record.
- Added "Re-parse all".
- Sources now show the site label used in the citation when it differs from the domain.

**0.1.0**

- First version. Captured runs 2 and 3 and the Gemini run.

## Known gaps

- If ChatGPT resumes a response over a WebSocket, that part is not captured. The response metadata has a flag suggesting this can happen.
- ChatGPT product records are not confirmed.
- The YouTube reader (channel, followers, views, likes, description) is written from the format in the LinkedIn post and is not tested, because none of my prompts returned a YouTube source.
- Gemini queries are not extracted.
- Readers for Claude, Perplexity and Grok are first guesses.
