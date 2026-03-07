/**
 * AI Image Generation for TabletopExercise
 *
 * Three image categories (inspired by TTRPG design):
 *   1. Attack vector — what the victim saw (phishing, ransomware note, USB, etc.)
 *   2. Evidence — what investigators find (SIEM alert, network diagram, dark web listing)
 *   3. Atmosphere — world-building (NPC portraits, location art, cover art)
 *
 * Provider selection: IMAGE_PROVIDER env var (default: openai)
 * API keys read from env — never hardcoded.
 * Add new providers by implementing ImageProviderImpl and registering in PROVIDERS.
 */

import type { Artifact, VisualStyle, ImageSubtype } from './schema.ts';
import { htmlArtifactForSubtype } from './generate-html-artifacts.ts';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ImageProviderName = 'openai' | 'gemini' | 'stability' | 'replicate' | 'ollama';

export interface GenerateOptions {
  width?: number;
  height?: number;
  quality?: 'standard' | 'hd';
  style?: VisualStyle;
}

interface ImageProviderImpl {
  /** Returns base64 data URI: data:image/png;base64,... */
  generate(prompt: string, options: GenerateOptions): Promise<string>;
}

// ---------------------------------------------------------------------------
// Prompt builders
// ---------------------------------------------------------------------------

const STYLE_SAFE = 'Safe for work. No violence, gore, or explicit content.';

function styleToSuffix(style?: VisualStyle): string {
  if (!style) return '';
  const parts: string[] = [];
  if (style.art_style) parts.push(`Art style: ${style.art_style}.`);
  if (style.color_palette) parts.push(`Color palette: ${style.color_palette}.`);
  if (style.mood) parts.push(`Mood: ${style.mood}.`);
  return parts.length > 0 ? `\n\n${parts.join(' ')}` : '';
}

function subtypeFromArtifact(artifact: Artifact): ImageSubtype {
  if (artifact.image_subtype) return artifact.image_subtype;
  switch (artifact.type) {
    case 'email':      return 'phishing_email';
    case 'screenshot': return 'ransomware_note';
    case 'document':   return 'fraudulent_invoice';
    case 'log':        return 'network_capture';
    case 'alert':      return 'dark_web_listing';
    default:           return 'network_diagram';
  }
}

function buildAttackVectorPrompt(artifact: Artifact, style?: VisualStyle): string {
  const subtype = subtypeFromArtifact(artifact);
  const title = artifact.title;
  const preview = (artifact.artifact_content ?? artifact.content ?? '').slice(0, 300);

  let base: string;
  switch (subtype) {
    case 'phishing_email':
      base = `A realistic screenshot of a phishing email in a standard email client. `
           + `The email is titled "${title}". `
           + (preview ? `Email body text begins: "${preview}". ` : '')
           + `The email appears legitimate but has subtle red flags: mismatched sender domain, urgency cues. `
           + `Wide desktop screenshot showing full email client UI with inbox sidebar.`;
      break;
    case 'ransomware_note':
      base = `A screenshot of a computer screen showing a ransomware splash screen. `
           + `Title: "${title}". Dark background, threatening text in bright red or white. `
           + (preview ? `Message preview: "${preview}". ` : '')
           + `Includes a countdown timer, bitcoin address field, and contact instructions.`;
      break;
    case 'fraudulent_invoice':
      base = `A scan or photo of a fraudulent corporate invoice document. `
           + `Document title: "${title}". `
           + (preview ? `Content excerpt: "${preview}". ` : '')
           + `Professional layout with company logo placeholder, line items table, and payment instructions. `
           + `Realistic paper texture, slightly off-center scan.`;
      break;
    case 'usb_device':
      base = `A close-up photo of a USB flash drive found at a reception desk. `
           + `Label reads "${title}". `
           + `Generic office environment background, slightly suspicious placement. `
           + `Photorealistic product shot.`;
      break;
    default:
      base = `A realistic screenshot or visual representation of a cybersecurity artifact titled "${title}". `
           + (preview ? `Content: "${preview}". ` : '');
  }

  return `${base} ${STYLE_SAFE}${styleToSuffix(style)}`;
}

