# 8. Limits and next steps

I would rather be clear about what this project does not show than have someone find out later.

## What I am confident about

- ChatGPT sends its search query, its retrieved sources, a short text snapshot of each source and its citation links to the browser. I captured all four.
- The search query is a rewritten version of the prompt, with a category, a year, intent words and brand names added.
- Retrieved and cited are different sets. In my runs half of the retrieved sources were cited.
- Web search and Reddit arrive as separate channels.
- Logged-in answers can be personalised from past chats before the search runs.
- Gemini's response for a shopping question is built around Google Shopping product records.
- "Learning", "memory", "prompt cache" and "search cache" are separate mechanisms. OpenAI documents the first three to different degrees, and the prompt cache holds no web content.
- The extension captures ChatGPT and Gemini responses live.

## What I am not confident about

**Sample size.** Three ChatGPT runs and one Gemini run. All on one account, in one evening, about one topic. The three ChatGPT runs were in the same conversation. Every pattern I describe needs many more runs before I would call it a rule.

**How many search queries per answer.** My three recorded runs sent one each. A later attempt sent two, but I only kept the query strings, not a full capture. So I know more than one is possible on my account. I do not know what decides it: the mode, the wording, or the conversation so far. I did not test thinking mode.

**Why those brands.** The brand names appeared before any search ran, so they did not come from results. I believe they come from the model's training, and an independent study found the same pattern in 28.6% of buying-question runs. But I cannot see inside the model. I cannot say why Featherlite and Green Soul were picked over other brands, or why the third brand changed.

**Where Zodiac Pro came from.** It appeared in the second query of the two-query run and not in the first. It may have come from the model or from the first query's results. The query text cannot settle it.

**The explanation rests on other people's work.** Everything in [07-how-an-answer-is-made.md](07-how-an-answer-is-made.md) beyond my own captures comes from OpenAI's documentation or from independent studies. Three of the sources were opened and checked directly: OpenAI's prompt caching guide, the Ahrefs fan-out study and the Radyant study. The others could not be re-opened, and [09-references.md](09-references.md) marks which. The prompt cache details are documented for the API, and I am assuming the app is similar.

**The long snapshot.** The Loom video describes a second snapshot of about 1,000 characters. I never saw one. All 23 of mine were about 200 characters. Others have measured long snippets on a different search back end, so it may depend on the account or the country.

**Whether the snapshot is a stored copy.** The same page gave identical text in two runs 40 minutes apart. That fits a stored copy but does not prove it. A study of the retrieval side reports a cache of fetched pages, which would explain it, but that is an outside finding and not something OpenAI has confirmed.

**What the model actually read.** The browser gets 200 characters per source. The model may have been given more than that. I can only see what is sent to the page.

**Whether a retrieved page influenced the answer.** A page can be retrieved and ignored, or retrieved and used without being cited. Citations show credit, not influence.

**YouTube.** The task brief talks about YouTube metadata: channel, followers, views, likes, description. None of my prompts returned a YouTube source, so that part of Task 1 is not demonstrated. The reader is written but untested.

**ChatGPT product results.** Run 3 used product records. My parser did not extract them at the time, and the reader I added since is untested.

**Gemini queries.** I can see that Gemini searched. I cannot see what it searched for.

**Claude.** I looked at it by hand and have no saved capture. What I say about it is an impression.

**Perplexity and Grok.** Not tested at all.

**Things other researchers reported that I did not find.** Per-result scores, a "should fetch" flag, runner-up sources, and a label for which back end served each result. None of these were in my capture.

## Mistakes I made along the way

I am listing these because they are the kind of mistake anyone doing this will make.

1. **Looking at request names instead of responses.** My first attempt was a screenshot of the Network tab's request list. Names like `prepare`, `finalize` and `flush` told me nothing. The data was inside the response of one request, `conversation`.
2. **Thinking the snapshot is always the top of the page.** True for my first run, not for the next two.
3. **Reading Gemini's product links as search queries.** They look like queries. They are Google Shopping product cards.
4. **Joining all the answer text.** ChatGPT sends the answer as fragments and also as a merged copy, so I got it twice.
5. **Trusting the last copy of the source list.** It has no snapshots.
6. **Counting internal links as outside pages.** The first version of the parser listed ChatGPT's own product-search links as "linked but never retrieved".
7. **Treating "cache" as one thing.** I asked whether ChatGPT "caches" pages as if there were one cache. There are several, and the one OpenAI documents best (the prompt cache) is not the one that would hold a page snapshot.
8. **Not saving the two-query run.** The most interesting fan-out I saw is the one I have the least data for.

## What I would do next

In order:

1. **Run a prompt that returns YouTube videos** and check the YouTube fields. This closes the biggest gap against the task brief.
2. **Capture logged out or in a temporary chat**, to remove personalisation and conversation context.
3. **Run the same prompt 10 times in fresh chats** and measure how much the query and the citations change. In particular, count how often each brand appears in the query. That would show how stable the model's choice of brands is.
4. **Capture a multi-query run in full.** Record the order of the queries and which results each one returned. That is the only way to tell whether a name in a later query came from the results of an earlier one.
5. **Test caching with a page I control.** Publish a page with a unique marker, log every request to it, ask ChatGPT about it, change the marker and ask again. The steps and how to read the results are in [07-how-an-answer-is-made.md](07-how-an-answer-is-made.md#how-to-tell-a-cached-page-from-a-fresh-one).
6. **Turn memory off and on** for the same prompt, to see exactly which query words personal memory adds.
7. **Try thinking mode** and see whether the number of queries goes up.
8. **Try a free account**, to look for the long snapshot.
9. **Save a Claude capture** and test its reader.
10. **Find Gemini's query text**, starting from the place where the "Searching the web" label appears.
11. **Run Perplexity and Grok.**
12. **Compare with the official OpenAI API** for the same prompt. The API returns a search trace, and it reports how many prompt tokens were served from the prompt cache, which the app does not show.
13. **Check what a snapshot is made from.** Fetch the live page, convert it to text, and see where the 200 characters come from. For YouTube, compare the snapshot with the video description and with the transcript.
14. **Automate** with a scripted browser, so the same prompts can be run many times.

## Open questions I find interesting

- Why did the two pakkapick.in pages swap between cited and not cited when nothing about them changed?
- When ChatGPT adds a brand name to the query and that brand's own blog comes back and gets cited, is that a fair result or a loop?
- ChatGPT and Gemini had one web page in common for the same question. How different are the answers a person gets depending on which assistant they ask?
- If the brands in a query come from training, a brand that is new or rarely written about starts with a disadvantage before any search happens. How large is that effect, and can a good page overcome it through the search results alone?
