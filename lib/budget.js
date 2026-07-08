'use strict';
// budget.js — the loop governor (MONETA composition).
// A self-improvement loop that never stops burns tokens forever. ZOILUS caps
// iterations and tokens, and treats "no meaningful improvement" as a stop too:
// diminishing returns after a couple of passes is the norm, not a bug.

class Budget {
  constructor(opts = {}) {
    this.maxIterations = opts.maxIterations ?? 3;   // world-class vs infinite-polish
    this.maxTokens = opts.maxTokens ?? Infinity;    // hard ceiling (MONETA-supplied)
    this.iterations = 0;
    this.tokens = 0;
    this.stopped = null; // reason string once halted
  }

  // call once per completed loop pass
  tick(tokensSpent = 0) {
    this.iterations += 1;
    this.tokens += Math.max(0, tokensSpent);
    return this;
  }

  canContinue() {
    if (this.iterations >= this.maxIterations) { this.stopped = 'max-iterations'; return false; }
    if (this.tokens >= this.maxTokens) { this.stopped = 'max-tokens'; return false; }
    return true;
  }

  // convergence stop: if the latest pass fixed nothing new, do not loop again
  converged(prevFailureCount, currFailureCount) {
    if (currFailureCount >= prevFailureCount) { this.stopped = 'no-improvement'; return true; }
    return false;
  }

  state() {
    return { iterations: this.iterations, tokens: this.tokens, stopped: this.stopped };
  }
}

module.exports = { Budget };
