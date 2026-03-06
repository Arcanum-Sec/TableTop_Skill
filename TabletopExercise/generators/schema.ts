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
  status: z.string(),
  trigger: z.string(),
  requiredProcedures: z.array(z.string()),
  impact: z.string(),
  recommendation: z.string(),
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

export const NPCDialogueSchema = z.object({
  npcName: z.string().min(1),
  role: z.string().min(1),
  triggerContext: z.string(),
  lines: z.array(NPCDialogueLineSchema).min(1),
});

export const ArtifactSchema = z.object({
  id: z.string().min(1),
  type: z.enum(['screenshot', 'log', 'email', 'document', 'alert', 'other']),
  title: z.string().min(1),
  content: z.string(),
  linkedInjectId: z.string().optional(),
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
