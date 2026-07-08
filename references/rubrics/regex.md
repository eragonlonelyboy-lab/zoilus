# Rubric: regex

World-class bar for a regular expression. Reject on doubt.

## Blocking checks
- **Correctness against both sets.** It must match every SHOULD-match example and reject every SHOULD-NOT example. Missing either is a blocking FAIL.
- **Proof table required.** A world-class answer ships a proof table of at least 5 matches and at least 5 rejects, including at least two tricky near-misses, each with the expected result. No proof table = FAIL (the author did not verify).
- **Catastrophic backtracking (ReDoS).** Reject any pattern that can backtrack catastrophically on adversarial input. Nested quantifiers like `(a+)+`, `(a*)*`, `(.*)*`, or overlapping alternation under a quantifier are the classic flaw class. If present, it is a blocking FAIL with a safer linear rewrite.
- **Anchoring and scope.** Whole-string vs substring, `^`/`$` vs `\b`, and the flags (`i`, `m`, `g`, `s`) must match the stated intent. A silent whole-string-vs-substring mismatch is blocking.

## Quality checks
- Simplest correct pattern over a clever dense one. Unreadable = a finding.
- Unicode / encoding handling stated where it matters.
- Escaping correct for the target flavor when embedded in code.
- If a regex is the wrong tool for the job, the answer says so and names the better approach.

## Verdict
FAIL if any SHOULD/SHOULD-NOT case breaks, no proof table, or a nested-quantifier ReDoS risk exists. Otherwise judge readability and note improvements.
