'use strict';
// ledger.js — the verdict ledger. Every review persists a git-diffable record.
// HORKOS asks "did you do it"; ZOILUS asks "is it good enough" — and writes the
// answer down so a pass can be re-checked, not just claimed.
const fs = require('fs');
const path = require('path');

const REQUIRED = ['id', 'ts', 'artifact', 'artifactType', 'verdict', 'lenses'];
const VERDICTS = ['PASS', 'FAIL'];

function validate(rec) {
  const errors = [];
  if (!rec || typeof rec !== 'object') return { ok: false, errors: ['record is not an object'] };
  for (const k of REQUIRED) if (rec[k] === undefined || rec[k] === null) errors.push(`missing field: ${k}`);
  if (rec.verdict && !VERDICTS.includes(rec.verdict)) errors.push(`verdict must be PASS or FAIL, got ${rec.verdict}`);
  if (rec.lenses && !Array.isArray(rec.lenses)) errors.push('lenses must be an array');
  if (Array.isArray(rec.lenses)) {
    rec.lenses.forEach((l, i) => {
      if (!l || typeof l.lens !== 'string') errors.push(`lens[${i}] missing name`);
      if (l && typeof l.score !== 'number') errors.push(`lens[${i}] missing numeric score`);
    });
  }
  // integrity: a PASS may not carry unresolved blocking failures
  if (rec.verdict === 'PASS' && Array.isArray(rec.lenses)) {
    const blocking = rec.lenses.reduce((n, l) => n + ((l.failures || []).filter((f) => (f.severity || 'blocking') === 'blocking').length), 0);
    if (blocking > 0) errors.push(`verdict PASS but ${blocking} blocking failure(s) unresolved`);
  }
  return { ok: errors.length === 0, errors };
}

function serialize(rec) {
  const lines = [];
  lines.push('---');
  lines.push(`id: ${rec.id}`);
  lines.push(`ts: ${rec.ts}`);
  lines.push(`artifact: ${rec.artifact}`);
  lines.push(`artifactType: ${rec.artifactType}`);
  lines.push(`verdict: ${rec.verdict}`);
  lines.push(`confidence: ${rec.confidence ?? ''}`);
  lines.push(`iterations: ${rec.iterations ?? 1}`);
  lines.push('---');
  lines.push('');
  lines.push(`# Verdict: ${rec.verdict} — ${rec.artifact}`);
  lines.push('');
  for (const l of rec.lenses || []) {
    lines.push(`## Lens: ${l.lens}  (score ${l.score})`);
    const fails = l.failures || [];
    if (!fails.length) { lines.push('- (clean)'); lines.push(''); continue; }
    for (const f of fails) {
      const sev = f.severity || 'blocking';
      lines.push(`- [${sev}] ${f.summary}${f.fix ? `  — fix: ${f.fix}` : ''}`);
    }
    lines.push('');
  }
  return lines.join('\n');
}

function parse(md) {
  const src = String(md || '').replace(/\r\n/g, '\n');
  const fm = src.match(/^---\n([\s\S]*?)\n---/);
  const rec = { lenses: [] };
  if (fm) {
    for (const line of fm[1].split('\n')) {
      const m = line.match(/^(\w+):\s*(.*)$/);
      if (!m) continue;
      let [, k, v] = m;
      if (k === 'iterations') v = v === '' ? undefined : Number(v);
      if (k === 'confidence') v = v === '' ? undefined : (isNaN(Number(v)) ? v : Number(v));
      rec[k] = v;
    }
  }
  const body = fm ? src.slice(fm[0].length) : src;
  const lensBlocks = body.split(/^## Lens: /m).slice(1);
  for (const b of lensBlocks) {
    const head = b.split('\n')[0];
    const nm = head.match(/^(.*?)\s*\(score\s*(-?\d+(?:\.\d+)?)\)/);
    const lens = { lens: nm ? nm[1].trim() : head.trim(), score: nm ? Number(nm[2]) : 0, failures: [] };
    for (const fl of b.split('\n').filter((x) => /^-\s/.test(x))) {
      if (/\(clean\)/.test(fl)) continue;
      const fm2 = fl.match(/^-\s*\[(\w+)\]\s*(.*?)(?:\s+— fix:\s*(.*))?$/);
      if (fm2) lens.failures.push({ severity: fm2[1], summary: fm2[2].trim(), fix: fm2[3] ? fm2[3].trim() : undefined });
    }
    rec.lenses.push(lens);
  }
  return rec;
}

function slug(s) {
  return String(s || 'artifact').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48) || 'artifact';
}

function write(dir, rec, dateStr) {
  const d = dateStr || (rec.ts || '').slice(0, 10) || 'undated';
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `${d}-${slug(rec.artifact)}.md`);
  fs.writeFileSync(file, serialize(rec), 'utf8');
  return file;
}

function list(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((f) => f.endsWith('.md')).map((f) => path.join(dir, f));
}

module.exports = { validate, serialize, parse, write, list, slug, REQUIRED, VERDICTS };
