# Rubric: code

World-class bar for general code quality. A blind reader must find it obvious, idiomatic, and free of avoidable cruft. Reject on doubt.

## Blocking checks
- **Silently swallowed errors.** An empty catch, a discarded error return, a bare `except: pass`, or a promise with no rejection path hides failure. If an error can be dropped without a trace, it is a blocking FAIL. Name the line and the failure it eats.
- **Resource leaks.** A file, socket, connection, lock, or handle opened on a path that can return or throw before release is a blocking FAIL. The cleanup must hold on every exit, including the error path. Name the leaking resource and the escape route.
- **Duplication of existing logic.** Reimplementing a helper, constant, or function that already exists in the codebase or standard library is a blocking FAIL. Cite the existing thing it should have called.

## Quality checks
- Naming reveals intent. A name that lies, abbreviates without reason, or forces the reader to guess the type is a finding.
- Idiom for the language. Reaching past the language's normal construct for a hand-rolled one is a finding unless justified.
- Dead code. Unreachable branches, unused variables, commented-out blocks, and orphaned imports are findings. Flag pre-existing dead code, do not silently delete it.
- No impossible-scenario error handling. A try/catch or validation guarding a path the caller cannot produce is noise. Flag it.
- Surgical. If the change refactors, reformats, or renames untouched adjacent code, that is scope creep and a finding.
- Readability. If a senior reader must trace state twice to follow the control flow, the code is too clever. Prefer the obvious form.

## Required output of a code review
A critique is not a code review. The review is incomplete unless it delivers all five, in this order:

1. **"what it does"**: a plain-language summary first, so the maker can confirm the critic read it as intended. A misread caught here costs nothing; a misread caught after the critique costs the whole review.
2. **Bugs and edge cases, ranked**: worst first, each with the concrete input or condition that triggers it, what goes wrong, and the fix. Include the edge cases the code silently ignores (empty, null, huge, concurrent, malformed input).
3. **security AND performance**: injection, auth, secrets, unsafe input handling, plus anything that will get "slow or costly at scale". Each with why and a fix. Both halves are required; a review that names only one has covered half the risk.
4. **"cleaner version"**: a rewritten version that is more correct, readable, and idiomatic for this language, with brief inline comments only on the lines that changed and why. Keep behaviour the same unless a change fixes a bug, in which case flag it. Naming a flaw without showing the corrected code leaves the fix unproven.
5. **"one thing done well"**: a specific, genuine positive, not flattery. This exists because a critic that can only find fault is uncalibrated: if it never registers what is right, its findings carry no information about what is wrong. Naming the one thing done well is the proof the critic can tell good code from bad, not just complain.

## Assumptions, not guesses
If the intent is unclear, or the snippet depends on code not shown, "state your assumption" rather than "guessing silently". An assumption written down can be corrected by the maker. A silent guess becomes a manufactured fault.

## Verdict
FAIL on a swallowed error, a resource leak, or duplication of logic that already exists. Otherwise judge readability, naming, idiom, and scope discipline, and name every finding by line. Also FAIL the review itself if it omits any of the five required outputs above. If the code is basically fine, say so rather than manufacturing issues.
