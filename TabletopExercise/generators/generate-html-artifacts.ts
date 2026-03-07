/**
 * HTML/CSS template renderer for UI-heavy artifact subtypes.
 *
 * AI diffusion models produce fuzzy, unreadable text when asked to render
 * phishing emails, ransomware notes, log viewers, etc. These templates inject
 * artifact_content verbatim so text is always accurate and legible at any zoom.
 *
 * Routing:
 *   HTML template  — phishing_email, ransomware_note, fraudulent_invoice,
 *                    network_capture, dark_web_listing, scada_interface
 *   AI provider    — usb_device, network_diagram, period_photograph,
 *                    portrait, location_illustration, cover_art
 */

import type { ImageSubtype, VisualStyle } from './schema.ts';

// ---------------------------------------------------------------------------
// HTML subtype set (caller checks this before deciding which path to take)
// ---------------------------------------------------------------------------

const HTML_SUBTYPES = new Set<ImageSubtype>([
  'phishing_email',
  'ransomware_note',
  'fraudulent_invoice',
  'network_capture',
  'dark_web_listing',
  'scada_interface',
]);

export function isHtmlSubtype(subtype: ImageSubtype): boolean {
  return HTML_SUBTYPES.has(subtype);
}

// ---------------------------------------------------------------------------
// Shared utility
// ---------------------------------------------------------------------------

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Normalise content so both real newlines and literal \n sequences split correctly. */
function splitLines(content: string): string[] {
  return content.replace(/\\n/g, '\n').split('\n').filter(l => l.trim());
}

// ---------------------------------------------------------------------------
// Phishing email — macOS/Outlook mail client chrome
// ---------------------------------------------------------------------------

