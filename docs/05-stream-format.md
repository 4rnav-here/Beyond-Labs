# 5. Stream format reference

This page is the technical detail: what the response looks like and where each piece of data sits. It is mostly about ChatGPT, because that is the one I took apart fully.

Everything here is from my capture of 9 October 2026. The format has changed several times this year, so treat field names as "correct on that day".

## ChatGPT

### Which request

In the Network tab, the request is named `conversation`. Its path ends in `/backend-api/f/conversation` when logged in. Other people report `/backend-anon/f/conversation` when logged out. I did not test logged out.

The response is an event stream. It arrives in pieces while the answer is being written. My run 1 response was 183,642 bytes and held 79 data events.

### Kinds of event

| Event | Count in run 1 | What it is |
|---|---|---|
| Patch events (no `type` field) | 50 | The messages themselves, built up piece by piece |
| `url_moderation` | 19 | A safety check for each URL that will be shown |
| `message_marker` | 4 | Timing marks: first reasoning token, first visible token, last token |
| `input_message` | 1 | My prompt, echoed back |
| `resume_conversation_token` | 1 | A session token for resuming the stream. Do not share this |
| `streaming_parent_patch` | 1 | Re-links messages when the answer is merged |
| `server_ste_metadata` | 1 | Summary at the end: model, plan, turn type, timings |
| `message_stream_complete` | 1 | End marker |
| `conversation_detail_metadata` | 1 | Limits and default model |

### The patch format

ChatGPT does not send whole messages. It sends small edits. Each edit has up to four parts:

| Key | Meaning |
|---|---|
| `p` | Path: where in the message to make the change, for example `/message/content/parts/0` |
| `o` | Operation: `add`, `append`, `replace`, `remove`, `truncate`, or `patch` |
| `v` | Value |
| `c` | Which message this edit belongs to (0, 1, 2 ...) |

Three rules took me a while to work out:

- An event with a **list** as its value and no operation is a batch. Apply each item in order.
- An event with **no `c`** belongs to the same message as the event before it.
- `append` means different things by type: join text to text, add items to a list, or merge keys into an object.

To read the stream properly you replay every edit in order and rebuild each message. The parser does this in about 40 lines.

### The messages in one answer

Run 1 produced ten messages. In order:

| # | Author | What it is |
|---|---|---|
| 0 | system | Hidden and empty |
| 1 | system | Hidden and empty |
| 2 | assistant | A tool call to a personal-context tool, asking about my preferences. Shown to me as "Personalizing" |
| 3 | assistant | Reasoning (empty) |
| 4 | assistant | Reasoning summary: "Personalized chair recommendations to match your needs and budget" |
| 5 | tool `web.run` | The search. **This message holds the fan-out queries** |
| 6 | assistant | First part of the answer. **Carries the source list with snapshots** |
| 7 | assistant | The merged, final answer |
| 8 | assistant | A short reasoning recap |
| 9 | assistant | Second part of the answer. **Carries the source list with snapshots again** |

The answer is streamed as two fragments (6 and 9) and also as one merged message (7). If you simply join all the text you get the answer twice. That was my first bug.

### Where the fan-out queries are

On the `web.run` tool message:

```json
"metadata": {
  "search_model_queries": {
    "type": "search_model_queries",
    "queries": [
      "best ergonomic office chairs under ₹10000 India 2026 reviews pricing Featherlite Green Soul Sleep Company"
    ]
  }
}
```

Other researchers say this field was renamed `search_queries` in August. I still saw the old name in October. The parser accepts both.

### Where the retrieved sources are

Under `metadata.search_result_groups`. Sources are grouped by site:

```json
{
  "type": "search_result_group",
  "domain": "pakkapick.in",
  "entries": [
    {
      "type": "search_result",
      "url": "https://pakkapick.in/office/best-office-chair-under-10000?utm_source=chatgpt.com",
      "title": "Best Office Chair Under ₹10000 in India 2026",
      "snippet": "Office & Study  Office Chairs  Home/Office & Study/Office Chairs ...",
      "ref_id": { "turn_index": 0, "ref_type": "search", "ref_index": 5 },
      "pub_date": null,
      "attribution": "pakkapick.in"
    }
  ]
}
```

| Field | Meaning |
|---|---|
| `url` | The page. ChatGPT adds `?utm_source=chatgpt.com`, which the parser strips |
| `title` | Page title |
| `snippet` | The text snapshot, about 200 characters |
| `pub_date` | Publish date as a Unix timestamp, or empty |
| `attribution` | Site name |
| `ref_id.ref_type` | Channel: `search` or `reddit` in my captures |
| `ref_id.ref_index` | Position in the result list, starting at 0 |
| `ref_id.turn_index` | See the warning below |

