'use strict';
// rubrics.js, the rubric packs. Each artifact type has a world-class bar the
// blind panel judges against. Packs are markdown data (references/rubrics/*.md);
// this module loads them and maps an artifact type to its lens set.
const fs = require('fs');
const path = require('path');

const RUBRIC_DIR = path.join(__dirname, '..', 'references', 'rubrics');

// artifact type -> ordered lens set (each lens has a rubric pack + a posture)
const LENSES = {
  code:         ['correctness', 'security', 'edge-cases', 'framework-rewrite', 'code'],
  regex:        ['regex', 'edge-cases'],
  spec:         ['spec', 'copy-critique'],
  architecture: ['architecture', 'framework-rewrite', 'edge-cases'],
  prose:        ['prose', 'copy-critique'],
  copy:         ['copy-critique', 'prose'],
  data:         ['data', 'edge-cases'],
  generic:      ['generic'],
};

function types() { return Object.keys(LENSES); }

function packPath(name) { return path.join(RUBRIC_DIR, `${name}.md`); }

function load(name) {
  const p = packPath(name);
  if (!fs.existsSync(p)) return null;
  return fs.readFileSync(p, 'utf8');
}

function lensesFor(artifactType) {
  return LENSES[artifactType] || LENSES.generic;
}

// list the rubric packs that exist on disk
function available() {
  if (!fs.existsSync(RUBRIC_DIR)) return [];
  return fs.readdirSync(RUBRIC_DIR).filter((f) => f.endsWith('.md')).map((f) => f.replace(/\.md$/, ''));
}

module.exports = { types, load, lensesFor, available, LENSES, RUBRIC_DIR };
