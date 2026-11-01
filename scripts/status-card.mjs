#!/usr/bin/env node
/*
 * Draws the public Uptime Kuma status page as SVG images for the GitHub profile README.
 *
 *   node scripts/status-card.mjs --base https://status.okoro.me --slug osiris --out out
 *   node scripts/status-card.mjs --from-dir test/fixtures --out out      (offline, for testing)
 *
 * Writes out/status-light.svg and out/status-dark.svg.
 * Env: EXCLUDE="cinelog.okoro.me,other name"  hides monitors by name.
 *      BARS=36                                 heartbeats drawn per row.
 *      TZ_LABEL=America/Toronto                time zone for the "Updated" line.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, a, i, all) => {
    if (a.startsWith('--')) acc.push([a.slice(2), all[i + 1]]);
    return acc;
  }, []),
);
const BASE = (args.base || 'https://status.okoro.me').replace(/\/$/, '');
const SLUG = args.slug || 'osiris';
const OUT = args.out || 'out';
const BARS = Number(process.env.BARS || 36);
const TZ = process.env.TZ_LABEL || 'America/Toronto';
const EXCLUDE = new Set(
  (process.env.EXCLUDE || '').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean),
);

/* ---------- data ---------- */

async function getJSON(path, file) {
  if (args['from-dir']) return JSON.parse(await readFile(join(args['from-dir'], file), 'utf8'));
  const res = await fetch(BASE + path, { headers: { 'user-agent': 'okoro-status-card' } });
  if (!res.ok) throw new Error(`${path} returned HTTP ${res.status}`);
  const type = res.headers.get('content-type') || '';
  if (!type.includes('json')) throw new Error(`${path} returned ${type}, not JSON (blocked by the tunnel or a challenge?)`);
  return res.json();
}

// Kuma stores UTC as "YYYY-MM-DD HH:MM:SS" with no zone.
const parseTime = (t) => new Date(/[zZ]|[+-]\d\d:?\d\d$/.test(t) ? t : `${t.replace(' ', 'T')}Z`);

function ago(date, now) {
  const m = Math.max(0, Math.round((now - date) / 60000));
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  return h < 48 ? `${h}h ago` : `${Math.round(h / 24)}d ago`;
}

/* ---------- text width (Arial metrics, 1/1000 em) ---------- */

const W = {};
' !"#$%&\'()*+,-./'.split('').forEach((c, i) =>
  (W[c] = [278, 278, 355, 556, 556, 889, 667, 191, 333, 333, 389, 584, 278, 333, 278, 278][i]));
'0123456789'.split('').forEach((c) => (W[c] = 556));
':;<=>?@'.split('').forEach((c, i) => (W[c] = [278, 278, 584, 584, 584, 556, 1015][i]));
'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').forEach((c, i) =>
  (W[c] = [667, 667, 722, 722, 667, 611, 778, 722, 278, 500, 667, 556, 833, 722, 778, 667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611][i]));
'abcdefghijklmnopqrstuvwxyz'.split('').forEach((c, i) =>
  (W[c] = [556, 556, 500, 556, 556, 278, 556, 556, 222, 222, 500, 222, 833, 556, 556, 556, 556, 333, 500, 278, 556, 500, 722, 500, 500, 500][i]));
'[\\]^_`{|}~'.split('').forEach((c, i) => (W[c] = [278, 278, 278, 469, 556, 333, 334, 260, 334, 584][i]));

const textWidth = (s, size, bold = false) =>
  ([...s].reduce((n, c) => n + (W[c] ?? 600), 0) / 1000) * size * (bold ? 1.08 : 1);

const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

function fit(s, size, max) {
  if (textWidth(s, size) <= max) return s;
  let out = s;
  while (out.length > 1 && textWidth(`${out}…`, size) > max) out = out.slice(0, -1);
  return `${out}…`;
}

/* ---------- drawing ---------- */

const STATUS = { 0: '#dc3545', 1: '#5cdd8b', 2: '#f8a306', 3: '#1747f5' };

const THEMES = {
  light: { bg: '#ffffff', border: '#e7eaee', text: '#212529', muted: '#8c96a0', empty: '#e9edf1', shadow: 'rgba(0,0,0,0.06)' },
  dark: { bg: '#0d1117', border: '#30363d', text: '#e6edf3', muted: '#8b949e', empty: '#30363d', shadow: 'rgba(0,0,0,0)' },
};

