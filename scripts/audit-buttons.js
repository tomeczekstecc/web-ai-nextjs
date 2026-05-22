const fs = require("fs");
const path = require("path");

function walk(dir) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name).split(path.sep).join("/");
    if (e.isDirectory()) out.push(...walk(p));
    else if (e.name.endsWith(".tsx")) out.push(p);
  }
  return out;
}

const SKIP = ["src/components/ui/"];
const files = walk("src").filter((f) => !SKIP.some((s) => f.startsWith(s)));

const open = /<Button\b|render=\{?\s*<Button\b/;
const results = [];

for (const f of files) {
  const text = fs.readFileSync(f, "utf8");
  const lines = text.split("\n");
  for (let i = 0; i < lines.length; i++) {
    if (!open.test(lines[i])) continue;
    const start = i;
    let j = i;
    const buf = [];
    while (j < Math.min(lines.length, i + 30)) {
      buf.push(lines[j]);
      const cur = lines[j];
      if (j > i && (/<\/Button>/.test(cur) || /\/>\s*($|[,)}\]])/.test(cur))) {
        j++;
        break;
      }
      if (j === i && /\/>\s*($|[,)}\]])/.test(cur)) {
        j++;
        break;
      }
      j++;
    }
    const block = buf.join("\n");
    const vm = block.match(/variant=["'](\w+)["']/);
    const variant = vm ? vm[1] : "default";
    const sm = block.match(/size=["']([\w-]+)["']/);
    const size = sm ? sm[1] : "default";
    let label = "";
    const lm = block.match(/>\s*([^<>{][^<>]*?)\s*<\/Button>/s);
    if (lm) label = lm[1];
    if (!label) {
      const aria = block.match(/aria-label=["']([^"']+)["']/);
      if (aria) label = "[aria] " + aria[1];
    }
    if (!label) {
      const expr = block.match(/>\s*(\{[^}]+\})\s*<\/Button>/s);
      if (expr) label = expr[1];
    }
    label = label.replace(/\s+/g, " ").slice(0, 100);
    results.push({ f, line: start + 1, variant, size, label });
    i = j - 1;
  }
}

const groups = {};
for (const r of results) (groups[r.variant] ||= []).push(r);

for (const v of ["destructive", "default", "outline", "secondary", "ghost", "link"]) {
  const rows = groups[v] || [];
  console.log(`\n### variant=${v}  (${rows.length})`);
  for (const r of rows) {
    console.log(`  ${r.f}:${r.line}  size=${r.size}  label=${JSON.stringify(r.label)}`);
  }
}
console.log(`\nTOTAL: ${results.length}`);
