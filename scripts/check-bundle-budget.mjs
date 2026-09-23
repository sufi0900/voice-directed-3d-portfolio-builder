import { readdir, stat } from "node:fs/promises";
import { join } from "node:path";

const root = join(process.cwd(), ".next", "static", "chunks");
const files = (await readdir(root, { recursive: true })).filter((file) => file.endsWith(".js"));
const sizes = await Promise.all(files.map(async (file) => ({ file, bytes: (await stat(join(root, file))).size })));
const largest = sizes.sort((a, b) => b.bytes - a.bytes)[0];
const total = sizes.reduce((sum, item) => sum + item.bytes, 0);
const maxChunk = 800 * 1024;
const maxTotal = 4 * 1024 * 1024;
if (!largest || largest.bytes > maxChunk || total > maxTotal) {
  console.error(`Bundle budget exceeded: largest=${largest ? Math.round(largest.bytes / 1024) : 0}KB total=${Math.round(total / 1024)}KB`);
  process.exit(1);
}
console.log(`Bundle budget passed: ${files.length} chunks, largest ${Math.round(largest.bytes / 1024)}KB, total ${Math.round(total / 1024)}KB.`);
