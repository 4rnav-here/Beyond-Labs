# 3. ChatGPT results (Tasks 1 and 2)

This page covers the two ChatGPT tasks: the citation snapshots (Task 1) and the fan-out queries with retrieved vs cited (Task 2).

I ran three prompts on 9 October 2026. All three were about the same thing on purpose, so I could compare runs.

| | Prompt | How I captured it | Time (IST) |
|---|---|---|---|
| Run 1 | Find the best chairs under 10k | By hand, copied from the Network tab | 21:23 |
| Run 2 | Find the best chairs under 15k in india | With the extension | 21:51 |
| Run 3 | Find the best chairs under 10k in india | With the extension | 22:03 |

This page is the record of what I saw. Why the queries look the way they do is on a separate page, [07-how-an-answer-is-made.md](07-how-an-answer-is-made.md), and I link to it where an observation needs explaining.

Two things to know before reading the numbers:

- All three prompts were sent in the **same conversation**, one after another. So runs 2 and 3 are follow-up turns, and the model had the earlier turns as context.
- I was logged in, on the Go plan. The metadata in run 1 says the model ran in "instant" mode. I assume the same for runs 2 and 3, since I did not change anything in between.

## Summary

| | Run 1 | Run 2 | Run 3 |
|---|---|---|---|
| Search queries sent | 1 | 1 | 1 |
| Sources retrieved | 10 | 11 | 9 |
| from web search | 9 | 8 | 6 |
| from Reddit | 1 | 3 | 3 |
| Sources cited | 4 | 5 | 6 |
| Image lookups | 4 | 5 | 0 |
| Product results used in the answer | 0 | 0 | 3 |
| Personalised from past chats | Yes | No | No |
| How ChatGPT labelled the turn | personal context | shopping | shopping |

Across the three runs: **30 sources retrieved, 15 cited.**

## Task 2: the fan-out queries

Each run sent exactly one search query.

| | What I typed | What ChatGPT searched |
|---|---|---|
| Run 1 | Find the best chairs under 10k | `best ergonomic office chairs under ₹10000 India 2026 reviews pricing Featherlite Green Soul Sleep Company` |
| Run 2 | Find the best chairs under 15k in india | `best ergonomic office chairs under ₹15000 India 2026 Featherlite Green Soul reviews pricing` |
| Run 3 | Find the best chairs under 10k in india | `best ergonomic office chairs under 10000 India 2026 reviews price Featherlite Green Soul Wakefit` |

What the rewrite does, every time:

| My words | ChatGPT's version | Where it came from |
|---|---|---|
| chairs | ergonomic office chairs | The model's guess at what I meant. In run 1 it had my chat history to go on |
| 10k / 15k | ₹10000 / ₹15000 / 10000 | Converted to a number. The rupee sign appears in runs 1 and 2 but not in run 3 |
| (nothing in run 1) | India | Added by the model in run 1. I typed it myself in runs 2 and 3 |
| (nothing) | 2026 | Added every time, to get current pages |
| (nothing) | reviews, pricing / price | Added every time. It tells the search what kind of page is wanted |
| (nothing) | Featherlite, Green Soul | Added every time, before any search had run. They cannot have come from search results, so the likely source is what the model learned in training |
| (nothing) | Sleep Company (run 1), Wakefit (run 3) | A third brand that changes between runs. So the list is written fresh each time, not read from a fixed store |

So the query follows a fixed pattern: **best + category + budget + country + year + intent words + brands**. This matches what Peec AI found across 5 million fan-out queries: ChatGPT stays close to the intent but adds brand names and words like "best" and "reviews".

**I expected several sub-queries and got one each time.** Possible reasons:

- I was in "instant" mode. Other researchers report that instant models run few searches and that "thinking" models run 5 to 10 rounds or more.
- More queries might run on the server without being sent to the browser. I cannot rule this out from the browser side.
- A simple shopping question may just not need more than one search.

The public averages for ChatGPT are 2.1 queries per prompt in one study and about 1.6 in another, so one is not unusual.

### A later run with two queries

After these three runs I tried the prompt "Best chairs under 15k" again and this time ChatGPT sent two queries. I have the query strings but no parsed capture of the sources, so this run is not counted anywhere else on this page.

| | Query |
|---|---|
| A | `best ergonomic office chairs under ₹15000 India 2026 Featherlite Amaze Green Soul Jupiter Pro reviews price` |
| B | `Green Soul Jupiter Pro official product price specifications India; Featherlite Amaze official price specifications India; Green Soul Zodiac Pro chair India 2026` |

What is different from the three runs above:

