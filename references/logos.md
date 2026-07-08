# LOGOS — the prompt engine

LOGOS forges instructions. It is an engine inside ZOILUS (also callable standalone). Three modes; the creative rewrite is yours to perform, the re-forge scaffolding is deterministic (`lib/logos.js`).

## Construct (harvested from prompt #82)
Design a reusable system prompt / agent that does one job well, every time.

Ask up to 2 clarifying questions only if the goal is unclear enough to change the result. Then produce a copy-paste-ready prompt with:
- an expert **role**,
- the needed **context**,
- a precise **task**,
- explicit **constraints**,
- an exact **output format**,
- 1-3 **clarifying questions embedded** in the prompt itself (so the assistant asks the user before answering),
- clearly labeled `[PLACEHOLDERS]` for anything the user must supply, so it stays reusable.

Quality bar: a stranger could paste it and get a strong result on the first try. Clarity over length. No em dashes.

## Refine (harvested from prompt #44)
Diagnose why a rough prompt underperforms, then rewrite it.

1. **Diagnosis** — check it against role, context, specific task, constraints, output format, examples, and success criteria. Say concretely what each gap costs in the output.
2. **Improved prompt** — the clean rewrite (structure as in Construct).
3. **Key upgrades** — one line each naming what changed and why it improves the result.

## Re-forge (the loop step — deterministic scaffold)
Inside a ZOILUS review loop, when the panel returns FAIL, LOGOS folds the named failures into the producer's instruction as explicit MUST-FIX constraints so the next attempt cannot repeat them.

`lib/logos.js` → `forgeRetry(priorPrompt, failures)` appends a `## MUST FIX` block listing every failure; `isReforged(prior, next)` asserts the instruction actually changed (a loop-safety invariant — a re-forge that changes nothing is a bug, not a pass).

The creative improvement of the producer's own reasoning is the LLM's job; injecting the failures as hard constraints is deterministic and testable.
