import { writeFileSync } from "node:fs";

const USER = "0wl-X";
const SKILLS = { "C#": 90, "C": 90, "C++": 88, "JavaScript": 86, "Node.js": 82, "Python": 72 };
const BG = "#0a1220", FG = "#c9d1d9", AC = "#4DA3FF", MUTED = "#1c2b45";
const FONT = "JetBrains Mono, Consolas, monospace";
const headers = { Accept: "application/vnd.github+json", ...(process.env.GITHUB_TOKEN && { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` }) };
const api = async (path) => (await fetch(`https://api.github.com${path}`, { headers })).json();

const radar = (title, data) => {
  const keys = Object.keys(data), n = keys.length, cx = 210, cy = 215, r = 120;
  const pt = (i, v) => {
    const a = (Math.PI * 2 * i) / n - Math.PI / 2;
    return [cx + Math.cos(a) * r * v, cy + Math.sin(a) * r * v];
  };
  const ring = (v) => keys.map((_, i) => pt(i, v).map((x) => x.toFixed(1)).join(",")).join(" ");
  const rings = [0.2, 0.4, 0.6, 0.8, 1].map((v) => `<polygon points="${ring(v)}" fill="none" stroke="${MUTED}"/>`).join("");
  const axes = keys.map((_, i) => { const [x, y] = pt(i, 1); return `<line x1="${cx}" y1="${cy}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="${MUTED}"/>`; }).join("");
  const max = Math.max(...Object.values(data));
  const shape = keys.map((k, i) => pt(i, data[k] / max).map((x) => x.toFixed(1)).join(",")).join(" ");
  const dots = keys.map((k, i) => { const [x, y] = pt(i, data[k] / max); return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4" fill="${AC}"/>`; }).join("");
  const labels = keys.map((k, i) => {
    const [x, y] = pt(i, 1.2);
    const anchor = x < cx - 10 ? "end" : x > cx + 10 ? "start" : "middle";
    return `<text x="${x.toFixed(1)}" y="${(y + 4).toFixed(1)}" fill="${FG}" font-family="${FONT}" font-size="12" text-anchor="${anchor}">${k}</text>`;
  }).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="420" height="400" viewBox="0 0 420 400"><rect width="420" height="400" rx="12" fill="${BG}" stroke="${MUTED}"/><text x="210" y="34" fill="${AC}" font-family="${FONT}" font-size="16" font-weight="700" text-anchor="middle">${title}</text>${rings}${axes}<polygon points="${shape}" fill="${AC}" fill-opacity=".25" stroke="${AC}" stroke-width="2"/>${dots}${labels}</svg>`;
};

const card = (name, rows) => {
  const body = rows.map(([k, v], i) => `<text x="30" y="${75 + i * 28}" fill="${FG}" font-family="${FONT}" font-size="14">${k}</text><text x="440" y="${75 + i * 28}" fill="${AC}" font-family="${FONT}" font-size="14" font-weight="700" text-anchor="end">${v}</text>`).join("");
  const h = 90 + rows.length * 28;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="470" height="${h}" viewBox="0 0 470 ${h}"><rect width="470" height="${h}" rx="12" fill="${BG}" stroke="${MUTED}"/><text x="30" y="38" fill="${AC}" font-family="${FONT}" font-size="17" font-weight="700">${name}'s GitHub Stats</text>${body}</svg>`;
};

writeFileSync("assets/radar-dark.svg", radar("skills", SKILLS));

if (process.argv[2] !== "skills") {
  const user = await api(`/users/${USER}`);
  const repos = (await api(`/users/${USER}/repos?per_page=100&type=owner`)).filter((r) => !r.fork);
  const stars = repos.reduce((s, r) => s + r.stargazers_count, 0);
  const forks = repos.reduce((s, r) => s + r.forks_count, 0);
  const bytes = {};
  for (const r of repos) {
    const l = await api(`/repos/${USER}/${r.name}/languages`);
    for (const [k, v] of Object.entries(l)) bytes[k] = (bytes[k] || 0) + v;
  }
  const top = Object.entries(bytes).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const langs = Object.fromEntries(top.length >= 3 ? top : [["JavaScript", 1], ["Python", 1], ["C#", 1]]);
  writeFileSync("assets/radar-langs-dark.svg", radar("languages", langs));
  writeFileSync("assets/card-stats-dark.svg", card("Owl", [["Total Stars", stars], ["Total Forks", forks], ["Public Repos", user.public_repos], ["Followers", user.followers], ["Following", user.following]]));
}
