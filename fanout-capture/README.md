# Fan-out Capture

A Chrome extension that shows what an AI assistant actually searched for behind an answer:
the fan-out queries, every source it retrieved (URL, title, date, snapshot snippet), and which
of those it cited. Data stays in your browser.

This folder is the tool. What it found, and the explanation of why assistants search the way they
do, is in the [main README](../README.md) and the [docs](../docs/).

## Install

1. Open `chrome://extensions`, turn on **Developer mode**.
2. **Load unpacked** and choose the `extension/` folder.
3. Reload any open ChatGPT tab (the hook must load before the page does).
4. Click the extension icon to open the side panel, then ask something that needs a web search.

## What is verified

| Part | Status |
|---|---|
| ChatGPT parser | Tested on a real captured stream: 1 query, 10 retrieved, 4 cited |
| Capture hook, storage, side panel | Tested in Chromium against a stand-in chatgpt.com page replaying that stream |
| Live chatgpt.com capture | Used for two of the three recorded ChatGPT runs |
| Live gemini.google.com capture | Captured one answer. Links and products found, queries not found |
| Perplexity, Claude, Grok readers | Written from public write-ups, not tested on live traffic |
| YouTube snippet fields | Pattern taken from the LinkedIn post; no YouTube source in the test capture |

## How it works

- `inject.js` runs in the page before its scripts and wraps `fetch` and `XMLHttpRequest`. It copies any
  streamed response (and known endpoints) without changing it.
- `bridge.js` relays the copy to `background.js`, which parses and stores it, keeping the raw stream too.
- `parser.js` is shared by the extension and the command-line tool.
- `panel.html` is the side panel: queries, sources, cited vs. retrieved, JSON/CSV/raw export, and
  "Open saved stream" for a response copied out of DevTools.

## Command line

    node cli/parse.js saved-stream.txt            # JSON
    node cli/parse.js saved-stream.txt --csv      # one row per source

## ChatGPT stream structure (as of October 2026)

- Server-sent events. Each frame is a patch: `p` path, `o` operation, `v` value, `c` message index.
- Fan-out queries: `message.metadata.search_model_queries.queries` on the `web.run` tool message.
- Retrieved sources: `message.metadata.search_result_groups[].entries[]` with `url`, `title`,
  `snippet`, `pub_date`, `attribution`, `ref_id {turn_index, ref_type, ref_index}`.
- The source list is sent more than once. Mid-stream copies carry snippets; the final copy drops them.
- Citations: `<Cite refs={["turn…search5"]}/>` tags in the answer, resolved under
  `metadata.model_dil_v2.appData.opGenui.componentResults` (`componentName: "Cite"`).
- Join retrieved to cited on `ref_type` + `ref_index`; `turn_index` differs between copies.

## Known gaps

- If ChatGPT resumes a stream over a WebSocket, that part is not captured.
- Field names change often. The raw stream is stored so old captures can be re-parsed after a fix.
- Logged-in answers can be personalised from chat history; the panel flags this.
- The extension sees only what is sent to the page. It cannot show why the model chose its query
  words or whether a source came from a stored copy. See
  [docs/07-how-an-answer-is-made.md](../docs/07-how-an-answer-is-made.md).
