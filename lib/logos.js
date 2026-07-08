'use strict';
// logos.js — the LOGOS engine, deterministic half.
// LOGOS forges instructions (harvested prompts #82 construct + #44 refine).
// The creative rewrite is the LLM's job (see references/logos.md + SKILL.md);
// what is deterministic — and therefore testable — is the RE-FORGE step of the
// loop: turn a panel's named failures into hard must-fix constraints appended to
// the prior instruction, so the next attempt cannot repeat the same mistakes.

function forgeRetry(priorPrompt, failures) {
  const prior = String(priorPrompt || '').trim();
  const list = (failures || [])
    .map((f) => (typeof f === 'string' ? f : (f && f.summary) || ''))
    .map((s) => s.trim())
    .filter(Boolean);

  if (!list.length) return prior; // nothing to fold in

  const block = [
    '',
    '## MUST FIX (from the last review — do not repeat these)',
    ...list.map((s, i) => `${i + 1}. ${s}`),
    '',
    'Address every item above explicitly before producing the next version.',
  ].join('\n');

  return `${prior}\n${block}`.trim();
}

// did the re-forge actually change the instruction? (loop-safety invariant)
function isReforged(priorPrompt, nextPrompt) {
  return String(priorPrompt || '').trim() !== String(nextPrompt || '').trim();
}

module.exports = { forgeRetry, isReforged };
