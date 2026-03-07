/**
 * Zod schemas for TabletopExercise data.
 *
 * Single source of truth for:
 *  - TypeScript types (via z.infer)
 *  - MCP tool validation
 *  - tabletop://schema resource (via zod-to-json-schema)
 *
 * Derived from the TabletopExerciseData interface in generate-pdf.ts,
 * extended with M&M-specific enrichment fields.
 */

import { z } from 'zod';

// ---------------------------------------------------------------------------
// Primitive enums
// ---------------------------------------------------------------------------

export const ScenarioTypeSchema = z.enum(['contemporary', 'historical']);

export const SeverityUpperSchema = z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']);
export const SeverityLowerSchema = z.enum(['critical', 'high', 'medium', 'low']);

// ---------------------------------------------------------------------------
// Sub-schemas mirroring generate-pdf.ts interfaces
// ---------------------------------------------------------------------------

export const ConditionalResponseSchema = z.object({
  trigger: z.string().min(1),
  response: z.string().min(1),
});

export const TimelineEventSchema = z.object({
  time: z.string().min(1),
  title: z.string().min(1),
  description: z.string(),
  impact: z.string().optional(),
  severity: SeverityLowerSchema,
});

export const ObjectiveSchema = z.object({
  number: z.number().int().positive(),
  title: z.string().min(1),
  description: z.string(),
  successCriteria: z.array(z.string()),
});

/** QMD-format conditional branch (if team [condition] → IM response) */
export const QMDConditionalBranchSchema = z.object({
  condition: z.string().min(1),
  im_response: z.string().min(1),
});

export const InjectSchema = z.object({
  id: z.string().min(1),
  time: z.string().min(1),
  title: z.string().min(1),
  severity: SeverityLowerSchema,
  /** READ-ALOUD narrative shown to participants. Contemporary: symptom-only, no malmon family names. */
  scenario: z.string().min(1),
  artifact: z.string().optional(),
  expectedResponse: z.string(),
  discussionQuestions: z.array(z.string()).optional(),
  conditionalResponses: z.array(ConditionalResponseSchema).optional(),

  // QMD-specific fields (M&M handbook format)
  trigger: z.string().optional(),
  read_aloud: z.string().optional(),
  artifact_inline: z.string().optional(),
  hint_if_stuck: z.string().optional(),
  red_flag: z.string().optional(),
  success_indicator: z.string().optional(),
  conditional_branches: z.array(QMDConditionalBranchSchema).optional(),
});

export const AtomicSchema = z.object({
  id: z.string().min(1),
  time: z.string().min(1),
  title: z.string().min(1),
  action: z.string().min(1),
  commands: z.string().optional(),
  commandLanguage: z.string().optional(),
  expectedResponse: z.string(),
  fallback: z.string().optional(),
  verification: z.array(z.string()).optional(),
});

export const GapSchema = z.object({
  priority: SeverityLowerSchema,
  title: z.string().min(1),
  // HTML-generator fields
  status: z.string().optional(),
  trigger: z.string().optional(),
  requiredProcedures: z.array(z.string()).optional(),
  impact: z.string().optional(),
  recommendation: z.string().optional(),
  // QMD-specific fields (M&M debrief format)
  what_the_scenario_revealed: z.string().optional(),
  why_it_matters: z.string().optional(),
  suggested_remediation: z.array(z.string()).optional(),
  debrief_question: z.string().optional(),
});

export const GapStatsSchema = z.object({
  critical: z.number().int().min(0),
  high: z.number().int().min(0),
  medium: z.number().int().min(0),
  low: z.number().int().min(0),
});

// ---------------------------------------------------------------------------
// M&M-specific enrichment schemas
// ---------------------------------------------------------------------------

export const NPCDialogueLineSchema = z.object({
  prompt: z.string().min(1),
  response: z.string().min(1),
});

/** QMD-format NPC dialogue lines with three named emotional beats */
export const NPCDialogueLinesQMDSchema = z.object({
  under_pressure: z.string().min(1),
  escalating: z.string().min(1),
  conceding: z.string().min(1),
});

export const NPCDialogueSchema = z.object({
  npcName: z.string().min(1),
  role: z.string().min(1),
  triggerContext: z.string().optional(),
  // Accepts either the original prompt/response array or the QMD under_pressure/escalating/conceding object
  lines: z.union([
    z.array(NPCDialogueLineSchema).min(1),
    NPCDialogueLinesQMDSchema,
  ]).optional(),
});

export const KeyDiscoveryQuestionSchema = z.object({
  question: z.string().min(1),
  answer_and_facilitation: z.string(),
});

export const ImageSubtypeSchema = z.enum([
  // Attack vector
  'ransomware_note',
  'phishing_email',
  'fraudulent_invoice',
  'usb_device',
  // Evidence
  'scada_interface',
  'network_capture',
  'dark_web_listing',
  'network_diagram',
  // Atmosphere
  'period_photograph',
  'portrait',
  'location_illustration',
  'cover_art',
]);

export const VisualStyleSchema = z.object({
  art_style: z.string().optional(),     // "photorealistic" | "noir graphic novel"
  color_palette: z.string().optional(), // "muted sepia" | "high-contrast blue-grey"
  mood: z.string().optional(),          // "tense, clinical" | "cold, corporate"
  seed: z.number().int().optional(),    // for deterministic generation
});

