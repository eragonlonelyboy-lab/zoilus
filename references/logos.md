# LOGOS: the prompt engine

LOGOS forges instructions. It is an engine inside ZOILUS (also callable standalone). Three modes; the creative rewrite is yours to perform, the re-forge scaffolding is deterministic (`lib/logos.js`).

## Construct (harvested from prompt #82)
Design a reusable system prompt / agent that does one job well, every time.

### Intake
Ask a focused set of questions covering: the assistant's **Role** and expertise, who it serves, the **tone and personality**, what it should **ALWAYS** do, what it should **NEVER** do, how it handles **missing information** or requests **outside its scope**, and the exact response format. Ask only what is needed, grouped so the user can answer quickly, then wait. Ask up to 2 clarifying questions only if the goal is unclear enough to change the result. If the user says just proceed, make sensible assumptions and note them.

### Deliverable 1: the system prompt
A clean, copy-paste-ready prompt, written in the second person to the assistant, with every one of these sections present and labelled:
- **Role**: the expert identity and the one job it does well.
- **Context**: what it is given, who it serves, where it runs.
- a precise **task**,
- **tone and personality**: how it sounds, and the register it never drops out of.
- an exact **output format**,
- **ALWAYS**: what it must always do.
- **NEVER**: what it must never do.
- how to handle **missing information** or requests **outside its scope**: what to ask for, what to refuse, and how to say so.
- explicit **constraints**,
- 1-3 **clarifying questions embedded** in the prompt itself (so the assistant asks the user before answering),
- clearly labeled `[PLACEHOLDERS]` for anything the user must supply, so it stays reusable.

### Deliverable 2: one "worked example"
One short sample user request and the ideal response, so the target behaviour and format are locked in by demonstration. A format described in prose drifts; a format shown once holds.

### Deliverable 3: "tuning notes"
2 or 3 lines on how to adjust the prompt later (stricter, more concise, more creative), and name the one line most likely to need editing.

Quality bar: self-contained, unambiguous, and robust to unusual requests, so the assistant stays in character and on-format every time. A stranger could paste it and get a strong result on the first try. Clarity over length. No em dashes.

## Refine (harvested from prompt #44)
Diagnose why a rough prompt underperforms, then rewrite it.

### Intake
Capture before diagnosing:
- **the outcome this prompt serves**: the decision or result the user actually wants out of it, not the text they want back.
- **what will run it**: ChatGPT, Claude, an app, a coding agent.
- **who reads the output**: the audience whose standards the rewrite must meet.

If the goal is unclear enough to change the rewrite, ask up to 2 clarifying questions first. Otherwise proceed.

### Output
1. **Diagnosis**: check it against role, context, specific task, constraints, output format, examples, and success criteria. Say concretely what each gap costs in the output.
2. **Improved prompt**: the clean rewrite (structure as in Construct).
3. **Clarifying questions to embed**: the 1-3 questions the AI should ask the user before answering, written into the prompt itself.
4. **"key upgrades"**: one line each naming what changed and why it improves the result.

## Re-forge (the loop step: deterministic scaffold)
Inside a ZOILUS review loop, when the panel returns FAIL, LOGOS folds the named failures into the producer's instruction as explicit MUST-FIX constraints so the next attempt cannot repeat them.

`lib/logos.js` → `forgeRetry(priorPrompt, failures)` appends a `## MUST FIX` block listing every failure; `isReforged(prior, next)` asserts the instruction actually changed (a loop-safety invariant, a re-forge that changes nothing is a bug, not a pass).

The creative improvement of the producer's own reasoning is the LLM's job; injecting the failures as hard constraints is deterministic and testable.
