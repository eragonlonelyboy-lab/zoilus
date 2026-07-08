# Rubric: correctness

World-class bar for whether the code does what it is supposed to do. Every finding must name the concrete input or condition that triggers the wrong behavior. A claim with no triggering input is not a finding, it is a guess. Reject on doubt.

## Blocking checks
- **Any input that produces a wrong result.** Trace a concrete value through the logic to an output that contradicts the intent. Name the input, the expected output, and the actual output. A single such case is a blocking FAIL.
- **Any input that crashes.** A value that reaches an unhandled throw, panic, null dereference, or divide-by-zero on a path real callers hit is a blocking FAIL. Name the value.
- **Off-by-one and boundary logic.** Wrong comparison (`<` vs `<=`), wrong loop bound, wrong slice index, fencepost error. Name the boundary input (first, last, empty, single element) that exposes it.
- **Wrong operator or inverted condition.** A `&&` that should be `||`, a negated guard, an assignment where a comparison was meant. Name the input where the branch goes the wrong way.
- **Mishandled return values.** An error code, null, sentinel, or partial result ignored or misread so downstream logic proceeds on bad data. Name the upstream condition that returns it.
- **Race conditions.** Shared state mutated without synchronization on a path two callers can hit concurrently. Name the interleaving that corrupts state or loses a write.

## Quality checks
- Input assumptions stated and true. Any assumption about range, format, ordering, or non-null that the caller can violate is a finding.
- The happy path and the stated intent actually agree. Code that is internally consistent but solves the wrong problem is a finding.

## Verdict
FAIL if any concrete input produces a wrong result, a crash, or corrupted state. Every FAIL names its triggering input. Otherwise surface assumption gaps.