export const ArtifactSchema = z.object({
  id: z.string().min(1),
  type: z.enum(['screenshot', 'log', 'email', 'document', 'alert', 'other']),
  title: z.string().min(1),
  content: z.string().optional(),
  linkedInjectId: z.string().optional(),
  // QMD handout fields
  filename: z.string().optional(),           // used to derive handout slug
  handout_letter: z.enum(['A', 'B']).optional(),
  scene_context: z.string().optional(),
  section_heading: z.string().optional(),
  artifact_content: z.string().optional(),   // must use TEST-NET IPs + .example TLD
  im_notes_bullets: z.array(z.string()).optional(),
  key_discovery_questions: z.array(KeyDiscoveryQuestionSchema).optional(),
  facilitation_notes: z.array(z.string()).optional(),
  // Image generation fields
  image_data: z.string().optional(),         // base64 data URI (data:image/png;base64,...)
  html_data: z.string().optional(),          // self-contained HTML string for UI-based artifacts
  image_subtype: ImageSubtypeSchema.optional(),
});

// ---------------------------------------------------------------------------
// M&M QMD-specific schemas
// ---------------------------------------------------------------------------

export const RedHerringSchema = z.object({
  title: z.string().min(1),
  what_points_to_it: z.array(z.string()).min(1),
  why_its_wrong: z.string().min(1),
  im_resolution_script: z.string().min(1),
});

// ---------------------------------------------------------------------------
// Facilitator guide sub-schema (passthrough for extra fields)
// ---------------------------------------------------------------------------

export const FacilitatorGuidePreparationSchema = z
  .object({
    timeline: z.string().optional(),
    tasks: z.array(z.string()).optional(),
    materialsNeeded: z.array(z.string()).optional(),
    roomSetup: z.array(z.string()).optional(),
  })
  .passthrough();

export const FacilitatorGuideSchema = z
  .object({
    preparation: FacilitatorGuidePreparationSchema.optional(),
    openingScript: z.string().optional(),
    groundRules: z.array(z.string()).optional(),
  })
  .passthrough();

// ---------------------------------------------------------------------------
// Full exercise data schema — the quality standard
// ---------------------------------------------------------------------------

export const TabletopExerciseDataSchema = z.object({
  // M&M scenario type — unlocks historical mode rules
  scenario_type: ScenarioTypeSchema.optional(),

  // Cover page
  title: z.string().min(1),
  subtitle: z.string().optional(),
  scenarioType: z.string().optional(),
  targetAudience: z.string(),
  duration: z.string().optional(),
  difficulty: z.string().optional(),
  severity: SeverityUpperSchema,
  preparedBy: z.string().optional(),
  date: z.string().optional(),
  version: z.string().optional(),

  // Executive summary
  executiveSummary: z.string().optional(),
  attackVector: z.string().optional(),
  potentialImpact: z.string().optional(),
  testingGoals: z.string().optional(),
  criticalGaps: z.string().optional(),

  // Scenario narrative
  scenarioOverview: z.string().optional(),
  timelineEvents: z.array(TimelineEventSchema).optional(),

  // Learning objectives
  objectives: z.array(ObjectiveSchema).optional(),

  // Facilitator guide
  facilitatorGuide: FacilitatorGuideSchema.optional(),

  // Core exercise content
  injects: z.array(InjectSchema),

  // Technical atomics
  atomics: z.array(AtomicSchema).optional(),

  // Gap analysis
  gapStats: GapStatsSchema.optional(),
  gaps: z.array(GapSchema),

  // M&M enrichment sections
  npcDialogue: z.array(NPCDialogueSchema).optional(),
  artifacts: z.array(ArtifactSchema).optional(),
  red_herrings: z.array(RedHerringSchema).optional(),

  // M&M nested metadata (scenario_type also available at top level for backwards compat)
  metadata: z.object({
    scenario_type: ScenarioTypeSchema.optional(),
  }).passthrough().optional(),

  // M&M scenario info (malmon_family used for contemporary read_aloud validation)
  scenario: z.object({
    malmon_family: z.string().optional(),
  }).passthrough().optional(),

  // Image generation fields
  cover_image_data: z.string().optional(),   // base64 data URI for cover page
  visual_style: VisualStyleSchema.optional(),
});

// ---------------------------------------------------------------------------
// Section presence schema (returned by check_scenario_completeness)
// ---------------------------------------------------------------------------

export const SectionPresenceSchema = z.object({
  present: z.array(z.string()),
  missing: z.array(z.string()),
  scenario_type: ScenarioTypeSchema,
});

// ---------------------------------------------------------------------------
// Exported TypeScript types
// ---------------------------------------------------------------------------

export type TabletopExerciseData = z.infer<typeof TabletopExerciseDataSchema>;
export type ScenarioType = z.infer<typeof ScenarioTypeSchema>;
export type SectionPresence = z.infer<typeof SectionPresenceSchema>;
export type Inject = z.infer<typeof InjectSchema>;
export type Gap = z.infer<typeof GapSchema>;
export type Atomic = z.infer<typeof AtomicSchema>;
export type Artifact = z.infer<typeof ArtifactSchema>;
export type NPCDialogue = z.infer<typeof NPCDialogueSchema>;
export type RedHerring = z.infer<typeof RedHerringSchema>;
export type NPCDialogueLinesQMD = z.infer<typeof NPCDialogueLinesQMDSchema>;
export type KeyDiscoveryQuestion = z.infer<typeof KeyDiscoveryQuestionSchema>;
export type ImageSubtype = z.infer<typeof ImageSubtypeSchema>;
export type VisualStyle = z.infer<typeof VisualStyleSchema>;
