# Rubric: code

World-class bar for general code quality. A blind reader must find it obvious, idiomatic, and free of avoidable cruft. Reject on doubt.

## Blocking checks
- **Silently swallowed errors.** An empty catch, a discarded error return, a bare `except: pass`, or a promise with no rejection path hides failure. If an error can be dropped without a trace, it is a blocking FAIL. Name the line and the failure it eats.
- **Resource leaks.** A file, socket, connection, lock, or handle opened on a path that can return or throw before release is a blocking FAIL. The cleanup must hold on every exit, including the error path. Name the leaking resource and the escape route.
- **Duplication of existing logic.** Reimplementing a helper, constant, or function that already exists in the codebase or standard library is a blocking FAIL. Cite the existing thing it should have called.

## Quality checks
- Naming reveals intent. A name that lies, abbreviates without reason, or forces the reader to guess the type is a finding.
- Idiom for the language. Reaching past the language's normal construct for a hand-rolled one is a finding unless justified.
- Dead code. Unreachable branches, unused variables, commented-out blocks, and orphaned imports are findings. Flag pre-existing dead code, do not silently delete it.
- No impossible-scenario error handling. A try/catch or validation guarding a path the caller cannot produce is noise. Flag it.
- Surgical. If the change refactors, reformats, or renames untouched adjacent code, that is scope creep and a finding.
- Readability. If a senior reader must trace state twice to follow the control flow, the code is too clever. Prefer the obvious form.

## Verdict
FAIL on a swallowed error, a resource leak, or duplication of logic that already exists. Otherwise judge readability, naming, idiom, and scope discipline, and name every finding by line.
