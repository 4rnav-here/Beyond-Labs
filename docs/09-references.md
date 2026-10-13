# 9. References

Everything I read or was pointed to, grouped by what it helped with.

A note on trust: apart from the official documentation, most of this is written by SEO researchers and tool vendors who inspected the traffic themselves. It is useful and often right, but it is not official, and some of it was already out of date when I checked it against my own captures.

## Where the task started

- Loom walkthrough of the task: https://www.loom.com/share/37a4b42659e9445388bb1ac5888f1091
- David Konitzny (Peec AI), "ChatGPT reads your YouTube description, not your transcript" (LinkedIn post)

## Official documentation

- OpenAI, web search tool for the API. Describes the search trace: queries, sources, opened pages, citations. https://developers.openai.com/api/docs/guides/tools-web-search
- OpenAI Help Center, "ChatGPT search". Describes the Sources panel and citations in the app.
- Chrome DevTools, Network panel. How to inspect a request's payload and response. https://developer.chrome.com/docs/devtools/network
- Anthropic, streaming responses. The typed-block format. https://platform.claude.com/docs/en/api/streaming

## How ChatGPT learns, remembers and caches

These are the sources behind [07-how-an-answer-is-made.md](07-how-an-answer-is-made.md). They came out of a research conversation with ChatGPT. Because an assistant can cite a page loosely, each one was opened where possible. "Checked" means the page was opened and the claim I use is there. "Not re-checked" means the page exists but I could not open it, so the claim rests on the research summary and on search results.

| Source | Used for | Status |
|---|---|---|
| OpenAI, "Prompt caching" (API guide). https://developers.openai.com/api/docs/guides/prompt-caching | What the prompt cache stores, exact prefix matching, 1,024-token minimum, per-machine storage, 30-minute lifetime | Checked |
| Ahrefs, "How ChatGPT Does Query Fan-Out (15 Million Queries Studied)", 12 October 2026. https://ahrefs.com/blog/query-fan-out-chatgpt/ | 66.6 million logged-out responses, 14.4% searched, about 1.6 queries each, growth of "official" and "price" | Checked |
| Radyant, "Does ChatGPT decide before it searches?", 20 August 2026. https://www.radyant.io/research/chatgpt-fanout-branded-search-queries | 28.6% of opening queries named a vendor, brands in answers without a matching query, day-to-day variation. One week, one engine, 21 accounts | Checked |
| OpenAI Help Center, "Searching the web with ChatGPT". https://help.openai.com/en/articles/9237897-searching-the-web-with-chatgpt | Prompts rewritten into one or more targeted queries, follow-up queries after first results | Not re-checked |
| OpenAI Help Center, "Memory in ChatGPT". https://help.openai.com/en/articles/8590148-memory-in-chatgpt | Saved memories and past chats, memories shaping search queries | Not re-checked. The points I use appear in search results for the page |
| OpenAI, "Dreaming: Better memory for a more helpful ChatGPT", June 2026. https://openai.com/index/chatgpt-memory-dreaming/ | Background process that keeps memory current | Not re-checked. Confirmed through news coverage |
| Search Engine Land, "Inside ChatGPT's retrieval stack: The index, cache, and pages it actually reads" (RESONEO study). https://searchengineland.com/chatgpt-retrieval-stack-index-cache-pages-485036 | Three layers: discovery index, reading cache, pages opened live. 1,200 answers, 88,000 results, 26,900 pages | Partly. The layers and sample sizes are confirmed. The Markdown conversion and the 30-minute refresh are not re-checked |
| "Category-conditioned Web Exposure Tracks Brand Presence in ChatGPT Fanout Queries" (preprint, cited as SSRN 7524682) | A model can know a brand and still leave it out of the first query, because a query has room for few names | Not found under that title. A Research Square preprint makes the same argument. I use it only as a suggestion |
| OpenAI, "Retrieval" and "Conversation state" (API guides). https://developers.openai.com/api/docs/guides/retrieval and https://developers.openai.com/api/docs/guides/conversation-state | General background on retrieval and on how earlier turns are carried forward. Not about ChatGPT's web search | Not re-checked |

## How ChatGPT search works (reverse-engineering write-ups)

- Peec AI, "ChatGPT built its own search index". Back ends, the index, ranking stages. https://peec.ai/blog/chatgpt-built-its-own-search-index
- Suganthan Mohanadasan, "How ChatGPT picks sources", part 1. Field names, the two snippet lengths, a console snippet. https://suganthan.com/blog/how-chatgpt-picks-sources/
- Part 2. What changed in July, hidden system messages, runner-up sources. https://suganthan.com/blog/how-chatgpt-picks-sources-part-2/
- Search Engine Land, "Inside ChatGPT search". The `web.run` tool and its operations, from a Resoneo study. https://searchengineland.com/inside-chatgpt-search-web-run-fan-out-queries-ai-visibility-477339
- FunnelStory, how ChatGPT streams citations. The older marker format. https://funnelstory.ai/blog/engineering/ever-wondered-how-chatgpt-shows-you-its-sources-lets-dive-into-streaming
- Metehan Yeşilyurt, post on retrieval data in the stream. Scores and fetch flags. No raw data published. https://community.startuptalky.com/discussions/post/chatgpt-retrieval-system-leak-alert-i-found-something-huge-in-EjJ2p6bMvfO2KSa

