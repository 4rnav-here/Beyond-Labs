# 2. Research notes

This is what I learned before and while building. It has three kinds of source:

- **Official documentation**, which is reliable but says little about the ChatGPT app itself.
- **Public write-ups by SEO researchers** who inspected ChatGPT's network traffic. Useful, often right, not official, and sometimes already out of date.
- **My own captures.** At the end of most sections I note whether they agree.

Full links are in [09-references.md](09-references.md).

This page is about the search side: the tool, the queries, the back ends, the format. The wider picture, how the model learned what it knows, what it remembers about a user and what is cached where, is in [07-how-an-answer-is-made.md](07-how-an-answer-is-made.md).

## Contents

- [What the official sources say](#what-the-official-sources-say)
- [Background: what fan-out means technically](#background-what-fan-out-means-technically)
- [The search pipeline](#the-search-pipeline)
- [The search tool](#the-search-tool-webrun)
- [How queries get rewritten](#how-queries-get-rewritten)
- [Where results come from](#where-results-come-from)
- [The snapshot and its two sizes](#the-snapshot-and-its-two-sizes)
- [Which cache are we talking about](#which-cache-are-we-talking-about)
- [YouTube](#youtube)
- [How citations are encoded](#how-citations-are-encoded)
- [Retrieved vs cited: the big studies](#retrieved-vs-cited-the-big-studies)
- [Hidden instructions and classification](#hidden-instructions-and-classification)
- [The format keeps changing](#the-format-keeps-changing)
- [How people capture this data](#how-people-capture-this-data)
- [Other assistants, from reading](#other-assistants-from-reading)
- [Existing tools I looked at](#existing-tools-i-looked-at)

## What the official sources say

**In the app.** OpenAI's help pages describe the Sources panel and inline citations. They show the cited pages and some extra links. They do not show the search queries or every page that was retrieved.

**Asking the model to explain itself does not work.** You can ask ChatGPT to list everything it looked at after it answers. But it has no record of its own browsing to read from. It can produce a believable explanation that is not a true log. This is why the network response matters: it is a record, not a recollection.

**In the API.** OpenAI's developer API has a web search tool, and its response can include a proper trace:

| Item | What it tells you |
|---|---|
| `web_search_call` | A search happened |
| `action.queries` | The queries sent, when returned |
| `action.sources` | All URLs consulted, which can be more than were cited |
| `open_page`, `find_in_page` | The model opened a page or searched inside one |
| `url_citation` | Which part of the answer each citation supports |

So the idea that retrieved and cited are different sets is not a leak or a secret. OpenAI documents it for the API. What is undocumented is the same data in the consumer app, and that is what this project captures.

The API is not the app, though. It has no chat history, and it may not use the same search back ends.

## Background: what fan-out means technically

"Fan-out" is one name for several different techniques. It helped me to separate them.

| Technique | What it does | Example |
|---|---|---|
| Query rewriting / expansion | Rephrases the prompt as a better search query, adding terms a page would contain | "chairs under 10k" becomes "best ergonomic office chairs under ₹10000 India 2026 reviews" |
| Query decomposition | Splits one question into several sub-questions | One query for products, one for prices, one for reviews |
| Multi-query retrieval with fusion | Runs several versions of the query and merges the ranked results. A common merge method is Reciprocal Rank Fusion | Three phrasings, one combined list |
| Metasearch | Sends the same query to several search engines | Google, Bing and an in-house index |
| Iterative retrieval | Uses the first results to decide what to search next | Finds a product name, then searches for that product |

Metasearch widens the **back ends**. Fan-out widens the **queries**. They are different things and a system can do both.

**My captures:** in the three recorded runs I saw the first kind only: one rewritten, expanded query per answer. In a later attempt I saw two queries for one prompt, a broad one and a narrower one about official prices and specifications. That is decomposition, possibly with some iterative retrieval, and it is described in [07-how-an-answer-is-made.md](07-how-an-answer-is-made.md#why-one-prompt-can-become-two-queries). The public reports of many queries per answer are mostly from "thinking" mode.

## The search pipeline

Putting the sources together, a ChatGPT web search goes roughly like this:

1. **Decide whether to search.** Simple questions are answered from what the model learned in training, with no search.
2. **Personalise (logged-in only).** The model can look at saved memory and past chats before it searches.
3. **Rewrite the prompt into search queries.** This is the fan-out. The model does not search with your words.
4. **Retrieve.** The queries go to several search back ends. Each result comes back with a title, URL, date and a text snippet.
5. **Optionally open pages.** The model can open a specific result to read more of it.
6. **Write the answer and attach citations** to individual claims.

## The search tool: `web.run`

Source: Search Engine Land's write-up of a Resoneo study.

- The model calls an internal tool named `web.run`.
- Older models sent compact text commands. Newer ones send structured JSON.
- The tool has about 12 operations. The named ones include `search_query`, `open`, `find`, `click`, `screenshot` and `product_query`.
- `search_query` takes a list of queries. `open` takes a reference ID such as `turn0search0`, pointing at a result from an earlier search.
- "Thinking" models chain 5 to 10 or more search rounds and often use `site:` filters. "Instant" models usually run 2 or 3 rounds.
- Pages that get opened are fetched by the `ChatGPT-User` crawler.

**My captures:** the tool message is authored by `web.run`, which matches. I was on the instant model and saw one search query per answer, not 2 or 3.

## How queries get rewritten

Source: Peec AI's analysis of 5 million fan-out queries (April 2026).

| Assistant | Average queries per prompt | Style |
|---|---|---|
| Perplexity | 1.4 | Mostly strips filler words and re-runs a cleaner version |
| ChatGPT | 2.1 | Stays close to the intent but adds brand names, comparisons and words like "best", "top", "reviews" |
| Grok | 6.8 | Treats the prompt as a research brief. Uses `site:` in 18.3% of chats, often `site:reddit.com` |

Other researchers noted ChatGPT appending source-type hints such as "official" to fact queries.

A newer and much larger study from Ahrefs (October 2026) looked at 66.6 million logged-out ChatGPT responses and 15 million fan-out queries. It found 14.4% of responses triggered a search, with about 1.6 queries per searched response. Between August and September the word "official" rose from 10.1% to 13.1% of English fan-out queries, and "price" from 6.0% to 8.9%. The two averages (2.1 and 1.6) come from different samples and models, so I read them as "usually one or two", not as a contradiction.

OpenAI's own help page says the same thing in general terms: a prompt is usually rewritten into one or more targeted queries, and more specific ones can follow once the first results are in.

**My captures:** this matched closely. All three of my ChatGPT queries added "ergonomic office", "reviews", "pricing" or "price", the year, and two or three brand names I never typed. The second query in my later two-query run used "official", "price" and "specifications", which is exactly the vocabulary Ahrefs saw growing. Where the brand names come from is covered in [07-how-an-answer-is-made.md](07-how-an-answer-is-made.md#where-the-brand-names-come-from).

## Where results come from

Sources: Peec AI ("ChatGPT built its own search index") and Suganthan Mohanadasan's two posts.

Until 21 July 2026 every source in the response carried a `result_source` label saying which back end it came from:

| Label | What it is reported to be |
|---|---|
| `labrador` | OpenAI's own search index |
| `bright` | Bright Data, a scraping provider |
| `oxylabs` | Oxylabs, a scraping provider |
| `serp` | Scraped search-engine results |
| `bing` | Bing, rolled out to some accounts from late June 2026 |

Other points from the same posts:

- OpenAI's index is reported to have separate verticals: general web, PDF, YouTube, news, arXiv, Wikipedia, local, finance, legal, medical, shopping, images.
- It stores page content, crawl date and publication date ahead of time. Pages are served from this cache, not fetched live.
- Ranking is reported to combine keyword matching (BM25), embedding search, a fusion step and a reranker. No scores are exposed for web results.
- The mix of back ends differed by account. A free account in Italy was served entirely by `labrador`. A paid account in the UAE was mostly `bright`.

**My captures:** the `result_source` label is gone, as reported, so I cannot tell which back end served my results. What I do see is a `ref_type` on each source, with two values: `search` and `reddit`. So Reddit is clearly a separate channel.

## The snapshot and its two sizes

This is the part the Loom video focuses on.

What the posts say:

- Each source has a `snippet` field holding text from the page.
- Suganthan measured `bright` snippets at about **153 characters** on average and `labrador` snippets at about **1,080 to 1,217 characters**. That lines up with the "150 to 200" and "about 1,000" in the video.
- So the two sizes look like two different back ends, not two versions of the same page.
- A Peec researcher (Metehan Yeşilyurt) reported that the page text looks like HTML converted to markdown-style plain text, and that sources reach the model as blocks of about 170 words. He published no raw data, so I treat this as unverified.

**My captures:** all 23 search snippets across three runs were between 201 and 204 characters and ended in "...". That is a third size, close to the short one. I never saw a snippet near 1,000 characters. Headings in my snippets were in capitals, which fits the "converted to plain text" claim.

**What "two snapshots" could actually mean.** When I asked ChatGPT about this, it pointed out that the two sizes could be three different things, and they should not be mixed up:

1. Two formats returned by two different search providers. This is what the measurements above suggest.
2. A short search snippet, plus a longer extract that is fetched only when the model opens that page.
3. Two stored versions of the same page, kept for reuse.

Only the third is "ChatGPT keeps two snapshots of every page". I found no evidence for that one.

A later Search Engine Land article on a RESONEO study (1,200 answers, 88,000 search results, 26,900 distinct pages) gives some support to the second and third readings together. It describes three layers: a discovery index that finds pages, a reading cache that keeps full copies of pages already fetched, and a small set of pages opened live. On that picture the long text is not a second snippet. It is the stored full page, which the model reaches only when it reads a result.

My conclusion: the short snapshot is real. The long one is reported by others but I could not reproduce it, and I found nothing official. It may depend on account type or country, it may have changed since, or it may sit in a layer that is not sent with the search results.

## Which cache are we talking about

"Cached" came up a lot, and it means three unrelated things here.

| Cache | Where it is | Can I see it? |
|---|---|---|
| Browser cache | On my computer. Stores scripts, icons and so on | Yes, in the Network tab. It has nothing to do with search |
| Network or CDN cache | Between my browser and the server | Sometimes, through response headers. Also nothing to do with search |
| The search system's own store | On OpenAI's or its providers' servers. Holds page text collected in advance | No. Only its output is visible, as the `snippet` |

The video's "snapshot" is the third kind. From the browser I can see what comes out of it. I cannot see how or when it was filled.

There are two more server-side things that get called a cache or a memory and have nothing to do with web pages: the prompt cache, which reuses calculation for a repeated prompt, and personal memory, which holds what ChatGPT knows about the user. I separate all of these in [07-how-an-answer-is-made.md](07-how-an-answer-is-made.md#four-things-that-all-get-called-memory-or-cache).

## YouTube

Source: David Konitzny's LinkedIn post.

For a YouTube video the snippet is reported to contain the title, channel name, follower count, verified status, publish date, views, likes, and the full description including links and timecodes. It does not contain the transcript. So the description is what ChatGPT "knows" about a video.

**My captures:** none of my prompts returned a YouTube source, so I could not check this. The parser has a reader for the format shown in the post. It is untested.

## How citations are encoded

Source: FunnelStory's write-up on streaming citations.

- The older format put invisible marker characters in the answer text, wrapping reference IDs like `turn0search11`.
- A separate list called `content_references` mapped each marker to a URL.
- Pages that supported a claim but lost the visible slot were listed under `supporting_websites`.

**My captures:** this had changed. My answers contain tags like `<Cite refs={["turn638361search2"]}/>` written in a UI markup language, and the details for each tag are resolved in a separate block. The reference ID idea is the same, only the wrapping is new.

## Retrieved vs cited: the big studies

| Study | Size | Finding |
|---|---|---|
| Ahrefs | 1.4 million prompts | About 50% of retrieved URLs were cited. Roughly 16.6 cited and 16.6 uncited URLs per prompt. Reddit made up 67.8% of the uncited pool |
| AirOps | 548,534 pages, 15,000 prompts | Only 15% of retrieved pages reached a final answer |
| Peec AI (Deep Research) | Session logs | The agent reads far more pages than it cites. A page can shape an answer without being credited |

The Ahrefs and AirOps numbers are far apart because they count "retrieved" differently.

**My captures:** 15 of 30 retrieved sources were cited, which is 50%. That matches Ahrefs, but with three runs it could easily be chance. Reddit was not the uncited bulk for me: 4 of 7 Reddit threads were cited.

## Hidden instructions and classification

Source: Suganthan's second post.

- Each conversation carries two hidden system messages, labelled `identity_prompt` and `sources_and_filters_prompt`. Their text arrives empty in the browser, so the content cannot be read.
- Each turn is classified with a `turn_use_case`. Reported values: `instant_search`, `shopping`, `text`, `local`, `thinking`, `image_gen`.
- Personalisation sources are listed under `personal_sources`. Reported values: `convo_search`, `gmail`, `files`.
- Every URL shown to the user goes through a safety check, visible only in the live stream.

**My captures:** I see two hidden, empty system messages at the start, which fits. I see `turn_use_case` values of `shopping` and `personal context`. I see `personal_sources: ["convo_search"]` in the run that used my chat history. I see 19 URL safety-check events in one response.

## The format keeps changing

From FanoutFox's changelog and Suganthan's posts:

| Date (2026) | Change |
|---|---|
| 21 July | `result_source` removed. Citations moved into grouped items |
| 22 July | Sources nested under per-domain groups. Reference ID changed from text to an object |
| August | `turn_use_case` reported dropped. `search_model_queries` reported renamed to `search_queries` |
| 20 August | Search records moved out of the saved conversation and into the live response only |

**My captures (9 October):** `search_model_queries` is still the name I see, and `turn_use_case` is still present in a metadata event at the end of the stream. So either those two changes were rolled back, or they apply only to some accounts. This is exactly why the parser checks for both names.

The 20 August change matters most for building anything. You have to capture the response while it streams. Reading the saved conversation afterwards is not enough.

## How people capture this data

| Method | How it works | Good for |
|---|---|---|
| DevTools by hand | Network tab, find the conversation request, search the response for `search_model_queries` | A first look |
| Console snippet | A few lines pasted into the console that fetch the conversation and print a table | Quick checks on your own account |
| Bookmarklet | Same idea, one click (Mike Friedman's is the known one) | Non-technical users |
| Browser extension | Wraps the page's `fetch` and copies the response as it streams | Everyday passive capture. This is what I built |
| Browser automation | A script drives a real browser and listens to responses | Many prompts, repeated runs |
| Proxy (mitmproxy) | Sits between browser and server | One tool for every site, but ChatGPT uses HTTP/3, which complicates it |
| Paid scraper APIs | cloro, Bright Data, Scrape.do, Apify and others | Large scale without maintaining anything |

Two practical warnings from the posts:

- A hook installed after the page has loaded can miss the stream. It needs to be in place before the page's own scripts run.
- Plain automated Chrome gets blocked by Cloudflare. In one 2026 benchmark, `nodriver` passed 28 of 31 protected targets, `patchright` 25, and plain Playwright 24.

## Other assistants, from reading

What I found myself on Gemini and Claude is in [04-gemini-claude-and-others.md](04-gemini-claude-and-others.md). This section is only what I read.

**Gemini.** One request, `StreamGenerate`, carries the answer. The response starts with a `)]}'` guard line, then chunks with a length number before each. The useful chunk is tagged `wrb.fr`, and its content is JSON stored inside a string, so it must be decoded twice. There are no field names, only arrays inside arrays. One write-up found the endpoint answered without any login, and hit rate limits after about 100 calls in a day. Commercial scrapers list Gemini fan-out queries as not available.

**Perplexity.** Streams from `/rest/sse/perplexity_ask`. The response is made of named blocks. Sources sit under `web_result_block.web_results`, and research steps under `plan_block`. The last message is flagged `final_sse_message`.

**Claude.** Anthropic's public API streams typed blocks. A web search shows up as a `server_tool_use` block named `web_search`, with the query arriving in pieces as partial JSON. At least one scraping vendor does not offer Claude at all, because it sits behind a login and automated access conflicts with Anthropic's terms.

**Grok.** Highest fan-out of the group (6.8 queries per prompt in the Peec study). Strong bot detection, inherited from X.

## Existing tools I looked at

- **FanoutFox** (Chrome extension by Suganthan Mohanadasan): fan-out, sources, citations, runner-ups. Its changelog is the best public record of format changes.
- **ChatGPT Search & fan-outs capture** (Resoneo): Chrome extension from the team behind the `web.run` study.
- **Mike Friedman's bookmarklet**: queries plus the model's reasoning text.
- **Open source:** `chatgpt2api` documents the patch format, `QuickGPT` shows how to wrap `fetch` inside the page, `elmo` is a full self-hosted tracker.

Most of these are ChatGPT-only. That is part of why the main task, going beyond ChatGPT, is the interesting bit.
