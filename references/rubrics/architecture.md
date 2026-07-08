# Rubric: architecture

World-class bar for a system or software design. Find the expensive problems now, while they are cheap. Reject on doubt.

## Blocking checks
- **Hidden coupling and single points of failure (SPOF).** Where are components more entangled or fragile than they look? What happens when each dependency is slow or down, and where does one failure cascade? An unaddressed SPOF on a critical path is a blocking FAIL.
- **Scaling break order.** What breaks first at 10x and at 100x traffic or data, in what order, and why? Name the specific bottleneck (a table, a lock, a queue, a synchronous call). If the design has no answer, FAIL.
- **Failure and recovery gaps.** Observability, retries, idempotency, backpressure, data recovery. A write path with no idempotency or a job with no retry story is a blocking gap.

## Quality checks
- **Unpriced trade-offs.** The costs not accounted for across consistency, latency, operational burden, cost, and complexity-to-evolve.
- Prefer boring, proven solutions over clever ones unless the complexity is truly justified — and say when it is.
- The 2-3 decisions that most determine success, phrased so answering them changes the architecture.

## Ranking
Rank every finding by **likelihood x blast-radius**, worst first, and be blunt about the single biggest risk.

## Verdict
FAIL on an unaddressed SPOF, no scaling break-order answer, or a missing failure/recovery story on a critical path. Otherwise surface trade-offs and rank.
