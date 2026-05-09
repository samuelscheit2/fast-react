# Fast React Conformance Placeholder

This package is reserved for the future dual-run oracle harness.

Planned strategy:

1. Execute each scenario once against pinned `react@19.2.6` packages.
2. Execute the same scenario against Fast React aliased to the same public
   entrypoints.
3. Compare normalized JSON observations for package resolution, object shapes,
   errors, warnings, render logs, DOM snapshots, effect order, stream chunks, and
   TypeScript compile results.
4. Track expected divergences with an owner, milestone, reason, and expiry.

The current scaffold only proves the package exists and can be invoked by CI.
It does not claim any React conformance.
