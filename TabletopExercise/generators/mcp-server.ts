#!/usr/bin/env bun

/**
 * TabletopExercise MCP Server
 *
 * Exposes 6 tools and 3 resources so AI coding agents can enrich
 * M&M scenario cards in a schema-validated, additive-only way.
 *
 * Start:
 *   bun run mcp-server.ts
 *
 * Register with Claude:
 *   claude mcp add tabletop-exercise -- bun run generators/mcp-server.ts
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { readFile, writeFile, readdir } from 'fs/promises';
import { resolve, join, extname, dirname } from 'path';
import { fileURLToPath } from 'url';

import {
  TabletopExerciseDataSchema,
  ScenarioTypeSchema,
  VisualStyleSchema,
  ImageSubtypeSchema,
  type ScenarioType,
  type SectionPresence,
} from './schema.ts';
import {
  generateAttackVectorImages,
  generateEvidenceImages,
  generateAtmosphereImages,
  type AtmosphereContext,
} from './generate-images.ts';
import { generateTabletopHTML } from './generate-pdf.ts';
import { generateExerciseQmd } from './generate-qmd.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ---------------------------------------------------------------------------
// Load .env from the generators directory (API keys for image generation)
// ---------------------------------------------------------------------------

try {
  const envContent = await readFile(resolve(__dirname, '.env'), 'utf-8');
  for (const line of envContent.split('\n')) {
    const match = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (match) {
      const [, key, val] = match;
      process.env[key] ??= val.replace(/^["']|["']$/g, '').trim();
    }
  }
} catch { /* no .env file present — API keys must come from shell environment */ }


// ---------------------------------------------------------------------------
// Security helpers
// ---------------------------------------------------------------------------

/** Reject any path containing ".." to prevent path traversal (OWASP A01). */
function rejectTraversal(p: string): string | null {
  if (p.includes('..')) return null;
  return p;
}

// ---------------------------------------------------------------------------
// Atomics content — parsed once at startup, never re-read per call
// ---------------------------------------------------------------------------

const ATOMICS_PATH = resolve(__dirname, '../ATOMICS-LIBRARY.md');
let atomicsContent = '(Atomics library not found)';
try {
  atomicsContent = await readFile(ATOMICS_PATH, 'utf-8');
} catch (err) {
  process.stderr.write(`Warning: could not load ATOMICS-LIBRARY.md: ${String(err)}\n`);
}

// ---------------------------------------------------------------------------
// Known M&M malmon family names (update with actual names from the M&M project)
// ---------------------------------------------------------------------------

const MALMON_FAMILIES: readonly string[] = [
  'Code Red',
  'FakeBat',
  'GaboonGrabber',
  'Gh0st RAT',
  'LitterDrifter',
  'LockBit',
  'Noodle RAT',
  'Poison Ivy',
  'Raspberry Robin',
  'Stuxnet',
  'The Inquisitor',
  'WannaCry',
  'WireLurker',
];

// ---------------------------------------------------------------------------
// Section detection — shared between check_scenario_completeness and list_scenario_cards
// ---------------------------------------------------------------------------