- **Query A names products, not only brands.** "Featherlite Amaze" and "Green Soul Jupiter Pro" in place of "Featherlite" and "Green Soul".
- **Query B has a different job.** A looks for comparisons and reviews. B asks for the official price and specifications of specific products. It reads like three small lookups joined by semicolons.
- **Query B introduces a product that is not in A.** Green Soul Zodiac Pro. I cannot tell from the text whether the model added it on its own or picked it up from the results of query A. A page titled "Green Soul Zodiac Pro vs Featherlite Amaze vs Frido AeroMesh" was among the results of run 2, so the name is certainly out there for this kind of search.

This is the behaviour OpenAI describes for ChatGPT search: one or more targeted queries, with more specific ones possible after the first results. I look at why a prompt gets split like this in [07-how-an-answer-is-made.md](07-how-an-answer-is-made.md#why-one-prompt-can-become-two-queries).

### Other lookups that are not search queries

- **Image lookups.** Runs 1 and 2 sent one image request per recommended product, for example `Featherlite Contact High Back black mesh office chair adjustable lumbar`. These are written by the model after it has decided what to recommend.
- **Product results.** Run 3 did not use image lookups. Its answer is built from product records (referenced as `turn492111product1`, `turn492111product17`, `turn492111product2`) that carry a title, a price and a product page. This is a third channel next to web search and Reddit. My parser did not extract these records in that run. I have added a reader for them since, but it is not tested on a real response yet.
- **Personal context lookup.** Only in run 1. Before searching, the model asked an internal tool: *"What are the user's relevant preferences for buying chairs or home/office furniture, including intended use (desk work, gaming, dining), ergonomic needs, height, room constraints, and budget preferences?"* It got back two of my older chats.

## Task 1: citation snapshots

For each source the response gives: URL, title, site name, publish date (when known), a reference number, the channel it came from, and a text snapshot. The tables below shorten long titles.

### Run 1: "Find the best chairs under 10k"

| # | Channel | Site | Page title | Published | Snapshot | Cited |
|---|---|---|---|---|---|---|
| 0 | search | pakkapick.in | Best Ergonomic Office Chairs Under ₹10000 India 2026 | none | 202 chars | No |
| 1 | search | deallooto.com | Best Office Chairs Under ₹10,000 in India (August 2026) - Dea… | 2026-08-20 | 204 chars | **Yes** |
| 2 | search | featherlitestore.com | WFH Chairs – Featherlite Furniture | none | 201 chars | **Yes** |
| 3 | search | ndtvshopping.com | Best Green Soul Office Chairs Under 10,000: From Boss To Exec… | 2026-01-06 | 202 chars | No |
| 4 | search | hindustantimes.com | Stop slouching: 5 best budget office chairs under ₹10,000 tha… | 2026-02-02 | 202 chars | No |
| 5 | search | pakkapick.in | Best Office Chair Under ₹10000 in India 2026 | none | 202 chars | **Yes** |
| 6 | search | reviehub.in | 5 Best Office Chairs Under ₹10,000 in India (2026) – RevieHub… | 2026-10-09 | 202 chars | No |
| 7 | search | flipkart.com | Featherlite Furniture \| Buy Lab Tested Furniture Online at B… | 2026-09-11 | 202 chars | No |
| 8 | search | flipkart.com | Featherlite Chairs: India's Top Office & Study Solutions | none | 202 chars | No |
| 9 | reddit | reddit.com | Suggest best ergonomic chair around ₹10k — considering Green… | 2026-05-24 | none | **Yes** |

10 retrieved, 4 cited.

### Run 2: "Find the best chairs under 15k in india"

| # | Channel | Site | Page title | Published | Snapshot | Cited |
|---|---|---|---|---|---|---|
| 0 | search | productscanner.in | What Reddit Actually Recommends: 5 Best Office Chairs Under ₹… | 2026-09-06 | 202 chars | **Yes** |
| 1 | search | greensoul.online | Top Ergonomic Office Chairs in India 2026 (₹6K–₹15K) | 2026-03-18 | 201 chars | **Yes** |
| 2 | search | greensoul.online | Best Office Chair Under Rs 15,000 in India | 2026-06-14 | 202 chars | **Yes** |
| 3 | search | greensoul.online | Jupiter Superb Reclining Office Chair \| Auto Recline | none | 202 chars | **Yes** |
| 4 | search | wakefit.co | Office Chairs: Buy High Back Ergonomic Office chairs Online a… | none | 203 chars | No |
| 5 | search | naatural.in | Green Soul Zodiac Pro vs Featherlite Amaze vs Frido AeroMesh:… | 2026-08-21 | 202 chars | No |
| 6 | search | greensoul.online | Green Soul vs CellBell vs Wakefit vs Featherlite: Honest Comp… | 2026-06-15 | 202 chars | No |
| 7 | search | team-bhp.com | Office / Desk Chair offering excellent support - Page 13 - Te… | none | 203 chars | No |
| 8 | reddit | reddit.com | Green Soul Jupiter Pro vs Featherlite Contact High Back, whic… | 2026-10-07 | none | No |
| 9 | reddit | reddit.com | Best ergonomic chair in India under 15k? (Considering a few o… | 2026-03-19 | none | No |
| 10 | reddit | reddit.com | Good office chairs below 15k | 2026-05-11 | none | **Yes** |

11 retrieved, 5 cited.

### Run 3: "Find the best chairs under 10k in india"

| # | Channel | Site | Page title | Published | Snapshot | Cited |
|---|---|---|---|---|---|---|
| 0 | search | deallooto.com | Best Office Chairs Under ₹10,000 in India (August 2026) | 2026-08-20 | 204 chars | **Yes** |
| 1 | search | pakkapick.in | Best Ergonomic Office Chairs Under ₹10000 India 2026 | none | 202 chars | **Yes** |
| 2 | search | pakkapick.in | Best Office Chair Under ₹10000 in India 2026 | none | 202 chars | No |
| 3 | search | zoutons.com | Amazon Office Chairs Under Rs. 10,000: Prices, August 2026 | 2026-08-21 | 201 chars | **Yes** |
| 4 | search | vaishaktalks.com | Best Office Chairs Under ₹10000 in India For Long Work Hours | 2026-08-13 | 201 chars | **Yes** |
| 5 | search | reviehub.in | 5 Best Office Chairs Under ₹10,000 in India (2026) – RevieHub… | 2026-10-09 | 202 chars | No |
| 6 | reddit | reddit.com | Chair Recommendations (Budget: 10-15k) | 2026-05-30 | none | No |
| 7 | reddit | reddit.com | Best ergonomic chair under ₹10k in India | 2026-05-02 | none | **Yes** |
| 8 | reddit | reddit.com | Sharing my experience buying my first ergonomic chair in pune | 2026-04-09 | none | **Yes** |

9 retrieved, 6 cited.

### What a snapshot looks like

Some examples, exactly as they arrived:

| Site | Snapshot text (about 200 characters) |
|---|---|
| deallooto.com | BEST OFFICE CHAIRS UNDER ₹10,000 IN INDIA (AUGUST 2026)  📅 20 Aug 2026, 12:52 pm 🏷️ Best Picks, Home  🏆 All Best Picks guides › this guide  If you work from home, the chair is the one purchase where... |
| featherlitestore.com | Showing 1–12 of 28 results  [Select] [Input]  * Bedroom Furniture6 * Beds2 * Side Tables4 * Dining Room Furniture6 * WFH Chairs28 * High Back Chairs14 * Medium Back Chairs13 * Mesh Chairs23 * Fabric... |
| productscanner.in | THE SHORT ANSWER  Pick  \| Best for  \| Approx. official price*  \| Why it made the list  \| Main catch --- \| --- \| --- \| --- \| --- Featherlite Amaze High Back  \| Best overall  \| ₹12,239  \| Strongest lon... |
| vaishaktalks.com | And if you enjoy this guide, consider subscribing to my YouTube channel for more work-from-home tech reviews and ergonomic setup tips.  MY TOP 5 BEST OFFICE CHAIRS UNDER ₹10000  If you just want the... |
| team-bhp.com | Page 13 of 24 « First < 3 4 5 6 7 8 9 10 11 12 13 14 15 16 17 18 19 20 21 22 23 > Last » 72 Photos    \| Search this Thread  \| Image 270,050 views  Image: Old 21st November 2020, 15:03  \|   #181 Soumen... |

## What I learned from the snapshots

**1. Every search snapshot is about 200 characters.** I have 23 of them across the three runs. The shortest is 201 characters and the longest is 204. Each one ends in "...". I never saw the longer, roughly 1,000-character snapshot that the Loom video mentions.

**2. Reddit sources have no snapshot at all.** All 7 Reddit threads arrived with a title, a URL and an exact timestamp, but no text.

**3. The snapshot is plain text made from the page.** Headings show up in capitals. Form controls show up as `[Select]` and `[Input]`. Tables show up with `|` separators. So the page was converted to text before it was stored.

**4. The snapshot does not always start at the top of the page.** In my first run I thought it did, because several started with menus and breadcrumbs (pakkapick.in, featherlitestore.com, flipkart.com). The later runs showed otherwise. The vaishaktalks.com snapshot starts mid-article, and the productscanner.in one starts at its summary table. So some selection is happening, but I cannot say how.

**5. The same page gave the same snapshot twice.** Four URLs appeared in both run 1 and run 3, about 40 minutes apart. All four had identical snapshot text. That fits the idea of a stored copy. It is not proof, because a live fetch of an unchanged page would give the same text. If there is a stored copy, it belongs to the search system. It is not the prompt cache that OpenAI documents for its API, which stores no page content at all. The difference, and a test that could settle it, are in [07-how-an-answer-is-made.md](07-how-an-answer-is-made.md#how-to-tell-a-cached-page-from-a-fresh-one).

**6. A snapshot can be useless and the page still gets retrieved.** The team-bhp.com snapshot is nothing but page numbers from a forum thread. It was retrieved and not cited.

## What I learned about retrieved vs cited

**Half of what was retrieved got cited.** 15 of 30. Ahrefs found the same share (about 50%) across 1.4 million prompts. With three runs my number could be luck, but it is in the same place.

| | Retrieved | Cited | Share |
|---|---|---|---|
| Web search | 23 | 11 | 48% |
| Reddit | 7 | 4 | 57% |
| All | 30 | 15 | 50% |

**Position mattered more than anything else I could measure.**

| Position in the search results | Retrieved | Cited |
|---|---|---|
| First four (0 to 3) | 12 | 9 |
| Fifth onward (4+) | 11 | 2 |

**A publish date did not help.** Among web results, pages with a date were cited 7 times out of 14. Pages without one were cited 4 times out of 9. The freshest dated page in the whole set, reviehub.in, was updated the same day. It was retrieved in two runs and cited in neither.

**The same page can be cited in one run and ignored in the next.** Four URLs appeared in both run 1 and run 3:

| Page | Run 1 | Run 3 |
|---|---|---|
| deallooto.com, best office chairs under ₹10,000 | position 1, cited | position 0, cited |
| pakkapick.in, best ergonomic office chairs | position 0, not cited | position 1, cited |
| pakkapick.in, best office chair | position 5, cited | position 2, not cited |
| reviehub.in, 5 best office chairs | position 6, not cited | position 5, not cited |

The two pakkapick.in pages swapped. Same site, same snapshots, opposite outcome. So a single run is not enough to say a page "gets cited".

**Naming a brand in the query pulled in that brand's own pages.** The run 2 query named Green Soul. Four of the eight web results were from greensoul.online, and three of those were cited, including Green Soul's own "best office chair under Rs 15,000" blog post. The brand name was added by ChatGPT, not by me. So a choice the model made from its own learned associations, before searching, decided a good part of what the search returned.

**Reddit is its own channel.** Reddit results are tagged `reddit`, not `search`, and are numbered after the web results. Six of the seven threads came from one subreddit, r/ErgonomicIndia.

**Some links in the answer were never retrieved.** In runs 1 and 2 the answer linked to brand home pages such as greensoul.online, wakefit.co, featherlitestore.com and ikea.com/in. None of these are in the source list. The model wrote those links itself.

## Personalisation (run 1 only)

Run 1 started with a personalisation step. The response lists two of my past chats as context, each tagged with `category: "memory"` and `attribution: "Past chat"`. The turn was labelled "personal context" instead of "shopping".

I never typed "India" or "office" in run 1, yet both are in the search query, and the answer talks about "long coding and desk-work sessions". The response shows that the past chats were made available to the model. It does not prove they caused those words to be added, but it is the obvious explanation. OpenAI's documentation says memory can be used to shape the search queries ChatGPT sends, so this is the system working as described.

For anyone measuring fan-out queries this matters a lot. A logged-in account with history will not give the same queries as a fresh one. Runs 2 and 3 did not repeat the personalisation step, but they were in the same conversation, so they are not clean either.

## Caveats

- Three runs, one account, one conversation, one evening. These are leads to test, not rules.
- "Retrieved" means the source was listed in the response. It does not prove the model read the whole page.
- "Cited" means a citation tag pointed to it. A page can shape an answer without being cited.
- The capture shows what happened, not why. Where this page says where something "came from", that is my reading, supported by the sources in [07-how-an-answer-is-made.md](07-how-an-answer-is-made.md).
- Runs 2 and 3 were parsed by the first version of the extension. Its output listed a few internal chatgpt.com links under "links not retrieved". That was a parser bug and is fixed.