## Finding fan-out queries by hand

- Goodie, "Query Fan-Out". The DevTools method. https://higoodie.com/blog/query-fan-out
- NoGood, "Query Fan-Out: The Complete Guide". https://nogood.io/blog/query-fan-out-guide/
- Practical Ecommerce, "How to Extract ChatGPT's Fan-Out Queries". Covers Mike Friedman's bookmarklet. https://www.practicalecommerce.com/how-to-extract-chatgpts-fan-out-queries

## Retrieved vs cited

- Ahrefs, "Why ChatGPT Cites One Page Over Another", 1.4 million prompts. https://ahrefs.com/blog/why-chatgpt-cites-pages/
- Summary of the AirOps study (15% of retrieved pages cited). https://authoritytech.io/curated/chatgpt-read-your-content-cited-someone-else-2026
- Peec AI, read vs cited in Deep Research. https://docs.peec.ai/research/read-vs-cited-in-deep-research

## Fan-out behaviour across assistants

- Peec AI, fan-outs per prompt by engine (Perplexity 1.4, ChatGPT 2.1, Grok 6.8). https://docs.peec.ai/research/fanouts-per-prompt-by-engine

## Other assistants' formats

- Scrape.do, "Scrape Gemini Responses and Sources". The clearest description of Gemini's response format. https://scrape.do/blog/gemini-scraping/
- cloro, "Scrape Perplexity". https://cloro.dev/blog/scrape-perplexity/
- cloro, provider comparison: what each assistant exposes. https://docs.cloro.dev/guides/providers
- Bright Data, query fan-out in their scrapers. https://docs.brightdata.com/datasets/scrapers/concepts/query-fan-out

## Existing tools

- FanoutFox (Chrome extension). Its changelog is the best public history of ChatGPT format changes. https://fanoutfox.com/changelog/
- Resoneo, "ChatGPT Search & fan-outs capture" (Chrome extension). https://chromewebstore.google.com/detail/hlpghnnocnclmnkhmoacpoejpebfeifm
- Mike Friedman's bookmarklet, linked from the Practical Ecommerce article above.

## Code I learned from

- basketikun/chatgpt2api. Notes on ChatGPT's patch format. https://github.com/basketikun/chatgpt2api
- Fallstop/QuickGPT. A working example of wrapping `fetch` inside the page. https://github.com/Fallstop/QuickGPT
- Rani367/pAPI. A Perplexity stream reader. https://github.com/Rani367/pAPI
- elmohq/elmo. An open-source AI visibility tracker. https://github.com/elmohq/elmo

## For scaling

- Scrapfly, "How to scrape ChatGPT". Logged-out endpoint, session handling. https://scrapfly.io/blog/posts/how-to-scrape-chatgpt
- cloro, "Scrape ChatGPT". https://cloro.dev/blog/scrape-chatgpt/
- Anti-detect browser benchmark, 2026. https://ianlpaterson.com/blog/anti-detect-browser-benchmark-patchright-nodriver-curl-cffi/

## Background on retrieval and fan-out

These were suggested during my early research with ChatGPT. I used them to understand the ideas. I have not studied each one in depth.

**Ideas**

- Query2doc: expanding a query with generated text before searching. https://arxiv.org/abs/2303.07678
- RAG-Fusion: several queries, results merged by rank. Paper: https://arxiv.org/abs/2402.03367
- "Scaling Retrieval Augmented Generation with RAG Fusion" (2026). On when the gains from extra queries disappear. I have not checked this one.

**Projects**

- RAG-Fusion reference code. https://github.com/Raudaschl/rag-fusion
- SearXNG, open-source metasearch. https://github.com/searxng/searxng
- GPT Researcher. https://github.com/assafelovic/gpt-researcher
- STORM (Stanford). https://github.com/stanford-oval/storm
- Open Deep Research (LangChain). Reported archived in August 2026. https://github.com/langchain-ai/open_deep_research
- browser-use. https://github.com/browser-use/browser-use
- Langfuse, tracing for AI applications. https://github.com/langfuse/langfuse
- LangSmith, tracing and evaluation. https://docs.smith.langchain.com
- wigolo, a search tool with parallel queries and result fusion. https://mcp.so/servers/wigolo
- Tavily, a search service built for AI agents. https://tavily.com