function buildEvidencePrompt(artifact: Artifact, style?: VisualStyle): string {
  const subtype = subtypeFromArtifact(artifact);
  const title = artifact.title;
  const preview = (artifact.artifact_content ?? artifact.content ?? '').slice(0, 300);

  let base: string;
  switch (subtype) {
    case 'network_diagram':
      base = `A professional network topology diagram titled "${title}". `
           + `Shows interconnected nodes: workstations, servers, firewalls, cloud services. `
           + `Includes color-coded threat paths highlighted in red. Clean technical illustration style.`;
      break;
    case 'dark_web_listing':
      base = `A screenshot of a dark web forum or marketplace listing titled "${title}". `
           + `Dark background, monospaced font, anonymous handles. `
           + (preview ? `Listing preview: "${preview}". ` : '')
           + `Realistic underground forum UI. Redacted/fictional PII. No real credentials.`;
      break;
    case 'scada_interface':
      base = `A screenshot of a SCADA/ICS industrial control system HMI interface titled "${title}". `
           + `Shows plant process diagram with sensors, valves, and status indicators. `
           + (preview ? `Status data: "${preview}". ` : '')
           + `Green and amber status lights, slightly dated industrial software aesthetic.`;
      break;
    case 'network_capture':
      base = `A screenshot of a network packet capture or SIEM log viewer titled "${title}". `
           + `Shows rows of log entries with timestamps, IP addresses (RFC 5737 TEST-NET), protocols. `
           + (preview ? `Sample entries: "${preview}". ` : '')
           + `Wireshark or Splunk-style dark theme UI.`;
      break;
    default:
      base = `A professional cybersecurity investigation evidence screenshot titled "${title}". `
           + (preview ? `Content visible: "${preview}". ` : '')
           + `Technical, analytical aesthetic with data tables and charts.`;
  }

  return `${base} ${STYLE_SAFE}${styleToSuffix(style)}`;
}

export interface AtmosphereContext {
  scenario_title: string;
  npc_name?: string;
  npc_role?: string;
  location?: string;
  scenario_overview?: string;
  subtype: ImageSubtype;
}

function buildAtmospherePrompt(ctx: AtmosphereContext, style?: VisualStyle): string {
  let base: string;
  switch (ctx.subtype) {
    case 'portrait':
      base = `A professional portrait illustration of ${ctx.npc_name ?? 'a corporate employee'}`
           + (ctx.npc_role ? `, ${ctx.npc_role}` : '')
           + `. The portrait conveys their personality and role in a cybersecurity incident scenario. `
           + `Stylized corporate headshot, neutral background.`;
      break;
    case 'location_illustration':
      base = `An establishing illustration of ${ctx.location ?? 'a corporate office environment'} `
           + `relevant to the scenario "${ctx.scenario_title}". `
           + `Cinematic wide angle, atmospheric, sets the scene before the incident begins.`;
      break;
    case 'cover_art':
      base = `Cover art for a cybersecurity tabletop exercise titled "${ctx.scenario_title}". `
           + (ctx.scenario_overview ? `Scenario context: "${ctx.scenario_overview.slice(0, 200)}". ` : '')
           + `Professional, dramatic composition suitable for a printed exercise booklet cover. `
           + `No text overlay needed.`;
      break;
    case 'period_photograph':
      base = `A period-accurate archival photograph style image depicting ${ctx.location ?? 'a historical computing environment'} `
           + `related to the scenario "${ctx.scenario_title}". `
           + `Sepia or muted color tone, era-appropriate equipment and clothing.`;
      break;
    default:
      base = `An atmospheric illustration for the cybersecurity exercise "${ctx.scenario_title}". `
           + `Evocative, professional, sets the tone for a serious incident response scenario.`;
  }

  return `${base} ${STYLE_SAFE}${styleToSuffix(style)}`;
}

// ---------------------------------------------------------------------------
// Provider implementations
// ---------------------------------------------------------------------------

class OpenAIProvider implements ImageProviderImpl {
  async generate(prompt: string, options: GenerateOptions): Promise<string> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error('OPENAI_API_KEY not set');

    const resp = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: process.env.OPENAI_IMAGE_MODEL ?? 'dall-e-3',
        prompt,
        n: 1,
        size: `${options.width ?? 1024}x${options.height ?? 1024}`,
        quality: options.quality ?? 'standard',
        response_format: 'b64_json',
      }),
    });
    if (!resp.ok) {
      const err = await resp.text().catch(() => resp.statusText);
      throw new Error(`OpenAI API error ${resp.status}: ${err}`);
    }
    const json = await resp.json() as { data: Array<{ b64_json: string }> };
    return `data:image/png;base64,${json.data[0].b64_json}`;
  }
}

class GeminiProvider implements ImageProviderImpl {
  async generate(prompt: string, _options: GenerateOptions): Promise<string> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY not set');

    // Imagen 4 via predict endpoint (default), or override with GEMINI_IMAGE_MODEL
    const model = process.env.GEMINI_IMAGE_MODEL ?? 'imagen-4.0-generate-001';
    const resp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:predict?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instances: [{ prompt }],
          parameters: { sampleCount: 1 },
        }),
      }
    );
    if (!resp.ok) {
      const err = await resp.text().catch(() => resp.statusText);
      throw new Error(`Gemini API error ${resp.status}: ${err}`);
    }
    const json = await resp.json() as { predictions: Array<{ bytesBase64Encoded: string; mimeType?: string }> };
    const prediction = json.predictions[0];
    if (!prediction?.bytesBase64Encoded) throw new Error('Gemini returned no image data');
    return `data:${prediction.mimeType ?? 'image/png'};base64,${prediction.bytesBase64Encoded}`;
  }
}

