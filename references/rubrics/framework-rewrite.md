# Framework and rewrite boundary

Reject a rewrite or framework migration unless the artifact proves the current boundary is the cause of the named failure.

The critic must ask:

- What measurable failure cannot be fixed inside the current design?
- Which assumption makes a rewrite necessary rather than merely attractive?
- What is the cheapest discriminating spike that tests that assumption without committing the migration?
- What compatibility, rollback, data migration, training and operational costs are missing?
- Can the change be isolated behind an adapter or seam first?

A speculative rewrite is a blocking failure. The verdict must name the cheapest spike, its pass/fail signal, and the decision it unlocks.
