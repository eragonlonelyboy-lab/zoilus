'use strict';
// logos.js, the LOGOS engine, deterministic half.
// LOGOS forges instructions (harvested prompts #82 construct + #44 refine).
// The creative rewrite is the LLM's job (see references/logos.md + SKILL.md);
// what is deterministic, and therefore testable, is the RE-FORGE step of the
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
    '## MUST FIX (from the last review, do not repeat these)',
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

// CONSTRUCT (harvested #82), emit a reusable system-prompt skeleton to fill in.
// The creative wording is the LLM's job; the required structure is deterministic.
function constructSkeleton(job) {
  const j = String(job || '[WHAT THE ASSISTANT DOES, one job it does well]').trim();
  return [
    'Role:',
    `You are [EXPERT ROLE] whose entire craft is: ${j}.`,
    '',
    'Context:',
    '- [KEY CONTEXT THE TASK NEEDS]',
    '- You serve [WHO THIS ASSISTANT SERVES].',
    '- You run inside [WHERE THIS PROMPT RUNS].',
    '',
    'If [the single thing most likely to change your output] is unclear, ask 1-3 clarifying questions first, then wait. Otherwise proceed.',
    '',
    'Task: [the precise task, one sentence].',
    '',
    'Tone and personality:',
    '- [HOW YOU SOUND: e.g. plain, exact, warm but unsentimental]',
    '- [THE REGISTER YOU NEVER DROP OUT OF]',
    '',
    'ALWAYS:',
    '- [WHAT YOU MUST ALWAYS DO, every response]',
    '- [WHAT YOU MUST ALWAYS DO, every response]',
    '',
    'NEVER:',
    '- [WHAT YOU MUST NEVER DO]',
    '- [WHAT YOU MUST NEVER DO]',
    '',
    'Missing information and requests outside its scope:',
    '- If [REQUIRED INPUT] is missing, ask for it before answering. Do not guess silently.',
    '- If a request falls outside its scope ([WHAT IS OUT OF SCOPE]), say so plainly in one line and name what you can do instead.',
    '',
    'Constraints:',
    '- [hard constraint]',
    '- [hard constraint]',
    '- No em dashes. No hype words. Say plainly if the request is the wrong approach.',
    '',
    'Output format:',
    '1. [labeled section]',
    '2. [labeled section]',
    '',
    'Worked example:',
    'User: [A SHORT SAMPLE REQUEST]',
    'Ideal response: [THE IDEAL RESPONSE, in the exact output format above, so the target behaviour and format are locked in by demonstration]',
    '',
    'Tuning notes (for the human, not the assistant):',
    '- Stricter: tighten the NEVER list and the output format.',
    '- More concise or more creative: adjust the tone and personality lines.',
    '- The one line most likely to need editing: [THE LINE YOU WILL REVISIT FIRST].',
    '',
    'Quality bar: a stranger could paste this and get a strong result on the first try. Use [PLACEHOLDERS] for anything the user must supply.',
  ].join('\n');
}

// REFINE (harvested #44), emit the diagnose-then-rewrite scaffold for an existing prompt.
function refineScaffold(promptText) {
  const p = String(promptText || '[PASTE THE PROMPT TO IMPROVE]').trim();
  return [
    '# LOGOS refine',
    '',
    '## 1. Diagnosis',
    'Check the prompt below against each axis; name what each gap costs in the output:',
    '- role · context · specific task · constraints · output format · examples · success criteria',
    '',
    '## 2. Improved prompt',
    '(clean, copy-paste-ready rewrite with an expert role, context, precise task, explicit constraints, exact output format, embedded clarifying questions, and [PLACEHOLDERS])',
    '',
    '## 3. Key upgrades',
    '- (one line each: what changed and why it improves the result)',
    '',
    '---',
    'PROMPT UNDER REVIEW:',
    p,
  ].join('\n');
}

module.exports = { forgeRetry, isReforged, constructSkeleton, refineScaffold };
