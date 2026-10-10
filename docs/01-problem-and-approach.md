# 1. The problem and my approach

## The problem

When ChatGPT answers a question using web search, you only see the final answer. But the browser receives a lot more than that. Hidden in the network response are:

- the search queries the model wrote for itself (the "fan-out" queries),
- every page it retrieved,
- a short text snapshot of each page,
- and which of those pages it actually cited.

The key idea from the task brief is **"Retrieved is not the same as Cited."** ChatGPT pulls in more pages than it credits.

The task has three parts:

1. **Task 1.** Capture the network stream for one prompt and extract the citation snapshot for each source: URL, title, snippet and any metadata.
2. **Task 2.** From the same stream, extract the fan-out queries, and note which sources were retrieved and which were cited.
3. **Main task.** Do the same analysis on other assistants (Gemini, Claude, Grok, Perplexity), compare the structure with ChatGPT, and sketch or build a way to automate it.

## What the Loom video says

The video is 1 minute 42 seconds. My notes:

- It starts from a LinkedIn post by David Konitzny (Peec AI): "ChatGPT reads your YouTube description, not your transcript."
- The method is to open Chrome's developer tools, go to the network stream, and pull the data out of the response.
- The demo runs on a **logged-out, free** ChatGPT session with a standing-desk query. The Sources panel lists 13 sources.
- For each source, ChatGPT already holds a snapshot of the page. The video describes two sizes: a short one of about 150 to 200 characters and a longer one of about 1,000 characters.
- That snapshot data is in the network packets.
- The ask is a small system that captures this source data every time a query is run.
- The speaker says that even getting close counts as a good result.

The video never opens the Network tab itself, so it does not show which request to look at or what the fields are called. That part I had to work out.

## How I went about it

I did all of this in one evening, so I had to be practical. I did not take the time to understand every network call and every internal tool. I read enough to understand the flow, and then built something simple on top of it.

I used ChatGPT and Claude as research and coding assistants throughout. I say where below.

### Step 1: a first, too-broad question

I started by asking ChatGPT how I could see which pages it looked up and how it reached its answer.

The answer was correct but pointed the wrong way for this task. It was about:

- the Sources panel and clicking citations,
- OpenAI's official API, which can return a trace of the search,
- tools for recording what an AI application does, such as Langfuse.

Useful background, but none of it shows what the ChatGPT app itself sends to the browser. I kept the API idea for the scaling plan in [07-scaling.md](07-scaling.md).

### Step 2: narrowing to retrieval

I told it I only cared about the fan-out queries and the retrieval side, not how the answer is written.

That gave me the vocabulary I needed: query decomposition, query expansion, multi-query retrieval with rank fusion, metasearch, and iterative retrieval. These are in [02-research-notes.md](02-research-notes.md#background-what-fan-out-means-technically). It also gave me a list of what a good search trace should record, which I reuse in the scaling plan.

### Step 3: asking about the two snapshots

I asked whether my understanding from the video was right: that ChatGPT keeps two snapshots of each page, a compact one and a longer one of about 1,000 characters.

ChatGPT could not confirm it. It said there are real mechanisms that look like this (search snippets, opening a page for more text, cached content), but nothing public that proves two fixed-size stored snapshots. It suggested three different things the "two sizes" could be. Those are in the research notes too.

### Step 4: the Network tab, wrong way first

I asked ChatGPT for the best phones under 45k, opened the Network tab and took screenshots of the list of requests.

That did not help. The list showed names like `conversation`, `prepare`, `finalize`, `flush` and a lot of favicon requests for sites such as 91mobiles.com. The names say nothing about search. The favicon requests only hint at which sites appear in the answer.

The lesson: the data is not in the request list. It is **inside the response** of one request, the one named `conversation`. And because the answer streams, that response is one long stream of events.

### Step 5: finding the public research

In parallel I used Claude to search for what other people had already found. That turned up a group of SEO researchers who have been reading ChatGPT's network traffic for months, and gave me the field names to look for: `search_model_queries`, `search_result_groups`, `snippet`, `pub_date`. It also turned up measured numbers for the two snapshot sizes. All of this is written up in [02-research-notes.md](02-research-notes.md).

### Step 6: capturing one response by hand

I asked ChatGPT "Find the best chairs under 10k", opened the `conversation` request and copied the whole response into a text file. It was about 180 KB for one answer.

### Step 7: reading the raw response

I went through that file to find where the queries, sources and citations sit. I also gave the file to ChatGPT and to Claude and compared what each found.

This is where I learned that the public write-ups were already partly out of date. The citation format in my capture was different from the one the articles describe. I also found things I had not read about anywhere, like the source list being sent three times with different contents.

### Step 8: a parser, then an extension

First a single script that takes the raw response and returns clean JSON: prompt, queries, sources, cited or not. I checked its output against what I had counted by hand.

Then a Chrome extension around it. The extension captures the response automatically, runs the same parser, and shows the result in a side panel.

### Step 9: more runs

With the extension working, I ran two more ChatGPT prompts and one Gemini prompt, and looked at Claude by hand. I also copied the raw Gemini response and went through it.

### Step 10: fixing what the new runs exposed

The new captures showed three problems in the parser, which I fixed. They also showed that two things I believed after the first run were wrong. Both are listed in [08-limits-and-next-steps.md](08-limits-and-next-steps.md#mistakes-i-made-along-the-way).

## Choices I made

**Keep the first version simple.** I did not want to build a complicated system before I understood the data. That would only have added confusion. One hook, one parser file, no build step, no libraries.

**Focus on three platforms first.** ChatGPT, Gemini and Claude. Perplexity and Grok are covered from reading only.

**An extension instead of a scraper.** A browser extension reads my own session in my own browser. It does not need to get past bot detection, and it works on any assistant I am logged in to. A scripted browser would have spent most of the evening fighting Cloudflare. The scripted route is the right one for scale, and I describe it in [07-scaling.md](07-scaling.md).

**Always keep the raw response.** ChatGPT changed its response format several times between July and October 2026. If the raw text is saved, a parser fix can be re-run on old captures.

**Search by field name, not position.** The parser walks the whole response looking for known field names. Fields get moved around often, and this survives that.

**Say what I did not verify.** Where something comes only from someone else's write-up, or where a reader in the extension is untested, the docs say so.

## About the two snapshot sizes

I tried to understand the 150 to 200 character and 1,000 character snapshots from the video. I could not find anything official on it.

What I did find were third-party posts that measured two different search back ends with different snippet lengths: about 153 characters on one and about 1,100 to 1,200 on the other. So the two sizes in the video may be two back ends, not two copies of one page.

In my own captures, every search snippet was 201 to 204 characters. I never saw a long one. So I can confirm the short snapshot. I cannot confirm the long one, and I am not sure it still works the way the video describes. Details in [02-research-notes.md](02-research-notes.md#the-snapshot-and-its-two-sizes).
