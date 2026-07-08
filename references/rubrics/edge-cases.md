# Rubric: edge-cases

World-class bar for the cases the code silently ignores. The happy path is assumed to work. Hunt the boundaries, the empties, and the adversarial inputs that real traffic will eventually deliver. Reject on doubt.

## Blocking checks
- **An unhandled edge case on a path real inputs will hit.** If a value that production will actually produce reaches code that has no answer for it and the result is wrong, a crash, or corruption, it is a blocking FAIL. Name the input and what it produces. A theoretical case no caller can create is not blocking, say so.
- **Empty and absent.** Empty string, empty list, empty map, zero rows, missing field. Name the one the code assumes is non-empty and what breaks when it is not.
- **Null and undefined.** A value that can be null, undefined, or absent reaching code that dereferences it without a guard. Name the source that can return nothing.
- **Boundary values.** Zero, negative, max int, off-by-one at the limit, first and last element. Name the boundary the logic mishandles.

## Quality checks
- Huge input. Unbounded growth, no pagination, a load into memory that a large but plausible input blows up. Flag the missing bound.
- Concurrent access. Two callers hitting shared state or the same resource with no coordination. Flag the interleaving.
- Malformed and adversarial input. Wrong type, truncated payload, injection-shaped data, deeply nested structure. Flag what the parser assumes.
- Unicode and encoding. Multibyte, combining marks, normalization, mixed encodings where the code assumes ASCII or one byte per character.
- Timezone and locale. Naive datetimes, DST gaps, locale-dependent parsing, formatting that assumes one region.
- Exhausted resources. Full disk, closed connection, timeout, retry storm. Flag the failure with no fallback.

## Verdict
FAIL on any unhandled edge case that real inputs will hit and that yields a wrong result, crash, or corruption. Name the input. Otherwise rank the remaining exposures by how likely production is to hit them.
