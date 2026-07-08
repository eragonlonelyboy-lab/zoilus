'use strict';
// blind.js — the blind-to-maker contract.
// Before a critic panel sees an artifact, strip anything that reveals the maker's
// reasoning, self-assessment, or intent. A critic that reads "I chose X because it
// is clearly correct" is no longer independent — it anchors on the maker's story.
// ZOILUS judges the artifact, never the confession.

// Heading-started sections whose whole body is maker reasoning (removed wholesale).
const MAKER_HEADING = /^#{1,6}\s*(reasoning|rationale|self[\s-]?(assessment|review|critique|eval\w*)|author'?s?\s+note|why\s+i\b|my\s+thinking|design\s+notes?|notes?\s+to\s+(the\s+)?reviewer|confidence)\b.*$/i;

// Single lines that leak self-assessment (removed line-by-line, artifact body kept).
const MAKER_LINE = /^\s*(note to reviewer|self[\s-]?score|confidence[:=]|i (chose|decided|think this is|believe this is)|this should be (fine|correct|good)|i'?m (confident|sure) (that|this))\b/i;

function stripMakerReasoning(text) {
  if (text == null) return { stripped: '', removed: [] };
  const src = String(text).replace(/\r\n/g, '\n');
  const lines = src.split('\n');
  const out = [];
  const removed = [];
  let skipToNextHeading = false;
  let skipLevel = 0;

  for (const line of lines) {
    const heading = line.match(/^(#{1,6})\s/);
    if (skipToNextHeading) {
      // stop skipping when we hit a heading at the same or shallower level
      if (heading && heading[1].length <= skipLevel) {
        skipToNextHeading = false;
      } else {
        removed.push(line);
        continue;
      }
    }
    if (MAKER_HEADING.test(line)) {
      skipToNextHeading = true;
      skipLevel = heading ? heading[1].length : 6;
      removed.push(line);
      continue;
    }
    if (MAKER_LINE.test(line)) { removed.push(line); continue; }
    out.push(line);
  }

  // strip HTML comments (often maker asides) but keep artifact structure
  let stripped = out.join('\n').replace(/<!--[\s\S]*?-->/g, (m) => { removed.push(m); return ''; });
  // collapse 3+ blank lines the removals may have left
  stripped = stripped.replace(/\n{3,}/g, '\n\n').trim();
  return { stripped, removed };
}

module.exports = { stripMakerReasoning, MAKER_HEADING, MAKER_LINE };