function render(monitors, theme, now) {
  const t = THEMES[theme];
  const WIDTH = 880;
  const PAD = 20;
  const ROW = 64;
  const BAR_W = 5;
  const BAR_GAP = 3;
  const BAR_H = 18;
  const barsWidth = BARS * BAR_W + (BARS - 1) * BAR_GAP;
  const barsX = WIDTH - PAD - 12 - barsWidth;
  const top = PAD + 8;
  const height = top + monitors.length * ROW + 50;

  const rows = monitors.map((m, i) => {
    const y = top + i * ROW;
    const parts = [];

    // uptime pill
    const pct = m.uptime == null ? 'N/A' : `${+(m.uptime * 100).toFixed(2)}%`;
    const pillW = Math.max(52, textWidth(pct, 12, true) + 18);
    parts.push(
      `<rect x="${PAD + 12}" y="${y + 6}" width="${pillW.toFixed(1)}" height="20" rx="10" fill="${STATUS[m.status] ?? t.empty}"/>`,
      `<text x="${(PAD + 12 + pillW / 2).toFixed(1)}" y="${y + 20}" font-size="12" font-weight="700" fill="#fff" text-anchor="middle">${esc(pct)}</text>`,
    );

    // name
    const nameX = PAD + 12 + pillW + 8;
    const name = fit(m.name, 15, barsX - nameX - 24);
    parts.push(
      `<text x="${nameX.toFixed(1)}" y="${y + 21}" font-size="15" fill="${t.text}"${m.url ? ' text-decoration="underline"' : ''}>${esc(name)}</text>`,
    );

    // tags
    let tx = PAD + 12;
    for (const tag of m.tags) {
      const label = tag.value ? `${tag.name}: ${tag.value}` : tag.name;
      const w = textWidth(label, 11) + 14;
      if (tx + w > barsX - 24) break;
      parts.push(
        `<rect x="${tx.toFixed(1)}" y="${y + 33}" width="${w.toFixed(1)}" height="18" rx="6" fill="${esc(tag.color || '#6c757d')}"/>`,
        `<text x="${(tx + 7).toFixed(1)}" y="${y + 46}" font-size="11" fill="#fff">${esc(label)}</text>`,
      );
      tx += w + 6;
    }

    // heartbeat bars, newest on the right
    const beats = m.beats.slice(-BARS);
    const offset = BARS - beats.length;
    for (let b = 0; b < BARS; b++) {
      const beat = beats[b - offset];
      const color = beat ? STATUS[beat.status] ?? t.empty : t.empty;
      const x = barsX + b * (BAR_W + BAR_GAP);
      parts.push(`<rect x="${x}" y="${y + 6}" width="${BAR_W}" height="${BAR_H}" rx="2.5" fill="${color}"/>`);
    }
    if (beats.length) {
      parts.push(
        `<text x="${barsX}" y="${y + 41}" font-size="11" fill="${t.muted}">${esc(ago(parseTime(beats[0].time), now))}</text>`,
        `<text x="${barsX + barsWidth}" y="${y + 41}" font-size="11" fill="${t.muted}" text-anchor="end">now</text>`,
      );
    }
    return parts.join('\n    ');
  });

  const updated = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ, month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'short',
  }).format(now);
  const host = BASE.replace(/^https?:\/\//, '');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${height}" viewBox="0 0 ${WIDTH} ${height}" font-family="Arial, Helvetica, sans-serif">
  <title>Live status from ${esc(host)}</title>
  <rect x="${PAD - 2}" y="${PAD - 6}" width="${WIDTH - 2 * PAD + 4}" height="${height - 2 * PAD + 10}" rx="14" fill="${t.shadow}"/>
  <rect x="${PAD}" y="${PAD - 8}" width="${WIDTH - 2 * PAD}" height="${height - 2 * PAD + 10}" rx="12" fill="${t.bg}" stroke="${t.border}"/>
  <g>
    ${rows.join('\n    ')}
  </g>
  <text x="${WIDTH - PAD - 12}" y="${height - PAD - 10}" font-size="11" fill="${t.muted}" text-anchor="end">Updated ${esc(updated)} · ${esc(host)}</text>
</svg>
`;
}

/* ---------- main ---------- */

const page = await getJSON(`/api/status-page/${SLUG}`, 'status-page.json');
const beats = await getJSON(`/api/status-page/heartbeat/${SLUG}`, 'heartbeat.json');

const monitors = (page.publicGroupList || [])
  .flatMap((g) => g.monitorList || [])
  .filter((m) => !EXCLUDE.has(String(m.name).toLowerCase()))
  .map((m) => {
    const list = [...(beats.heartbeatList?.[m.id] || [])].sort((a, b) => parseTime(a.time) - parseTime(b.time));
    return {
      name: m.name,
      url: m.url,
      tags: m.tags || [],
      beats: list,
      status: list.at(-1)?.status,
      uptime: beats.uptimeList?.[`${m.id}_24`],
    };
  });

if (!monitors.length) throw new Error('No monitors found on the status page');

const now = args['from-dir'] && process.env.NOW ? new Date(process.env.NOW) : new Date();
await mkdir(OUT, { recursive: true });
for (const theme of ['light', 'dark']) {
  await writeFile(join(OUT, `status-${theme}.svg`), render(monitors, theme, now));
}
console.log(`Drew ${monitors.length} monitors into ${OUT}/status-{light,dark}.svg`);
