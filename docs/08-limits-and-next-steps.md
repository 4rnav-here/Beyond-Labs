# 8. Limits and next steps

I would rather be clear about what this project does not show than have someone find out later.

## What I am confident about

- ChatGPT sends its search query, its retrieved sources, a short text snapshot of each source and its citation links to the browser. I captured all four.
- The search query is a rewritten version of the prompt, with a category, a year, intent words and brand names added.
- Retrieved and cited are different sets. In my runs half of the retrieved sources were cited.
- Web search and Reddit arrive as separate channels.
- Logged-in answers can be personalised from past chats before the search runs.
- Gemini's response for a shopping question is built around Google Shopping product records.
- The extension captures ChatGPT and Gemini responses live.

## What I am not confident about

**Sample size.** Three ChatGPT runs and one Gemini run. All on one account, in one evening, about one topic. The three ChatGPT runs were in the same conversation. Every pattern I describe needs many more runs before I would call it a rule.

**Only one search query per answer.** I do not know whether that is because I was in instant mode, because the question was simple, or because more queries run on the server and are not sent to the browser. I did not test thinking mode.

**The long snapshot.** The Loom video describes a second snapshot of about 1,000 characters. I never saw one. All 23 of mine were about 200 characters. Others have measured long snippets on a different search back end, so it may depend on the account or the country.

**Whether the snapshot is a stored copy.** The same page gave identical text in two runs 40 minutes apart. That fits a stored copy but does not prove it.

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

## What I would do next

In order:

1. **Run a prompt that returns YouTube videos** and check the YouTube fields. This closes the biggest gap against the task brief.
2. **Capture logged out or in a temporary chat**, to remove personalisation and conversation context.
3. **Run the same prompt 10 times in fresh chats** and measure how much the query and the citations change.
4. **Try thinking mode** and see whether the number of queries goes up.
5. **Try a free account**, to look for the long snapshot.
6. **Save a Claude capture** and test its reader.
7. **Find Gemini's query text**, starting from the place where the "Searching the web" label appears.
8. **Run Perplexity and Grok.**
9. **Compare with the official OpenAI API** for the same prompt.
10. **Check what a snapshot is made from.** Fetch the live page, convert it to text, and see where the 200 characters come from. For YouTube, compare the snapshot with the video description and with the transcript.
11. **Automate** with a scripted browser, as described in [07-scaling.md](07-scaling.md).

## Open questions I find interesting

- Why did the two pakkapick.in pages swap between cited and not cited when nothing about them changed?
- When ChatGPT adds a brand name to the query and that brand's own blog comes back and gets cited, is that a fair result or a loop?
- ChatGPT and Gemini had one web page in common for the same question. How different are the answers a person gets depending on which assistant they ask?
