# 7. How an answer is made: learning, memory, search and cache

The earlier pages describe what I captured. This page tries to explain it.

Two questions kept coming back while I looked at the captures:

- ChatGPT put "Featherlite" and "Green Soul" into its search query before it had searched for anything. **Where did those names come from?**
- The same page came back with the same 200-character snapshot 40 minutes apart. **Was that a cached copy? And is that the same "cache" people mean when they say ChatGPT caches things?**

I could not answer either from the network response alone, so I went back and researched how the whole system fits together. The short answer is that four different mechanisms are involved, and they are easy to mix up because everyday language uses "memory" and "cache" for all of them.

## How sure I am about each thing

Not everything on this page has the same weight. I use three levels and try to say which one applies.

| Level | What it means | Example |
|---|---|---|
| Documented | OpenAI says so in its own help pages or API guides | The prompt cache stores intermediate model state, not web pages |
| Measured by others | Independent researchers observed it. Useful, not official, can go out of date | A separate cache of fetched pages in the search system |
| My reading | My own interpretation of my captures | The brand names in my queries came from the model, not from the search |

Anything about OpenAI's internal routing, ranking or storage that is not in the first two rows is unknown, and I try not to pretend otherwise.

## The path of one question

This is the order things happen in, as far as public sources describe it. On the right is whether the browser capture shows that step.

```
Your prompt + the conversation so far + saved memory (if switched on)
        │
        ▼
1. The model reads all of it and decides: answer directly, or search?     not visible
        │
        ▼
2. It writes its own search queries (the fan-out)                         visible
        │
        ▼
3. Search providers return results: title, URL, date, short snippet       visible
        │
        ▼
4. It may look at the results and search again, or open a page            partly visible
        │
        ▼
5. It writes the answer and attaches citations                            visible
```

OpenAI's help page on ChatGPT search describes steps 2 and 4 in plain words: the prompt is usually rewritten into one or more targeted queries that go to search providers, and more specific queries can follow after the first results have been looked at. So fan-out is not a hidden trick. It is documented behaviour. What is not documented is how the model chooses the words.

The diagram is a way of thinking about it. It is not a drawing of OpenAI's real services.

## Four things that all get called "memory" or "cache"

| | What it really is | How long it lasts | Can it put a brand name in a query? | Can I see it from the browser? |
|---|---|---|---|---|
| 1. Model weights | What the model learned in training | Until the model is replaced | Yes. This is the main source | No |
| 2. Personal memory | Saved memories and past chats | Until I delete them | Yes, if I had told it a preference | Partly. The response says when past chats were used |
| 3. Prompt cache | Reused calculation for a repeated start of a prompt | Minutes | No | No |
| 4. Search index and page cache | Stored copies of web pages on the search side | Minutes to much longer | Indirectly, through what the results contain | Only its output, as the snippet |

