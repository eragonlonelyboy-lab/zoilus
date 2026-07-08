# Rubric: spec

World-class bar for a version-1 spec or plan. Reject on doubt.

## Blocking checks
- **The riskiest assumption is named.** Every spec rests on one assumption that, if wrong, sinks it. If the spec does not name it — and the cheapest test to check it before writing much — that is a blocking FAIL. (This is the discipline harvested from prompt #39.)
- **One measurable "done" outcome.** There must be a single, checkable outcome that means "this worked." "Make it good" is not a criterion. Missing = FAIL.
- **Ruthless v1 scope.** A must-have list vs a later list, and every cut justified. If v1 is bloated past the smallest thing that still delivers real value, FAIL.
- **Buildable and unambiguous.** A capable builder could start tomorrow without getting stuck on an undefined term, a missing data shape, or an unstated dependency. Silent ambiguity is a blocking gap (this is the incumbent-Momus turf, out-ruthlessed: reject the 80%, not approve it).

## Quality checks
- Problem + specific user + how they solve it today, in plain language.
- Core user stories cover the main flow end to end, ordered by importance.
- Simplest tech approach that a small team or solo dev could execute — no overengineering (see anti-overengineering rubric).
- Skimmable; clarity over completeness.

## Verdict
FAIL if the riskiest assumption is unnamed, there is no measurable done-outcome, scope is not ruthless, or a builder would stall on ambiguity. Otherwise note tightening.
