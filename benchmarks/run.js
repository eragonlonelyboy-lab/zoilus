'use strict';
// Deterministic benchmark suite. No LLM, these prove the machinery, not the judgment.
const assert = require('assert');
const blind = require('../lib/blind');
const ledger = require('../lib/ledger');
const rubrics = require('../lib/rubrics');
const logos = require('../lib/logos');
const { Budget } = require('../lib/budget');
const verdict = require('../lib/verdict');
const siblings = require('../lib/siblings');
const { runLoop, makeBudget } = require('../lib/loop');
const os = require('os');
const fs = require('fs');
const path = require('path');

let pass = 0, fail = 0;
const tests = [];
function t(name, fn) { tests.push({ name, fn }); } // register; run sequentially below (async-aware)

// --- blind-to-maker contract ---
t('blind strips a maker reasoning section, keeps the artifact', () => {
  const src = '# Parser\nfunction parse(x){return x;}\n\n## Reasoning\nI chose this because it is clearly correct and I am confident.\n';
  const { stripped, removed } = blind.stripMakerReasoning(src);
  assert(removed.length > 0, 'should remove something');
  assert(/function parse/.test(stripped), 'artifact code must remain');
  assert(!/clearly correct/.test(stripped), 'maker reasoning must be gone');
  assert(!/## Reasoning/.test(stripped), 'reasoning heading gone');
});
t('blind strips self-score lines but keeps body', () => {
  const src = 'Title\nSelf-score: 9/10\nReal content line.\n<!-- note: rushed this -->\nMore content.';
  const { stripped } = blind.stripMakerReasoning(src);
  assert(!/Self-score/.test(stripped));
  assert(!/rushed this/.test(stripped));
  assert(/Real content line/.test(stripped) && /More content/.test(stripped));
});
t('blind leaves a clean artifact unchanged (no false stripping)', () => {
  const src = '# API\nGET /users returns a list.\nEach user has an id and a name.';
  const { stripped, removed } = blind.stripMakerReasoning(src);
  assert.strictEqual(removed.length, 0, 'nothing to remove');
  assert.strictEqual(stripped, src.trim());
});

// --- verdict ledger ---
t('ledger serialize -> parse round-trips', () => {
  const rec = { id: 'v1', ts: '2026-07-08T00:00:00Z', artifact: 'foo.js', artifactType: 'code', verdict: 'FAIL', confidence: 0.9, iterations: 2,
    lenses: [{ lens: 'correctness', score: 3, failures: [{ severity: 'blocking', summary: 'null deref on empty input', fix: 'guard for empty' }] }] };
  const back = ledger.parse(ledger.serialize(rec));
  assert.strictEqual(back.verdict, 'FAIL');
  assert.strictEqual(back.artifactType, 'code');
  assert.strictEqual(back.lenses.length, 1);
  assert.strictEqual(back.lenses[0].lens, 'correctness');
  assert.strictEqual(back.lenses[0].failures[0].summary, 'null deref on empty input');
});
t('ledger validate rejects a PASS with a blocking failure', () => {
  const bad = { id: 'v2', ts: '2026-07-08', artifact: 'x', artifactType: 'code', verdict: 'PASS',
    lenses: [{ lens: 'security', score: 2, failures: [{ severity: 'blocking', summary: 'sql injection' }] }] };
  const r = ledger.validate(bad);
  assert(!r.ok && r.errors.some((e) => /blocking/.test(e)), 'PASS with blocking failure must be invalid');
});
t('ledger validate flags missing fields', () => {
  const r = ledger.validate({ verdict: 'MAYBE' });
  assert(!r.ok);
  assert(r.errors.some((e) => /verdict must be/.test(e)));
  assert(r.errors.some((e) => /missing field: id/.test(e)));
});

// --- budget / loop governor ---
t('budget halts at max iterations', () => {
  const b = new Budget({ maxIterations: 3 });
  let n = 0; while (b.canContinue()) { b.tick(100); n++; }
  assert.strictEqual(n, 3);
  assert.strictEqual(b.state().stopped, 'max-iterations');
});
t('budget halts at token ceiling', () => {
  const b = new Budget({ maxIterations: 99, maxTokens: 250 });
  let n = 0; while (b.canContinue()) { b.tick(100); n++; }
  assert(b.state().stopped === 'max-tokens');
  assert(n <= 3);
});
t('budget convergence stop when a pass fixes nothing new', () => {
  const b = new Budget();
  assert.strictEqual(b.converged(2, 2), true, 'same failure count => converged');
  assert.strictEqual(b.converged(5, 2), false, 'fewer failures => keep going');
});

// --- LOGOS re-forge ---
t('LOGOS re-forge injects failures and changes the prompt', () => {
  const prior = 'Write a file parser.';
  const next = logos.forgeRetry(prior, ['no handling for missing file', { summary: 'no empty-input test' }]);
  assert(logos.isReforged(prior, next), 're-forged prompt must differ');
  assert(/MUST FIX/.test(next));
  assert(/missing file/.test(next) && /empty-input test/.test(next), 'named failures must appear');
});
t('LOGOS re-forge with no failures returns the prior unchanged', () => {
  const prior = 'Write a file parser.';
  assert.strictEqual(logos.forgeRetry(prior, []), prior);
});

// --- rubric packs (harvested disciplines must be present) ---
t('all 8 rubric packs exist on disk', () => {
  const have = rubrics.available();
  for (const name of ['regex', 'spec', 'architecture', 'copy-critique', 'anti-overengineering', 'code', 'prose', 'generic']) {
    assert(have.includes(name), 'missing rubric pack: ' + name);
  }
});
t('regex rubric carries the ReDoS + proof-table discipline', () => {
  const r = (rubrics.load('regex') || '').toLowerCase();
  assert(/redos|backtrack/.test(r), 'regex pack must check catastrophic backtracking');
  assert(/proof|table|match.*reject|reject.*match/.test(r), 'regex pack must require a proof table');
});
t('spec rubric carries the riskiest-assumption discipline', () => {
  const r = (rubrics.load('spec') || '').toLowerCase();
  assert(/riskiest assumption|riskiest-assumption/.test(r));
  assert(/cheapest (test|experiment)/.test(r));
});
t('architecture rubric carries SPOF + 10x/100x scaling discipline', () => {
  const r = (rubrics.load('architecture') || '').toLowerCase();
  assert(/single point of failure|spof/.test(r));
  assert(/10x|100x|blast.?radius/.test(r));
});
t('copy-critique rubric carries the reader-dropoff discipline', () => {
  const r = (rubrics.load('copy-critique') || '').toLowerCase();
  assert(/drop.?off|drops? off|lose (the|them|reader)/.test(r));
});
t('lens sets map artifact types to lenses', () => {
  assert.deepStrictEqual(rubrics.lensesFor('regex'), ['regex', 'edge-cases']);
  assert(rubrics.lensesFor('unknown-type').includes('generic'));
});

// --- planted-flaw recall (a seeded weakness the right rubric would catch) ---
t('planted flaw: a regex with (a+)+ is exactly what the ReDoS rubric flags', () => {
  const flawed = '(a+)+$'; // classic catastrophic backtracking
  const r = (rubrics.load('regex') || '').toLowerCase();
  // the rubric must instruct the critic to look for this class
  assert(/nested quantifier|catastrophic|redos|backtrack/.test(r), 'rubric must name the flaw class');
  assert(/\(a\+\)\+|nested/.test(r) || /backtrack/.test(r));
});

// --- numeric world-class bar + confidence (ZOI-04) ---
t('verdict: a lens below the bar fails even with no blocking failure', () => {
  const r = verdict.computeVerdict([{ lens: 'code', score: 6, failures: [] }]);
  assert.strictEqual(r.verdict, 'FAIL');
});
t('verdict: a blocking failure fails even at a high score', () => {
  const r = verdict.computeVerdict([{ lens: 'code', score: 10, failures: [{ severity: 'blocking', summary: 'x' }] }]);
  assert.strictEqual(r.verdict, 'FAIL');
});
t('verdict: all lenses at/above bar with no blocking = PASS, no averaging', () => {
  const r = verdict.computeVerdict([{ lens: 'code', score: 9, failures: [] }, { lens: 'security', score: 8, failures: [] }]);
  assert.strictEqual(r.verdict, 'PASS');
  // one weak lens must sink it even if the other is perfect (no averaging)
  const r2 = verdict.computeVerdict([{ lens: 'code', score: 10, failures: [] }, { lens: 'security', score: 4, failures: [] }]);
  assert.strictEqual(r2.verdict, 'FAIL');
});
t('verdict: confidence is 0..1 and rises with more blocking failures', () => {
  const a = verdict.computeVerdict([{ lens: 'code', score: 7, failures: [{ severity: 'blocking', summary: 'x' }] }]);
  const b = verdict.computeVerdict([{ lens: 'code', score: 7, failures: [{ severity: 'blocking', summary: 'x' }, { severity: 'blocking', summary: 'y' }] }]);
  assert(a.confidence >= 0 && a.confidence <= 1 && b.confidence <= 1);
  assert(b.confidence > a.confidence, 'more blocking => more confident FAIL');
});
t('verdict: taste-heavy types use a lower bar than code', () => {
  assert(verdict.barFor('prose') < verdict.barFor('code'));
});

// --- loop runner + MONETA cap (ZOI-07) ---
t('loop: fail then pass converges in 2 iterations', async () => {
  const res = await runLoop({
    prompt: 'make a thing',
    produce: (p) => (/MUST FIX/.test(p) ? 'fixed thing' : 'broken thing'),
    review: (a) => (a === 'fixed thing' ? { verdict: 'PASS', failures: [], tokens: 10 } : { verdict: 'FAIL', failures: [{ severity: 'blocking', summary: 'broken' }], tokens: 10 }),
    budget: makeBudget({ maxIterations: 4 }),
  });
  assert.strictEqual(res.verdict, 'PASS');
  assert.strictEqual(res.iterations, 2);
});
t('loop: a never-passing producer halts at the iteration cap, not forever', async () => {
  const res = await runLoop({
    prompt: 'x',
    produce: () => 'still broken',
    review: () => ({ verdict: 'FAIL', failures: [{ severity: 'blocking', summary: 'nope' }], tokens: 10 }),
    budget: makeBudget({ maxIterations: 3 }),
  });
  assert.strictEqual(res.verdict, 'FAIL');
  assert(res.stopped === 'max-iterations' || res.stopped === 'no-improvement');
  assert(res.iterations <= 3);
});
t('loop: MONETA token ceiling from env halts the loop', async () => {
  const prev = process.env.ZOILUS_MAX_TOKENS;
  process.env.ZOILUS_MAX_TOKENS = '150';
  try {
    const res = await runLoop({
      prompt: 'x', produce: () => 'broken',
      review: () => ({ verdict: 'FAIL', failures: [{ severity: 'blocking', summary: 'a' }], tokens: 100 }),
      budget: makeBudget({ maxIterations: 99 }),
    });
    assert.strictEqual(res.budget.stopped, 'max-tokens');
  } finally { if (prev === undefined) delete process.env.ZOILUS_MAX_TOKENS; else process.env.ZOILUS_MAX_TOKENS = prev; }
});

// --- sibling detection + routing (ZOI-08, ZOI-10) ---
t('siblings: detects installed god dirs and lists missing', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'zoilus-sib-'));
  fs.mkdirSync(path.join(tmp, 'horkos'));
  fs.mkdirSync(path.join(tmp, 'veritas'));
  fs.mkdirSync(path.join(tmp, 'not-a-god'));
  const s = siblings.detect([tmp]);
  assert(s.installed.includes('horkos') && s.installed.includes('veritas'));
  assert(!s.installed.includes('not-a-god'));
  assert(s.missing.includes('chiron'));
});
t('siblings: recommends only missing natural pairs', () => {
  const rec = siblings.recommend(['horkos']).map((r) => r.name);
  assert(!rec.includes('horkos'));
  assert(rec.includes('chiron') && rec.includes('moneta'));
});
t('route: prose -> veritas when installed, native when not', () => {
  assert.strictEqual(siblings.routeLens('prose', ['veritas']), 'veritas');
  assert.strictEqual(siblings.routeLens('prose', []), 'zoilus-native');
  assert.strictEqual(siblings.routeLens('correctness', ['veritas']), 'zoilus-native');
});

// --- LOGOS construct/refine scaffolds (ZOI-06) ---
t('LOGOS construct skeleton carries the required structure', () => {
  const s = logos.constructSkeleton('review pull requests');
  for (const part of [
    'Role:',
    'EXPERT ROLE',
    'Context:',
    'clarifying question',
    'Tone and personality',
    'ALWAYS:',
    'NEVER:',
    'outside its scope',
    'Constraints',
    'Output format',
    'Worked example',
    'Tuning notes',
    'PLACEHOLDERS',
    'review pull requests',
  ]) {
    assert(s.includes(part), 'construct skeleton missing: ' + part);
  }
});
t('LOGOS refine scaffold carries diagnose-then-rewrite', () => {
  const s = logos.refineScaffold('do the thing');
  assert(/Diagnosis/.test(s) && /Improved prompt/.test(s) && /Key upgrades/.test(s));
  assert(s.includes('do the thing'));
});

(async () => {
  for (const { name, fn } of tests) {
    try { await fn(); pass++; console.log('  ok  ' + name); }
    catch (e) { fail++; console.log('FAIL  ' + name + '\n      ' + e.message); }
  }
  console.log('\n' + pass + '/' + (pass + fail) + ' passed');
  process.exit(fail ? 1 : 0);
})();