function renderPhishingEmail(title: string, content: string): string {
  const lines = splitLines(content);
  const bodyHtml = lines.map(l => `<p>${esc(l)}</p>`).join('') || '<p>(no content)</p>';
  const previewText = esc(lines[0] ?? '');

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;background:#f0f0f0}
.client{display:flex;height:600px;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.2)}
.sidebar{width:200px;background:#2c2c2e;color:#aaa;font-size:12px;padding:16px 0;flex-shrink:0}
.sidebar .account{padding:8px 16px 16px;border-bottom:1px solid #3a3a3c}
.sidebar .account .name{color:#fff;font-weight:600;font-size:13px}
.folder{padding:6px 16px;cursor:pointer;display:flex;justify-content:space-between}
.folder.active{background:#3a3a3c;color:#fff;border-radius:4px;margin:0 8px;padding:6px 8px}
.badge{background:#3b82f6;color:#fff;border-radius:10px;padding:1px 6px;font-size:10px}
.list{width:260px;border-right:1px solid #e5e7eb;overflow-y:auto;flex-shrink:0}
.list-item{padding:12px 16px;border-bottom:1px solid #f3f4f6;cursor:pointer}
.list-item.selected{background:#eff6ff}
.list-item .sender{font-weight:600;font-size:13px;color:#111}
.list-item .subject{font-size:12px;color:#374151;margin-top:2px}
.list-item .preview{font-size:11px;color:#9ca3af;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.list-item .time{float:right;font-size:11px;color:#9ca3af}
.email{flex:1;overflow-y:auto;padding:24px}
.email-header{border-bottom:1px solid #e5e7eb;padding-bottom:16px;margin-bottom:16px}
.email-subject{font-size:18px;font-weight:700;color:#111;margin-bottom:12px}
.meta{font-size:12px;color:#6b7280;line-height:1.8}
.meta .field{display:flex;gap:8px}
.meta .label{color:#9ca3af;width:50px;flex-shrink:0}
.from-domain{color:#ef4444;font-weight:600}
.warning-banner{background:#fef3c7;border:1px solid #fbbf24;border-radius:4px;padding:8px 12px;margin-bottom:16px;font-size:12px;color:#92400e;display:flex;gap:8px;align-items:center}
.email-body{font-size:14px;line-height:1.6;color:#374151}
.email-body p{margin-bottom:.8em}
.cta-button{display:inline-block;background:#2563eb;color:#fff;padding:10px 20px;border-radius:4px;text-decoration:none;font-weight:600;font-size:14px;margin:12px 0}
</style></head><body>
<div class="client">
  <div class="sidebar">
    <div class="account">
      <div class="name">user@company.com</div>
      <div style="font-size:11px;margin-top:2px">iCloud Mail</div>
    </div>
    <div class="folder active">Inbox <span class="badge">3</span></div>
    <div class="folder">Sent</div>
    <div class="folder">Drafts</div>
    <div class="folder">Junk Mail</div>
    <div class="folder">Trash</div>
  </div>
  <div class="list">
    <div class="list-item selected">
      <span class="time">10:34 AM</span>
      <div class="sender">IT Security Team</div>
      <div class="subject">${esc(title)}</div>
      <div class="preview">${previewText}</div>
    </div>
    <div class="list-item">
      <span class="time">Yesterday</span>
      <div class="sender">HR Department</div>
      <div class="subject">Q4 Review Reminder</div>
      <div class="preview">Please complete your self-assessment by...</div>
    </div>
    <div class="list-item">
      <span class="time">Mon</span>
      <div class="sender">IT Helpdesk</div>
      <div class="subject">Scheduled Maintenance</div>
      <div class="preview">Systems will be unavailable Saturday 2–4 AM...</div>
    </div>
  </div>
  <div class="email">
    <div class="email-header">
      <div class="email-subject">${esc(title)}</div>
      <div class="meta">
        <div class="field"><span class="label">From:</span> <span>IT-Security-Team@<span class="from-domain">it-security-company-alerts.net</span></span></div>
        <div class="field"><span class="label">To:</span> <span>user@company.com</span></div>
        <div class="field"><span class="label">Date:</span> <span>Today, 10:34 AM</span></div>
        <div class="field"><span class="label">Subject:</span> <span>${esc(title)}</span></div>
      </div>
    </div>
    <div class="warning-banner">&#9888; This message may be a phishing attempt. The sender domain does not match your organisation.</div>
    <div class="email-body">
      ${bodyHtml}
      <br><a class="cta-button" href="#">Verify Account Now &#8594;</a>
    </div>
  </div>
</div>
</body></html>`;
}

// ---------------------------------------------------------------------------
// Ransomware note — full-bleed dark splash screen
// ---------------------------------------------------------------------------

function renderRansomwareNote(title: string, content: string): string {
  const lines = splitLines(content);
  const bodyHtml = lines.map(l => `<div class="line">${esc(l)}</div>`).join('')
    || '<div class="line">All your files have been encrypted with military-grade encryption. Pay the ransom to recover them.</div>';

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#0a0a0a;color:#f0f0f0;font-family:'Courier New',Courier,monospace;min-height:600px;display:flex;align-items:center;justify-content:center}
.note{width:100%;max-width:700px;padding:40px}
.skull{font-size:60px;text-align:center;margin-bottom:20px}
h1{font-size:28px;color:#ef4444;text-transform:uppercase;letter-spacing:3px;text-align:center;margin-bottom:8px;text-shadow:0 0 20px rgba(239,68,68,.5)}
.subtitle{font-size:14px;color:#f97316;text-align:center;letter-spacing:2px;margin-bottom:32px}
.body{font-size:13px;line-height:1.8;color:#d1d5db;margin-bottom:28px}
.body .line{margin-bottom:4px}
.box{border:1px solid #374151;background:#111;border-radius:4px;padding:16px;margin-bottom:20px}
.box-label{font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px}
.box-value{font-size:12px;color:#10b981;word-break:break-all}
.timer{text-align:center;color:#ef4444;font-size:20px;letter-spacing:4px;margin:24px 0}
.timer-label{font-size:11px;color:#6b7280;text-align:center;text-transform:uppercase;letter-spacing:2px}
.footer{text-align:center;font-size:11px;color:#4b5563;margin-top:32px}
</style></head><body>
<div class="note">
  <div class="skull">&#9760;</div>
  <h1>${esc(title)}</h1>
  <div class="subtitle">&#9888; CRITICAL SECURITY ALERT &#9888;</div>
  <div class="body">${bodyHtml}</div>
  <div class="box">
    <div class="box-label">Bitcoin Payment Address</div>
    <div class="box-value">bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh</div>
  </div>
  <div class="box">
    <div class="box-label">Your Unique Decryption Key ID</div>
    <div class="box-value">DCRYPT-A7F3B9C2-E1D4F8A6</div>
  </div>
  <div class="timer-label">Time Remaining to Pay</div>
  <div class="timer">71:58:43</div>
  <div class="footer">Do not rename files &middot; Do not use third-party recovery tools &middot; Contact: support@darkmail.onion</div>
</div>
</body></html>`;
}

// ---------------------------------------------------------------------------
// Fraudulent invoice — white paper with invoice layout
// ---------------------------------------------------------------------------

function renderFraudulentInvoice(title: string, content: string): string {
  const contentHtml = esc(content.trim()) || 'Professional consulting services rendered per agreement.';

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:Arial,sans-serif;background:#f8f8f8;padding:24px}
.page{background:#fff;max-width:680px;margin:0 auto;padding:40px;box-shadow:0 2px 8px rgba(0,0,0,.1)}
.header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:32px}
.logo-box{width:120px;height:50px;background:#e5e7eb;border:2px dashed #9ca3af;display:flex;align-items:center;justify-content:center;font-size:11px;color:#6b7280}
.invoice-title{text-align:right}
.invoice-title h1{font-size:32px;color:#1e3a8a;letter-spacing:2px}
.invoice-title .num{font-size:14px;color:#374151;margin-top:4px}
.parties{display:flex;gap:40px;margin-bottom:28px;font-size:13px}
.party h3{font-size:11px;text-transform:uppercase;color:#6b7280;letter-spacing:1px;margin-bottom:6px}
.party p{line-height:1.6;color:#374151}
.party .company{font-weight:700;color:#111}
table{width:100%;border-collapse:collapse;margin-bottom:20px;font-size:13px}
thead tr{background:#1e3a8a;color:#fff}
thead th{padding:8px 12px;text-align:left;font-weight:600}
tbody tr:nth-child(even){background:#f9fafb}
tbody td{padding:8px 12px;border-bottom:1px solid #e5e7eb;color:#374151}
.totals{margin-left:auto;width:260px;font-size:13px;border-collapse:collapse}
.totals td{padding:6px 12px}
.totals tr:last-child{background:#1e3a8a;color:#fff;font-weight:700;font-size:15px}
.bank{margin-top:24px;padding:16px;background:#eff6ff;border-left:4px solid #3b82f6;font-size:12px;color:#374151;line-height:1.8}
.bank h4{color:#1e40af;margin-bottom:6px}
.notes{margin-top:16px;font-size:12px;color:#374151;padding:12px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:4px;line-height:1.6}
.footer{margin-top:24px;font-size:11px;color:#9ca3af;text-align:center;border-top:1px solid #e5e7eb;padding-top:12px}
</style></head><body>
<div class="page">
  <div class="header">
    <div class="logo-box">COMPANY LOGO</div>
    <div class="invoice-title">
      <h1>INVOICE</h1>
      <div class="num">Invoice #: INV-20847</div>
      <div class="num">Date: 28/02/2026</div>
      <div class="num">Due: 30/03/2026</div>
    </div>
  </div>
  <div class="parties">
    <div class="party">
      <h3>From</h3>
      <p class="company">GlobalTech Solutions Ltd</p>
      <p>123 Business Park<br>London, EC2A 4NE<br>VAT: GB123456789</p>
    </div>
    <div class="party">
      <h3>Bill To</h3>
      <p class="company">Your Company Inc.</p>
      <p>456 Corporate Drive<br>Manchester, M1 5AN</p>
    </div>
  </div>
  <div style="font-weight:600;font-size:14px;margin-bottom:8px;color:#111">${esc(title)}</div>
  <table>
    <thead>
      <tr><th>#</th><th>Description</th><th>Qty</th><th>Unit Price</th><th>Amount</th></tr>
    </thead>
    <tbody>
      <tr><td>1</td><td>Professional Services — Q1 Retainer</td><td>1</td><td>$4,750.00</td><td>$4,750.00</td></tr>
      <tr><td>2</td><td>Expenses &amp; Disbursements</td><td>1</td><td>$950.00</td><td>$950.00</td></tr>
    </tbody>
  </table>
  <table class="totals">
    <tr><td>Subtotal:</td><td style="text-align:right">$5,700.00</td></tr>
    <tr><td>VAT (20%):</td><td style="text-align:right">$1,140.00</td></tr>
    <tr><td>AMOUNT DUE:</td><td style="text-align:right">$6,840.00</td></tr>
  </table>
  <div class="notes"><strong>Notes:</strong> ${contentHtml}</div>
  <div class="bank">
    <h4>Payment Instructions</h4>
    Bank: HSBC UK &middot; Sort Code: 40-00-01 &middot; Account: 12345678<br>
    Reference: INV-20847 &middot; Payment due within 30 days
  </div>
  <div class="footer">Please make payment to the account above &middot; Late payments subject to 8% interest &middot; Registered in England &amp; Wales</div>
</div>
</body></html>`;
}

// ---------------------------------------------------------------------------
// Network capture — dark Wireshark/Splunk table
// ---------------------------------------------------------------------------

function renderNetworkCapture(title: string, content: string): string {
  const lines = splitLines(content);

  const protocols = ['TCP', 'TLS', 'HTTP', 'DNS', 'ICMP'] as const;
  const protocolColors: Record<string, string> = {
    TCP: '#dbeafe', TLS: '#d1fae5', HTTP: '#fef3c7', DNS: '#f3e8ff', ICMP: '#fee2e2',
  };

  const dataLines = lines.length > 0 ? lines : [
    'SYN -> 203.0.113.42:443 [suspicious outbound]',
    'TLS ClientHello -> 203.0.113.42:443',
    'HTTP GET /config.php?id=exfil HTTP/1.1',
    'DNS query: evil.example.com A?',
    'ICMP Echo Request -> 10.0.0.254',
    'HTTP POST /upload?token=abc123',
    'TCP FIN -> 203.0.113.42:443',
  ];

  const rows = dataLines.slice(0, 20).map((line, i) => {
    const ipMatch = line.match(/\b(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\b/);
    const src = ipMatch ? ipMatch[1] : `192.0.2.${10 + i}`;
    const dst = i % 3 === 0 ? '203.0.113.42' : `10.0.0.${i + 1}`;
    const proto = protocols[i % protocols.length];
    const bg = protocolColors[proto];
    const ts = (i * 0.347).toFixed(3);
    return `<tr style="background:${bg}">
      <td>${i + 1}</td><td>${ts}</td><td>${esc(src)}</td>
      <td>${esc(dst)}</td><td>${proto}</td>
      <td style="max-width:320px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(line.slice(0, 80))}</td>
    </tr>`;
  });

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#1a1a2e;font-family:'Courier New',monospace;font-size:12px}
.toolbar{background:#16213e;padding:8px 16px;display:flex;gap:16px;align-items:center;border-bottom:1px solid #0f3460}
.toolbar .title{color:#a78bfa;font-weight:700;font-size:14px}
.btn{background:#0f3460;color:#94a3b8;padding:3px 10px;border-radius:3px;font-size:11px}
.filter-bar{background:#16213e;padding:6px 16px;display:flex;gap:8px;align-items:center;border-bottom:1px solid #1e293b}
.filter-bar input{background:#0f3460;border:1px solid #334155;color:#94a3b8;padding:4px 8px;border-radius:3px;font-size:11px;width:300px;font-family:inherit}
.apply{background:#7c3aed;color:#fff;padding:4px 10px;border-radius:3px;font-size:11px;cursor:pointer}
.stats{background:#16213e;padding:4px 16px;font-size:11px;color:#64748b;border-bottom:1px solid #1e293b}
table{width:100%;border-collapse:collapse}
thead tr{background:#0f3460}
thead th{color:#94a3b8;padding:6px 8px;text-align:left;font-size:11px;font-weight:600;border-right:1px solid #1e293b}
tbody tr{border-bottom:1px solid rgba(255,255,255,.05)}
tbody td{padding:4px 8px;color:#1e293b;font-size:11px}
.packet-detail{background:#0f1629;padding:12px 16px;border-top:2px solid #334155;color:#94a3b8;font-size:11px}
.packet-detail h3{color:#a78bfa;margin-bottom:8px;font-size:12px}
</style></head><body>
<div class="toolbar">
  <span class="title">Wireshark &#183; ${esc(title)}</span>
  <span class="btn">File</span><span class="btn">Edit</span><span class="btn">View</span>
  <span class="btn">Capture</span><span class="btn">Analyze</span>
  <span style="margin-left:auto;color:#ef4444;font-size:11px">&#9679; Live Capture</span>
</div>
<div class="filter-bar">
  <span style="color:#94a3b8;font-size:11px">Filter:</span>
  <input value="ip.addr == 203.0.113.0/24 or http">
  <span class="apply">Apply</span>
  <span class="btn" style="margin-left:8px">Clear</span>
</div>
<div class="stats">${rows.length} packets captured &middot; Elapsed: 00:04:23 &middot; Interface: eth0</div>
<table>
  <thead><tr><th>No.</th><th>Time</th><th>Source</th><th>Destination</th><th>Protocol</th><th>Info</th></tr></thead>
  <tbody>${rows.join('')}</tbody>
</table>
<div class="packet-detail">
  <h3>Packet Details</h3>
  <div>&gt; Frame 1 (54 bytes on wire)</div>
  <div>&gt; Ethernet II, Src: 00:11:22:33:44:55</div>
  <div>&gt; Internet Protocol, Src: 192.0.2.10, Dst: 203.0.113.42</div>
  <div>&gt; Transmission Control Protocol, Src Port: 54312, Dst Port: 443</div>
</div>
</body></html>`;
}

// ---------------------------------------------------------------------------
// Dark web listing — terminal green-on-black
// ---------------------------------------------------------------------------

function renderDarkWebListing(title: string, content: string): string {
  const lines = splitLines(content);
  const bodyHtml = lines.map(l => `<div class="line">${esc(l)}</div>`).join('')
    || '<div class="line">Sensitive corporate data available for purchase. Premium quality verified dump. Sample provided on request via secure channel.</div>';

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#000;color:#00ff41;font-family:'Courier New',Courier,monospace;font-size:13px;padding:16px;min-height:600px}
.prompt{color:#666;margin-bottom:8px}
.header{border:1px solid #00ff41;padding:12px;margin-bottom:16px}
.header-top{display:flex;justify-content:space-between;margin-bottom:8px}
.site-name{font-size:18px;font-weight:700;text-shadow:0 0 10px rgba(0,255,65,.5)}
.site-tag{color:#888;font-size:11px}
.nav{display:flex;gap:16px;font-size:11px;color:#00aa28;border-top:1px solid #003310;padding-top:8px;margin-top:8px}
.nav .active{color:#00ff41;text-decoration:underline}
.listing{border:1px solid #003310;padding:16px;margin-bottom:12px}
.listing-header{display:flex;justify-content:space-between;margin-bottom:12px}
.listing-title{color:#00ff41;font-size:16px;font-weight:700}
.listing-id{color:#666;font-size:11px}
.meta-row{display:flex;gap:24px;margin-bottom:12px;font-size:12px}
.meta-label{color:#555;text-transform:uppercase;font-size:10px;letter-spacing:1px}
.meta-value{color:#00cc33}
.meta-value.red{color:#ff4444}
.body{line-height:1.7;color:#00cc33;margin-bottom:12px}
.price-box{border:1px solid #00ff41;padding:12px;display:flex;justify-content:space-between;align-items:center}
.price{font-size:20px;font-weight:700}
.buy-btn{background:#00ff41;color:#000;padding:6px 20px;font-weight:700;font-size:12px;letter-spacing:1px}
.footer{color:#333;font-size:11px;margin-top:16px;border-top:1px solid #111;padding-top:8px}
.handle{color:#ff8c00}
.tag{background:#003310;color:#00aa28;padding:2px 6px;margin-right:4px;font-size:10px}
</style></head><body>
<div class="prompt">[tor@anon ~]$ lynx http://breach4sale7z2sxj.onion</div>
<div class="header">
  <div class="header-top">
    <div class="site-name">BreachMarket [v3.1]</div>
    <div class="site-tag">[ Verified &middot; PGP Required &middot; XMR Only ]</div>
  </div>
  <div style="color:#555;font-size:11px;margin-bottom:6px">Anonymous &middot; Secure &middot; No Logs &middot; Since 2019</div>
  <div class="nav">
    <span>Home</span><span>New Listings</span>
    <span class="active">Data Dumps</span>
    <span>Credentials</span><span>Contact</span>
  </div>
</div>
<div class="listing">
  <div class="listing-header">
    <div class="listing-title">${esc(title)}</div>
    <div class="listing-id">#LST-D4C9E2F1</div>
  </div>
  <div class="meta-row">
    <div><div class="meta-label">Seller</div><div class="meta-value handle">@d4rkspectr3</div></div>
    <div><div class="meta-label">Posted</div><div class="meta-value">2 days ago</div></div>
    <div><div class="meta-label">Views</div><div class="meta-value">847</div></div>
    <div><div class="meta-label">Verified</div><div class="meta-value red">&#10003; VERIFIED</div></div>
    <div><div class="meta-label">Escrow</div><div class="meta-value">Available</div></div>
  </div>
  <div style="margin-bottom:10px">
    <span class="tag">Corporate</span><span class="tag">Finance</span>
    <span class="tag">PII</span><span class="tag">Credentials</span>
  </div>
  <div class="body">${bodyHtml}</div>
  <div class="price-box">
    <div>
      <div style="font-size:11px;color:#555">ASKING PRICE</div>
      <div class="price">2.5 XMR</div>
    </div>
    <div class="buy-btn">[ BUY NOW ]</div>
  </div>
</div>
<div class="footer">[ Report &middot; PGP Key &middot; Dispute ] &middot; Use TAILS OS &middot; Route through 3+ hops</div>
</body></html>`;
}

// ---------------------------------------------------------------------------
// SCADA/ICS HMI interface — industrial control panel
// ---------------------------------------------------------------------------

function renderScadaInterface(title: string, content: string): string {
  const lines = splitLines(content);

  const severities = ['CRITICAL', 'WARNING', 'ALARM', 'WARNING'] as const;
  const severityColors: Record<string, string> = {
    CRITICAL: '#ef4444', WARNING: '#f59e0b', ALARM: '#f97316',
  };

  const dataLines = lines.length > 0 ? lines : [
    'Pressure sensor PV-101: value out of range (142.3 bar)',
    'Temperature TX-202 exceeds threshold: 87.4°C',
    'Flow meter FM-305: communication failure',
    'Valve V-107: position feedback mismatch',
  ];

  const alarmRows = dataLines.slice(0, 8).map((line, i) => {
    const sev = severities[i % severities.length];
    const color = severityColors[sev];
    const timeOffset = i * 73000;
    const t = new Date(1741356187000 - timeOffset);
    const timeStr = `${String(t.getUTCHours()).padStart(2,'0')}:${String(t.getUTCMinutes()).padStart(2,'0')}:${String(t.getUTCSeconds()).padStart(2,'0')}`;
    return `<tr>
      <td style="color:${color};font-weight:700">${sev}</td>
      <td>${esc(line.slice(0, 70))}</td>
      <td>${timeStr}</td>
      <td style="color:${color}">ACTIVE</td>
    </tr>`;
  });

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#2d2d2d;font-family:Arial,sans-serif;font-size:12px;color:#e0e0e0}
.titlebar{background:#1a1a1a;padding:6px 16px;display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid #555}
.titlebar .logo{font-size:14px;font-weight:700;color:#f59e0b;letter-spacing:2px}
.status-ok{color:#22c55e}
.status-alarm{color:#ef4444}
.main{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;padding:12px}
.gauge-panel{background:#3a3a3a;border:1px solid #555;border-radius:4px;padding:12px}
.gauge-panel .title{font-size:11px;color:#aaa;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px}
.gauge{width:80px;height:80px;border-radius:50%;margin:0 auto 8px;display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:700}
.gauge-ok{background:radial-gradient(circle,#16a34a,#15803d);color:#fff;box-shadow:0 0 15px rgba(22,163,74,.5)}
.gauge-warn{background:radial-gradient(circle,#d97706,#b45309);color:#fff;box-shadow:0 0 15px rgba(217,119,6,.5)}
.gauge-crit{background:radial-gradient(circle,#dc2626,#991b1b);color:#fff;box-shadow:0 0 15px rgba(220,38,38,.8)}
.gauge-label{text-align:center;font-size:11px;color:#aaa}
.gauge-value{text-align:center;font-size:13px;font-weight:700;color:#e0e0e0}
.process-panel{grid-column:1/-1;background:#3a3a3a;border:1px solid #555;border-radius:4px;padding:12px}
.process-panel h3{color:#f59e0b;font-size:13px;margin-bottom:8px;border-bottom:1px solid #555;padding-bottom:4px}
.alarm-table{width:100%;border-collapse:collapse;font-size:11px}
.alarm-table th{background:#1a1a1a;padding:5px 8px;text-align:left;color:#aaa;border-bottom:1px solid #555}
.alarm-table td{padding:5px 8px;border-bottom:1px solid #404040}
.hmi-title{grid-column:1/-1;background:#1a3a5c;border:1px solid #2563eb;border-radius:4px;padding:8px 16px;display:flex;justify-content:space-between;align-items:center}
.hmi-title h2{color:#60a5fa;font-size:15px;letter-spacing:1px}
.hmi-title .time{color:#94a3b8;font-size:11px}
</style></head><body>
<div class="titlebar">
  <div class="logo">&#9881; SCADA HMI v4.2</div>
  <div style="font-size:11px">
    <span class="status-alarm">&#9679; ALARM STATE</span>
    &middot; PLC: <span class="status-ok">ONLINE</span>
    &middot; Historian: <span class="status-ok">ONLINE</span>
  </div>
</div>
<div class="main">
  <div class="hmi-title">
    <h2>${esc(title)}</h2>
    <div class="time">Last Update: 14:23:07 &middot; Operator: OPS-02</div>
  </div>
  <div class="gauge-panel">
    <div class="title">Pressure PV-101</div>
    <div class="gauge gauge-crit">142</div>
    <div class="gauge-label">bar</div>
    <div class="gauge-value">OVER LIMIT</div>
  </div>
  <div class="gauge-panel">
    <div class="title">Temperature TX-202</div>
    <div class="gauge gauge-warn">87</div>
    <div class="gauge-label">&deg;C</div>
    <div class="gauge-value">HIGH</div>
  </div>
  <div class="gauge-panel">
    <div class="title">Flow FM-305</div>
    <div class="gauge gauge-ok">--</div>
    <div class="gauge-label">m&sup3;/h</div>
    <div class="gauge-value">COMM FAULT</div>
  </div>
  <div class="process-panel">
    <h3>Active Alarms &amp; Events</h3>
    <table class="alarm-table">
      <thead><tr><th>Severity</th><th>Description</th><th>Time</th><th>Status</th></tr></thead>
      <tbody>${alarmRows.join('')}</tbody>
    </table>
  </div>
</div>
</body></html>`;
}

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

/**
 * Returns a self-contained HTML string for UI-heavy artifact subtypes,
 * or null if the subtype should be rendered by an AI image provider.
 */
export function htmlArtifactForSubtype(
  subtype: ImageSubtype,
  title: string,
  content: string,
  _style?: VisualStyle,
): string | null {
  switch (subtype) {
    case 'phishing_email':     return renderPhishingEmail(title, content);
    case 'ransomware_note':    return renderRansomwareNote(title, content);
    case 'fraudulent_invoice': return renderFraudulentInvoice(title, content);
    case 'network_capture':    return renderNetworkCapture(title, content);
    case 'dark_web_listing':   return renderDarkWebListing(title, content);
    case 'scada_interface':    return renderScadaInterface(title, content);
    default:                   return null;
  }
}
