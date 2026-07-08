'use strict';
// loop.js — the self-improvement loop runner (ZOI-07).
// Orchestration is deterministic; the produce/review steps are injected callbacks
// (LLM-driven in the skill, stubs in the tests). LOGOS re-forges the instruction
// from each review's failures; the Budget governs when to stop.
const { Budget } = require('./budget');
const { forgeRetry } = require('./logos');

// Read a token ceiling from MONETA if it is installed, else env, else none.
// MONETA composition: ZOILUS does not reimplement budgeting, it defers to it.
function monetaCeiling() {
  const env = process.env.ZOILUS_MAX_TOKENS || process.env.MONETA_BUDGET;
  if (env && !isNaN(Number(env))) return Number(env);
  try {
    const fs = require('fs');
    const path = require('path');
    const cfg = path.join(require('os').homedir(), '.moneta', 'config.json');
    if (fs.existsSync(cfg)) {
      const m = JSON.parse(fs.readFileSync(cfg, 'utf8'));
      if (m && m.budget && !isNaN(Number(m.budget))) return Number(m.budget);
    }
  } catch { /* no moneta, no ceiling */ }
  return Infinity;
}

function makeBudget(opts = {}) {
  return new Budget({
    maxIterations: opts.maxIterations ?? 3,
    maxTokens: opts.maxTokens ?? monetaCeiling(),
  });
}

// runLoop({ prompt, produce(prompt)->artifact, review(artifact)->{verdict,failures,tokens}, budget })
// Returns { verdict, iterations, history, budget, stopped }.
async function runLoop({ prompt, produce, review, budget }) {
  budget = budget || makeBudget();
  const history = [];
  let currentPrompt = prompt;
  let prevFailCount = Infinity;

  for (;;) {
    const artifact = await produce(currentPrompt);
    const r = (await review(artifact)) || {};
    const failCount = (r.failures || []).length;
    history.push({ iteration: history.length + 1, verdict: r.verdict, failCount, prompt: currentPrompt });
    budget.tick(r.tokens || 0);

    if (r.verdict === 'PASS') {
      return { verdict: 'PASS', iterations: history.length, history, budget: budget.state() };
    }
    if (!budget.canContinue()) {
      return { verdict: 'FAIL', iterations: history.length, history, budget: budget.state(), stopped: budget.state().stopped };
    }
    if (budget.converged(prevFailCount, failCount)) {
      return { verdict: 'FAIL', iterations: history.length, history, budget: budget.state(), stopped: 'no-improvement' };
    }
    prevFailCount = failCount;
    currentPrompt = forgeRetry(currentPrompt, r.failures);
  }
}

module.exports = { runLoop, makeBudget, monetaCeiling };
