#!/usr/bin/env node
'use strict';
// zoilus, the merciless critic. Deterministic CLI half (zero-LLM): blind-contract,
// verdict ledger, loop budget, rubric packs, schema check, setup. The judgment
// itself is skill-driven (see SKILL.md); this is the machinery the skill leans on.
const fs = require('fs');
const path = require('path');
const blind = require('../lib/blind');
const ledger = require('../lib/ledger');
const rubrics = require('../lib/rubrics');
const { Budget } = require('../lib/budget');
const logos = require('../lib/logos');
const verdict = require('../lib/verdict');
const siblings = require('../lib/siblings');
const { runLoop, makeBudget } = require('../lib/loop');

const pkg = require('../package.json');
const args = process.argv.slice(2);
const cmd = args[0];
const VERDICT_DIR = process.env.ZOILUS_DIR || path.join(process.cwd(), '.zoilus', 'verdicts');

function out(s) { process.stdout.write(s + '\n'); }

function readArg(name) {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
}

switch (cmd) {
  case '--version': case '-v':
    out(`zoilus ${pkg.version}`); break;

  case 'strip': {
    const file = args[1];
    if (!file || !fs.existsSync(file)) { out('usage: zoilus strip <file>'); process.exit(1); }
    const { stripped, removed } = blind.stripMakerReasoning(fs.readFileSync(file, 'utf8'));
    if (readArg('--report') !== undefined || args.includes('--report')) {
      out(`# blind-contract: removed ${removed.length} maker-reasoning line(s)/section(s)`);
    }
    out(stripped);
    break;
  }

  case 'rubric': {
    const name = args[1];
    if (!name) { out('available rubric packs: ' + rubrics.available().join(', ')); break; }
    const body = rubrics.load(name);
    if (!body) { out(`no rubric pack: ${name}`); process.exit(1); }
    out(body);
    break;
  }

  case 'lenses': {
    const type = args[1] || 'generic';
    out(`${type} -> ${rubrics.lensesFor(type).join(', ')}`);
    break;
  }

  case 'check': {
    const file = args[1];
    if (!file || !fs.existsSync(file)) { out('usage: zoilus check <verdict.md>'); process.exit(1); }
    const rec = ledger.parse(fs.readFileSync(file, 'utf8'));
    const { ok, errors } = ledger.validate(rec);
    out(ok ? 'OK, verdict record valid' : 'INVALID:\n' + errors.map((e) => '  - ' + e).join('\n'));
    process.exit(ok ? 0 : 1);
    break;
  }

  case 'ledger': {
    const sub = args[1];
    if (sub === 'list') {
      const files = ledger.list(VERDICT_DIR);
      if (!files.length) { out('(no verdicts yet)'); break; }
      for (const f of files) {
        const rec = ledger.parse(fs.readFileSync(f, 'utf8'));
        out(`${rec.verdict.padEnd(4)}  ${rec.ts || '?'}  ${rec.artifact}  (${path.basename(f)})`);
      }
    } else {
      out('usage: zoilus ledger list');
    }
    break;
  }

  case 'setup': {
    const has = (p) => fs.existsSync(path.join(__dirname, '..', p));
    const sib = siblings.detect();
    out('ZOILUS setup check');
    out('------------------');
    out(`  rubric packs present : ${rubrics.available().length}  (${rubrics.available().join(', ') || 'none'})`);
    out(`  SKILL.md             : ${has('SKILL.md') ? 'yes' : 'MISSING'}`);
    out(`  companion CLAUDE.md  : ${has('CLAUDE.md') ? 'yes' : 'MISSING'}`);
    out(`  verdict dir          : ${VERDICT_DIR} ${fs.existsSync(VERDICT_DIR) ? '(exists)' : '(created on first verdict)'}`);
    out(`  siblings installed   : ${sib.installed.join(', ') || 'none'}`);
    const rec = siblings.recommend(sib.installed);
    if (rec.length) { out('  recommended (missing):'); for (const r of rec) out(`    - ${r.name}: ${r.why}`); }
    out('');
    out('ZOILUS is skill-first: invoke it in Claude Code with /zoilus or "have ZOILUS review this".');
    out('This CLI provides the deterministic machinery (blind-contract, ledger, budget, rubric packs).');
    out('Budget defaults: 3 iterations. Token ceiling read from MONETA (ZOILUS composes with it).');
    break;
  }

  case 'forge': {
    if (args.includes('--refine')) {
      const file = readArg('--refine');
      const text = file && fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
      out(logos.refineScaffold(text));
    } else {
      const job = readArg('--construct') || args.slice(1).join(' ');
      out(logos.constructSkeleton(job));
    }
    break;
  }

  case 'siblings': {
    const s = siblings.detect();
    out('installed: ' + (s.installed.join(', ') || 'none'));
    const rec = siblings.recommend(s.installed);
    out('recommended (missing pairs): ' + (rec.map((r) => r.name).join(', ') || 'none, all set'));
    break;
  }

  case 'route': {
    const lens = args[1];
    if (!lens) { out('usage: zoilus route <lens>  (e.g. prose, copy-critique, design, completion)'); break; }
    out(`${lens} -> ${siblings.routeLens(lens)}`);
    break;
  }

  case 'loop-demo': {
    // a real fail-then-pass loop with injected produce/review stubs (proves orchestration)
    const b = makeBudget({ maxIterations: 4 });
    runLoop({
      prompt: 'Write a regex to match an email.',
      produce: (p) => (/MUST FIX/.test(p) ? '^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$' : '(.+)+@(.+)+'),
      review: (artifact) => /\(\.\+\)\+|\(a\+\)\+/.test(artifact)
        ? { verdict: 'FAIL', failures: [{ severity: 'blocking', summary: 'catastrophic backtracking (nested quantifier)' }], tokens: 500 }
        : { verdict: 'PASS', failures: [], tokens: 500 },
      budget: b,
    }).then((res) => {
      out(`loop result: ${res.verdict} in ${res.iterations} iteration(s)` + (res.stopped ? ` (stopped: ${res.stopped})` : ''));
      res.history.forEach((h) => out(`  iter ${h.iteration}: ${h.verdict} (${h.failCount} failure(s))`));
    });
    break;
  }

  case 'budget-demo': {
    // shows the loop governor halting; used in docs/tests
    const b = new Budget({ maxIterations: Number(readArg('--max') || 3) });
    let pass = 0;
    while (b.canContinue()) { b.tick(1000); pass++; }
    out(`ran ${pass} passes, halted: ${b.state().stopped}`);
    break;
  }

  case 'forge-demo': {
    const prior = 'Write a function that parses the file.';
    const next = logos.forgeRetry(prior, ['no error handling for a missing file', 'no test for empty input']);
    out(next);
    break;
  }

  default:
    out(`zoilus ${pkg.version}, the merciless critic`);
    out('');
    out('  zoilus strip <file> [--report]   blind-contract: strip maker reasoning');
    out('  zoilus rubric [name]             show a rubric pack (or list them)');
    out('  zoilus lenses <artifactType>     which lenses judge this artifact type');
    out('  zoilus forge --construct "<job>" LOGOS: scaffold a reusable prompt');
    out('  zoilus forge --refine <file>     LOGOS: scaffold a prompt rewrite');
    out('  zoilus check <verdict.md>        validate a verdict record');
    out('  zoilus ledger list               list recorded verdicts');
    out('  zoilus siblings                  detect installed Demiurge gods');
    out('  zoilus route <lens>              which god judges this lens');
    out('  zoilus setup                     state-aware setup readout');
    out('');
    out('The judgment is skill-driven: /zoilus in Claude Code. This CLI is the machinery.');
}
