# Contributing to FLOW.txt

Please keep contributions focused, tested, and privacy-safe.

## Principles
- Clean, strict TypeScript; no performance regressions.
- Cross-platform: desktop + mobile if `isDesktopOnly` is false.
- Privacy: no outbound data without explicit consent.

## What’s welcome
- Reproducible bug fixes.
- Performance or memory improvements.
- UX/accessibility tweaks that stay unobtrusive.
- Incremental support for workflows, priorities, dates without breaking defaults.
- Tests for any new logic (parser/workflows especially).

## Not welcome (for now)
- Features requiring external services or accounts.
- Telemetry/tracking.
- Breaking mobile compatibility.
- Large refactors without clear benefit.

## Workflow
1) Open an issue for sizable features (problem, proposal, UX).
2) Fork and branch: `feature/<summary>` or `fix/<summary>`.
3) Run tests/build before PR:
   ```bash
   npm test
   npm run build
   ```
4) Submit a small PR with: what/why, risks, test coverage; add GIFs for UI.

## Style & requirements
- No `any`; follow existing formatting; minimal, useful comments.
- Avoid new deps unless discussed.
- Keep `manifest.json`, `versions.json`, `CHANGELOG.md` aligned when versioning.

## Security & privacy
- No outbound data without consent.
- No obfuscated or hand-minified code.

## Governance
- Maintainers may close PRs/issues not aligned with the roadmap or quality bar.
- Big PRs may be split or sent back for changes.

Thanks for contributing responsibly.
