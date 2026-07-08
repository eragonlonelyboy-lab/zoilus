# Lenses: interactive, not blind

## The conflict

ZOILUS law 1 is blind to the maker: a critic sees ONLY the artifact and the rubric. Never the maker's reasoning, never their intent, never a question and answer exchange with them. That is what keeps the panel honest, and it is non-negotiable.

But a blind critic therefore has no channel to ask the human anything. It gets one input and returns one verdict. It cannot pause, cannot request the stack trace it lacks, cannot check an assumption, cannot wait for the result of an experiment.

Six source prompts require exactly that:

- #14, #44, #82, #141: ask the human clarifying questions before producing.
- #15 ("Debug It With Me"): asks for expected vs actual behaviour, the exact error, the reproduction, and then WAITS for the result of each proposed check before continuing.
- #142 ("Explain This Code at 3 Levels"): surfaces assumptions to the human about code it cannot see, and pitches the explanation at the human's depth.

An interactive prompt cannot be a blind rubric. Asking is the mechanism, and the blind panel forbids the mechanism.

## What happened before

These were dropped rather than reconciled. Prompts #15 and #142 contributed zero content to ZOILUS: they did not become rubrics, and no other home was defined for them. The conflict was real, the resolution was absent, so the material was quietly lost. That is the honest history.

## The resolution

Two categories, kept apart on purpose:

- **Rubrics** (`references/rubrics/`) are blind and non-interactive. They are scoring bars handed to an independent critic that sees the artifact and nothing else. They fire and forget.
- **Lenses** (`references/lenses/`) are interactive and run WITH the human, outside the blind panel. They pause, ask, wait, and teach. They produce understanding and diagnosis, not a score.

State it plainly: the blind panel cannot host an interactive lens. A lens invoked inside the panel degenerates into guessing, because the party it needs to ask is not present. Lenses run in conversation, before or after a review, never as a panel member.

#44 and #82 already found their home as LOGOS modes (Refine and Construct), which are likewise invoked conversationally and not as panel critics. The two remaining harvested lenses live here:

- `debug.md` (from #15): pin down the gap, ranked hypotheses, test one at a time, isolate, root cause and lesson.
- `explain-code.md` (from #142): the gist, guided walkthrough in execution order, senior-engineer view, the one concept to learn.
