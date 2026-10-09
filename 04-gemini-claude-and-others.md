# 4. Gemini, Claude and the others (main task)

The main task asks three things about other assistants:

1. Do they send search activity, sub-queries, sources or reasoning to the browser, and where?
2. How does the structure differ from ChatGPT?
3. Can the extraction be automated?

I got one real capture from Gemini. I looked at Claude by hand. I did not get to Perplexity or Grok, so those are covered from reading only.

## Short answer

| | Search activity visible? | Sub-queries visible? | Sources visible? | Response format |
|---|---|---|---|---|
| ChatGPT | Yes | Yes, as a named field | Yes, with snapshots and citation links | Named fields, sent as small patches |
| Gemini | Yes, as status labels | Not as a clear field in my capture | Yes: web links, plus full product records | Arrays inside arrays, no field names |
| Claude | Partly | I could not find a rewriting step | Yes | Typed blocks |
| Perplexity | Reported yes | Reported yes, but mostly a cleaned-up copy of the prompt | Reported yes | Named blocks |
| Grok | Reported yes | Reported yes, the most of any assistant | Reported yes | Not checked |

"Reported" means I read it in someone else's write-up and did not test it.

## Gemini

### What I captured

I asked Gemini the same kind of chair question and captured it two ways: by copying the raw response from the Network tab, and with the extension (22:25 IST). The answer was titled "Best Office Chairs Under ₹15,000", so it lines up with ChatGPT run 2.

The extension's output is in `samples/gemini/run-1-chairs.json`. It found 16 links and no queries.

### The 16 links are two different things

When I looked at the 16 links properly, they split into two groups.

**Ten are Google Shopping product links.** They look like `google.com/search?q=...` with a long product title in `q`, and they carry a product ID.

| # | Product title in the link | Product ID |
|---|---|---|
| 1 | Wakefit Safari Pro High Back Ergonomic Office Chair Chrome Base | 17651513333714095061 |
| 2 | Wakefit Safari Ergonomic Office Chair for Work \| 3 Year Warranty \| Single Lock and Recline \| Soft Armrest with 3 Dimension adjustability\| Strong Nylon | 994712915031540430 |
| 3 | Wakefit Albus Pro Highback Class 4 Gaslift Chrome Base with Soft PU Multi Lock Pad Ergonomic Office Chair Black | 1615874656015949010 |
| 4 | Green Soul Zodiac Pro \| Nylon Pvc \| Office Chair With Seat Slider \|Flybird Ergonomic Design\|4D Adjustable Armrest\|Multi Synchro Tilt Mechanism\| | 17444508714295932661 |
| 5 | Wakefit Maven MidBack Ergonomic Office Chair and Base | 6853227957766862768 |
| 6 | Drogo AeroFlex Ergonomic Office Chair for Work from Home | 17752484887963485885 |
| 7 | Wooden Street Pictor High Back Mesh Office Chair (Black) | 13149156921982417188 |
| 8 | Wakefit Gravita Ergonomic HighBack Office Chair White and Sea Green | 6298097730229436900 |
| 9 | Wakefit Gravita Ergonomic HighBack Office Chair | 12501229745765018985 |
| 10 | Wakefit Gravita HighBack Office Chair White and Grey Footrest | 12622089460237076504 |

Seven of the ten are Wakefit chairs. The other three are Green Soul, Drogo and Wooden Street.

**Six are ordinary web pages.**

| Web page | Kind of page | Also in ChatGPT run 2? |
|---|---|---|
| https://cellbell.in/collections/under-15k | Retailer category page | No |
| https://www.reddit.com/r/ErgonomicIndia/comments/1ryb053/best_ergonomic_chair_in_india_under_15k/ | Forum thread | Yes, retrieved but not cited |
| https://www.flipkart.com/furniture/chairs/office-study-chairs/pr?sid=wwe,y7b,foc | Retailer category page | No |
| https://www.ikea.com/in/en/cat/desk-chairs-20652/ | Retailer category page | No |
| https://www.nilkamalfurniture.com/collections/office-chairs | Retailer category page | No |
| https://www.woodenstreet.com/office-chairs-under-15000 | Retailer category page | No |

Five of the six are shop category pages. None is a review article. That is very different from ChatGPT, which mostly pulled review blogs for the same question.

### A mistake I made first, and the correction

My first reading was that Gemini rewrites the prompt into several long, descriptive search queries. The response is full of `google.com/search?q=` links with long text like "Wakefit Safari Ergonomic Office Chair for Work | 3 Year Warranty | Single Lock and Recline | ...", and they do look like detailed queries.

They are not. Each of those links has `ibp=oshop` and a `prds=...productid:...` value, which marks it as a Google Shopping product card. The long text in `q` is the product's listing title as written by the seller. So these links tell me **which products Gemini pulled**, not **which searches Gemini ran**.

I could not find a field in the Gemini response that clearly lists the search queries it wrote. The response does show that a search happened (see below), but not the query text in a form I could pick out.

### What the raw response shows

I read the raw response by hand and also asked ChatGPT to go through it. The findings:

| What | Evidence in the response | What it means |
|---|---|---|
| Search activity | The labels "Google Search", "Searching the web" and "Searched the web" | Gemini tells the page that it searched |
| Product retrieval | "Google Shopping" and a `shopping_content` structure | Product data comes from Google's shopping system, not from web snippets |
| Product records | Title, product ID, price in rupees, description, seller name, image links. Some have ratings and review counts | Each product arrives as a full structured record |
| Web links | Reddit, CellBell, WoodenStreet, Flipkart and others | Normal web results are there too |
| Model name | "3.6 Flash" | The response names the model |
| Final answer | Product summaries and a buying summary | Built from the records above |

