/**
 * QMD generator for the M&M handbook.
 *
 * Produces Quarto markdown output directly — no HTML-to-QMD conversion needed.
 *
 * Key rules enforced here (not left to the caller):
 *  - Blank lines before every list (Quarto/Pandoc requirement)
 *  - No em dash characters — use -- instead
 *  - Contemporary/community scenarios: read_aloud must not name the malmon family
 *  - artifact_content: TEST-NET IPs only (192.0.2.x, 198.51.100.x, 203.0.113.x)
 *  - Variation blocks auto-wrapped around fields containing {{...}} placeholders
 */

import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';

import type {
  TabletopExerciseData,
  Inject,
  Gap,
  Artifact,
  NPCDialogue,
  RedHerring,
  NPCDialogueLinesQMD,
  ScenarioType,
} from './schema.ts';

// ---------------------------------------------------------------------------
// Formatting helpers — the ONLY way to produce lists in this generator.
// The leading \n is non-negotiable: Quarto requires a blank line before lists.
// ---------------------------------------------------------------------------

export function bulletList(items: string[]): string {
  if (items.length === 0) return '';
  return '\n' + items.map(i => `- ${i}`).join('\n') + '\n';
}

export function numberedList(items: string[]): string {
  if (items.length === 0) return '';
  return '\n' + items.map((item, i) => `${i + 1}. ${item}`).join('\n') + '\n';
}

export function paragraph(text: string): string {
  return '\n' + text + '\n';
}

/** Headings do NOT get a leading blank line — Quarto does not require one. */
export function heading(level: number, text: string): string {
  return '\n' + '#'.repeat(level) + ' ' + text + '\n';
}

/** Two trailing spaces = line break within a paragraph (Quarto rule). */
export function boldKV(label: string, value: string): string {
  return `\n**${label}:** ${value}  `;
}

// ---------------------------------------------------------------------------
// Guards
// ---------------------------------------------------------------------------

const EM_DASH = '\u2014';

/** Throw if the generated string contains an em dash character. */
export function safeQmd(s: string): string {
  if (s.includes(EM_DASH)) {
    throw new Error(
      'Em dash (\u2014) found in generated QMD — use -- (two hyphens) instead.'
    );
  }
  return s;
}

/** TEST-NET IP ranges that are safe to use in exercise artifacts. */
const TEST_NET_PREFIXES = ['192.0.2.', '198.51.100.', '203.0.113.'];

const IPV4_RE = /\b(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})\b/g;

function isTestNetIp(ip: string): boolean {
  return TEST_NET_PREFIXES.some(prefix => ip.startsWith(prefix));
}

/** Throw if artifact_content contains IP addresses outside TEST-NET ranges. */
export function validateTestNetIPs(content: string): void {
  const matches = [...content.matchAll(IPV4_RE)];
  for (const match of matches) {
    const ip = match[0];
    if (!isTestNetIp(ip)) {
      throw new Error(
        `Real routable IP address "${ip}" found in artifact_content. ` +
        'Use TEST-NET ranges only: 192.0.2.x, 198.51.100.x, 203.0.113.x.'
      );
    }
  }
}

/**
 * Throw if any inject read_aloud field names the malmon family in a
 * contemporary or community scenario.
 */
export function validateContemporaryReadAloud(
  injects: Inject[],
  malmonFamily: string,
  scenarioType: ScenarioType
): void {
  if (scenarioType === 'historical') return;
  const lowerFamily = malmonFamily.toLowerCase();
  for (const inject of injects) {
    const readAloud = inject.read_aloud ?? inject.scenario ?? '';
    if (readAloud.toLowerCase().includes(lowerFamily)) {
      throw new Error(
        `Inject "${inject.id}" read_aloud names the malmon family "${malmonFamily}" ` +
        `in a ${scenarioType} scenario. Use symptom-only descriptions.`
      );
    }
  }
}

// ---------------------------------------------------------------------------
// Variation block wrapping
// ---------------------------------------------------------------------------

const VARIATION_RE = /\{\{[^}]+\}\}/;

/**
 * Wrap text in a variation block if it contains {{...}} placeholders.
 * If no region is specified in the data, uses a single default="true" block.
 */
