---
name: TabletopExercise
description: Comprehensive cybersecurity tabletop exercise design and facilitation framework. USE WHEN designing incident response scenarios, creating executive or technical tabletops, generating atomics for exercise runners, identifying missing SOPs/playbooks, or evaluating organizational preparedness. Includes threat model integration, CISA-aligned methodologies, and automated gap analysis.
---

# TabletopExercise Skill

## Output Formats (ALWAYS GENERATE ALL THREE)

When you complete a tabletop exercise, generate these three outputs:

| Output | Purpose | File |
|--------|---------|------|
| **PDF** | Professional client-ready document | `[Exercise].pdf` |
| **Facilitator HTML** | Full content with notes, answers, guidance | `[Exercise]-facilitator.html` |
| **Participant HTML** | Clean version, no spoilers for attendees | `[Exercise]-participant.html` |

### Generator Location
```
~/.openclaw/workspace/skills/TabletopExercise/generators/
```

Run with:
```bash
cd ~/.openclaw/workspace/skills/TabletopExercise/generators
bun run generate-html.ts --input ../examples/[slug]/exercise-data.json --output ../examples/[slug]/
```

## Directory Structure

```
TabletopExercise/
├── SKILL.md                 # This file
├── ATOMICS-LIBRARY.md       # Atomic scenarios
├── generators/              # TypeScript generators
│   ├── generate-pdf.ts     # PDF generator
│   ├── generate-html.ts    # HTML generator
│   ├── generate-both.ts    # Generate both
│   └── package.json
├── templates/              # HTML templates
│   └── tabletop-exercise.html
├── examples/                # Example exercises
│   ├── lapsus-breach/
│   │   └── exercise-data.json
│   ├── ransomware-dev-network/
│   │   └── exercise-data.json
│   └── rainbow-six-ddos-attack/
│       └── exercise-data.json
```

## Running the Generators

### Prerequisites
```bash
cd ~/.openclaw/workspace/skills/TabletopExercise/generators
bun install
```

### Generate HTML Files
```bash
cd generators
bun run generate-html.ts --input ../examples/[exercise]/exercise-data.json
```

### Generate PDF
```bash
cd generators
bun run generate-pdf.ts --input ../examples/[exercise]/[exercise]-facilitator.html
```

### Generate Both
```bash
cd generators
bun run generate-both.ts --exercise [exercise-name]
```

## CRITICAL: Output Format Must Match Examples

The output MUST match the detail level and design of:
1. `rainbow-six-ddos-attack-reference.html` - Original detailed format
2. `examples/ssrf-aws-compromise/ssrf-aws-facilitator-v2.html` - Latest detailed format

Reference these files as templates. The SKILL.md below provides JSON structure, but always cross-reference with the HTML examples for exact styling and detail expectations.

### Required JSON Structure (exercise-data.json)

Each exercise MUST have this structure:

```json
{
  "title": "Exercise Title",
  "subtitle": "Brief description",
  "scenarioType": "Technical - Cloud Security",
  "targetAudience": "SOC Analysts, DevOps, Incident Response",
  "duration": "2 hours",
  "difficulty": "Intermediate",
  "severity": "CRITICAL",
  "preparedBy": "Arcanum Information Security",
  "date": "February 27, 2026",
  "version": "1.0",
  "executiveSummary": "2-3 paragraph detailed summary...",
  "scenarioOverview": "Detailed scenario narrative...",
  "attackVector": "Technical attack vector description",
  "potentialImpact": "Business and technical impact",
  "testingGoals": "What the exercise tests",
  "criticalGaps": "Gaps this exercise reveals",
  
  "facilitatorGuide": {
    "preparation": {
      "timeline": "When to prepare",
      "tasks": ["task 1", "task 2"],
      "materialsNeeded": ["item 1", "item 2"],
      "roomSetup": ["setup 1", "setup 2"]
    },
    "openingScript": "Full facilitator opening script...",
    "groundRules": ["rule 1", "rule 2"],
    "flowOverview": "How the exercise flows...",
    "timing": {
      "total": "2 hours",
      "breakdown": ["T+0: 20 min", "T+20: 15 min"]
    },
    "facilitation": [" facilitation note 1"],
    "closingScript": "Full closing script..."
  },

  "injects": [
    {
      "id": "UNIQUE-ID-001",
      "timing": "T+0",
      "title": "Inject Title",
      "priority": "high|critical",
      "scenario": "Full narrative scenario text (2-3 paragraphs)...",
      "artifact": {
        "type": "monitoring_alert|log|email|etc",
        "content": "Full artifact content with code blocks..."
      },
      "expectedResponse": "What the team should do...",
      "discussionQuestions": [
        "Question 1?",
        "Question 2?"
      ],
      "conditionalResponses": [
        {
          "condition": "If: What happens if X?",
          "response": "Response text..."
        }
      ],
      "facilitatorNotes": {
        "expectedTime": "15-20 minutes",
        "setup": "Setup and delivery instructions...",
        "keyPoints": ["Point 1", "Point 2"],
        "redFlags": ["Flag 1", "Flag 2"],
        "hints": ["Hint 1", "Hint 2"],
        "successIndicators": ["Indicator 1", "Indicator 2"]
      }
    }
  ],

  "objectives": [
    {
      "id": "OBJ-001",
      "title": "Objective Title",
      "description": "Detailed description",
      "type": "technical|process|communication"
    }
  ],

  "atomics": [
    {
      "id": "ATOMIC-001",
      "title": "Atomic Title",
      "description": "What the runner does",
      "execution": "Technical steps"
    }
  ],

  "gapAnalysis": [
    {
      "sop": "SOP/Playbook Name",
      "status": "exists|missing|partial",
      "gaps": ["Gap 1", "Gap 2"],
      "recommendations": ["Rec 1", "Rec 2"]
    }
  ]
}
```

### Required HTML Sections (in order)

1. **Hero Section**: Title, subtitle, severity badge, metadata grid (type, duration, difficulty, date)
2. **How to Run**: Brief instructions
3. **Executive Summary**: 2-3 paragraphs
4. **Scenario Overview**: Detailed narrative
5. **Attack Chain Timeline**: Visual timeline of events
6. **Exercise Objectives**: List of objectives
7. **Exercise Injects**: Collapsible cards with full facilitator notes
8. **Technical Atomics**: For scenario runners
9. **SOP/Playbook Gap Analysis**: Gap cards
10. **Action Items Summary**: Table of findings

### Inject Card Structure (EVERY inject must have)

