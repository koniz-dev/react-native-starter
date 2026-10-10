// Applies scripts/maintainer-files.json to a copy (stand-in for #47's init script).
const fs = require('fs');
const path = require('path');
const root = process.argv[2];
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'scripts/maintainer-files.json'), 'utf8'));
for (const block of manifest.blocks) {
  const file = path.join(root, block.file);
  const text = fs.readFileSync(file, 'utf8');
  const start = text.indexOf(block.start);
  const end = text.indexOf(block.end);
  if (start < 0 || end < start) throw new Error(`markers not found in ${block.file}`);
  fs.writeFileSync(file, text.slice(0, start) + text.slice(end + block.end.length).replace(/^\n+/, ''));
  console.log(`removed block from ${block.file}`);
}
for (const rel of manifest.files) {
  fs.rmSync(path.join(root, rel), { recursive: true, force: true });
  console.log(`deleted ${rel}`);
}
