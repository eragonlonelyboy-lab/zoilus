# HONEST NUMBERS: where ZOILUS loses

The merciless critic turns the knife on itself. Here is exactly what ZOILUS can and cannot prove, and what it costs when you run it.

## No benchmark can bless subjective quality

There is no number that certifies "this is world-class." Quality of execution is a judgment, and the judgment is made by critics, not by a test suite. So do not read a ZOILUS PASS as a measured score. Read it as: an independent panel, blind to the maker, could not find a blocking failure at the bar it was given.

What IS checkable is the machinery underneath the judgment, and that machinery is tested. The deterministic benchmark suite is `node benchmarks/run.js`. It proves the receipts, not the taste:

- **The blind-to-maker contract actually strips maker reasoning.** `strip` removes the maker's reasoning, self-scores, and intent asides deterministically, and the bench proves a stripped artifact no longer carries them. This is tested.
- **The loop budget halts.** The governor stops at the iteration cap and does not run unattended forever. This is tested.
- **The verdict ledger schema validates.** A verdict record either conforms to the schema or it is rejected with named errors. This is tested.
- **The rubric packs carry their disciplines.** Each pack loads with the harvested bars intact (the regex proof table, the spec riskiest-assumption test, the architecture 10x/100x failure lens, and the rest). This is tested.
- **LOGOS re-forge produces a materially different instruction.** Feeding named failures back in yields a new instruction that carries them as must-fix constraints, not a reworded copy of the old one. This is tested.

The bench proves the plumbing is honest. It does not, and cannot, prove your artifact is good. Only the panel does that, and only against the bar you gave it.

## ZOILUS is only as sharp as the bar it is given

The critics judge against a rubric. The sharper and more checkable the rubric, the sharper the verdict.

- **On checkable work (code, specs, data), ZOILUS is brutal.** A regex either passes its proof table or it does not. A spec either names its riskiest assumption and the cheapest test for it or it does not. A data analysis either survives the tails or it breaks. There is a right answer to point at, so a failure is concrete and a pass is earned.
- **On pure-taste work (a headline, a visual feel, a tone), ZOILUS is opinion-tinged.** There is no ground truth for "premium," so the verdict leans on borrowed domain lenses and on the standard you name. This is why the review asks for the intended standard up front: without a stated bar, taste critique is one informed opinion, not a proof. Give it the standard you are aiming for and it sharpens; leave the bar vague and the verdict softens to a well-argued opinion.

## It costs real tokens

A ZOILUS review is not cheap. It spawns N independent critics, one per lens, and it may run the improvement loop up to 3 iterations. So the cost is roughly N critics multiplied by up to 3 passes, plus a LOGOS re-forge between passes. Every critic is a separate agent reading the artifact and the rubric.

State this plainly: on a throwaway draft, ZOILUS is overkill. Spend it where world-class actually matters, and use a single quick read for everything else.

## Diminishing returns after two to three iterations

The loop earns its keep on the first pass or two. After roughly two to three iterations the gains flatten: the cheap, high-blast-radius failures are already fixed, and further passes trade many tokens for small polish.

The loop does not just run to the cap and stop. It halts on **no-improvement**: a pass that clears nothing new ends the loop early, because re-forging the same instruction against the same residual failures is spending tokens to stand still. The cap is a ceiling, not a target.

## It judges EXECUTION, not the DECISION

ZOILUS judges how well a thing is done. It does not judge whether the thing was worth doing. Those are different questions with different tools.

- Whether to build it, which option to pick, whether the plan is wise: that is **ATHENA**. ZOILUS will happily certify a beautifully executed answer to the wrong question and never notice, because the wrongness of the question is out of its lens.
- Point ZOILUS at a decision and you waste it: you get a rigorous critique of the craft on a choice that should not have been made. Ask ATHENA first if the question is "should I," and reach for ZOILUS once the question is "is this done well."

## Reject-on-doubt means some false-reject friction, by design

The default posture is FAIL. A pass must be earned, and "probably fine" is recorded as a FAIL with a reason. This is deliberate. It means ZOILUS will sometimes block work that was, in fact, good enough, and send you back for a fix you did not strictly need.

That friction is the price of the guarantee. A critic tuned to avoid false rejects would have to approve on doubt, and approving on doubt is how the real failures ship. ZOILUS takes the false-reject cost so the true failures do not slip through. If you want a lenient reviewer, ZOILUS is the wrong tool; that leniency is exactly what it exists to refuse.