```html
<div class="collapsible-card">
  <div class="collapsible-header">
    <span class="collapsible-id">UNIQUE-ID-001</span>
    <span class="collapsible-time">T+0</span>
    <span class="collapsible-title">Title</span>
    <span class="priority-badge critical">critical</span>
  </div>
  <div class="collapsible-body">
    <div class="collapsible-content">
      <h4>Scenario</h4>
      <p>Narrative...</p>
      
      <h4>Artifact</h4>
      <div class="code-block"><pre>...</pre></div>
      
      <h4>Expected Response</h4>
      <p>...</p>
      
      <h4>Discussion Questions</h4>
      <ul><li>...</li></ul>
      
      <h4>Conditional Responses</h4>
      <div><strong>If:</strong> condition<br>response</div>
      
      <div class="facilitator-notes">
        <div class="facilitator-notes-header">🎯 FACILITATOR NOTES - CONFIDENTIAL</div>
        <div class="facilitator-subsection">
          <h5>⏱️ Expected Time</h5>
          <span class="time-badge">15-20 minutes</span>
        </div>
        <div class="facilitator-subsection">
          <h5>🎬 Setup & Delivery</h5>
          <p>Instructions...</p>
        </div>
        <div class="facilitator-subsection">
          <h5>🔑 Key Points to Emphasize</h5>
          <ul><li>...</li></ul>
        </div>
        <div class="facilitator-subsection">
          <h5>🚩 Red Flags to Watch For</h5>
          <ul><li>...</li></ul>
        </div>
        <div class="facilitator-subsection">
          <h5>💡 Hints If Team Gets Stuck</h5>
          <div class="hint-box">Hint text...</div>
        </div>
        <div class="facilitator-subsection">
          <h5>✅ Success Indicators</h5>
          <ul><li>...</li></ul>
        </div>
      </div>
    </div>
  </div>
</div>
```

### CSS Requirements

- Use exact CSS from rainbow-six-ddos-attack-reference.html
- Primary color: #1e40af (blue)
### MANDATORY Detail Requirements (NO EXCEPTIONS)

Every tabletop exercise output MUST include:

#### Inject Detail Requirements (MANDATORY)
Each inject MUST have:
1. **Long scenario narrative** (2-3 paragraphs minimum) - NOT one sentence
2. **Detailed artifact** - Realistic monitoring output/logs with emojis, metrics, timestamps
3. **Expected response** - Clear list of what team should do
4. **Discussion questions** (4-6 minimum)
5. **Conditional responses** (2-3 minimum) - "If: What happens if X?" scenarios
6. **Full facilitator notes** with:
   - Expected time (e.g., "15-20 minutes")
   - Setup & Delivery instructions
   - Key Points to Emphasize (bullet list)
   - Red Flags to Watch For (bullet list)
   - Hints If Team Gets Stuck (1-3 hints)
   - Success Indicators (bullet list)

#### Gap Analysis Detail Requirements (MANDATORY)
The gap analysis section MUST have:
1. **Stat grid** showing Critical/High/Medium/Low counts
2. **Interactive eval forms** for EACH gap with:
   - Priority badge (CRITICAL/HIGH/MEDIUM)
   - SOP/Playbook title
   - Evaluation Trigger description
   - Radio buttons: Adequate | Inadequate | Missing
   - Required Procedures list
   - Impact if Gap Remains (colored box)
   - Recommendation (colored box)
   - Action Items section with:
     - Assigned Owner (input field)
     - Due Date (date input)
     - Priority (dropdown)
     - Notes (textarea)