[02-research-notes.md](02-research-notes.md#which-cache-are-we-talking-about) lists the browser cache and the CDN cache as well. Those two sit on my side of the connection and have nothing to do with search. The four here are all on the server side.

### 1. What the model learned

A language model is trained by showing it huge amounts of text and asking it, over and over, to predict the next word. Each wrong guess nudges its internal numbers, called weights. After enough of this, the weights hold a great many associations: that Featherlite is an Indian office-furniture brand, that Green Soul sells ergonomic chairs, that lumbar support matters for desk work, that people comparing products care about price and reviews.

The important part is what this is not. The model does not keep a copy of the pages it was trained on, and there is nothing in it to look up. It has a sense of what belongs together. It does not have a product catalogue.

This explains something I saw in every run. The model knew the brands well enough to name them, but it still searched, because knowing that Green Soul makes chairs is different from knowing what the Jupiter Pro costs this week. Training gives it the vocabulary to search well. It does not give it today's facts.

A second stage of training teaches the model when to use tools. That is why it decides on its own to search for chair prices but answers a general question from what it already knows. The exact rule for that decision is not public.

### 2. What it remembers about me

This is the personal kind. OpenAI documents two sources: saved memories, which are short facts kept separately, and information drawn from past chats. Custom instructions and connected apps can add to this.

Three documented points matter for this project:

- Saved memories are considered in future answers until they are deleted. Past chats are used selectively. ChatGPT does not remember every detail from them.
- Memories can be used to shape the search queries ChatGPT sends to search providers.
- OpenAI has described a background process, which it calls "dreaming", that reviews past conversations and keeps the remembered picture of the user up to date.

What is not documented is how this is stored or how the relevant bits are picked. I have seen it described as a vector database that is searched on every message. Nothing official says that, so I do not claim it.

My run 1 is a clear example of this mechanism at work. Before searching, the model asked an internal tool about my preferences for buying chairs and got two of my older chats back. I never typed "India" or "office", and both ended up in the query. See [03-chatgpt-results.md](03-chatgpt-results.md#personalisation-run-1-only).

### 3. The prompt cache

This one is the most technical and the least relevant to what I was looking for, but it is the one people usually mean when they say "ChatGPT caches".

When a model reads a prompt it does a lot of calculation on every token. If the next request starts with exactly the same text (same instructions, same tool definitions, same conversation so far), that calculation can be reused. OpenAI documents this for its API:

| Question | What the API guide says |
|---|---|
| What is stored? | The model's intermediate key-value tensors for the start of a prompt. Not the text, not an answer, not a web page |
| How is a match found? | The start of the prompt must match exactly. Two prompts that mean the same thing but are worded differently do not match |
| How long must the prompt be? | At least 1,024 tokens on the newer models |
| Where does it live? | On individual machines, so a request has to be routed to the right one |
| Is it shared? | Not across organisations |
| How long does it last? | About 30 minutes after its last use on the newer models |

So the prompt cache makes a reply faster and cheaper. It holds no facts about chairs. It cannot be the reason a brand shows up in a query, and it cannot be the reason a page shows up in the results.

One caution: this is documented for the API. I am assuming the app works in a similar way. I cannot observe it from the browser either way.

### 4. The search index and the page cache

This is the one that matters for the snapshots.

A search system does not download a page from its original website every time someone asks a question. There are several places where a stored copy can be used instead:

- **The index.** It is what makes a page findable. It holds titles, dates and some text.
- **The snippet.** The short extract that comes back with a search result. This is the roughly 200 characters I captured.
- **A cache of fetched pages.** A stored copy of a full page that was read earlier.
- **A live fetch.** Going to the website again.

OpenAI does not document this part in detail. The best public description is a Search Engine Land article on a RESONEO study of 1,200 ChatGPT answers, 88,000 search results and 26,900 distinct pages. It describes three layers: a discovery index that finds pages, a reading cache that keeps full copies of pages already fetched, and a small set of pages that are opened live. The study is also reported to describe the cached pages as HTML converted to Markdown, refreshed in the background after about 30 minutes while the old copy is still served. I could not check those two details against the article myself, so treat them as reported.

This fits what I saw without proving it:

- My snapshots were plain text with headings in capitals and tables written with `|` separators, which is what a page converted to text looks like.
- Four pages gave identical snapshots in run 1 and run 3, 40 minutes apart. A stored copy explains that. So does a live fetch of a page that had not changed.

## Fan-out, looked at again

With the four mechanisms separated, fan-out becomes easier to place. It happens at step 2, and it needs none of the caches. The model reads the prompt and writes better queries using what it learned in training. Memory can add to it. A cache does not take part.

### Why one prompt can become two queries

In my three recorded runs ChatGPT sent one query each time. In a later attempt at the same kind of prompt ("Best chairs under 15k") it sent two:

| | Query | What it is for |
|---|---|---|
| A | `best ergonomic office chairs under ₹15000 India 2026 Featherlite Amaze Green Soul Jupiter Pro reviews price` | Discovery. Find candidates, comparisons and reviews |
| B | `Green Soul Jupiter Pro official product price specifications India; Featherlite Amaze official price specifications India; Green Soul Zodiac Pro chair India 2026` | Verification. Confirm the price and specifications of named products on official pages |

I only have the two query strings for this one. I do not have a parsed capture of its sources, so it is not in the tables in [03-chatgpt-results.md](03-chatgpt-results.md).

The two queries have different jobs. A single search for "best chairs under 15k" would leave open which products exist, what they cost today, and whether the specifications in a review match the maker's own page. Query A answers the first. Query B goes after the other two. Query B also reads like three small lookups joined by semicolons, one per product.

The wording lines up with a large study. Ahrefs looked at 66.6 million logged-out ChatGPT responses from August and September 2026. About 14.4% triggered a search, and those used about 1.6 queries each. The words "official" and "price" both became more common in fan-out queries over those two months. My query B has both.

That study used logged-out sessions, so it says nothing about what memory adds. It describes the general habit, not my account.

## Where the brand names come from

This was the question I most wanted answered. A brand can enter by three routes.

**Route 1: the model proposes it before searching.** The names come from training. Radyant studied 3,842 runs of 615 buying questions that named no vendor. In 28.6% of runs the very first query already named one, before any results had come back.

**Route 2: the search results introduce it.** A first search surfaces a product, and a follow-up query then names it. This is the documented "search again after reviewing results" behaviour.

**Route 3: it appears in the answer without ever being in a query.** In the same Radyant study, for three accounts, 9% to 29% of answers that named a brand had no query naming it. So being in the query is not a requirement for being recommended.

Applied to my captures:

| Name | Most likely route | How sure |
|---|---|---|
| Featherlite, Green Soul | Route 1. They were in every query from the first one, before any search | Fairly sure about the route. Not sure why these two and not others |
| Sleep Company (run 1), Wakefit (run 3) | Route 1. A third brand that changed between runs | Fairly sure |
| Featherlite Amaze, Green Soul Jupiter Pro | Route 1, or carried over from earlier turns in the conversation | Cannot tell |
| Green Soul Zodiac Pro | Route 1 or route 2. It is in query B but not in query A | Cannot tell |

Zodiac Pro is the interesting one. It could be the model widening its own shortlist, or it could have come from the results of query A. I do know those results contain it for this kind of question: in my recorded run 2, one of the retrieved pages was titled "Green Soul Zodiac Pro vs Featherlite Amaze vs Frido AeroMesh". But that is a different run, and the query text alone cannot settle it.

The changing third brand is worth a note too. Radyant found that 36.6% of questions named a vendor on some days and not on others. So the brands in a query are not a fixed list pulled from storage. They are generated fresh each time, and they vary.

Three explanations people reach for, and what I think of each:

- **"It names the most popular brands."** Partly. A brand that appears often in the right context is easier for the model to recall. But frequency alone does not decide it. One preprint I came across argues that a query only has room for a few names, so a brand the model clearly knows can still be left out.
- **"It remembered my preference."** Possible in general, since memory can shape queries. There is nothing in my captures that shows a saved brand preference.
- **"It was cached."** No. Neither kind of cache ranks brands.

One consequence showed up in my own data. When the model names a brand in the query, the search returns that brand's own pages. In run 2 the query named Green Soul, four of the eight web results were from greensoul.online, and three were cited. The choice made before the search shaped what the search found.

## What each observation is best explained by

| What I saw | Best explanation | Level |
|---|---|---|
| The query was a rewritten version of my prompt | Query rewriting at step 2 | Documented |
| Brand names appeared before any search | Learned associations in the model | Measured by others, and my reading |
| "India" and "office" were added in run 1 | Past chats supplied as context | Shown in my capture. Memory shaping queries is documented |
| A second query with "official" and "price" | Follow-up or parallel verification search | Documented in general, measured by Ahrefs |
| The same page gave the same snapshot twice | A stored copy, or an unchanged page fetched twice | Open |
| Snapshots are plain text with capitals and `\|` tables | The page was converted to text before storage | Measured by others, matches mine |
| The same page was cited in one run and not the next | Not explained by any of the four. The model's choice varies between runs | Open |

## How to tell a cached page from a fresh one

Looking at the final answer cannot settle the cache question. A test with a page I control could. This is the experiment I would run:

1. Publish a page at a new URL with a unique marker phrase in it, and log every request the server receives, with time and user agent.
2. Ask ChatGPT a question that should retrieve it. Record the queries, the results and the snapshot.
3. Change the marker on the page.
4. Ask again, once with the same question and once with a different one that should reach the same page.
5. Repeat in a new chat, logged out, and with a changed URL, to rule out other explanations.

How to read the results:

| What happens | What it suggests |
|---|---|
| The same query returns the same URL | Stable retrieval. Says nothing about caching |
| The old marker appears after the page changed | A stale stored copy was used |
| The new marker appears and the server saw no request | Something in between fetched it, or the copy came from elsewhere |
| The server sees a request on every run | That page is fetched live each time |
| A page is cited that was never in the visible results | Another retrieval path, the model's own knowledge, or a gap in my capture |

A server log that shows no request does not prove one particular cache design. It only rules some explanations out.

## What stays unknown

- The rule the model uses to decide whether to search.
- How it picks which brands go into a query, and how many.
- How the search results are ranked before the model sees them.
- How much of each page the model is actually given. The browser gets about 200 characters.
- Whether the app uses the prompt cache the way the API guide describes.
- The real design of the page cache: what it is keyed on, how fresh it is kept, whether it differs by plan or country.

Public documentation and outside experiments cannot recover these for one specific question. What a capture tool can do is keep the observed and the inferred apart: the prompt, the queries, the results, the pages opened and the citations are observed, and everything else on this page is explanation built on top of them.

Sources for this page are listed in [09-references.md](09-references.md#how-chatgpt-learns-remembers-and-caches).
