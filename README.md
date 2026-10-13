# Fan-out Capture

What does an AI assistant actually search for when you ask it a question? Which of the pages it finds does it end up using? And where do the things it adds on its own, such as brand names you never typed, come from?

This repo is my attempt to answer that. It is mainly an explanation. It has the research on how the search works, my own captures from ChatGPT and Gemini, and a small Chrome extension I built to collect the data.

## The short version

When ChatGPT answers with web search, the browser receives much more than the answer you see. It also receives the search query the model wrote, every page it pulled, a short text snapshot of each page, and which pages it cited. None of that is shown on screen. All of it can be read from the network response.

I asked ChatGPT for the best chairs under 10k. It did not search for my words. It searched for:

> best ergonomic office chairs under ₹10000 India 2026 reviews pricing Featherlite Green Soul Sleep Company

It retrieved 10 pages and cited 4. I never typed "ergonomic", "India", "2026" or any of the three brands.

The capture shows *what* happened. It does not show *why*. So this project has two halves:

1. **What can be observed.** The queries, the sources, the snapshots and the citations, read from the response.
2. **What explains it.** How the model learned those brands, what it remembers about the user, what is cached and what is not.

Screenshots of two captures are in [Fan-Out-Image.pdf](Fan-Out-Image.pdf).

## How an answer is made

A question goes through roughly five steps. The browser capture shows some of them and not others.

| Step | What happens | Visible in the capture? |
|---|---|---|
| 1 | The model reads the prompt, the conversation and any saved memory, and decides whether to search | No |
| 2 | It writes its own search queries. This is the fan-out | Yes |
| 3 | Search providers return results, each with a title, URL, date and short snippet | Yes |
| 4 | It may search again with narrower queries, or open a page | Partly |
| 5 | It writes the answer and attaches citations | Yes |

OpenAI documents steps 2 and 4 itself: ChatGPT search usually rewrites a prompt into one or more targeted queries, and can send more specific ones after looking at the first results. So fan-out is expected behaviour. What is not public is how the words in those queries are chosen.

### Four things that get called "memory" or "cache"

This was the most useful thing I learned. When people say ChatGPT "remembers" or "has cached" something, they can mean four unrelated mechanisms.

| | What it is | Does it explain a brand in the query? |
|---|---|---|
| Model weights | What the model learned in training. Associations, not stored pages | Yes. This is the main source |
| Personal memory | Saved memories and past chats | Sometimes. It can shape a query when a preference is relevant |
| Prompt cache | Reused calculation when a prompt starts with the same text as a recent one | No. It makes replies faster. It holds no facts |
| Search index and page cache | Stored copies of web pages on the search side | Only indirectly. It explains the snapshots, not the query |

The model knows Featherlite makes office chairs because of training. It still searches, because training does not tell it today's price. The prompt cache, which is what most people mean by "ChatGPT caches", has nothing to do with either.

### Where the brand names come from

A brand can enter by three routes:

1. **The model proposes it before searching**, from what it learned. A Radyant study of 3,842 runs found the first query already named a vendor 28.6% of the time.
2. **The search results introduce it**, and a follow-up query then names it.
3. **It appears in the answer without being in any query.** The same study saw this in 9% to 29% of answers that named a brand.

In my runs, Featherlite and Green Soul were in every query from the start, so route 1. A third brand changed from run to run (Sleep Company, then Wakefit), which shows the list is generated fresh each time and not read from storage.

The full explanation, with what is documented, what is measured by others and what is my own reading, is in [docs/07-how-an-answer-is-made.md](docs/07-how-an-answer-is-made.md).

## What I found

### ChatGPT

I ran three chair-buying prompts and recorded them fully. Each time ChatGPT sent **one** search query, a rewritten version of mine:

| I typed | ChatGPT searched |
|---|---|
| Find the best chairs under 10k | best ergonomic office chairs under ₹10000 India 2026 reviews pricing Featherlite Green Soul Sleep Company |
| Find the best chairs under 15k in india | best ergonomic office chairs under ₹15000 India 2026 Featherlite Green Soul reviews pricing |
| Find the best chairs under 10k in india | best ergonomic office chairs under 10000 India 2026 reviews price Featherlite Green Soul Wakefit |