#### General Requirements
- Purple theme (#9333ea) for Arcanum
- Inter + JetBrains Mono fonts
- Collapsible inject cards with click handlers
- Timeline with connecting line
- Priority badges (critical=red, high=orange, medium=blue)
- Facilitator notes in yellow/gold background

### No Shortcuts - FULL FIDELITY REQUIRED

- ❌ No simplified formats - match Rainbow Six exactly
- ❌ No missing inject sections
- ❌ No basic Q&A without full facilitator notes
- ❌ No gap analysis without interactive eval forms
- ❌ No short scenarios - needs paragraphs of detail
- ❌ No missing conditional responses
- ✅ FULL fidelity to Rainbow Six example (ssrf-aws-facilitator-v2.html)

## Purpose

Design, facilitate, and evaluate cybersecurity tabletop exercises (TTX) for technical and executive audiences. Generate realistic scenarios, technical atomics for runners, and identify organizational gaps in incident response capabilities.

## When to Use

- Designing tabletop exercise scenarios for SOC teams or executives
- Creating technical "atomics" (executable injects) for scenario runners
- Generating checklists to identify missing SOPs, playbooks, or procedures
- Evaluating incident response plan effectiveness
- Building cross-functional coordination exercises
- Post-exercise gap analysis and improvement planning

## Key Capabilities

### 1. Scenario Generation
- **Executive Scenarios**: Business impact focus, decision-making, communication strategies
- **Technical Scenarios**: Detailed detection/response, forensics, technical challenges
- **Hybrid Scenarios**: Cross-functional coordination exercises
- **AI-Enhanced**: Deepfake attacks, automated threat chains, supply chain compromise

### 2. Technical Atomics for Runners
Exercise facilitators receive **executable atomics** - specific technical actions to simulate during scenarios:

**Example Atomic Set (Ransomware Scenario):**
```
T+0min: Send initial phishing email to participant's test inbox
T+15min: Simulate EDR alert: "Suspicious PowerShell execution on DESKTOP-01"
T+30min: Inject: Backup system shows "Replication failed - destination unreachable"
T+45min: Deliver ransom note via simulated file share
T+60min: Simulate CEO email inquiry: "Why can't I access the sales database?"
```

### 3. SOP/Playbook Gap Analysis
Automatically generates checklists identifying missing procedures:

**Example Output:**
```
MISSING PLAYBOOKS IDENTIFIED:
□ Ransomware Response Playbook
  - Detected mentions of: encryption, ransom, backup restoration
  - No documented procedure found for: crypto-ransomware containment

□ Executive Communication Protocol
  - Scenario requires CEO notification
  - Missing: Executive notification checklist, approval thresholds

□ Vendor Breach Response
  - Third-party compromise scenario element present
  - Missing: Vendor incident coordination runbook
```

### 4. Threat Model Integration
Scenarios built from real-world threat models:
- OAuth 2.0 attacks (RFC 6819)
- Kubernetes cluster compromise
- Supply chain attacks (npm, CDN)
- Cloud storage misconfiguration (AWS S3, GCS)
- IoT device exploitation
- AI/ML workload threats

### 5. CISA-Aligned Framework
Follows CISA Cybersecurity Tabletop Exercise Package (CTEP) methodology:
- 100+ pre-built scenario templates
- Facilitator guides and inject cards
- After-Action Report templates
- Objective-based performance analysis

## Core Framework: Plan → Engage → Learn

### Planning Phase
1. **Define Objectives**: 1-3 measurable goals (e.g., "Validate ransomware playbook")
2. **Select Scenario**: Match to organizational risk profile and threat landscape
3. **Identify Participants**: Cross-functional teams with actual decision authority
4. **Prepare Materials**: Scenario brief, injects, facilitator script, evaluation forms

### Engaging Phase
1. **Set Ground Rules**: Psychological safety, low-pressure learning environment
2. **Present Scenario**: Realistic T0 (initial conditions)
3. **Progressive Injects**: Timed complications (ransom notes, backup failures, media inquiries)
4. **Facilitate Discussion**: Open-ended questions, cross-functional coordination
5. **Document Observations**: Real-time data collection by evaluators

### Learning Phase
1. **Hot Wash**: 20-30 min immediate debrief
2. **After-Action Report**: Strengths, gaps, recommendations
3. **Action Items**: Assigned owners, deadlines, tracking
4. **Implementation**: Update IR plans, develop missing SOPs, schedule training
5. **Follow-Up Exercise**: Test improvements in 6-12 months

## Scenario Types (Based on Threat Models)

### 1. Ransomware Attack
- **Initial Vector**: Phishing, RDP compromise, vulnerable service
- **Progression**: Lateral movement, backup encryption, ransom demand
- **Key Decisions**: Containment strategy, backup restoration, ransom payment consideration, law enforcement notification
- **Atomics**: EDR alerts, file encryption simulation, backup system failures, ransom note delivery

### 2. Business Email Compromise (BEC)
- **Initial Vector**: Executive account takeover (OAuth token theft, password spray)
- **Progression**: Fraudulent wire transfer request, financial approval bypass
- **Key Decisions**: Transaction verification, account suspension, fraud investigation
- **Atomics**: Spoofed email delivery, banking system access attempts, approval workflow bypass

### 3. Supply Chain Breach
- **Initial Vector**: Compromised vendor, malicious npm package, CDN compromise
- **Progression**: Backdoored dependencies, data exfiltration, customer impact
- **Key Decisions**: Vendor communication, customer notification, incident disclosure
- **Atomics**: Dependency scan alerts, network traffic to unknown IPs, customer data access logs

### 4. Kubernetes Cluster Compromise
- **Initial Vector**: Exposed API server, vulnerable container image, RBAC misconfiguration
- **Progression**: Container escape, privilege escalation, cryptomining deployment
- **Key Decisions**: Pod isolation, cluster rebuilding, service continuity
- **Atomics**: kubectl alerts, resource utilization spikes, container logs

### 5. Cloud Storage Misconfiguration
- **Initial Vector**: Public S3 bucket, misconfigured GCS permissions, leaked credentials
- **Progression**: Data discovery by attacker, exfiltration, public disclosure
- **Key Decisions**: Access revocation, data breach notification, regulatory reporting
- **Atomics**: CloudTrail anomalies, data access logs, security researcher notification

### 6. Deepfake Social Engineering (AI-Enhanced)
- **Initial Vector**: Deepfake CEO voice call, AI-generated phishing content
- **Progression**: Fraudulent authorization, sensitive data disclosure, financial fraud
- **Key Decisions**: Out-of-band verification protocols, AI detection strategies
- **Atomics**: Voice call simulation, urgent request for credentials/payments

### 7. Insider Threat
- **Initial Vector**: Disgruntled employee, compromised insider account, privilege abuse
- **Progression**: Data exfiltration, system sabotage, unauthorized access
- **Key Decisions**: Investigation protocols, legal coordination, termination procedures
- **Atomics**: DLP alerts, unusual data transfers, off-hours access logs

### 8. DDoS Attack
- **Initial Vector**: Botnet attack, amplification attack, application-layer DDoS
- **Progression**: Service degradation, customer impact, mitigation coordination
- **Key Decisions**: CDN activation, rate limiting, customer communication
- **Atomics**: Traffic spike simulation, service health dashboards, customer complaints

## Technical vs Executive Audience

### Executive Tabletop (Non-Technical)
**Duration**: 60-90 minutes
**Participants**: C-suite, Board, Executive Directors, Business Unit heads
**Focus**:
- Business impact and continuity decisions
- External communication and PR strategy
- Regulatory compliance and legal considerations
- Financial impact and insurance coordination
- Stakeholder management

**Language**: Non-technical, succinct, business-focused
**Outcomes**: Improved alignment between leadership and technical teams, clarified executive roles during crises

### Technical Tabletop (Operational)
**Duration**: 90-120 minutes
**Participants**: SOC analysts, incident responders, IT Ops, Security Engineers
**Focus**:
- Detection and containment procedures
- Forensic analysis and evidence collection
- Technical tool usage (SIEM, EDR, forensics platforms)
- System recovery and backup restoration
- Threat intelligence and IOC extraction

**Language**: Deep technical content, command-line operations, log analysis
**Outcomes**: Validated technical playbooks, identified tool gaps, improved technical coordination

## Atomics Generation Framework

When generating atomics for exercise runners, provide:

### 1. Pre-Exercise Setup Atomics
```bash
# Example: Ransomware scenario setup
# T-60min: Prepare test environment
- Create isolated test VM (VICTIM-01)
- Deploy test file share with sample data
- Configure email server for phishing simulation
- Prepare EDR console access for runner
- Stage ransom note template in runner directory
```

### 2. Timed Inject Atomics
```markdown
## T+0 (Initial Compromise)
**Atomic ID**: PHISH-001
**Action**: Send phishing email to participant John Doe
**Email Template**: /exercises/ransomware-2024/templates/phish.eml
**Expected Response**: Participant reports email to security team within 15 minutes
**If No Response**: Proceed to T+15 inject regardless

## T+15 (EDR Alert)
**Atomic ID**: EDR-ALERT-001
**Action**: Display EDR alert on SOC dashboard
**Alert Details**:
  - Host: DESKTOP-01
  - User: jdoe
  - Process: powershell.exe -enc <base64>
  - Severity: HIGH
**Expected Response**: SOC analyst triages alert, escalates to IR team
**Facilitator Note**: If asked about base64 content, provide: "Downloads and executes secondary payload"

## T+30 (Backup Failure)
**Atomic ID**: BACKUP-FAIL-001
**Action**: Update backup system dashboard
**Status Change**: Replication status → "Failed - destination unreachable"
**Error Message**: "Cannot connect to backup-server-02.internal"
**Expected Response**: IT team investigates backup system, discovers encrypted files on backup target
```

### 3. Variable Response Atomics
```markdown
## Conditional Inject: If Participants Ask to Check Logs
**Atomic ID**: LOG-RESPONSE-001
**Trigger**: Participant requests "Check firewall logs for outbound connections"
**Response**: Provide log excerpt showing:
  - Multiple connections to 203.0.113.42:8443 (C2 server)
  - Data exfiltration: 2.3 GB transferred over 4 hours
  - TLS encrypted traffic, no payload inspection available
**Facilitator Script**: "Your firewall logs show persistent connections to this IP over the last 4 hours. WHOIS shows it's registered in [Country]. What's your next step?"
```

### 4. Escalation Atomics
```markdown
## T+60 (Executive Pressure)
**Atomic ID**: EXEC-EMAIL-001
**Action**: Simulate email from CEO to CTO (delivered via runner to participant)
**Subject**: "RE: Sales Database Access Issue - URGENT"
**Body**:
"I'm getting reports from the sales team that they can't access Salesforce. This is costing us deals. What's the status? Do we need to involve the board?"
**Expected Response**: CTO briefs CEO on incident status, provides estimated recovery timeline
**Facilitator Note**: If participants haven't identified ransomware yet, this pressure should accelerate investigation
```

### 5. Evidence Artifact Generation (OPTIONAL)

Generate realistic, detailed evidence artifacts that participants see during the tabletop. These make the exercise feel real and force participants to actually analyze evidence.

**Evidence Types:**

| Type | Use Case |
|------|----------|
| **EDR alerts** | JSON with process tree, file mods, network connections |
| **SIEM dashboards** | Splunk/Elastic query results |
| **Email headers** | Full BEC email with headers |
| **Cloud logs** | CloudTrail, GCP Audit Log, Azure Activity Log |
| **Network logs** | Zeek/suricata, firewall logs |
| **Chat/Slack** | Simulated IR channel messages |
| **News articles** | Fake breach disclosure |
| **Ransom notes** | Realistic text with demand |
| **Dashboard screenshots** | SOC wall display mockups |

**Format Examples:**

```json
// EDR Alert (Technical)
{
  "alert": {
    "id": "EDR-2026-48921",
    "rule": "Possible Ransomware Activity - Mass File Encryption",
    "severity": "CRITICAL",
    "timestamp": "2026-02-25T14:32:01Z",
    "host": "WIN-SRV-01.internal",
    "user": "svc_backup",
    "process_tree": [
      {"pid": 1234, "name": "explorer.exe", "parent": null},
      {"pid": 5678, "name": "cmd.exe", "parent": 1234},
      {"pid": 9012, "name": "powershell.exe", "parent": 5678, "cmd": "-enc JABjAGwA..."},
      {"pid": 3456, "name": "locked_files.exe", "parent": 9012}
    ],
    "files_encrypted": 1247,
    "first_file": "C:\\Finance\\Q1_Budget.xlsx",
    "network": {"outbound": ["185.141.xx.xx:443"]},
    "action_taken": "BLOCKED"
  }
}
```

```json
// CloudTrail Log (Technical)
{
  "eventVersion": "1.08",
  "userIdentity": {
    "type": "IAMUser",
    "principalId": "AIDACKCEVSQ6C2EXAMPLE",
    "arn": "arn:aws:iam::123456789012:user/admin",
    "accountId": "123456789012",
    "accessKeyId": "AKIAIOSFODNN7EXAMPLE"
  },
  "eventTime": "2026-02-25T14:23:17Z",
  "eventSource": "s3.amazonaws.com",
  "eventName": "GetObject",
  "awsRegion": "us-east-1",
  "requestParameters": {
    "bucketName": "company-sensitive-data",
    "key": "customers/pii_export.csv"
  },
  "responseElements": null,
  "sourceIPAddress": "203.0.113.42",
  "errorCode": "AccessDenied",
  "errorMessage": "Access Denied"
}
```

```markdown
// Email (BEC Scenario)
From: CEO <ceo@company-partner.com>
To: CFO <cfo@company.com>
Subject: URGENT: Wire Transfer Needed
Date: Wed, 25 Feb 2026 14:45:00 -0500

Hi,

I need you to process an urgent wire transfer for our new vendor. 
This needs to go out TODAY before 5pm.

Bank: First National Bank
Account: 1234567890
Routing: 021000021
Amount: $47,500
Reference: Project Acquisition

I'm in meetings all day and can't call. Please confirm once sent.

Sent from my iPhone
```

**Research Mode for Evidence:**

For more realistic evidence, offer user a choice:

```
"Generate evidence at:
[A] Template level — Generic, faster
[B] Research-backed — I'll pull log formats from recent breaches for realism (~30s)
"

If [B], reference:
- Recent CVE announcements
- Known breach timelines
- Real vendor log schemas (CrowdStrike, SentinelOne, Splunk, AWS)
```

**Design Principles:**
- Evidence should match the scenario (ransomware = EDR alerts, BEC = emails)
- Technical audiences get JSON/logs; executives get summaries/dashboards
- Include enough detail for participants to actually analyze
- Make artifacts self-contained in the HTML (no external dependencies)

## SOP/Playbook Gap Analysis Checklist Generator

The skill automatically generates gap analysis checklists by:

1. **Scenario Decomposition**: Identifies all decision points and required actions
2. **Playbook Mapping**: Checks for documented procedures covering each action
3. **Gap Identification**: Flags missing or inadequate procedures
4. **Priority Scoring**: Ranks gaps by criticality and likelihood

### Example Gap Analysis Output

```markdown
# SOP/Playbook Gap Analysis
**Scenario**: Ransomware Attack with Backup Failure
**Date**: 2026-02-06
**Participants**: SOC Team, IT Operations, Executive Leadership

---

## CRITICAL GAPS (Immediate Action Required)

### 1. Ransomware Containment Playbook - MISSING
**Scenario Trigger**: Multiple hosts showing file encryption behavior
**Required Decisions**:
  - [ ] Network segmentation procedures
  - [ ] Host isolation criteria and process
  - [ ] Active Directory credential reset procedures
  - [ ] Encrypted file preservation for forensics

**Impact if Missing**: Delayed containment, lateral spread to additional systems
**Recommendation**: Develop comprehensive ransomware response playbook covering:
  - Detection indicators (behavioral, file system, network)
  - Containment decision tree (isolate vs observe)
  - Credential rotation procedures
  - Backup verification and restoration process
  - Ransom payment decision framework (if organization policy allows consideration)

**Owner**: ___________ **Due Date**: ___________

---

### 2. Executive Communication During Active Incident - INADEQUATE
**Scenario Trigger**: CEO requests status update during ongoing incident
**Current Documentation**: Generic "incident notification template"
**Missing Elements**:
  - [ ] Executive briefing format and content requirements
  - [ ] Update frequency expectations during active incidents
  - [ ] Escalation thresholds requiring executive notification
  - [ ] Technical-to-business impact translation guide
  - [ ] Executive decision authority matrix (who approves what)

**Impact if Missing**: Inconsistent executive communication, business decision delays
**Recommendation**: Create executive incident communication playbook with:
  - Situation Report (SITREP) template
  - Update cadence by severity (Critical: hourly, High: every 4 hours)
  - Decision points requiring executive approval
  - Business impact assessment framework

**Owner**: ___________ **Due Date**: ___________

---

## HIGH-PRIORITY GAPS

### 3. Backup System Failure Response - PARTIAL
**Scenario Trigger**: Backup replication shows failed status
**Current Documentation**: IT runbook covers "routine backup monitoring"
**Missing Elements**:
  - [ ] Backup system compromise response procedures
  - [ ] Alternate backup verification methods (offline, immutable copies)
  - [ ] Backup restoration priority matrix (which systems first)
  - [ ] Backup integrity testing procedures

**Impact if Missing**: Extended recovery time, potential data loss
**Recommendation**: Enhance backup procedures with incident-specific guidance
**Owner**: ___________ **Due Date**: ___________

---

### 4. Third-Party Vendor Notification - MISSING
**Scenario Trigger**: Incident may impact vendor systems or data
**Required Decisions**:
  - [ ] When to notify vendors (timing, thresholds)
  - [ ] Who has authority to communicate with vendors
  - [ ] What information to share (technical details, IOCs)
  - [ ] Vendor incident coordination protocols

**Impact if Missing**: Contractual violations, delayed coordinated response
**Recommendation**: Develop vendor incident coordination framework
**Owner**: ___________ **Due Date**: ___________

---

## MEDIUM-PRIORITY GAPS

### 5. Forensic Evidence Collection - PARTIAL
**Scenario Trigger**: Need to preserve evidence for investigation/legal action
**Current Documentation**: "Incident handling basics" mentions "save logs"
**Missing Elements**:
  - [ ] Chain of custody procedures
  - [ ] Forensic image acquisition tools and methods
  - [ ] Evidence storage and retention policies
  - [ ] Legal hold procedures

**Impact if Missing**: Compromised evidence, inability to pursue legal action
**Recommendation**: Develop forensic evidence handling SOP
**Owner**: ___________ **Due Date**: ___________

---

## LOW-PRIORITY GAPS

### 6. Post-Incident Customer Communication - MISSING
**Scenario Trigger**: Ransomware impacts customer-facing services
**Missing Elements**:
  - [ ] Customer notification templates
  - [ ] Communication approval workflow
  - [ ] Regulatory notification requirements (GDPR, state breach laws)
  - [ ] Customer support escalation procedures

**Impact if Missing**: Regulatory non-compliance, customer trust damage
**Recommendation**: Create customer breach notification playbook
**Owner**: ___________ **Due Date**: ___________

---

## PROCESS GAPS

### Communication Channels
**Observed During Exercise**:
- Confusion about which Slack channel for incident coordination
- Some participants didn't have access to #incident-response
- Email used for time-sensitive updates (slow, unreliable)

**Recommendation**:
  - [ ] Establish dedicated incident communication platform
  - [ ] Pre-provision access for all IR team members
  - [ ] Document escalation procedures (when to page, when to email)
  - [ ] Test communication channels quarterly

---

## TOOL GAPS

### Detection and Response Tools
**Observed During Exercise**:
- EDR alerts not integrated with ticketing system (manual checking required)
- No automated host isolation capability (manual network changes)
- Backup monitoring dashboard not accessible to IR team

**Recommendation**:
  - [ ] Implement SOAR platform for automated response actions
  - [ ] Integrate EDR with ticketing/SIEM
  - [ ] Provide IR team access to backup monitoring
  - [ ] Evaluate automated network isolation tools

---

## TRAINING GAPS

### Identified Knowledge Deficiencies
- SOC analysts unfamiliar with ransomware behavioral indicators
- IT Ops unsure of backup restoration procedures under pressure
- Executives unclear on their roles during cyber incidents

**Recommendation**:
  - [ ] Ransomware detection training for SOC (quarterly)
  - [ ] Backup restoration drill for IT Ops (monthly)
  - [ ] Executive cyber crisis simulation (annually)

---

## SUMMARY METRICS

- **Total Gaps Identified**: 6 SOPs, 3 Process Issues, 3 Tool Gaps, 3 Training Needs
- **Critical Gaps**: 2
- **High-Priority Gaps**: 2
- **Estimated Remediation Effort**: 120 person-hours
- **Recommended Timeline**: 90 days for critical/high, 180 days for medium/low

---

## NEXT STEPS

1. **Immediate (Week 1)**:
   - Assign owners to all critical and high-priority gaps
   - Schedule working sessions to develop missing playbooks
   - Provision access to communication channels and tools

2. **Short-Term (Month 1-3)**:
   - Complete and test critical/high-priority SOPs
   - Implement recommended tool integrations
   - Conduct targeted training for identified knowledge gaps

3. **Follow-Up Exercise (Month 6)**:
   - Re-run similar ransomware scenario
   - Validate implemented improvements
   - Measure response time and coordination improvements

4. **Continuous Improvement**:
   - Quarterly review of all IR playbooks
   - Monthly mini-exercises (10-30 min rapid scenarios)
   - Annual comprehensive tabletop with executive participation
```

## Best Practices (From Research)

### Critical Success Factors
1. **Clear Objectives**: Define 1-3 measurable goals before designing scenario
2. **Realistic Scenarios**: Match organizational risk profile, avoid "doomsday" plots
3. **Cross-Functional Participation**: Include all departments involved in real incidents
4. **Skilled Facilitation**: Draw solutions from participants, don't provide answers
5. **Psychological Safety**: Frame as learning, not performance evaluation
6. **Implement Findings**: Assign owners, deadlines, track completion (most critical!)

### Common Pitfalls to Avoid
❌ Not implementing lessons learned (exercise becomes useless)
❌ Unrealistic "movie-style hacking" scenarios
❌ Same participants every time (limit learning)
❌ Inadequate debriefing time (real learning happens here)
❌ Treating as performance evaluation (creates defensive behavior)
❌ Outdated contact lists (critical failure during real incidents)

### Optimal Timing
- **Duration**: 60-90 minutes for quality discussion
- **Frequency**: Quarterly or monthly depending on risk profile
- **Follow-Up**: 6-12 months to test implemented improvements

## Integration with PAI Security Tools

### Caido MCP Integration
For scenarios involving web application compromise:
```bash
# Use Caido to demonstrate attack patterns during technical tabletops
/caido req.ext.eq:"php" AND req.query.matches:"eval|cmd"
# Show participants actual malicious requests from proxy history
```

### Browser MCP Integration
For client-side attack scenarios (XSS, CSRF):
- Demonstrate exploit chains live during tabletop
- Capture screenshots/GIFs for scenario inject materials

### JS Analyzer Integration
For supply chain compromise scenarios:
```bash
# Analyze compromised npm package during tabletop
bun run /root/doctorswzl/src/index.ts malicious-package.js
# Show participants dangerous sinks and data exfiltration code
```

## Output Standards

All tabletop exercise deliverables include:

1. **Executive Scenario Brief** (1-2 pages)
   - Scenario overview, objectives, participant roles
   - Timeline and inject schedule
   - Expected outcomes

2. **Facilitator Guide** (5-10 pages)
   - Detailed scenario narrative
   - Timed inject cards with facilitator notes
   - Open-ended discussion questions
   - Expected responses and talking points

3. **Technical Atomics Runbook** (for runners)
   - Pre-exercise setup instructions
   - Timed atomic delivery schedule
   - Conditional response atomics
   - Troubleshooting guide

4. **Evaluation Forms**
   - Observer note sheets
   - Performance metrics tracking
   - Participant feedback forms

5. **After-Action Report Template**
   - Objectives assessment
   - What went well
   - Areas for improvement
   - Action items with owners and deadlines

6. **SOP/Playbook Gap Analysis**
   - Missing procedures identified
   - Priority rankings (Critical/High/Medium/Low)
   - Remediation recommendations
   - Implementation timeline

## Two-File Output (Recommended)

**CRITICAL:** Always generate TWO separate HTML files:

### 1. Facilitator File (Full Access)
```
[Exercise-Name]-facilitator.html
```
Contains:
- Everything in the exercise
- All facilitator notes
- Expected responses
- Timing cues
- Discussion question answers
- Troubleshooting tips

### 2. Participant File (No Spoilers)
```
[Exercise-Name]-participant.html
```
Contains:
- Scenario overview
- Role/objectives
- Timeline (T+0, T+15, etc.) — **WITHOUT facilitator notes**
- Evidence artifacts
- Discussion questions — **WITHOUT answers**
- Any reference materials

**Key principle:** Participant file should not reveal:
- What the "correct" response is
- What's coming next in the timeline
- What facilitator should say
- Any hints about the scenario resolution

---

## HTML Output Specification (REQUIRED)

The HTML report MUST have exactly these 9 sections in this order:

### CSS Variables and Styling
```css
:root {
    --primary: #1e40af;        /* Deep blue - headers, accents */
    --primary-dark: #1e3a8a;
    --primary-light: #3b82f6;
    --accent: #0ea5e9;         /* Sky blue - links, highlights */
    --danger: #dc2626;         /* Red - critical, severity */
    --warning: #f59e0b;         /* Amber - warnings */
    --success: #10b981;        /* Green - adequate, good */
    --info: #3b82f6;           /* Blue - informational */
    --gray-50: #f9fafb;
    --gray-100: #f3f4f6;
    --gray-200: #e5e7eb;
    --gray-300: #d1d5db;
    --gray-400: #9ca3af;
    --gray-500: #6b7280;
    --gray-600: #4b5563;
    --gray-700: #374151;
    --gray-800: #1f2937;
    --gray-900: #111827;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}
```

### Section 1: Cover Page (Hero)
- Full-width gradient background (primary → primary-dark)
- Centered title (white, large, bold)
- Subtitle below title
- Metadata grid:
  - Scenario Type badge
  - Target Audience
  - Duration
  - Difficulty badge (color-coded: Critical=red, High=amber, Medium=blue, Low=gray)
  - Severity badge
  - Prepared By
  - Date
  - Version
- Company branding area

### Section 2: Executive Summary
- Section header with number (e.g., "01")
- Executive summary paragraph (2-3 sentences)
- Attack Vector box (highlighted)
- Potential Impact box (highlighted)
- Testing Goals box
- Critical Gaps summary

### Section 3: Scenario Overview
- Full narrative description of the scenario
- What the scenario tests
- Key decision points

### Section 4: Objectives
- Numbered list (1-5 objectives)
- Each objective has:
  - Number badge
  - Title (bold)
  - Description
  - Success criteria list

### Section 5: Timeline
- Visual timeline with events
- Each event has:
  - Time marker (T+0, T+15, etc.)
  - Title
  - Brief description
- Color-coded by severity

### Section 6: Injects (COLLAPSIBLE CARDS)
**CRITICAL - This is the core section**

Each inject is a collapsible card with:
- **Header row:**
  - Inject ID (e.g., "DDOS-DETECT-001")
  - Time (T+0, T+15, etc.)
  - Title
  - Severity badge (color-coded)
  - Chevron icon (clickable)
- **Collapsible body:**
  - **Scenario:** Narrative description of what happens
  - **Artifact:** Code block with fake logs/alerts/emails/screenshots (MUST be detailed JSON/log format)
  - **Expected Response:** What participants should do/decided
  - **Discussion Questions:** List of questions to ask
  - **Conditional Responses:** (If trigger → Then response)
  - **Facilitator Notes:** Setup, delivery, expected time, key points, red flags, hints, success indicators, transition

**Artifact Examples (MUST match these formats):**
```json
// EDR Alert
{
  "alert_id": "EDR-2026-48921",
  "rule": "Ransomware Activity - Mass File Encryption",
  "severity": "CRITICAL",
  "timestamp": "2026-02-25T14:32:01Z",
  "host": "WIN-SRV-01",
  "process_tree": [...],
  "files_encrypted": 1247,
  "network": {"outbound": ["185.141.xx.xx:443"]}
}

// Network Alert
MONITORING ALERT - HIGH SEVERITY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Alert: Network Traffic Anomaly
Time: 20:03:42 EST
Metrics:
  Inbound Traffic: 523 Gbps (normal: 45-60 Gbps)
  Source IPs: 12,000+

// Email
From: CEO <ceo@company.com>
To: CFO <cfo@company.com>
Subject: URGENT: Wire Transfer Needed
```

### Section 7: Gap Analysis (Interactive Evaluation Forms)
- **Stats grid:** 4 cards showing count of Critical/High/Medium/Low gaps
- **Each gap is an interactive form:**
  - Priority badge (color-coded)
  - Gap title (bold)
  - Trigger (what scenario element exposed this gap)
  - **Status radio buttons:** Adequate | Inadequate | Missing
  - Required procedures checklist
  - Impact if gap remains
  - Recommendation textarea
  - **Fillable fields:** Owner, Due Date, Priority Adjustment, Notes

### Section 8: Atomics (Technical Runbook)
- Table format
- Columns: ID, Time, Category, Action
- Each row is an atomic action for the runner

### Section 9: Facilitator Guide (CONFIDENTIAL)
- Badge: "🎯 FACILITATOR GUIDE - CONFIDENTIAL"
- **Subsections:**
  - Pre-Exercise Preparation (tasks, timeline, materials, room setup)
  - Opening Script (full script text in styled box)
  - Ground Rules (numbered list)
  - Exercise Flow Overview (total duration, breakdown)
  - Facilitation Best Practices (numbered list)
  - Troubleshooting (issue → solution pairs)
  - Closing Script (full script text)

---

## Two-File Output Implementation

### Facilitator Version (FULL)
Contains ALL 9 sections with:
- All facilitator notes
- Expected responses
- All guidance

### Participant Version (RESTRICTED)
Contains only:
- Cover page
- Executive Summary
- Scenario Overview
- Objectives
- Timeline
- Injects (Scenario + Artifact + Discussion Questions ONLY)
- Atomics

EXCLUDED from participant:
- Expected responses
- Facilitator notes
- Gap analysis forms
- All guidance sections

---

## Interactive Features

The HTML MUST include:
1. Collapsible inject cards (click to expand/collapse)
2. Interactive gap analysis forms (radio buttons, text inputs)
3. Smooth scroll navigation
4. Print-friendly styles

---

## Quality Requirements

- All artifacts MUST use realistic formats (JSON, logs, emails)
- Facilitator notes MUST include: setup, delivery, timing, key points, red flags, hints, success indicators, transition
- Gap analysis MUST have interactive evaluation forms with THIS EXACT FORMAT (see Rainbow Six example):
  - **eval-form**: Main container for each gap
  - **eval-status**: Radio button section (Adequate/Inadequate/Missing)
  - **eval-details**: Expandable details section
  - **Required Procedures**: Checklist of needed procedures
  - **Impact if Gap Remains**: Description box
  - **Recommendation**: Recommendation box
  - **Action Items**: Owner, Due Date, Adjusted Priority (dropdown), Notes (textarea)
  - **FACILITATOR NOTES - CONFIDENTIAL**: Probe questions and maturity indicators
- All sections MUST have numbered headers (01, 02, 03...)

### Required Gap Analysis CSS Classes

The generator MUST include these CSS classes (see Rainbow Six for exact definitions):

```css
.eval-form { background: var(--gray-50); padding: 1.5rem; border-radius: 0.5rem; margin-bottom: 1.5rem; }
.eval-status { display: flex; gap: 1rem; margin-bottom: 1.5rem; flex-wrap: wrap; }
.eval-option { flex: 1; min-width: 200px; }
.eval-option input[type="radio"] { margin-right: 0.5rem; }
.eval-option label { display: flex; align-items: center; padding: 1rem; border: 2px solid var(--gray-300); border-radius: 0.5rem; cursor: pointer; background: white; }
.eval-option input[type="radio"]:checked + label { border-color: var(--primary); background: #eff6ff; }
.eval-option.adequate input[type="radio"]:checked + label { border-color: var(--success); background: #f0fdf4; }
.eval-option.inadequate input[type="radio"]:checked + label { border-color: var(--warning); background: #fffbeb; }
.eval-option.missing input[type="radio"]:checked + label { border-color: var(--danger); background: #fef2f2; }
.eval-details { margin-top: 1.5rem; padding-top: 1.5rem; border-top: 2px solid var(--gray-200); }
.eval-field { margin-bottom: 1rem; }
.eval-field label { display: block; font-weight: 600; margin-bottom: 0.5rem; color: var(--gray-700); }
.eval-field input[type="text"], .eval-field input[type="date"], .eval-field textarea, .eval-field select { width: 100%; padding: 0.75rem; border: 1px solid var(--gray-300); border-radius: 0.375rem; font-family: inherit; }
.eval-field textarea { min-height: 80px; resize: vertical; }
.eval-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; }
.facilitator-notes { background: #fffbeb; border: 2px solid var(--warning); border-radius: 0.5rem; padding: 1.5rem; margin-top: 1.5rem; }
.facilitator-notes-header { display: flex; align-items: center; gap: 0.5rem; color: var(--warning); font-weight: 700; font-size: 0.875rem; text-transform: uppercase; margin-bottom: 1rem; padding-bottom: 0.75rem; border-bottom: 2px solid var(--warning); }
```

### Gap Analysis Data Schema

Each gap MUST have this structure:

```json
{
  "priority": "critical|high|medium|low",
  "title": "Gap Title",
  "trigger": "What in the scenario exposed this gap",
  "requiredProcedures": ["Procedure 1", "Procedure 2"],
  "impact": "What happens if this gap remains",
  "recommendation": "How to fix it",
  "probeQuestions": ["Question 1", "Question 2"],
  "maturityIndicators": {
    "adequate": "What adequate looks like",
    "inadequate": "What inadequate looks like", 
    "missing": "What missing looks like"
  }
}
```

**Gap Analysis Section MUST appear in BOTH facilitator AND participant versions** (the facilitator notes subsection is only in facilitator version).

### How to Generate

When the skill creates the output, generate TWO files:

```
Output/
├── ransomware-scenario-facilitator.html    # Full access
└── ransomware-scenario-participant.html    # No spoilers
```

**Visual distinction:**
- Facilitator file: Add "FACILITATOR ONLY" banner at top
- Participant file: Add "PARTICIPANT COPY" banner

## Usage Examples

### Example 1: Generate Executive Ransomware Scenario
```
User: "Design an executive tabletop for ransomware with focus on business continuity decisions"

Skill Output:
- Executive-appropriate scenario brief
- Business impact focus (not technical details)
- Decision points: insurance, ransom payment, customer notification, board communication
- Inject cards: journalist inquiry, cyber insurance adjuster call, customer complaints
- No technical atomics (not relevant for executives)
- Gap analysis: executive communication procedures, crisis management plan
```

### Example 2: Generate Technical Kubernetes Compromise Scenario with Atomics
```
User: "Create technical tabletop for Kubernetes cluster compromise with atomics for the runner"

Skill Output:
- Technical scenario brief with attack chain details
- Atomics runbook:
  * T+0: Display kubectl alert for unauthorized pod creation
  * T+15: Show container escape attempt in logs
  * T+30: Simulate cryptominer deployment (CPU spike)
  * T+45: Provide network logs showing C2 communication
- Facilitator guide with technical discussion questions
- Gap analysis: K8s incident response playbook, RBAC audit procedures, pod security policies
```

### Example 3: Gap Analysis Only
```
User: "We just completed a BEC tabletop. Generate gap analysis for missing SOPs."

Skill Output:
- Comprehensive checklist of missing procedures
- Priority rankings based on scenario decisions
- Specific recommendations for each gap
- Owner assignment template
- Follow-up exercise recommendations
```

## Resources

- **CISA CTEPs**: 100+ free scenario templates at cisa.gov/cybersecurity-tabletops
- **NIST SP 800-84**: Guide to Test, Training, and Exercise Programs
- **After-Action Report Templates**: CISA and NIST formats included
- **Threat Models**: OAuth, Kubernetes, cloud, IoT, AI/ML scenarios

---

## File Organization and Output Structure

**IMPORTANT**: Each generated tabletop exercise is automatically organized into its own dedicated folder:

```
/root/.claude/skills/TabletopExercise/exercises/[exercise-slug]/
  ├── tabletop.md              # Full exercise documentation (Markdown)
  ├── exercise-data.json       # Structured JSON for PDF generation
  ├── [Exercise-Title].pdf     # Professional client-ready PDF
  └── README.md                # Exercise metadata and quick reference
```

### Automatic Folder Creation Process:

1. **Generate Slug**: Convert exercise title to filesystem-safe slug
   - Example: "SSRF to AWS Credential Compromise" → "ssrf-aws-credential-compromise"

2. **Create Exercise Folder**: `/root/.claude/skills/TabletopExercise/exercises/[slug]/`

3. **Save All Formats**:
   - **Markdown** (`tabletop.md`): Complete exercise with all sections
   - **JSON** (`exercise-data.json`): Structured data for PDF regeneration
   - **PDF**: Professional, client-ready document with design
   - **README.md**: Quick reference with metadata and file descriptions

4. **Confirm to User**: Provide full path to exercise folder and PDF

### File Purposes:

- **tabletop.md**: Complete exercise documentation, facilitator guide, inject cards
- **exercise-data.json**: Structured data matching PDF generator interface (preserves all content for future updates)
- **PDF**: Final deliverable for client presentation or executive review
- **README.md**: Exercise overview, scenario type, target audience, generation date

### Regenerating PDFs:

If you need to update the PDF design or fix content:
```bash
cd /root/.claude/skills/TabletopExercise/pdf-generator
bun run generate-pdf.ts \
  --data ../exercises/[slug]/exercise-data.json \
  --output ../exercises/[slug]/Updated-Exercise.pdf
```

---

## Image Generation

TabletopExercise can generate AI images for three pedagogically distinct purposes. Use the MCP tools or invoke them in sequence during exercise creation.

### Three image categories

| Category | MCP Tool | What it generates | Difficulty guidance |
|----------|----------|-------------------|---------------------|
| **Attack vector** | `generate_attack_vector_images` | What the victim saw: phishing emails, ransomware notes, fake invoices, USB devices | All levels (phishing/invoice), Intermediate+ (ransomware note) |
| **Evidence** | `generate_evidence_images` | What investigators find: SIEM logs, network diagrams, dark web listings, SCADA interfaces | All (network diagram), Advanced (SCADA, packet captures) |
| **Atmosphere** | `generate_atmosphere_images` | World-building: cover art, NPC portraits, location illustrations, period photographs | All (portraits, cover), Historical only (period_photograph) |

### Recommended workflow

```
validate_exercise_data
  → generate_attack_vector_images   # populates artifact.image_data
  → generate_evidence_images        # populates artifact.image_data
  → generate_atmosphere_images      # populates cover_image_data + NPC portraits
  → generate_exercise               # facilitator.html contains <img> tags
  → generate_exercise_qmd           # handout PNGs written to output_dir
```

### Provider selection

Set `IMAGE_PROVIDER` env var (default: `openai`). Set the corresponding API key.

| Provider | Env var | Notes |
|----------|---------|-------|
| `openai` | `OPENAI_API_KEY` | DALL-E 3 -- best prompt adherence |
| `gemini` | `GEMINI_API_KEY` | Google Imagen (imagen-3.0-generate-002) |
| `stability` | `STABILITY_API_KEY` | Stability AI REST API |
| `replicate` | `REPLICATE_API_KEY` | Default model: flux-schnell. Override with `REPLICATE_MODEL` |
| `ollama` | none | Self-hosted at `OLLAMA_BASE_URL` (default: http://localhost:11434) |

### Style consistency via `visual_style`

Add a `visual_style` block to exercise data to ensure cohesive images within a scenario. Reuse the same block across all scenario cards in a malmon family for a unified visual identity across the handbook.

```json
{
  "visual_style": {
    "art_style": "photorealistic",
    "color_palette": "high-contrast blue-grey",
    "mood": "tense, clinical",
    "seed": 42
  }
}
```

Pass `visual_style` directly to any image tool to override the data-level setting for that call.

---

**Version**: 2.0 (Enhanced from original SOC Manager Table Top Designer)
**Enhancements**:
- Added technical atomics generation for exercise runners
- Integrated SOP/playbook gap analysis framework
- Incorporated CISA CTEP methodology
- Added threat model-based scenario library
- Enhanced with 2025-2026 AI threat considerations
- Integrated PAI security tool workflows

**Maintained by**: Skylar (xssdoctor)
**Original**: Arcanum-Sec redbluepurpleAI project
