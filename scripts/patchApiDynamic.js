const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '../src/app/api');
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath);
    } else if (/^route\.(ts|js)$/.test(entry.name)) {
      const text = fs.readFileSync(fullPath, 'utf8');
      if (text.includes('export const dynamic')) continue;
      const match = text.match(/^(import[^\n]*(?:\n|\r\n))+/);
      const out = match
        ? text.slice(0, match[0].length) + "export const dynamic = 'force-dynamic';\n" + text.slice(match[0].length)
        : "export const dynamic = 'force-dynamic';\n" + text;
      fs.writeFileSync(fullPath, out, 'utf8');
      console.log('patched', fullPath);
    }
  }
}
walk(root);
