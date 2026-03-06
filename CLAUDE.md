# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the **TabletopExercise PAI Skill** — a cybersecurity tabletop exercise design and facilitation framework. It is a Claude skill (not a standalone app) that generates professional exercise materials from structured JSON data.

The skill produces three output formats for each exercise:
- **Facilitator HTML** — full content with facilitator notes, expected answers, timing guidance
- **Participant HTML** — clean version with spoilers hidden
- **PDF** — professional client-ready document (via Playwright/Chromium)

## Directory Structure

```
TabletopExercise/
├── SKILL.md                  # Main skill definition loaded by PAI
├── ATOMICS-LIBRARY.md        # Pre-built atomic inject sequences
├── README.md                 # Usage documentation
├── generators/               # TypeScript generators (run with bun)
│   ├── generate-html.ts      # Standalone HTML generator
│   ├── generate-html-new.ts  # Updated standalone HTML generator
│   ├── generate-html-standalone.ts
│   ├── generate-both.ts      # Generates facilitator + participant versions
│   ├── generate-pdf.ts       # PDF generator (core logic + HTML renderer)
│   └── package.json
├── templates/
│   └── tabletop-exercise.html
└── examples/
    ├── ssrf-aws-compromise/  # SSRF → AWS credential theft scenario
    └── rainbow-six-ddos-attack/  # DDoS scenario
```

## Generator Commands

All generators use **Bun** (not Node/npm).

```bash
cd TabletopExercise/generators

# Install dependencies (first time only)
bun add playwright && bunx playwright install chromium

# Generate both facilitator and participant HTML
bun run generate-both.ts ../examples/[slug]/exercise-data.json

# Generate standalone HTML
bun run generate-html.ts --input ../examples/[slug]/exercise-data.json --output ../examples/[slug]/

# Generate PDF
bun run generate-pdf.ts
```

## Exercise Data Format

Each exercise lives in `examples/[slug]/exercise-data.json`. Key top-level fields:

```json
{
  "title": "...",
  "severity": "CRITICAL|HIGH|MEDIUM|LOW",
  "targetAudience": "...",
  "facilitatorGuide": { ... },
  "timelineEvents": [ { "time": "T+0", "title": "...", "facilitatorNotes": {...} } ],
  "gapAnalysis": [ ... ],
  "atomics": [ ... ]
}
```

The `generate-pdf.ts` file contains the `generateTabletopHTML(data, mode)` function where `mode` is `'facilitator'` or `'participant'`. Participant mode hides facilitator-only fields.

## Architecture

- **SKILL.md** is the PAI skill definition — it defines how Claude should behave when invoked as the `TabletopExercise` skill. It is not a script to run.
- **ATOMICS-LIBRARY.md** provides reusable inject sequences that can be referenced when building `timelineEvents` in exercise JSON.
- **generators/** are TypeScript scripts consumed directly by Bun (no build step needed).
- HTML output is fully self-contained (CSS/JS inlined, no external dependencies).

## Deployment Context

This skill is used within the PAI (Personal AI) framework. The generators run locally or on the production server. Do not run Docker containers locally — testing happens in production.

# Coding Standards

## Security

- **Input validation first**: All tool inputs are validated against the Zod schema before any file I/O or generator calls. Never process unvalidated data.

- **Path traversal prevention (OWASP A01)**: When accepting file paths as tool input (e.g. qmd_path in check_scenario_completeness), resolve and verify the path stays within the expected base directory before reading. Reject paths containing `..`.

- **No injection (OWASP A03)**: Never pass tool input directly to shell commands, template strings, or eval. All generator calls use direct function imports — no child_process or exec.

- **Dependency hygiene (OWASP A06)**: Minimize dependencies. This project uses @modelcontextprotocol/sdk, zod, and zod-to-json-schema only. Add nothing else without a strong reason.

- **No secrets in code**: API keys, tokens, or credentials must come from environment variables. Never hardcode or log them.

## TypeScript

- Strict mode always. No `any` — use `z.infer<typeof Schema>` for Zod-derived types.
- Explicit return types on all exported functions.
- Prefer `unknown` over `any` when the type is genuinely unknown, then narrow it.

## MCP Tool Design

- Tools NEVER throw. Return structured error objects instead so the agent can read, fix, and retry. Only `validate_exercise_data` and `check_scenario_completeness` return errors as data — all others call validate_exercise_data internally first.
- Resources are read-only. No resource handler modifies state.
- The Zod schema in schema.ts is the single source of truth — TypeScript types, MCP validation, and the tabletop://schema resource all derive from it. Never duplicate type definitions.

## Code Quality

- Small, focused functions. If a function needs a comment to explain what it does, it should probably be split or renamed.
- DRY: if the same logic appears twice, extract it.
- Parse atomics at startup once, index by ID and category — don't re-parse on every tool call.
- Explicit error handling — no silent catch blocks.
