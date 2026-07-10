import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = path.join(root, "geometry_wars_3d_glm5_2.html");
const outputDir = path.join(root, ".tmp", "reverse");

const source = await readFile(sourcePath, "utf8");
const openTag = '<script type="module">';
const closeTag = "</script>";
const openIndex = source.indexOf(openTag);
const closeIndex = source.lastIndexOf(closeTag);

if (openIndex < 0 || closeIndex < 0 || closeIndex <= openIndex) {
  throw new Error("Unable to locate the canonical module script");
}
if (source.indexOf(openTag, openIndex + openTag.length) >= 0) {
  throw new Error("Expected exactly one module script");
}

const bodyStart = openIndex + openTag.length;
const moduleBody = source.slice(bodyStart, closeIndex);
const copyrightMarker = "Copyright 2010-2023 Three.js Authors";
const copyrightIndex = moduleBody.indexOf(copyrightMarker);
const vendorStart = moduleBody.lastIndexOf("/**", copyrightIndex);
const tailMarker = "class mg {";
const vendorEnd = moduleBody.indexOf(tailMarker, vendorStart);

if (vendorStart < 0 || vendorEnd < 0) {
  throw new Error("Unable to locate the Three.js bundle boundaries");
}
if (moduleBody.indexOf(tailMarker, vendorEnd + tailMarker.length) >= 0) {
  throw new Error("Expected a unique game tail marker");
}

const shellPrefix = source.slice(0, bodyStart);
const gameFront = moduleBody.slice(0, vendorStart);
const vendorBundle = moduleBody.slice(vendorStart, vendorEnd);
const gameTail = moduleBody.slice(vendorEnd);
const shellSuffix = source.slice(closeIndex);
const reassembled = shellPrefix + gameFront + vendorBundle + gameTail + shellSuffix;

const sha256 = (value) => createHash("sha256").update(value, "utf8").digest("hex");
const sourceHash = sha256(source);
const reassembledHash = sha256(reassembled);
if (sourceHash !== reassembledHash) {
  throw new Error(`Reassembly mismatch: ${sourceHash} != ${reassembledHash}`);
}

const revisionMatch = vendorBundle.slice(0, 512).match(/const\s+[\w$]+\s*=\s*"(\d+)"/);
if (!revisionMatch) {
  throw new Error("Unable to identify the bundled Three.js revision");
}

const gameModule = [
  'import * as THREE from "three";',
  "",
  "// Extracted game code. Bundled Three.js aliases are intentionally unresolved at this phase.",
  gameFront,
  gameTail,
].join("\n");

await mkdir(outputDir, { recursive: true });
const outputs = {
  "shell.prefix.html": shellPrefix,
  "game.front.js": gameFront,
  [`vendor.three-r${revisionMatch[1]}.js`]: vendorBundle,
  "game.tail.js": gameTail,
  "game.module.js": gameModule,
  "shell.suffix.html": shellSuffix,
};

for (const [name, contents] of Object.entries(outputs)) {
  await writeFile(path.join(outputDir, name), contents, "utf8");
}

const bytes = (value) => Buffer.byteLength(value, "utf8");
const manifest = {
  source: path.basename(sourcePath),
  sourceBytes: bytes(source),
  sourceSha256: sourceHash,
  reassembledSha256: reassembledHash,
  threeRevision: revisionMatch[1],
  boundaries: {
    moduleBodyStart: bodyStart,
    vendorStart: bodyStart + vendorStart,
    vendorEnd: bodyStart + vendorEnd,
    moduleBodyEnd: closeIndex,
  },
  outputs: Object.fromEntries(
    Object.entries(outputs).map(([name, contents]) => [
      name,
      { bytes: bytes(contents), sha256: sha256(contents) },
    ]),
  ),
};

await writeFile(
  path.join(outputDir, "manifest.json"),
  `${JSON.stringify(manifest, null, 2)}\n`,
  "utf8",
);

console.log(JSON.stringify(manifest, null, 2));
