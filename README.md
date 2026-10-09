# Fan-out Capture

What do AI assistants actually search for when you ask them a question, and which of the pages they find do they end up using?

This repo is my attempt to answer that. It has a small Chrome extension that captures the data, my results from ChatGPT and Gemini, and the research behind it.

## The short version

When ChatGPT answers with web search, the browser receives much more than the answer you see. It also receives the search query the model wrote, every page it pulled, a short text snapshot of each page, and which pages it cited. None of that is shown on screen. All of it can be read from the network response.

I built an extension that reads it and shows it in a side panel:

- the query ChatGPT really searched for
- every source it retrieved, with its snapshot text and date
- which sources were cited and which were only retrieved

Then I ran the same kind of question on Gemini and looked at Claude, to see how they differ.

<img src="docs/img/panel-chatgpt.png" alt="The extension's side panel showing a ChatGPT capture" width="360">

## My approach

I started by finding out how the search actually works. Time was short, so I did not go deep into every network call and every internal tool. I read enough to understand the overall flow, wrote a summary for myself, and then built a simple Chrome extension on top of that.

I kept the first version simple on purpose. Trying to build a complicated system before I understood the data would only have led to more confusion.

The Loom video describes two snapshot sizes per source: a short one of about 150 to 200 characters and a longer one of about 1,000 characters. I tried to understand this properly. I found nothing official. The closest thing was third-party measurements of two different search back ends, one returning about 150 characters and one about 1,100 to 1,200. In my own captures every snapshot was about 200 characters and I never saw a long one. So I can confirm the short snapshot. I am not sure the long one still works the way the video describes.

For the first pass I focused on three platforms: ChatGPT, Gemini and Claude.

The full story, including the wrong turns, is in [docs/01-problem-and-approach.md](docs/01-problem-and-approach.md).

## What I found

### ChatGPT

I ran three chair-buying prompts. Each time ChatGPT sent **one** search query, a rewritten version of mine:

| I typed | ChatGPT searched |
|---|---|
| Find the best chairs under 10k | best ergonomic office chairs under ₹10000 India 2026 reviews pricing Featherlite Green Soul Sleep Company |
| Find the best chairs under 15k in india | best ergonomic office chairs under ₹15000 India 2026 Featherlite Green Soul reviews pricing |
| Find the best chairs under 10k in india | best ergonomic office chairs under 10000 India 2026 reviews price Featherlite Green Soul Wakefit |

I expected several sub-queries and got one each time. I could not tell whether more queries run on the server without being sent to the browser.

The main numbers:

| | Run 1 | Run 2 | Run 3 | Total |
|---|---|---|---|---|
| Sources retrieved | 10 | 11 | 9 | 30 |
| Sources cited | 4 | 5 | 6 | 15 |

Things that stood out:

- **Half of what was retrieved got cited.** The same share Ahrefs found across 1.4 million prompts.
- **Brand names were added before any search ran.** I never typed Featherlite or Green Soul.
- **Position mattered most.** Of the first four search results, 9 of 12 were cited. Of the rest, 2 of 11.
- **Every snapshot was about 200 characters.** 23 snapshots, all between 201 and 204 characters. Reddit sources had none.
- **The same page was cited in one run and ignored in the next,** with nothing about the page changing.
- **Naming a brand pulled in that brand's own blog.** In run 2, four of eight web results were Green Soul's own pages and three were cited.
- **My first run was personalised.** ChatGPT looked at two of my older chats before it searched.

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

## How the task maps to this repo

| Task | Status | Where |
|---|---|---|
| Task 1: citation snapshots (URL, title, snippet, dates) | Done for ChatGPT, three runs | [docs/03](docs/03-chatgpt-results.md), `samples/chatgpt/` |
| Task 1: YouTube fields (channel, views, likes, description) | Not shown. None of my prompts returned a YouTube source. The reader is written but untested | [docs/08](docs/08-limits-and-next-steps.md) |
| Task 2: fan-out queries, retrieved vs cited | Done for ChatGPT, three runs | [docs/03](docs/03-chatgpt-results.md) |
| Main: do other assistants send this data, and where | Gemini from one capture. Claude by hand. Perplexity and Grok from reading | [docs/04](docs/04-gemini-claude-and-others.md) |
| Main: how the structure differs | Covered for ChatGPT, Gemini, Claude | [docs/04](docs/04-gemini-claude-and-others.md), [docs/05](docs/05-stream-format.md) |
| Main: can it be automated | Working extension and script for ChatGPT. Plan for the rest | `extension/`, `cli/`, [docs/07](docs/07-scaling.md) |

## What is in this repo

| Path | What it is |
|---|---|
| `extension/` | The Chrome extension |
| `cli/parse.js` | The same parser as a command-line script |
| `samples/` | Parsed output from my four runs |
| [docs/01-problem-and-approach.md](docs/01-problem-and-approach.md) | The task, the video, and how I went about it |
| [docs/02-research-notes.md](docs/02-research-notes.md) | Everything I learned about how AI search works |
| [docs/03-chatgpt-results.md](docs/03-chatgpt-results.md) | Tasks 1 and 2: queries, snapshots, retrieved vs cited |
| [docs/04-gemini-claude-and-others.md](docs/04-gemini-claude-and-others.md) | Main task: the other assistants |
| [docs/05-stream-format.md](docs/05-stream-format.md) | Technical reference: where each field sits |
| [docs/06-the-extension.md](docs/06-the-extension.md) | How the extension works and how to run it |
| [docs/07-scaling.md](docs/07-scaling.md) | How I would scale this |
| [docs/08-limits-and-next-steps.md](docs/08-limits-and-next-steps.md) | What I did not verify, mistakes I made, what comes next |
| [docs/09-references.md](docs/09-references.md) | Everything I read |

If you only read two pages, read 03 and 08.

## Quick start

**The extension**

1. Open `chrome://extensions` and turn on Developer mode.
2. Click "Load unpacked" and pick the `extension/` folder.
3. Reload the ChatGPT tab.
4. Click the extension icon to open the side panel, then ask something that needs a web search.

**The script**

    node cli/parse.js saved-stream.txt
    node cli/parse.js saved-stream.txt --csv

## What works and what does not

| Part | Status |
|---|---|
| ChatGPT: queries, sources, snapshots, cited vs retrieved | Working. Checked against a response I read by hand, then used live |
| ChatGPT: product results | Reader written, not tested |
| ChatGPT: YouTube fields | Reader written, not tested |
| Gemini: links and products | Working. Queries not found |
| Claude, Perplexity, Grok | Capture is set up. Readers are first guesses and untested |

## Limits

This is three ChatGPT runs and one Gemini run, on one account, in one evening, about one topic. The patterns above are leads to test, not rules. The full list of what I am and am not sure about is in [docs/08-limits-and-next-steps.md](docs/08-limits-and-next-steps.md).

## Closing thought

I found this problem really interesting, and I think a tool like this will never be finished. ChatGPT changed its response format at least four times between July and October 2026, and some of what I read while researching was already out of date when I checked it against my own capture. That is why the extension keeps the raw response for every capture: when the format changes, I only have to fix the parser and run it again.
