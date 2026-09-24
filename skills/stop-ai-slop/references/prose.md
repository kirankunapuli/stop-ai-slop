# Generated prose

Reference for [SKILL.md](../SKILL.md). Agents write more prose than code: commit messages, pull request descriptions, docs, changelogs, review comments, and replies. The core test and the portability test apply unchanged.

## Words to cut

- **Inflation:** seamless, robust, comprehensive, holistic, world-class, best-in-class, mission-critical, turnkey, next-generation, state-of-the-art, cutting-edge, pivotal, paramount, transformative, game-changing, industry-leading, meticulous, intricate.
- **Startup filler:** leverage, utilize, unlock, unleash, supercharge, double down, move the needle, at scale, deep dive, circle back, north star, synergy, ecosystem, landscape, journey.
- **Empty adverbs:** just, really, simply, actually, truly, fundamentally, importantly, crucially, literally.
- **Empty openers:** "It's worth noting", "It's important to note", "At the end of the day", "When it comes to", "In today's world", "The reality is", "Let's dive in", "Needless to say", "In order to".

## Prefer the plain verb

use over leverage, utilize, facilitate, or empower. build over architect. help over enable. decide over make a decision. can over has the ability to. is over serves as.

## Patterns to cut

- **Warm-up sentences.** "Here's the thing", "Let me be clear", "The uncomfortable truth is". Delete and start at the point.
- **Setup-then-reveal contrast.** "It's not X, it's Y." Say Y. Same for "not just X but Y" and stacked negations.
- **"Nobody tells you" hype.** "What most people get wrong", "The part everyone misses". Drop the flattery and state the claim.
- **Colon drama.** A noun phrase, a colon, a lowercase payoff on the next line. Write one plain sentence.
- **Dangling explanation clauses.** Trailing `-ing` phrases that pretend to explain: "highlighting", "underscoring", "showcasing", "reflecting". Replace with the actual consequence.
- **Significance inflation.** "Stands as a testament", "plays a vital role", "marks a pivotal moment", "underscores its significance". State the fact and let the reader judge.
- **Encore paragraph.** A closing paragraph that restates the piece, or a final "deep" line. End on the last concrete point or next action.
- **Stage directions.** "That last part matters", "The key point is", "As you can see", "In other words". Cut when the point is clear.
- **Unnamed authority.** "Experts agree", "studies show", "widely regarded as". Name the source or drop the claim. Never invent one.
- **Word rotation.** Swapping synonyms instead of repeating the clear word. "The agent reviews the draft. The assistant scores it. The tool fixes it" becomes "The agent reviews, scores, and fixes the draft."
- **Verb inflation.** Prefer "is" and "has". "Serves as a centralized hub" becomes "tracks X, Y, and Z".
- **Decoration.** Emoji in headings, bold sprinkled mid-sentence, a bullet list where two sentences read better, headers over two-line sections, em dashes used as rhythm.

## Specifics beat abstraction

"Improved efficiency" becomes "cut deploy time from 40 minutes to 4". Numbers, names, dates, and mechanisms.

## Preserve the writer's voice

Keep real uncertainty, humour, bluntness, self-interruption, and digressions. Fix the AI patterns. Do not smooth distinctive writing into generic polish.

## Commit messages

- Imperative mood, subject 50 characters or fewer, no trailing period: `fix token expiry check`, not `Fixed the token expiry check.`
- No "This commit", no "I", no filler such as "minor", "various", or "some".
- Body only when the why is not obvious. Wrap at 72.
- No emoji, no `Generated with ...` footer, no tool attribution.
- Follow Conventional Commits when the repository already does.

## Pull request descriptions

- Lead with what changed and why. Do not restate the title under `## Summary`.
- Do not checklist the diff back to the reviewer.
- Link the issue. State how it was tested.
- Cut "Please review", "Let me know if", and "I hope this helps".

## Docs and changelogs

- Front-load the point. Do not restate the heading in the first sentence.
- Cut "In this section we will", "It's important to note", "Simply", and "Just".
- Changelog entries describe the user-visible change and the version, not the commit log.
