'use strict';
// Deterministic benchmark suite. No LLM — these prove the machinery, not the judgment.
const assert = require('assert');
const blind = require('../lib/blind');
const ledger = require('../lib/ledger');
const rubrics = require('../lib/rubrics');
const logos = require('../lib/logos');
const { Budget } = require('../lib/budget');

let pass = 0, fail = 0;
function t(name, fn) { try { fn(); pass++; console.log('  ok  ' + name); } catch (e) { fail++; console.log('FAIL  ' + name + '\n      ' + e.message); } }

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

console.log('\n' + pass + '/' + (pass + fail) + ' passed');
process.exit(fail ? 1 : 0);