One example record: Wakefit Safari Ergonomic Office Chair, ₹6,997, seller Amazon.in, with a long description covering armrests, seat slider, recline, gas lift and warranty.

Two more things I noticed:

- **The same product shows up several times in different shapes.** Once as a full record, once as a card for the page to draw, and once inside the written answer. This is one record being reused, not three separate lookups.
- **Product descriptions are much longer than ChatGPT's 200-character snapshots.** So for products, Gemini's response carries more text per item than ChatGPT's does for web pages.

### Gemini's response format

- The request to look for is named `StreamGenerate`.
- The response starts with the line `)]}'`. This is a guard and has to be removed first.
- After that come chunks. Each chunk has a number on its own line (its length) and then a JSON array.
- The useful chunk is tagged `wrb.fr`. Its content is JSON stored inside a text string, so it has to be decoded a second time.
- Inside, there are **no field names**. Everything is arrays inside arrays, and you find things by position.

This last point is why Gemini is hard to automate. In ChatGPT I can search for a field called `search_model_queries`. In Gemini there is nothing to search for. My parser just collects every URL it finds, which is how the product links and the web links got mixed together in the first version.

### ChatGPT vs Gemini on the same question

| | ChatGPT (run 2) | Gemini |
|---|---|---|
| Search query text | Visible: 1 query | Not found |
| Web sources | 11 (8 search, 3 Reddit) | 6 |
| Kind of web sources | Review blogs, a brand's blog, forum threads | Shop category pages and 1 forum thread |
| Text per web source | About 200 characters | None in the parsed output |
| Products | 5 image lookups, no product records | 10 Google Shopping records |
| Cited vs retrieved | Visible per source | Not worked out |
| Sources in common | 1 Reddit thread (retrieved, not cited) | The same thread |

My reading: for a shopping question, ChatGPT acts like a reader of review articles, and Gemini acts like a shopping search. Gemini leans on Google's own product database. ChatGPT leans on what other websites say about the products.

### What I would do next on Gemini

- Find where the search query text sits, if it is sent at all. The status labels prove a search ran.
- Follow one product ID through the whole response to map the record layout.
- Try a question that is not about shopping. I expect the product records to disappear and normal web sources with snippets to take over.

## Claude

Claude was the hardest for me to get anything out of.

On the surface, at least, it seems to take my query as it is, find the top websites that match, read them, and then answer. I could not find a clear step where it rewrites my prompt into different sub-queries the way ChatGPT does.

What I know about the format:

- The response is a stream of typed blocks. Each block has a start, some updates, and a stop.
- Anthropic's public API documents a web search as a block named `web_search`. The query is streamed in small pieces of JSON that have to be joined together. Search results come back in a separate result block.
- I expected the claude.ai web app to look the same. I have not confirmed that from a saved capture.

There is no Claude sample in this repo yet. The extension has a reader written from the API documentation, and it is untested.

<!-- TODO: add a Claude capture to samples/claude/ and fill in: the query it sent, the number of sources, and whether sources carry snippets. -->

One caution: I am describing what reaches the browser. Claude may do more on its servers that is never sent to the page.

## Perplexity and Grok (reading only)

**Perplexity**

- Streams from a request named `perplexity_ask`.
- The response is made of named blocks. Sources sit under `web_results`. Research steps sit in a plan block.
- A Peec AI study of 5 million queries found Perplexity averages 1.4 queries per prompt, and that it mostly strips filler words and searches a cleaner version of the prompt.

**Grok**

- The same study measured 6.8 queries per prompt, the highest of the three they looked at.
- It uses `site:` searches in 18.3% of chats, often `site:reddit.com`.
- It has strong bot detection, which makes automation harder.

The extension captures responses on both sites, with a general-purpose reader that looks for anything shaped like a source or a query. I have not checked its output on either.

## How the structures differ

| | ChatGPT | Gemini | Claude |
|---|---|---|---|
| Transport | Event stream | Chunked response with length prefixes | Event stream |
| Shape of the data | Named fields | Positional arrays | Typed blocks with named fields |
| How the answer is built up | Small patches applied to a message, in order | Chunks of nested arrays | Blocks that start, update and stop |
| Finding the queries | Search for a field name | No name to search for | Join the pieces of the search block's input |
| Finding the sources | A named list, grouped by site | Collect URLs by walking the arrays | A result block |
| Biggest trap | The source list is sent several times and only some copies have snapshots | Product links look like search queries | Not enough data yet |

The ChatGPT column is from my own captures. The Gemini column is from one capture plus reading. The Claude column is from Anthropic's API documentation.

## Can it be automated?

Yes, with one capture method and a separate reader per assistant.

- **Capture** is the same everywhere. The extension copies the response as it streams. It worked for me on ChatGPT and Gemini. It is set up for Claude, Perplexity and Grok too, but I have not run it there.
- **Reading** is different everywhere. ChatGPT's reader works. Gemini's reader gets links and products but not queries. The other three are first guesses.

The working example the task asks for is the ChatGPT one. How I would grow it is in [07-scaling.md](07-scaling.md).
