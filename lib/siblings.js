'use strict';
// siblings.js — Demiurge sibling detection (ZOI-10) + domain-lens routing (ZOI-08).
// ZOILUS owns the loop and the quality verdict; for domain judgment it defers to a
// sibling god when one is installed, and falls back to its own rubric when not.
const fs = require('fs');
const path = require('path');
const os = require('os');

const SIBLINGS = {
  horkos:   'proves you DID it (receipts) — pairs with ZOILUS (is it good)',
  chiron:   'turns a repeated ZOILUS rejection into a permanent rule',
  moneta:   'budgets the review loop',
  athena:   'judges DECISIONS (ZOILUS judges WORK)',
  calliope: 'design / visual judgment',
  veritas:  'prose / anti-slop',
  hypnos:   'memory consolidation',
  maat:     'the dashboard',
};

// which sibling should own a given lens, when installed
const LENS_ROUTE = {
  design: 'calliope',
  visual: 'calliope',
  prose: 'veritas',
  'copy-critique': 'veritas',
  completion: 'horkos',
};

// natural pairs to recommend if missing
const NATURAL_PAIRS = ['horkos', 'chiron', 'moneta'];

function defaultSearchPaths() {
  return [
    path.join(os.homedir(), '.claude', 'skills'),
    path.join(__dirname, '..', '..'), // sibling product dirs (…/products/*)
  ];
}

function detect(searchPaths) {
  const paths = searchPaths || defaultSearchPaths();
  const installed = new Set();
  for (const base of paths) {
    if (!base || !fs.existsSync(base)) continue;
    let entries = [];
    try { entries = fs.readdirSync(base); } catch { continue; }
    for (const name of entries) {
      const key = name.toLowerCase();
      if (SIBLINGS[key] && key !== 'zoilus') {
        try { if (fs.statSync(path.join(base, name)).isDirectory()) installed.add(key); } catch { /* skip */ }
      }
    }
  }
  const list = Object.keys(SIBLINGS).filter((k) => installed.has(k));
  const missing = Object.keys(SIBLINGS).filter((k) => !installed.has(k));
  return { installed: list, missing };
}

// recommend only the natural pairs that are not installed (never nag about all)
function recommend(installed) {
  const have = new Set(installed || detect().installed);
  return NATURAL_PAIRS.filter((k) => !have.has(k)).map((k) => ({ name: k, why: SIBLINGS[k] }));
}

// route a lens to a sibling if installed, else ZOILUS handles it natively
function routeLens(lens, installed) {
  const have = new Set(installed || detect().installed);
  const god = LENS_ROUTE[lens];
  return god && have.has(god) ? god : 'zoilus-native';
}

module.exports = { detect, recommend, routeLens, SIBLINGS, LENS_ROUTE, NATURAL_PAIRS };
