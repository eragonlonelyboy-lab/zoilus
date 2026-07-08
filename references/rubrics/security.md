# Rubric: security

World-class bar for security. Assume every input is hostile and the attacker has read the source. Trace untrusted data to dangerous sinks. Reject on doubt.

## Blocking checks
- **Injection.** Untrusted input concatenated into a SQL query, shell command, HTML output, template, or eval. Trace the tainted value from entry to sink. String-built SQL, `exec`/`system` with user data, or unescaped output into markup is a blocking FAIL. Name the source, the sink, and a sample payload.
- **Auth and authz gaps.** An endpoint, action, or resource that acts without checking the caller is authenticated and permitted for that specific object. Missing ownership checks (IDOR), a route with no guard, or a privileged action reachable by a normal user is a blocking FAIL.
- **Secrets in code.** A hardcoded API key, password, token, or private key in source or config is a blocking FAIL. Name it.
- **Path traversal.** Untrusted input used to build a filesystem path without normalization and containment lets `../` escape the intended directory. Blocking FAIL if reachable.
- **SSRF.** Untrusted input controlling the target of a server-side request with no allowlist lets the attacker reach internal services or metadata endpoints. Blocking FAIL.
- **Insecure deserialization.** Untrusted bytes fed to a deserializer that can instantiate arbitrary types or run code is a blocking FAIL.

## Quality checks
- Missing rate limits on auth, reset, or expensive endpoints. Flag the abuse path.
- Untrusted input reaching any sink without validation, encoding, or parameterization, even where no exploit is proven yet.
- Weak crypto, predictable tokens, secrets logged, or overbroad CORS. Name the weakness.

## Verdict
FAIL on any exploitable path where untrusted input reaches a sink: injection, auth bypass, hardcoded secret, traversal, SSRF, or unsafe deserialization. Name source, sink, and payload. Otherwise surface the weaker exposures.