The main numbers:

| | Run 1 | Run 2 | Run 3 | Total |
|---|---|---|---|---|
| Sources retrieved | 10 | 11 | 9 | 30 |
| Sources cited | 4 | 5 | 6 | 15 |

Things that stood out, and what I think explains each:

- **Brand names were added before any search ran.** The model's learned associations, not the search and not a cache.
- **Naming a brand pulled in that brand's own blog.** In run 2, four of eight web results were Green Soul's own pages and three were cited. A choice made before the search shaped what the search found.
- **My first run was personalised.** ChatGPT looked at two of my older chats before it searched, and "India" and "office" appeared in the query without my typing them. This is the memory mechanism, and the response says so.
- **Half of what was retrieved got cited.** The same share Ahrefs found across 1.4 million prompts.
- **Position mattered most.** Of the first four search results, 9 of 12 were cited. Of the rest, 2 of 11.
- **Every snapshot was about 200 characters.** 23 snapshots, all between 201 and 204 characters. Reddit sources had none.
- **The same page gave the same snapshot 40 minutes apart.** This fits a stored copy on the search side. It does not prove one.
- **The same page was cited in one run and ignored in the next,** with nothing about the page changing. I have no explanation for this beyond the model's choice varying between runs.

**A later run sent two queries.** For "Best chairs under 15k" I saw a broad discovery query, followed by a narrower one asking for the official price and specifications of named products. That is the documented follow-up behaviour, and the words "official" and "price" match a trend Ahrefs measured across 15 million fan-out queries. I only have the query strings for that run, so it is not in the numbers above.

Details: [docs/03-chatgpt-results.md](docs/03-chatgpt-results.md)

### Gemini

Gemini was the more interesting one, though not for the reason I first thought.

At first it looked like Gemini was rewriting my prompt into many long, descriptive queries. That was wrong. Those were Google Shopping product links, with the product's listing title in them. I could not find Gemini's actual search query in the response.

What Gemini does send is very different from ChatGPT:

- 10 Google Shopping product records, with price, seller and a long description
- 6 web pages, of which 5 were shop category pages and none was a review article
- only one web page in common with ChatGPT for the same question

For a shopping question, ChatGPT reads review articles and Gemini runs a shopping search.

### Claude

Claude was the hardest to crack. On the surface, at least, it seems to take my query as it is, find the top websites that match, go through them, and then answer. I could not see a rewriting step. I only looked at it by hand and have no saved capture, so this is an impression and not a result.

Details for both: [docs/04-gemini-claude-and-others.md](docs/04-gemini-claude-and-others.md)

## About the two snapshot sizes

The Loom video that set the task describes two snapshots per source: a short one of about 150 to 200 characters and a longer one of about 1,000 characters. I found nothing official on this. Third-party measurements show two different search back ends, one returning about 150 characters and one about 1,100 to 1,200. In my own captures every snapshot was about 200 characters and I never saw a long one.

So I can confirm the short snapshot. The research on the retrieval side suggests the longer text may belong to a different layer, a cache of full pages the system has already read, and not to a second copy sent with every search result. I could not confirm that from the browser.

## How I went about it

I started by finding out how the search works, read enough to understand the flow, and then built a simple Chrome extension on top of that. I kept the first version simple on purpose. Building a complicated system before I understood the data would only have added confusion.

Once the extension worked, the captures raised questions the network response could not answer, mainly about brand names and caching. So I went back to research, this time on how the model learns, remembers and caches. That second round is what turned this from a tool into an explanation.

The full story, including the wrong turns, is in [docs/01-problem-and-approach.md](docs/01-problem-and-approach.md).

## How the task maps to this repo