Dates for web results are whole days (midnight UTC). Reddit dates are exact to the second.

### The source list arrives three times

This is the most important thing on this page.

| Copy | Attached to | Has snapshots? | Has Reddit? | `turn_index` |
|---|---|---|---|---|
| 1 | Answer fragment (message 6) | Yes | No | 0 |
| 2 | Answer fragment (message 9) | Yes | No | 0 |
| 3 | Final merged answer (message 7) | **No** | Yes | 638361 |

So:

- If you keep only the last copy, you lose every snapshot.
- If you keep only the first copy, you lose the Reddit sources.
- The parser merges all copies and keeps the longest snapshot it has seen for each source.

### Where the citations are

The answer text is not plain text. It is written in a UI markup with tags, and citations are one of those tags:

```
A sensible choice for long coding and desk-work sessions. <Cite refs={["turn638361search2"]}/>
```

A reference like `turn638361search2` reads as: turn 638361, channel `search`, position 2.

The details behind each tag are sent separately, under `metadata.model_dil_v2.appData.opGenui.componentResults`. Each entry there has a `componentName`. In run 1 there were four kinds:

| Component | What it is |
|---|---|
| `Cite` | A citation. Lists the sources it points to, with URL, title and site label |
| `Link` | A plain link written by the model. These are the "linked but never retrieved" pages |
| `Entity` | A product name that can be clicked |
| `AsyncImage` | An image lookup, with the query the model wrote for it |

Older write-ups describe a different citation format, with invisible marker characters in the text and a list called `content_references`. My capture did not use that for citations. The parser handles both.

### Matching a citation to a source

Match on **channel and position** (`ref_type` and `ref_index`).

Do not match on `turn_index`. It is 0 in the first two copies of the source list and 638361 in the third copy and in the citation tags. Matching on it would make it look like nothing was cited.

### Personalisation

When the model uses past chats, the answer messages carry:

```json
"personal_sources": ["convo_search"],
"conversation_context_citation_metadata": [
  {
    "retrieval_origin": "pca",
    "citation": {
      "title": "(title of an older chat)",
      "url": "(link to that chat)",
      "snippet": "(the question I asked in it)",
      "attribution": "Past chat",
      "category": "memory",
      "type": "grouped_webpages"
    }
  }
]
```

I do not know what `pca` stands for and will not guess.

### The summary event

The `server_ste_metadata` event at the end is a handy summary. Fields I found useful:

| Field | Value in run 1 |
|---|---|
| `model_slug` | The model that answered |
| `requested_model_experience` | `instant` |
| `plan_type` | `go` |
| `turn_use_case` | `personal context` (runs 2 and 3: `shopping`) |
| `tool_name`, `tool_invoked` | The first tool that ran |
| `server_ttfvt_ms` | About 12,000: twelve seconds to the first visible word |

### Things other researchers reported that I did not see

I searched my raw capture for these and found none of them:

- `result_source` (which back end served a result). Reported removed in July, and it is gone.
- `supporting_websites` (runner-up sources).
- Per-result scores, a `should_fetch` flag, per-chunk scores, `og_data`, `meta_tags`. One researcher described these. They may appear only for some accounts, or only in "thinking" mode.

## Gemini

- Request name: `StreamGenerate`.
- First line is `)]}'` and must be dropped.
- Then chunks: a length on one line, a JSON array on the next.
- The chunk tagged `wrb.fr` holds the payload as a JSON **string**. Decode it a second time.
- The payload is arrays inside arrays. No field names.
- A `google.com/search` link with `ibp=oshop` or a `prds=` value is a Google Shopping product, not a search query. See [04-gemini-claude-and-others.md](04-gemini-claude-and-others.md).

## Claude

From Anthropic's public API documentation, not from my own capture:

- An event stream of typed blocks.
- `content_block_start` opens a block. A web search opens one named `web_search`.
- `content_block_delta` events carry the query in small pieces of JSON text. Join them, then parse.
- `content_block_stop` closes the block.

## Perplexity

From other people's parsers, not from my own capture:

- Request path contains `/rest/sse/perplexity_ask`.
- Event stream. Each event has a list of `blocks`.
- Sources are under `web_result_block.web_results`.
- The last event is flagged `final_sse_message`.
