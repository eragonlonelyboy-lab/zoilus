'use strict';
// verdict.js, the numeric world-class bar (ZOI-04).
// Turns a panel's per-lens scores + failures into a PASS/FAIL with a derived
// confidence. Two independent ways to fail: a blocking failure, or a score below
// the bar. No averaging, one lens under the bar sinks the whole verdict.

const clamp01 = (x) => Math.max(0, Math.min(1, x));
const round2 = (x) => Math.round(x * 100) / 100;

// per-artifact-type bar (0-10). code/security-heavy types sit at 8; taste-heavy
// types (prose/copy) at 7.5 because the tail is opinion. Configurable via opts.
const THRESHOLDS = {
  code: 8, correctness: 8, security: 8, regex: 8, spec: 8, architecture: 8,
  data: 8, 'edge-cases': 8, prose: 7.5, copy: 7.5, 'copy-critique': 7.5, generic: 7.5,
};
const DEFAULT_THRESHOLD = 8;

function barFor(lens, opts = {}) {
  if (opts.threshold != null) return opts.threshold;
  return THRESHOLDS[lens] != null ? THRESHOLDS[lens] : DEFAULT_THRESHOLD;
}

// lenses: [{ lens, score, failures:[{severity}] }]
function computeVerdict(lenses, opts = {}) {
  const perLens = (lenses || []).map((l) => {
    const bar = barFor(l.lens, opts);
    const blocking = (l.failures || []).filter((f) => (f.severity || 'blocking') === 'blocking').length;
    const score = typeof l.score === 'number' ? l.score : bar; // no score => assume at-bar (neutral)
    const belowBar = score < bar;
    return { lens: l.lens, score, bar, blocking, margin: round2(score - bar), pass: blocking === 0 && !belowBar };
  });

  const verdict = perLens.length && perLens.every((p) => p.pass) ? 'PASS' : 'FAIL';
  const minMargin = perLens.length ? Math.min(...perLens.map((p) => p.margin)) : 0;
  const blockingTotal = perLens.reduce((n, p) => n + p.blocking, 0);

  let confidence;
  if (verdict === 'FAIL') {
    // more blocking failures + further below the bar => more sure it is a fail
    confidence = clamp01(0.5 + 0.1 * blockingTotal + 0.06 * Math.max(0, -minMargin));
  } else {
    // further above the lowest bar => more sure it is a pass
    confidence = clamp01(0.5 + 0.08 * Math.max(0, minMargin));
  }
  return { verdict, confidence: round2(confidence), minMargin, blockingTotal, perLens };
}

module.exports = { computeVerdict, barFor, THRESHOLDS, DEFAULT_THRESHOLD };