const SECTION_PATTERNS: Array<{ name: string; patterns: RegExp[] }> = [
  { name: 'npc_dialogue',      patterns: [/npc.{0,20}dialogue/i, /## NPC/i, /scripted.*dialogue/i] },
  { name: 'inject_timeline',   patterns: [/## Injects/i, /## Timeline/i, /T\+\d+/i, /inject.*sequence/i] },
  { name: 'gap_analysis',      patterns: [/## Gap Analysis/i, /gap analysis/i, /## Gaps/i] },
  { name: 'artifacts',         patterns: [/## Artifacts/i, /artifact.*handout/i, /\[handout\]/i] },
  { name: 'branching',         patterns: [/## Branch/i, /conditional.*response/i, /if.*then.*inject/i, /decision.*tree/i] },
  { name: 'facilitator_notes', patterns: [/facilitator.{0,10}note/i, /## Facilitator/i] },
  { name: 'objectives',        patterns: [/## Objectives/i, /learning objectives/i] },
  { name: 'atomics',           patterns: [/## Atomics/i, /atomic.*sequence/i, /ATOMIC-ID/i] },
];

const ALL_SECTION_NAMES = SECTION_PATTERNS.map(s => s.name);

function detectSections(content: string, filePath: string): SectionPresence {
  let scenario_type: ScenarioType = 'contemporary';

  // Check frontmatter 'type' field
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (frontmatterMatch) {
    const typeMatch = frontmatterMatch[1].match(/^type:\s*(.+)$/m);
    if (typeMatch) {
      const val = typeMatch[1].trim().replace(/['"]/g, '');
      if (val === 'historical') scenario_type = 'historical';
    }
  }

  // Directory name heuristic
  if (filePath.includes('historical-foundation')) {
    scenario_type = 'historical';
  }

  const present: string[] = [];
  const missing: string[] = [];

  for (const section of SECTION_PATTERNS) {
    if (section.patterns.some(p => p.test(content))) {
      present.push(section.name);
    } else {
      missing.push(section.name);
    }
  }

  return { present, missing, scenario_type };
}

// ---------------------------------------------------------------------------
// MCP Server factory — exported so tests can connect via InMemoryTransport
// ---------------------------------------------------------------------------

export function createServer(): McpServer {
const server = new McpServer({
  name: 'tabletop-exercise',
  version: '1.0.0',
});

// ---------------------------------------------------------------------------
// Resources (read-only)
// ---------------------------------------------------------------------------

server.resource(
  'tabletop-schema',
  'tabletop://schema',
  async (_uri) => ({
    contents: [{
      uri: 'tabletop://schema',
      mimeType: 'application/json',
      text: JSON.stringify(
        zodToJsonSchema(TabletopExerciseDataSchema, { name: 'TabletopExerciseData' }),
        null,
        2
      ),
    }],
  })
);

server.resource(
  'tabletop-atomics',
  'tabletop://atomics',
  async (_uri) => ({
    contents: [{
      uri: 'tabletop://atomics',
      mimeType: 'text/markdown',
      text: atomicsContent,
    }],
  })
);

server.resource(
  'tabletop-template',
  'tabletop://template',
  async (_uri) => ({
    contents: [{
      uri: 'tabletop://template',
      mimeType: 'text/markdown',
      text: `# TabletopExercise HTML Template Reference

This document maps each schema field to its rendered position in the HTML output.

## Cover Page
- \`title\` → H1 heading on cover page
- \`subtitle\` → Subtitle line beneath title
- \`severity\` → Color-coded badge: CRITICAL=red, HIGH=orange, MEDIUM=yellow, LOW=green
- \`scenarioType\` → Scenario type label
- \`targetAudience\` → Audience specification
- \`duration\` → Estimated exercise duration
- \`difficulty\` → Difficulty level
- \`preparedBy\` → Author attribution
- \`date\` → Exercise date
- \`version\` → Document version number

## Executive Summary Section
- \`executiveSummary\` → Full narrative paragraph
- \`attackVector\` → Attack vector description box
- \`potentialImpact\` → Impact assessment box
- \`testingGoals\` → Goals paragraph
- \`criticalGaps\` → Pre-identified gaps summary

## Scenario Overview
- \`scenarioOverview\` → Narrative paragraph
- \`timelineEvents[]\` → Visual timeline: time marker + title + description + severity badge

## Learning Objectives
- \`objectives[].number\` → Objective number
- \`objectives[].title\` → Bold objective title
- \`objectives[].description\` → Detail text
- \`objectives[].successCriteria[]\` → Bulleted success criteria

## Injects (Core Exercise Content)
- \`injects[].id\` → Inject identifier (e.g. "INJ-001")
- \`injects[].time\` → Time marker (e.g. "T+15")
- \`injects[].title\` → Inject title shown to all participants
- \`injects[].severity\` → Severity badge
- \`injects[].scenario\` → READ-ALOUD narrative (shown to both facilitator and participant)
  - Contemporary rule: symptom-only language, no malmon family names
  - Historical rule: may name the malmon
- \`injects[].artifact\` → Reference to an artifact handout
- \`injects[].expectedResponse\` → FACILITATOR-ONLY: what participants should do
- \`injects[].discussionQuestions[]\` → FACILITATOR-ONLY: discussion prompts
- \`injects[].conditionalResponses[]\` → FACILITATOR-ONLY: if-then response trees

## Atomics (Technical Exercise Execution)
- \`atomics[].id\` → Atomic identifier (e.g. "PHISH-001")
- \`atomics[].time\` → Execution time offset
- \`atomics[].title\` → Atomic title
- \`atomics[].action\` → Runner action to perform
- \`atomics[].commands\` → Code/command block
- \`atomics[].commandLanguage\` → Syntax highlighting hint
- \`atomics[].expectedResponse\` → Expected participant reaction
- \`atomics[].fallback\` → What to do if participants don't respond
- \`atomics[].verification[]\` → Pre-exercise verification checklist items

## Gap Analysis
- \`gapStats.critical/high/medium/low\` → Statistics dashboard counters
- \`gaps[].priority\` → Priority badge
- \`gaps[].title\` → Gap title
- \`gaps[].status\` → Current remediation status
- \`gaps[].trigger\` → Which inject/moment revealed this gap
- \`gaps[].requiredProcedures[]\` → Procedures needed to close the gap
- \`gaps[].impact\` → Business impact if gap is not closed
- \`gaps[].recommendation\` → Actionable remediation guidance

## M&M Enrichment Fields (stored in JSON, not yet rendered by base HTML renderer)
- \`npcDialogue[]\` → Scripted NPC interactions for facilitator reference during exercise
- \`artifacts[]\` → Full handout content linked to specific injects
- \`scenario_type\` → "contemporary" | "historical" — controls M&M naming and debrief rules

## M&M Naming Rules by Scenario Type
| Field | Contemporary | Historical |
|---|---|---|
| inject.scenario | Symptom-only, no malmon names | May name the malmon |
| artifacts | Fictional organizations only | Real historical events/dates OK |
| Debrief framing | "your organization" | "lessons from history" |
| scenario_type field | Optional (defaults to contemporary) | Must be set to "historical" |
`,
    }],
  })
);

// ---------------------------------------------------------------------------
// Tool 1: check_scenario_completeness
// ---------------------------------------------------------------------------

server.tool(
  'check_scenario_completeness',
  'Parse a M&M scenario card (.qmd) and detect which enrichment sections are present vs missing. Returns scenario_type inferred from frontmatter or path.',
  {
    qmd_path: z.string().describe('Path to a .qmd scenario card file'),
  },
  async ({ qmd_path }) => {
    if (!rejectTraversal(qmd_path)) {
      return { content: [{ type: 'text' as const, text: JSON.stringify({ error: 'Path traversal rejected: path must not contain ".."' }) }] };
    }

    let content: string;
    try {
      content = await readFile(qmd_path, 'utf-8');
    } catch (err) {
      return { content: [{ type: 'text' as const, text: JSON.stringify({ error: `Cannot read file: ${String(err)}` }) }] };
    }

    const result = detectSections(content, qmd_path);
    return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
  }
);

// ---------------------------------------------------------------------------
// Tool 2: validate_exercise_data
// ---------------------------------------------------------------------------

server.tool(
  'validate_exercise_data',
  'Validate a raw JSON object against TabletopExerciseDataSchema. Returns structured errors — never throws.',
  {
    data: z.record(z.unknown()).describe('Raw exercise data object to validate'),
  },
  async ({ data }) => {
    const result = TabletopExerciseDataSchema.safeParse(data);

    if (result.success) {
      return { content: [{ type: 'text' as const, text: JSON.stringify({ valid: true, errors: [] }) }] };
    }

    const errors = result.error.issues.map(issue => ({
      path: issue.path.join('.') || '(root)',
      message: issue.message,
    }));

    return { content: [{ type: 'text' as const, text: JSON.stringify({ valid: false, errors }) }] };
  }
);

// ---------------------------------------------------------------------------
// Tool 3: generate_exercise
// ---------------------------------------------------------------------------

server.tool(
  'generate_exercise',
  'Validate exercise JSON then generate facilitator.html and participant.html into output_dir.',
  {
    exercise_data_path: z.string().describe('Path to exercise-data.json'),
    output_dir: z.string().describe('Directory to write HTML output files'),
  },
  async ({ exercise_data_path, output_dir }) => {
    if (!rejectTraversal(exercise_data_path) || !rejectTraversal(output_dir)) {
      return { content: [{ type: 'text' as const, text: JSON.stringify({ error: 'Path traversal rejected' }) }] };
    }

    let raw: unknown;
    try {
      raw = JSON.parse(await readFile(exercise_data_path, 'utf-8'));
    } catch (err) {
      return { content: [{ type: 'text' as const, text: JSON.stringify({ error: `Cannot read exercise data: ${String(err)}` }) }] };
    }

    const parsed = TabletopExerciseDataSchema.safeParse(raw);
    if (!parsed.success) {
      const errors = parsed.error.issues.map(i => ({ path: i.path.join('.'), message: i.message }));
      return { content: [{ type: 'text' as const, text: JSON.stringify({ error: 'Validation failed before generation', errors }) }] };
    }

    try {
      const facilitatorHtml = generateTabletopHTML(parsed.data as Parameters<typeof generateTabletopHTML>[0], 'facilitator');
      const participantHtml = generateTabletopHTML(parsed.data as Parameters<typeof generateTabletopHTML>[0], 'participant');

      const facilPath = join(output_dir, 'facilitator.html');
      const partPath = join(output_dir, 'participant.html');

      await writeFile(facilPath, facilitatorHtml, 'utf-8');
      await writeFile(partPath, participantHtml, 'utf-8');

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({ facilitator_html: facilPath, participant_html: partPath }),
        }],
      };
    } catch (err) {
      return { content: [{ type: 'text' as const, text: JSON.stringify({ error: `HTML generation failed: ${String(err)}` }) }] };
    }
  }
);

// ---------------------------------------------------------------------------
// Tool 4: merge_exercise_data
// ---------------------------------------------------------------------------

server.tool(
  'merge_exercise_data',
  'Additive-only deep merge: write only top-level keys that are absent from the existing JSON. Validates the merged result, then writes it back.',
  {
    base_path: z.string().describe('Path to existing exercise-data.json'),
    additions: z.record(z.unknown()).describe('Top-level keys to add (existing keys are never overwritten)'),
  },
  async ({ base_path, additions }) => {
    if (!rejectTraversal(base_path)) {
      return { content: [{ type: 'text' as const, text: JSON.stringify({ error: 'Path traversal rejected' }) }] };
    }

    let base: Record<string, unknown>;
    try {
      base = JSON.parse(await readFile(base_path, 'utf-8'));
    } catch (err) {
      return { content: [{ type: 'text' as const, text: JSON.stringify({ error: `Cannot read base file: ${String(err)}` }) }] };
    }

    const sectionsAdded: string[] = [];
    const merged: Record<string, unknown> = { ...base };

    for (const [key, value] of Object.entries(additions)) {
      if (!(key in merged)) {
        merged[key] = value;
        sectionsAdded.push(key);
      }
    }

    const validation = TabletopExerciseDataSchema.safeParse(merged);
    if (!validation.success) {
      const errors = validation.error.issues.map(i => ({ path: i.path.join('.'), message: i.message }));
      return { content: [{ type: 'text' as const, text: JSON.stringify({ error: 'Merged data failed schema validation', errors }) }] };
    }

    try {
      await writeFile(base_path, JSON.stringify(merged, null, 2), 'utf-8');
    } catch (err) {
      return { content: [{ type: 'text' as const, text: JSON.stringify({ error: `Cannot write merged file: ${String(err)}` }) }] };
    }

    return {
      content: [{
        type: 'text' as const,
        text: JSON.stringify({ merged_path: base_path, sections_added: sectionsAdded }),
      }],
    };
  }
);

// ---------------------------------------------------------------------------
// Tool 5: validate_m_and_m_formatting
// ---------------------------------------------------------------------------

server.tool(
  'validate_m_and_m_formatting',
  'Apply M&M-specific formatting rules beyond Zod schema. Checks contemporary/historical naming rules, debrief framing, and required fields.',
  {
    data: z.record(z.unknown()).describe('Exercise data object to validate'),
    scenario_type: ScenarioTypeSchema.describe('Scenario type determines which rule-set applies'),
  },
  async ({ data, scenario_type }) => {
    // Validate against full schema before applying M&M rules
    const schemaCheck = TabletopExerciseDataSchema.safeParse(data);
    if (!schemaCheck.success) {
      const errors = schemaCheck.error.issues.map(i => ({ path: i.path.join('.'), message: i.message }));
      return { content: [{ type: 'text' as const, text: JSON.stringify({ error: 'Schema validation failed before M&M checks', errors }) }] };
    }

    try {
    const violations: Array<{ rule: string; location: string; details: string }> = [];
    const dataText = JSON.stringify(data).toLowerCase();

    if (scenario_type === 'contemporary') {
      // Rule: inject narrative must not contain malmon family names
      const injects = (data as Record<string, unknown>).injects;
      if (Array.isArray(injects)) {
        for (const inject of injects) {
          const injectRecord = inject as Record<string, unknown>;
          const narrativeText = [injectRecord.scenario, injectRecord.title]
            .filter((v): v is string => typeof v === 'string')
            .join(' ');

          for (const family of MALMON_FAMILIES) {
            if (new RegExp(`\\b${family}\\b`, 'i').test(narrativeText)) {
              violations.push({
                rule: 'contemporary_no_malmon_name',
                location: `inject[${String(injectRecord.id ?? '?')}].scenario`,
                details: `Contemporary inject narrative must not name malmon family "${family}". Use symptom-only descriptions.`,
              });
            }
          }
        }
      }

      // Rule: artifacts must not reference real-world organizations
      const artifacts = (data as Record<string, unknown>).artifacts;
      if (Array.isArray(artifacts)) {
        const realOrgPatterns: Array<[RegExp, string]> = [
          [/\bmicrosoft\b/i, 'Microsoft'],
          [/\bgoogle\b/i, 'Google'],
          [/\bamazon\b/i, 'Amazon'],
          [/\bapple\b/i, 'Apple'],
          [/\bcisco\b/i, 'Cisco'],
        ];
        for (const artifact of artifacts) {
          const artifactRecord = artifact as Record<string, unknown>;
          const content = String(artifactRecord.content ?? '');
          for (const [pattern, orgName] of realOrgPatterns) {
            if (pattern.test(content)) {
              violations.push({
                rule: 'contemporary_fictional_orgs_only',
                location: `artifact[${String(artifactRecord.id ?? '?')}].content`,
                details: `Contemporary artifacts must use fictional organization names. Found real-world reference: "${orgName}".`,
              });
            }
          }
        }
      }

      // Rule: debrief framing must be "your org" / "your organization"
      if (
        dataText.includes('debrief') &&
        !dataText.includes('your org') &&
        !dataText.includes('your organization')
      ) {
        violations.push({
          rule: 'contemporary_debrief_framing',
          location: 'debrief section',
          details: 'Contemporary debrief must use "your organization"/"your org" framing, not historical framing.',
        });
      }
    }

    if (scenario_type === 'historical') {
      // Rule: scenario_type field must be set in data
      if ((data as Record<string, unknown>).scenario_type !== 'historical') {
        violations.push({
          rule: 'historical_type_field_required',
          location: 'data.scenario_type',
          details: 'Historical scenarios must set scenario_type: "historical" in the exercise data JSON.',
        });
      }

      // Rule: debrief should use "lessons from history" framing
      if (
        dataText.includes('debrief') &&
        !dataText.includes('lessons from')
      ) {
        violations.push({
          rule: 'historical_debrief_framing',
          location: 'debrief section',
          details: 'Historical scenario debrief should use "lessons from history" framing.',
        });
      }
    }

    return {
      content: [{
        type: 'text' as const,
        text: JSON.stringify({ valid: violations.length === 0, violations }),
      }],
    };
    } catch (err) {
      return { content: [{ type: 'text' as const, text: JSON.stringify({ error: `M&M validation error: ${String(err)}` }) }] };
    }
  }
);

// ---------------------------------------------------------------------------
// Tool 6: generate_exercise_qmd
// ---------------------------------------------------------------------------

server.tool(
  'generate_exercise_qmd',
  'Generate native Quarto markdown for the M&M handbook: appends 4 sections to index.qmd and writes handout-a/b QMD files. Use instead of generate_exercise when the target is a Quarto book.',
  {
    exercise_data: z.record(z.unknown()).describe('Validated exercise data object'),
    output_dir: z.string().describe('Scenario directory for handout files and exercise-data.json'),
    append_to: z.string().describe('Path to index.qmd — the 4 sections are appended here'),
    scenario_variables: z.record(z.string()).optional().describe('Flat key→value map of scenario variables (e.g. hospital_name) for resolving {{placeholders}} in handout files'),
    regions: z.array(z.string()).optional().describe(
      'Region values extracted from scenario-variables frontmatter (e.g. ["us", "dk"]). '
      + 'Derive from region_* keys: region_us → "us", region_dk → "dk". '
      + 'Omit entirely for non-localized scenarios -- variables will be resolved inline.'
    ),
  },
  async ({ exercise_data, output_dir, append_to, scenario_variables, regions }) => {
    if (!rejectTraversal(output_dir) || !rejectTraversal(append_to)) {
      return { content: [{ type: 'text' as const, text: JSON.stringify({ error: 'Path traversal rejected' }) }] };
    }

    const parsed = TabletopExerciseDataSchema.safeParse(exercise_data);
    if (!parsed.success) {
      const errors = parsed.error.issues.map(i => ({ path: i.path.join('.'), message: i.message }));
      return { content: [{ type: 'text' as const, text: JSON.stringify({ error: 'Schema validation failed', errors }) }] };
    }

    try {
      const result = await generateExerciseQmd(
        parsed.data as Parameters<typeof generateExerciseQmd>[0],
        output_dir,
        append_to,
        scenario_variables ?? {},
        regions ?? []
      );
      return { content: [{ type: 'text' as const, text: JSON.stringify(result) }] };
    } catch (err) {
      return { content: [{ type: 'text' as const, text: JSON.stringify({ error: String(err) }) }] };
    }
  }
);

// ---------------------------------------------------------------------------
// Tool 7: list_scenario_cards
// ---------------------------------------------------------------------------

server.tool(
  'list_scenario_cards',
  'Walk a directory tree, find all .qmd scenario cards, and return a completeness summary for each.',
  {
    scenarios_dir: z.string().describe('Root directory to walk for .qmd files'),
  },
  async ({ scenarios_dir }) => {
    if (!rejectTraversal(scenarios_dir)) {
      return { content: [{ type: 'text' as const, text: JSON.stringify({ error: 'Path traversal rejected' }) }] };
    }

    const qmdFiles: string[] = [];

    async function walkDir(dir: string): Promise<void> {
      let entries;
      try {
        entries = await readdir(dir, { withFileTypes: true });
      } catch (err) {
        process.stderr.write(`Warning: cannot read directory ${dir}: ${String(err)}\n`);
        return;
      }
      for (const entry of entries) {
        const full = join(dir, entry.name);
        if (entry.isDirectory()) {
          await walkDir(full);
        } else if (entry.isFile() && extname(entry.name) === '.qmd') {
          qmdFiles.push(full);
        }
      }
    }

    try {
      await walkDir(resolve(scenarios_dir));
    } catch (err) {
      return { content: [{ type: 'text' as const, text: JSON.stringify({ error: `Cannot walk directory: ${String(err)}` }) }] };
    }

    const results: Array<
      | { path: string; scenario_type: string; present: string[]; missing: string[]; completeness_pct: number }
      | { path: string; error: string }
    > = [];

    for (const qmdPath of qmdFiles) {
      let content: string;
      try {
        content = await readFile(qmdPath, 'utf-8');
      } catch {
        results.push({ path: qmdPath, error: 'Cannot read file' });
        continue;
      }

      const { present, missing, scenario_type } = detectSections(content, qmdPath);
      const completeness_pct = Math.round((present.length / ALL_SECTION_NAMES.length) * 100);
      results.push({ path: qmdPath, scenario_type, present, missing, completeness_pct });
    }

    return { content: [{ type: 'text' as const, text: JSON.stringify(results, null, 2) }] };
  }
);

// ---------------------------------------------------------------------------
// Tool 8: generate_attack_vector_images
// ---------------------------------------------------------------------------

server.tool(
  'generate_attack_vector_images',
  'Generate AI images for attack-vector artifacts (phishing emails, ransomware notes, fraudulent invoices, USB devices). Requires IMAGE_PROVIDER env var and corresponding API key. Returns updated_data with image_data populated on each artifact.',
  {
    exercise_data: z.record(z.unknown()).describe('Validated exercise data object'),
    visual_style: VisualStyleSchema.optional().describe('Style consistency settings shared across the scenario'),
  },
  async ({ exercise_data, visual_style }) => {
    const parsed = TabletopExerciseDataSchema.safeParse(exercise_data);
    if (!parsed.success) {
      const errors = parsed.error.issues.map(i => ({ path: i.path.join('.'), message: i.message }));
      return { content: [{ type: 'text' as const, text: JSON.stringify({ error: 'Schema validation failed', errors }) }] };
    }

    const artifacts = parsed.data.artifacts ?? [];
    if (artifacts.length === 0) {
      return { content: [{ type: 'text' as const, text: JSON.stringify({ updated_data: parsed.data, images_generated: 0, provider_used: process.env.IMAGE_PROVIDER ?? 'openai' }) }] };
    }

    try {
      const { updatedArtifacts, imagesGenerated, providerUsed } = await generateAttackVectorImages(
        artifacts,
        visual_style ?? parsed.data.visual_style
      );
      const updatedData = { ...parsed.data, artifacts: updatedArtifacts, visual_style: visual_style ?? parsed.data.visual_style };
      return { content: [{ type: 'text' as const, text: JSON.stringify({ updated_data: updatedData, images_generated: imagesGenerated, provider_used: providerUsed }) }] };
    } catch (err) {
      return { content: [{ type: 'text' as const, text: JSON.stringify({ error: String(err) }) }] };
    }
  }
);

// ---------------------------------------------------------------------------
// Tool 9: generate_evidence_images
// ---------------------------------------------------------------------------

server.tool(
  'generate_evidence_images',
  'Generate AI images for evidence artifacts (network diagrams, SIEM logs, dark web listings, SCADA interfaces). Requires IMAGE_PROVIDER env var and corresponding API key.',
  {
    exercise_data: z.record(z.unknown()).describe('Validated exercise data object'),
    visual_style: VisualStyleSchema.optional().describe('Style consistency settings shared across the scenario'),
  },
  async ({ exercise_data, visual_style }) => {
    const parsed = TabletopExerciseDataSchema.safeParse(exercise_data);
    if (!parsed.success) {
      const errors = parsed.error.issues.map(i => ({ path: i.path.join('.'), message: i.message }));
      return { content: [{ type: 'text' as const, text: JSON.stringify({ error: 'Schema validation failed', errors }) }] };
    }

    const artifacts = parsed.data.artifacts ?? [];
    if (artifacts.length === 0) {
      return { content: [{ type: 'text' as const, text: JSON.stringify({ updated_data: parsed.data, images_generated: 0, provider_used: process.env.IMAGE_PROVIDER ?? 'openai' }) }] };
    }

    try {
      const { updatedArtifacts, imagesGenerated, providerUsed } = await generateEvidenceImages(
        artifacts,
        visual_style ?? parsed.data.visual_style
      );
      const updatedData = { ...parsed.data, artifacts: updatedArtifacts, visual_style: visual_style ?? parsed.data.visual_style };
      return { content: [{ type: 'text' as const, text: JSON.stringify({ updated_data: updatedData, images_generated: imagesGenerated, provider_used: providerUsed }) }] };
    } catch (err) {
      return { content: [{ type: 'text' as const, text: JSON.stringify({ error: String(err) }) }] };
    }
  }
);

// ---------------------------------------------------------------------------
// Tool 10: generate_atmosphere_images
// ---------------------------------------------------------------------------

server.tool(
  'generate_atmosphere_images',
  'Generate AI atmosphere images: cover art, NPC portraits, location illustrations, period photographs. Requires IMAGE_PROVIDER env var and corresponding API key.',
  {
    exercise_data: z.record(z.unknown()).describe('Validated exercise data object'),
    subtypes: z.array(ImageSubtypeSchema).optional().describe('Limit which atmosphere subtypes to generate (default: cover_art + portrait for each NPC)'),
    visual_style: VisualStyleSchema.optional().describe('Style consistency settings shared across the scenario'),
  },
  async ({ exercise_data, subtypes, visual_style }) => {
    const parsed = TabletopExerciseDataSchema.safeParse(exercise_data);
    if (!parsed.success) {
      const errors = parsed.error.issues.map(i => ({ path: i.path.join('.'), message: i.message }));
      return { content: [{ type: 'text' as const, text: JSON.stringify({ error: 'Schema validation failed', errors }) }] };
    }

    const atmosphereSubtypes = new Set(subtypes ?? ['cover_art', 'portrait']);
    const style = visual_style ?? parsed.data.visual_style;
    const scenarioTitle = parsed.data.title;
    const scenarioOverview = parsed.data.scenarioOverview;

    const contexts: AtmosphereContext[] = [];

    if (atmosphereSubtypes.has('cover_art')) {
      contexts.push({ scenario_title: scenarioTitle, scenario_overview: scenarioOverview, subtype: 'cover_art' });
    }

    if (atmosphereSubtypes.has('portrait')) {
      for (const npc of (parsed.data.npcDialogue ?? [])) {
        contexts.push({
          scenario_title: scenarioTitle,
          npc_name: npc.npcName,
          npc_role: npc.role,
          subtype: 'portrait',
        });
      }
    }

    if (atmosphereSubtypes.has('location_illustration') || atmosphereSubtypes.has('period_photograph')) {
      const subtype = atmosphereSubtypes.has('period_photograph') ? 'period_photograph' : 'location_illustration';
      contexts.push({ scenario_title: scenarioTitle, scenario_overview: scenarioOverview, subtype });
    }

    if (contexts.length === 0) {
      return { content: [{ type: 'text' as const, text: JSON.stringify({ updated_data: parsed.data, images_generated: 0, provider_used: process.env.IMAGE_PROVIDER ?? 'openai' }) }] };
    }

    try {
      const { results, imagesGenerated, providerUsed } = await generateAtmosphereImages(contexts, style);

      // Attach cover_image_data to root data
      const coverResult = results.find(r => r.subtype === 'cover_art');
      const updatedData: Record<string, unknown> = { ...parsed.data };
      if (coverResult) updatedData.cover_image_data = coverResult.image_data;

      return { content: [{ type: 'text' as const, text: JSON.stringify({ updated_data: updatedData, images_generated: imagesGenerated, provider_used: providerUsed, atmosphere_images: results.map(r => ({ subtype: r.subtype })) }) }] };
    } catch (err) {
      return { content: [{ type: 'text' as const, text: JSON.stringify({ error: String(err) }) }] };
    }
  }
);

  return server;
}

// ---------------------------------------------------------------------------
// Entrypoint — connect to stdio when run directly
// ---------------------------------------------------------------------------

if (import.meta.main) {
  const transport = new StdioServerTransport();
  await createServer().connect(transport);
}