class StabilityProvider implements ImageProviderImpl {
  async generate(prompt: string, options: GenerateOptions): Promise<string> {
    const apiKey = process.env.STABILITY_API_KEY;
    if (!apiKey) throw new Error('STABILITY_API_KEY not set');

    const model = process.env.STABILITY_MODEL ?? 'core';
    const endpoint = `https://api.stability.ai/v2beta/stable-image/generate/${model}`;
    const resp = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        output_format: 'png',
        width: options.width ?? 1024,
        height: options.height ?? 1024,
      }),
    });
    if (!resp.ok) {
      const err = await resp.text().catch(() => resp.statusText);
      throw new Error(`Stability API error ${resp.status}: ${err}`);
    }
    const json = await resp.json() as { image: string };
    return `data:image/png;base64,${json.image}`;
  }
}

class ReplicateProvider implements ImageProviderImpl {
  async generate(prompt: string, _options: GenerateOptions): Promise<string> {
    const apiKey = process.env.REPLICATE_API_KEY;
    if (!apiKey) throw new Error('REPLICATE_API_KEY not set');

    const model = process.env.REPLICATE_MODEL ?? 'black-forest-labs/flux-schnell';

    // Start prediction
    const startResp = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ version: model, input: { prompt } }),
    });
    if (!startResp.ok) {
      const err = await startResp.text().catch(() => startResp.statusText);
      throw new Error(`Replicate API error ${startResp.status}: ${err}`);
    }
    const prediction = await startResp.json() as { id: string; urls: { get: string } };

    // Poll until done
    for (let i = 0; i < 30; i++) {
      await new Promise(r => setTimeout(r, 2000));
      const pollResp = await fetch(prediction.urls.get, {
        headers: { 'Authorization': `Bearer ${apiKey}` },
      });
      const poll = await pollResp.json() as { status: string; output?: string[] };
      if (poll.status === 'succeeded' && poll.output?.[0]) {
        const imgResp = await fetch(poll.output[0]);
        const buf = await imgResp.arrayBuffer();
        const b64 = Buffer.from(buf).toString('base64');
        return `data:image/png;base64,${b64}`;
      }
      if (poll.status === 'failed') throw new Error('Replicate prediction failed');
    }
    throw new Error('Replicate prediction timed out');
  }
}

