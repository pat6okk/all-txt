import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

const SOURCE_RELATIVE_PATH = "AGENTS.md";
const GENERATED_NOTICE =
  "<!-- AUTO-GENERATED from AGENTS.md. Do not edit directly. Run `npm run sync:agents`. -->";

const args = new Set(process.argv.slice(2));
const checkMode = args.has("--check");

if (args.size > (checkMode ? 1 : 0)) {
  console.error("Usage: node scripts/sync-agent-instructions.mjs [--check]");
  process.exit(1);
}

function normalizeNewlines(text) {
  return text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
}

function ensureTrailingNewline(text) {
  return text.endsWith("\n") ? text : `${text}\n`;
}

function buildCopilotContent(canonicalContent) {
  return ensureTrailingNewline(
    `${GENERATED_NOTICE}\n\n${canonicalContent.trimEnd()}\n`,
  );
}

function buildAgentRuleContent(canonicalContent) {
  return ensureTrailingNewline(
    `---\ntrigger: always_on\n---\n\n${GENERATED_NOTICE}\n\n${canonicalContent.trimEnd()}\n`,
  );
}

async function readTextFile(absolutePath) {
  const raw = await readFile(absolutePath, "utf8");
  return ensureTrailingNewline(normalizeNewlines(raw));
}

async function readTextFileIfExists(absolutePath) {
  try {
    return await readTextFile(absolutePath);
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      return null;
    }
    throw error;
  }
}

async function main() {
  const sourceAbsolutePath = path.join(repoRoot, SOURCE_RELATIVE_PATH);
  const canonicalContent = await readTextFile(sourceAbsolutePath);

  const targets = [
    {
      relativePath: ".github/copilot-instructions.md",
      render: buildCopilotContent,
    },
    {
      relativePath: ".agent/rules/obsidian-expert.md",
      render: buildAgentRuleContent,
    },
  ];

  const mismatches = [];

  for (const target of targets) {
    const targetAbsolutePath = path.join(repoRoot, target.relativePath);
    const expectedContent = target.render(canonicalContent);
    const currentContent = await readTextFileIfExists(targetAbsolutePath);
    const isDifferent = currentContent !== expectedContent;

    if (checkMode) {
      if (isDifferent) {
        mismatches.push(target.relativePath);
      }
      continue;
    }

    if (isDifferent) {
      await mkdir(path.dirname(targetAbsolutePath), { recursive: true });
      await writeFile(targetAbsolutePath, expectedContent, "utf8");
      console.log(`updated ${target.relativePath}`);
    } else {
      console.log(`ok ${target.relativePath}`);
    }
  }

  if (checkMode) {
    if (mismatches.length > 0) {
      console.error("Agent instruction files are out of sync with AGENTS.md:");
      for (const relativePath of mismatches) {
        console.error(`- ${relativePath}`);
      }
      console.error("Run `npm run sync:agents` to fix.");
      process.exit(1);
    }
    console.log("All agent instruction files are in sync.");
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