export function wrapVariation(text: string, group = 'region', value = 'default'): string {
  if (!VARIATION_RE.test(text)) return text;
  return (
    `::: {.variation group="${group}" value="${value}" default="true"}\n` +
    text + '\n' +
    ':::\n'
  );
}

// ---------------------------------------------------------------------------
// Slug derivation
// ---------------------------------------------------------------------------

export function slugFromFilename(filename: string): string {
  return filename
    .replace(/\.qmd$/i, '')
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

// ---------------------------------------------------------------------------
// Section renderers
// ---------------------------------------------------------------------------

function renderInjectSequence(injects: Inject[]): string {
  let out = heading(2, 'Inject Sequence');
  out += paragraph(
    '*The following injects are delivered by the IM at the trigger points described. ' +
    'Read aloud text verbatim. Adjust timing to group pace -- a fast-moving group ' +
    'may skip injects; a stuck group may need them early.*'
  );

  injects.forEach((inject, idx) => {
    const n = idx + 1;
    out += heading(3, `Inject ${n}: ${inject.title}`);

    if (inject.trigger) {
      out += boldKV('Trigger', inject.trigger);
    }

    const readAloud = inject.read_aloud ?? inject.scenario;
    out += '\n\n**Read Aloud:**\n';
    out += paragraph(wrapVariation(`*"${readAloud}"*`));

    if (inject.artifact_inline) {
      out += '\n**Inline Artifact:**\n';
      // Indent 4 spaces → renders as code block in Quarto
      out += '\n' + inject.artifact_inline.split('\n').map(l => '    ' + l).join('\n') + '\n';
    }

    const questions = inject.discussionQuestions ?? [];
    if (questions.length > 0) {
      out += '\n**Discussion Questions:**';
      out += bulletList(questions);
    }

    const branches = inject.conditional_branches ?? inject.conditionalResponses?.map(cr => ({
      condition: cr.trigger,
      im_response: cr.response,
    })) ?? [];
    if (branches.length > 0) {
      out += '\n**Conditional Branches:**';
      out += bulletList(branches.map(b => `**If team ${b.condition}:** ${b.im_response}`));
    }

    const notes: string[] = [];
    if (inject.hint_if_stuck) notes.push(`*Hint if stuck:* *"${inject.hint_if_stuck}"*`);
    if (inject.red_flag) notes.push(`*Red flag:* ${inject.red_flag}`);
    if (inject.success_indicator) notes.push(`*Success indicator:* ${inject.success_indicator}`);
    if (inject.expectedResponse && !inject.hint_if_stuck) notes.push(`*Expected response:* ${inject.expectedResponse}`);

    if (notes.length > 0) {
      out += '\n**IM Notes:**';
      out += bulletList(notes);
    }
  });

  return out;
}

function isQMDLines(lines: NPCDialogue['lines']): lines is NPCDialogueLinesQMD {
  return (
    lines !== undefined &&
    !Array.isArray(lines) &&
    'under_pressure' in lines
  );
}

function renderNPCDialogue(npcDialogue: NPCDialogue[]): string {
  let out = heading(2, 'NPC Dialogue Scripts');
  out += paragraph(
    '*Verbatim lines for key NPCs at critical decision moments. Deliver in character ' +
    'when players interact with the NPC or when the scene naturally calls for it. ' +
    'Adapt phrasing naturally but preserve the core message.*'
  );

  for (const npc of npcDialogue) {
    const nameLabel = npc.npcName ? `${npc.role}: ${npc.npcName}` : npc.role;
    out += heading(3, wrapVariation(nameLabel));

    if (npc.triggerContext) {
      out += paragraph(npc.triggerContext);
    }

    if (isQMDLines(npc.lines)) {
      out += '\n**Under pressure** (when team delays or debates):\n';
      out += paragraph(wrapVariation(`*"${npc.lines.under_pressure}"*`));

      out += '\n**Escalating** (when situation worsens or deadline approaches):\n';
      out += paragraph(wrapVariation(`*"${npc.lines.escalating}"*`));

      out += '\n**Conceding** (when team presents a strong plan):\n';
      out += paragraph(wrapVariation(`*"${npc.lines.conceding}"*`));
    } else if (Array.isArray(npc.lines) && npc.lines.length > 0) {
      for (const line of npc.lines) {
        out += boldKV(line.prompt, '');
        out += paragraph(wrapVariation(`*"${line.response}"*`));
      }
    }
  }

  return out;
}

function renderRedHerrings(redHerrings: RedHerring[]): string {
  let out = heading(2, 'Red Herrings');
  out += paragraph(
    '*These false leads are built into the scenario. Do not shut down player investigation -- ' +
    'let them work through the evidence to the correct conclusion. The goal is productive ' +
    'confusion, not frustration.*'
  );

  redHerrings.forEach((rh, idx) => {
    out += heading(3, `Red Herring ${idx + 1}: ${rh.title}`);
    out += '\n**What points to it:**';
    out += bulletList(rh.what_points_to_it);
    out += boldKV('Why it\'s wrong', rh.why_its_wrong);
    out += '\n\n**IM resolution script:** ';
    out += paragraph(wrapVariation(`*"${rh.im_resolution_script}"*`));
  });

  return out;
}

function renderGapAnalysis(gaps: Gap[]): string {
  let out = heading(2, 'Post-Session Gap Analysis');
  out += paragraph(
    '*Use this section during the debrief. Each gap is a real security control weakness ' +
    'this scenario is designed to surface. Help participants connect scenario events to ' +
    'their own organization\'s readiness.*'
  );

  gaps.forEach((gap, idx) => {
    const n = idx + 1;
    out += heading(3, `Gap ${n}: ${gap.title} *(Priority: ${gap.priority})*`);

    const revealed = gap.what_the_scenario_revealed ?? gap.trigger ?? gap.impact ?? '';
    const matters = gap.why_it_matters ?? gap.recommendation ?? '';
    const remediation = gap.suggested_remediation ?? gap.requiredProcedures ?? [];
    const debriefQ = gap.debrief_question ?? '';

    out += boldKV('What the scenario revealed', revealed);
    out += boldKV('Why it matters', matters);

    if (remediation.length > 0) {
      out += '\n\n**Suggested remediation:**';
      out += bulletList(remediation);
    }

    if (debriefQ) {
      out += boldKV('Debrief question', `*"${debriefQ}"*`);
    }
  });

  return out;
}

// ---------------------------------------------------------------------------
// Handout renderer
// ---------------------------------------------------------------------------

/**
 * CSS block for handout QMD files.
 *
 * Verified against the canonical M&M source file:
 *   im-handbook/resources/scenario-cards/stuxnet/historical-foundation/handout-a-scada-diagnostics.qmd
 */
const HANDOUT_CSS = `\`\`\`{=html}
<style>
@media print {
  #quarto-sidebar, .quarto-title-block, nav.navbar,
  #quarto-header, .nav-footer, #quarto-margin-sidebar,
  .quarto-search, .sidebar-navigation, .toc-actions,
  .variation-controls, #TOC, .breadcrumb-container { display: none !important; }
  #quarto-content { margin-left: 0 !important; }
  .im-notes { display: none !important; }
  body { font-size: 11pt; font-family: monospace; }
  pre { page-break-inside: avoid; }
  h1 { font-size: 18pt; }
  h2 { font-size: 14pt; }
}
.im-notes {
  background: #fff3cd;
  border: 1px solid #ffc107;
  border-radius: 6px;
  padding: 0.8rem 1rem;
  margin-top: 0.5rem;
  font-size: 0.9em;
}
.im-notes { color: #433000; }
[data-bs-theme="dark"] .im-notes,
.quarto-dark .im-notes { background: #3d3200; border-color: #665200; color: #f5e6b8; }
</style>
\`\`\``;

function renderHandout(artifact: Artifact, malmonFamily: string): string {
  const letter = artifact.handout_letter ?? 'A';
  const artifactContent = artifact.artifact_content ?? artifact.content ?? '';

  if (artifactContent) {
    validateTestNetIPs(artifactContent);
  }

  let out = `---\npagetitle: "Handout ${letter}: ${artifact.title} | ${malmonFamily}"\n---\n\n`;
  out += HANDOUT_CSS + '\n';
  out += heading(1, `Handout ${letter}: ${artifact.title}`);

  if (artifact.scene_context) {
    out += paragraph(`*${artifact.scene_context}*`);
  }

  out += '\n---\n';

  if (artifact.section_heading) {
    out += heading(2, artifact.section_heading);
  }

  if (artifactContent) {
    out += '\n```\n' + artifactContent + '\n```\n';
  }

  const imNotes = artifact.im_notes_bullets ?? [];
  if (imNotes.length > 0) {
    out += '\n::: {.im-notes}\n**IM NOTES (Do Not Show to Players):**';
    out += bulletList(imNotes);
    out += ':::\n';
  }

  out += '\n---\n';
  out += heading(2, 'Key Discovery Questions');

  const questions = artifact.key_discovery_questions ?? [];
  for (const q of questions) {
    out += '\n- **' + q.question + '**\n';
    if (q.answer_and_facilitation) {
      out += '\n::: {.im-notes}\n' + q.answer_and_facilitation + '\n:::\n';
    }
  }

  const facilNotes = artifact.facilitation_notes ?? [];
  if (facilNotes.length > 0) {
    out += '\n::: {.im-notes}\n';
    out += heading(2, 'IM Facilitation Notes');
    out += bulletList(facilNotes);
    out += ':::\n';
  }

  return out;
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export interface QMDGenerateResult {
  appended_to: string;
  sections_written: string[];
  handout_a_path?: string;
  handout_b_path?: string;
}

export async function generateExerciseQmd(
  data: TabletopExerciseData,
  outputDir: string,
  appendTo: string
): Promise<QMDGenerateResult> {
  // Resolve scenario type (top-level or nested metadata)
  const scenarioType: ScenarioType =
    data.scenario_type ??
    data.metadata?.scenario_type ??
    'contemporary';

  const malmonFamily = data.scenario?.malmon_family ?? '';

  // Contemporary/community read_aloud validation
  if (malmonFamily && data.injects.length > 0) {
    validateContemporaryReadAloud(data.injects, malmonFamily, scenarioType);
  }

  // Build the four sections
  const sectionsWritten: string[] = [];
  let appendContent = '';

  if (data.injects.length > 0) {
    appendContent += safeQmd(renderInjectSequence(data.injects));
    sectionsWritten.push('Inject Sequence');
  }

  if ((data.npcDialogue ?? []).length > 0) {
    appendContent += safeQmd(renderNPCDialogue(data.npcDialogue!));
    sectionsWritten.push('NPC Dialogue Scripts');
  }

  if ((data.red_herrings ?? []).length > 0) {
    appendContent += safeQmd(renderRedHerrings(data.red_herrings!));
    sectionsWritten.push('Red Herrings');
  }

  if (data.gaps.length > 0) {
    appendContent += safeQmd(renderGapAnalysis(data.gaps));
    sectionsWritten.push('Post-Session Gap Analysis');
  }

  // Append sections to index.qmd
  let existing = '';
  try {
    existing = await readFile(appendTo, 'utf-8');
  } catch {
    // File doesn't exist yet — start fresh
  }
  await writeFile(appendTo, existing + '\n' + appendContent, 'utf-8');

  // Write exercise-data.json to output_dir
  await writeFile(
    join(outputDir, 'exercise-data.json'),
    JSON.stringify(data, null, 2),
    'utf-8'
  );

  const result: QMDGenerateResult = {
    appended_to: appendTo,
    sections_written: sectionsWritten,
  };

  // Write handout files (up to 2)
  const artifacts = data.artifacts ?? [];
  const handoutA = artifacts.find(a => a.handout_letter === 'A') ?? artifacts[0];
  const handoutB = artifacts.find(a => a.handout_letter === 'B') ?? artifacts[1];

  if (handoutA) {
    const slug = slugFromFilename(handoutA.filename ?? handoutA.id);
    const handoutPath = join(outputDir, `handout-a-${slug}.qmd`);
    await writeFile(handoutPath, safeQmd(renderHandout({ ...handoutA, handout_letter: 'A' }, malmonFamily)), 'utf-8');
    result.handout_a_path = handoutPath;
  }

  if (handoutB) {
    const slug = slugFromFilename(handoutB.filename ?? handoutB.id);
    const handoutPath = join(outputDir, `handout-b-${slug}.qmd`);
    await writeFile(handoutPath, safeQmd(renderHandout({ ...handoutB, handout_letter: 'B' }, malmonFamily)), 'utf-8');
    result.handout_b_path = handoutPath;
  }

  return result;
}