class OllamaProvider implements ImageProviderImpl {
  async generate(prompt: string, _options: GenerateOptions): Promise<string> {
    const baseUrl = process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434';
    const model = process.env.OLLAMA_IMAGE_MODEL ?? 'llava';

    const resp = await fetch(`${baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, prompt, stream: false }),
    });
    if (!resp.ok) {
      const err = await resp.text().catch(() => resp.statusText);
      throw new Error(`Ollama API error ${resp.status}: ${err}`);
    }
    const json = await resp.json() as { images?: string[] };
    if (!json.images?.[0]) throw new Error('Ollama returned no image data');
    return `data:image/png;base64,${json.images[0]}`;
  }
}

// ---------------------------------------------------------------------------
// Provider registry
// ---------------------------------------------------------------------------

const PROVIDERS: Record<ImageProviderName, () => ImageProviderImpl> = {
  openai:    () => new OpenAIProvider(),
  gemini:    () => new GeminiProvider(),
  stability: () => new StabilityProvider(),
  replicate: () => new ReplicateProvider(),
  ollama:    () => new OllamaProvider(),
};

function getProvider(name: ImageProviderName): ImageProviderImpl {
  const factory = PROVIDERS[name];
  if (!factory) throw new Error(`Unknown image provider: "${name}". Valid providers: ${Object.keys(PROVIDERS).join(', ')}`);
  return factory();
}

/**
 * Parse IMAGE_PROVIDER into an ordered chain.
 * Accepts a single name ("openai") or comma-separated priority list
 * ("anthropic,openai,replicate"). Each entry is tried in order; the
 * first success wins.
 */
function buildProviderChain(): Array<[string, ImageProviderImpl]> {
  const raw = process.env.IMAGE_PROVIDER ?? 'openai';
  return raw.split(',').map(s => s.trim()).filter(Boolean).map(name => [name, getProvider(name as ImageProviderName)] as [string, ImageProviderImpl]);
}

/**
 * Try each provider in the chain. Returns on first success.
 * Throws a combined error listing every failure if all providers fail.
 */
async function generateWithFallback(prompt: string, options: GenerateOptions): Promise<{ imageData: string; providerUsed: string }> {
  const chain = buildProviderChain();
  const errors: string[] = [];

  for (const [name, impl] of chain) {
    try {
      const imageData = await impl.generate(prompt, options);
      return { imageData, providerUsed: name };
    } catch (err) {
      errors.push(`${name}: ${String(err)}`);
    }
  }

  throw new Error(`All providers failed:\n${errors.join('\n')}`);
}

// ---------------------------------------------------------------------------
// Three exported generator functions (one per MCP tool)
// ---------------------------------------------------------------------------

/**
 * Tool 8: Generate attack vector images.
 * Populates artifact.image_data for attack-vector-type artifacts.
 * Returns updated artifacts array + provider used.
 */
export async function generateAttackVectorImages(
  artifacts: Artifact[],
  style?: VisualStyle,
): Promise<{ updatedArtifacts: Artifact[]; imagesGenerated: number; providerUsed: string }> {
  const attackSubtypes = new Set<ImageSubtype>(['ransomware_note', 'phishing_email', 'fraudulent_invoice', 'usb_device']);
  const providersUsed = new Set<string>();

  let imagesGenerated = 0;
  const updatedArtifacts = await Promise.all(
    artifacts.map(async (artifact) => {
      const subtype = subtypeFromArtifact(artifact);
      if (!attackSubtypes.has(subtype) && artifact.type !== 'email' && artifact.type !== 'screenshot' && artifact.type !== 'document') {
        return artifact;
      }
      // UI subtypes: render via CSS/HTML template (no API key needed, text always legible)
      const content = artifact.artifact_content ?? artifact.content ?? '';
      const htmlTemplate = htmlArtifactForSubtype(subtype, artifact.title, content, style);
      if (htmlTemplate) {
        imagesGenerated++;
        return { ...artifact, html_data: htmlTemplate };
      }
      // Physical subtypes: fall through to AI provider
      const prompt = buildAttackVectorPrompt(artifact, style);
      const { imageData, providerUsed } = await generateWithFallback(prompt, { style });
      providersUsed.add(providerUsed);
      imagesGenerated++;
      return { ...artifact, image_data: imageData };
    })
  );

  return { updatedArtifacts, imagesGenerated, providerUsed: [...providersUsed].join(', ') };
}

/**
 * Tool 9: Generate evidence images.
 * Populates artifact.image_data for evidence-type artifacts.
 */
export async function generateEvidenceImages(
  artifacts: Artifact[],
  style?: VisualStyle,
): Promise<{ updatedArtifacts: Artifact[]; imagesGenerated: number; providerUsed: string }> {
  const evidenceSubtypes = new Set<ImageSubtype>(['scada_interface', 'network_capture', 'dark_web_listing', 'network_diagram']);
  const providersUsed = new Set<string>();

  let imagesGenerated = 0;
  const updatedArtifacts = await Promise.all(
    artifacts.map(async (artifact) => {
      const subtype = subtypeFromArtifact(artifact);
      if (!evidenceSubtypes.has(subtype) && artifact.type !== 'log' && artifact.type !== 'alert') {
        return artifact;
      }
      // UI subtypes: render via CSS/HTML template
      const content = artifact.artifact_content ?? artifact.content ?? '';
      const htmlTemplate = htmlArtifactForSubtype(subtype, artifact.title, content, style);
      if (htmlTemplate) {
        imagesGenerated++;
        return { ...artifact, html_data: htmlTemplate };
      }
      // Physical/diagram subtypes: fall through to AI provider
      const prompt = buildEvidencePrompt(artifact, style);
      const { imageData, providerUsed } = await generateWithFallback(prompt, { style });
      providersUsed.add(providerUsed);
      imagesGenerated++;
      return { ...artifact, image_data: imageData };
    })
  );

  return { updatedArtifacts, imagesGenerated, providerUsed: [...providersUsed].join(', ') };
}

/**
 * Tool 10: Generate atmosphere images.
 * Generates cover_image_data and NPC portrait_data.
 */
export async function generateAtmosphereImages(
  context: AtmosphereContext[],
  style?: VisualStyle,
): Promise<{ results: Array<{ subtype: string; image_data: string }>; imagesGenerated: number; providerUsed: string }> {
  const providersUsed = new Set<string>();
  const results: Array<{ subtype: string; image_data: string }> = [];

  for (const ctx of context) {
    const prompt = buildAtmospherePrompt(ctx, style);
    const { imageData, providerUsed } = await generateWithFallback(prompt, { style });
    providersUsed.add(providerUsed);
    results.push({ subtype: ctx.subtype, image_data: imageData });
  }

  return { results, imagesGenerated: results.length, providerUsed: [...providersUsed].join(', ') };
}
