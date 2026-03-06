#!/usr/bin/env bun
/**
 * Integration tests for the TabletopExercise MCP server.
 *
 * Uses InMemoryTransport so tests run in-process without spawning a subprocess.
 *
 * Run:
 *   bun run test-mcp.ts
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { writeFile, unlink, mkdir } from 'fs/promises';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

import { createServer } from './mcp-server.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ---------------------------------------------------------------------------
// Test harness
// ---------------------------------------------------------------------------

let passed = 0;
let failed = 0;

function assert(condition: boolean, label: string): void {
  if (condition) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.error(`  ✗ ${label}`);
    failed++;
  }
}

function parseToolResult(result: Awaited<ReturnType<Client['callTool']>>): unknown {
  const text = (result.content as Array<{ type: string; text: string }>)[0]?.text ?? '{}';
  return JSON.parse(text);
}

// ---------------------------------------------------------------------------
// Start server + client via InMemoryTransport
// ---------------------------------------------------------------------------

const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();

const server = createServer();
const client = new Client({ name: 'test-client', version: '1.0.0' });

await server.connect(serverTransport);
await client.connect(clientTransport);

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const SSRF_DATA_PATH = resolve(__dirname, 'ssrf-exercise-data.json');
const TMP_DIR = resolve(__dirname);

// Minimal QMD with inject timeline and gap analysis sections
const QMD_WITH_SECTIONS = `---
title: Test Scenario
type: contemporary
---

## Injects

**T+0**: Initial alert fires.

## Gap Analysis

| Gap | Severity |
|-----|----------|
| No runbook | High |

## Facilitator Notes

Keep participants on track.
`;

// Minimal QMD missing most sections
const QMD_SPARSE = `---
title: Sparse Scenario
---

# Overview
Short scenario with no enrichment.
`;

// Historical QMD
const QMD_HISTORICAL = `---
title: Historical Scenario
type: historical
---

## Injects

T+0 something happens.
`;

const QMD_CONTEMPORARY_PATH = resolve(__dirname, '/tmp/test-contemporary.qmd');
const QMD_SPARSE_PATH = resolve(__dirname, '/tmp/test-sparse.qmd');
const QMD_HISTORICAL_PATH = resolve(__dirname, '/tmp/test-historical.qmd');

await writeFile(QMD_CONTEMPORARY_PATH, QMD_WITH_SECTIONS, 'utf-8');
await writeFile(QMD_SPARSE_PATH, QMD_SPARSE, 'utf-8');
await writeFile(QMD_HISTORICAL_PATH, QMD_HISTORICAL, 'utf-8');

// ---------------------------------------------------------------------------
// Test 1: tools/list — all 6 tools registered
// ---------------------------------------------------------------------------

console.log('\nTest 1: tools/list');
{
  const toolList = await client.listTools();
  const names = toolList.tools.map(t => t.name).sort();
  const expected = [
    'check_scenario_completeness',
    'generate_exercise',
    'list_scenario_cards',
    'merge_exercise_data',
    'validate_exercise_data',
    'validate_m_and_m_formatting',
  ];
  assert(JSON.stringify(names) === JSON.stringify(expected), `6 tools registered: ${names.join(', ')}`);
}

// ---------------------------------------------------------------------------
// Test 2: resources/list — 3 resources registered
// ---------------------------------------------------------------------------

console.log('\nTest 2: resources/list');
{
  const resList = await client.listResources();
  const uris = resList.resources.map(r => r.uri).sort();
  assert(uris.includes('tabletop://schema'), 'tabletop://schema registered');
  assert(uris.includes('tabletop://atomics'), 'tabletop://atomics registered');
  assert(uris.includes('tabletop://template'), 'tabletop://template registered');
}

// ---------------------------------------------------------------------------
// Test 3: tabletop://schema resource — valid JSON Schema with properties
// ---------------------------------------------------------------------------

console.log('\nTest 3: tabletop://schema resource');
{
  const res = await client.readResource({ uri: 'tabletop://schema' });
  const text = (res.contents[0] as { text: string }).text;
  const schema = JSON.parse(text);
  const props = schema.definitions?.TabletopExerciseData?.properties ?? schema.properties ?? {};
  assert('title' in props, 'schema has "title" property');
  assert('injects' in props, 'schema has "injects" property');
  assert('scenario_type' in props, 'schema has M&M "scenario_type" property');
  assert('npcDialogue' in props, 'schema has M&M "npcDialogue" property');
}

// ---------------------------------------------------------------------------
// Test 4: validate_exercise_data — SSRF example returns valid: true
// ---------------------------------------------------------------------------

console.log('\nTest 4: validate_exercise_data (valid data)');
{
  const ssrfData = JSON.parse(await Bun.file(SSRF_DATA_PATH).text());
  const result = parseToolResult(
    await client.callTool({ name: 'validate_exercise_data', arguments: { data: ssrfData } })
  ) as { valid: boolean; errors: unknown[] };
  assert(result.valid === true, 'SSRF exercise-data.json passes schema validation');
  assert(result.errors.length === 0, 'No validation errors');
}

// ---------------------------------------------------------------------------
// Test 5: validate_exercise_data — invalid data returns structured errors
// ---------------------------------------------------------------------------

console.log('\nTest 5: validate_exercise_data (invalid data)');
{
  const result = parseToolResult(
    await client.callTool({
      name: 'validate_exercise_data',
      arguments: { data: { title: 'Missing required fields' } },
    })
  ) as { valid: boolean; errors: Array<{ path: string; message: string }> };
  assert(result.valid === false, 'Invalid data returns valid: false');
  assert(result.errors.length > 0, 'Returns at least one error');
  const paths = result.errors.map(e => e.path);
  assert(paths.includes('severity'), 'Reports missing "severity"');
  assert(paths.includes('injects'), 'Reports missing "injects"');
}

// ---------------------------------------------------------------------------
// Test 6: check_scenario_completeness — rich QMD detects present sections
// ---------------------------------------------------------------------------

console.log('\nTest 6: check_scenario_completeness (rich QMD)');
{
  const result = parseToolResult(
    await client.callTool({
      name: 'check_scenario_completeness',
      arguments: { qmd_path: QMD_CONTEMPORARY_PATH },
    })
  ) as { present: string[]; missing: string[]; scenario_type: string };
  assert(result.scenario_type === 'contemporary', 'Detects contemporary from frontmatter');
  assert(result.present.includes('inject_timeline'), 'Detects inject_timeline section');
  assert(result.present.includes('gap_analysis'), 'Detects gap_analysis section');
  assert(result.present.includes('facilitator_notes'), 'Detects facilitator_notes section');
  assert(result.missing.includes('npc_dialogue'), 'Reports missing npc_dialogue');
  assert(result.missing.includes('artifacts'), 'Reports missing artifacts');
}

// ---------------------------------------------------------------------------
// Test 7: check_scenario_completeness — historical QMD
// ---------------------------------------------------------------------------

console.log('\nTest 7: check_scenario_completeness (historical QMD)');
{
  const result = parseToolResult(
    await client.callTool({
      name: 'check_scenario_completeness',
      arguments: { qmd_path: QMD_HISTORICAL_PATH },
    })
  ) as { present: string[]; missing: string[]; scenario_type: string };
  assert(result.scenario_type === 'historical', 'Detects historical from frontmatter type field');
}

// ---------------------------------------------------------------------------
// Test 8: check_scenario_completeness — path traversal rejected
// ---------------------------------------------------------------------------

console.log('\nTest 8: check_scenario_completeness (path traversal)');
{
  const result = parseToolResult(
    await client.callTool({
      name: 'check_scenario_completeness',
      arguments: { qmd_path: '/tmp/../../etc/passwd' },
    })
  ) as { error?: string };
  assert(typeof result.error === 'string' && result.error.includes('traversal'), 'Rejects path with ".."');
}

// ---------------------------------------------------------------------------
// Test 9: merge_exercise_data — additive-only merge
// ---------------------------------------------------------------------------

console.log('\nTest 9: merge_exercise_data (additive-only)');
{
  // Write a minimal valid base JSON
  const basePath = '/tmp/test-exercise-base.json';
  const base = {
    title: 'Merge Test',
    targetAudience: 'SOC',
    severity: 'HIGH',
    injects: [{ id: 'INJ-001', time: 'T+0', title: 'Alert fires', severity: 'high', scenario: 'An alert fires.', expectedResponse: 'Investigate' }],
    gaps: [],
  };
  await writeFile(basePath, JSON.stringify(base), 'utf-8');

  const result = parseToolResult(
    await client.callTool({
      name: 'merge_exercise_data',
      arguments: {
        base_path: basePath,
        additions: {
          title: 'SHOULD NOT OVERWRITE',       // existing key — must be ignored
          scenario_type: 'contemporary',        // new key — must be added
          npcDialogue: [],                      // new key — must be added
        },
      },
    })
  ) as { merged_path?: string; sections_added?: string[]; error?: string };

  assert(!result.error, `No merge error: ${result.error ?? ''}`);
  assert(Array.isArray(result.sections_added), 'Returns sections_added array');
  assert(result.sections_added!.includes('scenario_type'), 'Added scenario_type');
  assert(result.sections_added!.includes('npcDialogue'), 'Added npcDialogue');
  assert(!result.sections_added!.includes('title'), 'Did NOT overwrite existing title');

  // Verify the file on disk
  const merged = JSON.parse(await Bun.file(basePath).text());
  assert(merged.title === 'Merge Test', 'Original title preserved in file');
  assert(merged.scenario_type === 'contemporary', 'New field written to file');

  await unlink(basePath).catch(() => {});
}

// ---------------------------------------------------------------------------
// Test 10: validate_m_and_m_formatting — contemporary violation (real org name)
// ---------------------------------------------------------------------------

console.log('\nTest 10: validate_m_and_m_formatting (contemporary violation)');
{
  const data = {
    title: 'Test',
    targetAudience: 'SOC',
    severity: 'HIGH',
    injects: [{ id: 'INJ-001', time: 'T+0', title: 'Alert', severity: 'high', scenario: 'Alert fires.', expectedResponse: '' }],
    gaps: [],
    artifacts: [{
      id: 'ART-001',
      type: 'document',
      title: 'Vendor invoice',
      content: 'Invoice from Microsoft Corporation for Azure services.',
    }],
  };
  const result = parseToolResult(
    await client.callTool({
      name: 'validate_m_and_m_formatting',
      arguments: { data, scenario_type: 'contemporary' },
    })
  ) as { valid: boolean; violations: Array<{ rule: string }> };
  assert(result.valid === false, 'Detects real-org violation in contemporary artifact');
  assert(
    result.violations.some(v => v.rule === 'contemporary_fictional_orgs_only'),
    'Reports contemporary_fictional_orgs_only rule violation'
  );
}

// ---------------------------------------------------------------------------
// Test 11: validate_m_and_m_formatting — historical missing scenario_type field
// ---------------------------------------------------------------------------

console.log('\nTest 11: validate_m_and_m_formatting (historical missing field)');
{
  const data = {
    title: 'Historical exercise',
    targetAudience: 'SOC',
    severity: 'HIGH',
    // scenario_type intentionally omitted
    injects: [],
    gaps: [],
  };
  const result = parseToolResult(
    await client.callTool({
      name: 'validate_m_and_m_formatting',
      arguments: { data, scenario_type: 'historical' },
    })
  ) as { valid: boolean; violations: Array<{ rule: string }> };
  assert(result.valid === false, 'Detects missing scenario_type field for historical');
  assert(
    result.violations.some(v => v.rule === 'historical_type_field_required'),
    'Reports historical_type_field_required violation'
  );
}

// ---------------------------------------------------------------------------
// Test 12: generate_exercise — produces facilitator.html and participant.html
// ---------------------------------------------------------------------------

console.log('\nTest 12: generate_exercise');
{
  const result = parseToolResult(
    await client.callTool({
      name: 'generate_exercise',
      arguments: {
        exercise_data_path: SSRF_DATA_PATH,
        output_dir: TMP_DIR,
      },
    })
  ) as { facilitator_html?: string; participant_html?: string; error?: string };

  assert(!result.error, `No generation error: ${result.error ?? ''}`);
  assert(typeof result.facilitator_html === 'string', 'Returns facilitator_html path');
  assert(typeof result.participant_html === 'string', 'Returns participant_html path');

  if (result.facilitator_html && result.participant_html) {
    const facilContent = await Bun.file(result.facilitator_html).text().catch(() => '');
    const partContent = await Bun.file(result.participant_html).text().catch(() => '');
    assert(facilContent.includes('<!DOCTYPE html'), 'facilitator.html is valid HTML');
    assert(partContent.includes('<!DOCTYPE html'), 'participant.html is valid HTML');
    assert(facilContent.length > partContent.length, 'facilitator.html is larger (has facilitator-only content)');
  }
}

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

await client.close();

console.log(`\n${'─'.repeat(50)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);

if (failed > 0) {
  process.exit(1);
}
