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
