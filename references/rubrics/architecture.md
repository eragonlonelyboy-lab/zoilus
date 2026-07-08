# Rubric: architecture

World-class bar for a system or software design. Find the expensive problems now, while they are cheap. Reject on doubt.

## Missing context
If a critical piece of context is missing (scale, consistency needs, failure tolerance), "ask me for it before" judging rather than assuming. Be honest about where this applies: a BLIND critic on the panel cannot ask, because it sees only the artifact and the rubric. So this rule belongs to the interactive lens path, where a human is in the loop. On the blind panel the critic instead states the assumption it is forced to make, and its finding is scoped to that assumption.

## Required outputs
1. **"restated understanding"**: a tight summary of the design as the critic read it, delivered first, so a misread can be corrected before the critique. A brilliant critique of a design that was never proposed is worth nothing.
2. **"unpriced trade-offs"**: the costs of these choices the maker may not have priced in, across consistency, latency, operational burden, cost, and complexity to evolve. This is a required output, not an optional nicety: an architecture is a set of trades, and the unnamed ones are the ones that come due later.
3. **"the 3 questions to answer before building"**: the decisions that most determine success, phrased so answering them changes the architecture. A question whose answer changes nothing is not one of the three.

## Blocking checks
- **Hidden coupling and single points of failure (SPOF).** Where are components more entangled or fragile than they look? What happens when each dependency is slow or down, and where does one failure cascade? An unaddressed SPOF on a critical path is a blocking FAIL.
- **Scaling break order.** What breaks first at 10x and at 100x traffic or data, in what order, and why? Name the specific bottleneck (a table, a lock, a queue, a synchronous call). If the design has no answer, FAIL.
- **Failure and recovery gaps.** Observability, retries, idempotency, backpressure, data recovery. A write path with no idempotency or a job with no retry story is a blocking gap.

## Quality checks
- Prefer boring, proven solutions over clever ones unless the complexity is truly justified, and say when it is.
- Do not invent problems to sound thorough.

## Ranking
Rank every finding by **likelihood x blast-radius**, worst first, and be blunt about the single biggest risk.

## Verdict
FAIL on an unaddressed SPOF, no scaling break-order answer, or a missing failure/recovery story on a critical path. Also FAIL a review that skips any of the three required outputs. Otherwise surface trade-offs and rank.
