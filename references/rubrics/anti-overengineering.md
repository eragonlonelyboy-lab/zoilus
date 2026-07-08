# Rubric: anti-overengineering

World-class bar for a technical approach or stack choice: the simplest thing that ships THIS project, matched to the maker's skill and constraints. Reject resume-driven architecture.

## Blocking checks
- **"Deliberately NOT using" is stated.** A world-class recommendation names the popular tools and patterns it is avoiding, microservices, Kubernetes, a message queue, a separate mobile app, premature caching, each with one line on why it is overkill *here*. If the choice cannot say what it is refusing, it has not been reasoned. (Discipline harvested from prompt #73.)
- **Matched to the maker.** The stack fits the stated skill level and top priorities (speed to launch, low cost, solo-maintainable, hireable-later), not what is trendy. A mismatch is a blocking finding.

## Quality checks
- One stack picked and defended, not five options listed.
- **Safe to defer.** The one decision that can be postponed without painting into a corner, plus the signal that says it is time to revisit.
- Boring, well-documented, widely-hired tools over clever ones.
- Fastest path to a real v1 in front of users, with the riskiest/slowest step flagged.

## Verdict
FAIL if the approach cannot name what it is deliberately not using, or the choice is mismatched to the maker's real constraints. Otherwise confirm the deferral and the fastest path.