| Task | Status | Where |
|---|---|---|
| Task 1: citation snapshots (URL, title, snippet, dates) | Done for ChatGPT, three runs | [docs/03](docs/03-chatgpt-results.md) |
| Task 1: YouTube fields (channel, views, likes, description) | Not shown. None of my prompts returned a YouTube source. The reader is written but untested | [docs/08](docs/08-limits-and-next-steps.md) |
| Task 2: fan-out queries, retrieved vs cited | Done for ChatGPT, three runs | [docs/03](docs/03-chatgpt-results.md) |
| Main: do other assistants send this data, and where | Gemini from one capture. Claude by hand. Perplexity and Grok from reading | [docs/04](docs/04-gemini-claude-and-others.md) |
| Main: how the structure differs | Covered for ChatGPT, Gemini, Claude | [docs/04](docs/04-gemini-claude-and-others.md), [docs/05](docs/05-stream-format.md) |
| Main: can it be automated | Working extension and script for ChatGPT. First guesses for the rest | [fanout-capture/](fanout-capture/), [docs/06](docs/06-the-extension.md) |
| Beyond the task: why the queries look the way they do | Explained from documentation and independent studies | [docs/07](docs/07-how-an-answer-is-made.md) |

## What is in this repo

| Path | What it is |
|---|---|
| [docs/01-problem-and-approach.md](docs/01-problem-and-approach.md) | The task, the video, and how I went about it |
| [docs/02-research-notes.md](docs/02-research-notes.md) | What is publicly known about how AI search works |
| [docs/03-chatgpt-results.md](docs/03-chatgpt-results.md) | Tasks 1 and 2: queries, snapshots, retrieved vs cited |
| [docs/04-gemini-claude-and-others.md](docs/04-gemini-claude-and-others.md) | Main task: the other assistants |
| [docs/05-stream-format.md](docs/05-stream-format.md) | Technical reference: where each field sits |
| [docs/06-the-extension.md](docs/06-the-extension.md) | How the extension works and how to run it |
| [docs/07-how-an-answer-is-made.md](docs/07-how-an-answer-is-made.md) | Learning, memory, search and cache, and where brand names come from |
| [docs/08-limits-and-next-steps.md](docs/08-limits-and-next-steps.md) | What I did not verify, mistakes I made, what comes next |
| [docs/09-references.md](docs/09-references.md) | Everything I read |
| `fanout-capture/extension/` | The Chrome extension |
| `fanout-capture/cli/parse.js` | The same parser as a command-line script |
| [Fan-Out-Image.pdf](Fan-Out-Image.pdf) | Screenshots of two captures |

If you only read three pages, read 03 for what I saw, 07 for what explains it, and 08 for what I am not sure about.

## Running the extension

1. Open `chrome://extensions` and turn on Developer mode.
2. Click "Load unpacked" and pick the `fanout-capture/extension/` folder.
3. Reload the ChatGPT tab.
4. Click the extension icon to open the side panel, then ask something that needs a web search.

The same parser runs from the command line on a response saved from the Network tab:

    node fanout-capture/cli/parse.js saved-stream.txt
    node fanout-capture/cli/parse.js saved-stream.txt --csv

| Part | Status |
|---|---|
| ChatGPT: queries, sources, snapshots, cited vs retrieved | Working. Checked against a response I read by hand, then used live |
| ChatGPT: product results | Reader written, not tested |
| ChatGPT: YouTube fields | Reader written, not tested |
| Gemini: links and products | Working. Queries not found |
| Claude, Perplexity, Grok | Capture is set up. Readers are first guesses and untested |

## Limits

This is three recorded ChatGPT runs and one Gemini run, on one account, in one evening, about one topic. The patterns above are leads to test, not rules.

The explanation has its own limit. A browser capture shows what was sent to the page. It does not show the model's reasons, how results were ranked, or whether a page came from a stored copy. Where I explain those, I am relying on OpenAI's documentation and on independent studies, and I say which. The full list of what I am and am not sure about is in [docs/08-limits-and-next-steps.md](docs/08-limits-and-next-steps.md).

## Closing thought

I found this problem really interesting, and I think a tool like this will never be finished. ChatGPT changed its response format at least four times between July and October 2026, and some of what I read while researching was already out of date when I checked it against my own capture. That is why the extension keeps the raw response for every capture: when the format changes, I only have to fix the parser and run it again.

The part I expect to last longer is the explanation. Field names will keep moving. The difference between what a model learned, what it remembers, what it searched for and what was cached will not.
