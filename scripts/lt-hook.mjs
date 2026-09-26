// The Claude Code hooks for this app, wired in .claude/settings.json.
//
//   node scripts/lt-hook.mjs after-edit    after every Write or Edit
//   node scripts/lt-hook.mjs before-stop   before the AI ends its turn
//
// after-edit lints the one file just edited, if it is under src/: ESLint for
// code, and Stylelint as well for a .css file. before-stop does the same for
// every file under src/ that git lists as changed. Both are silent and exit 0
// when clean. On a finding they print it and exit 2, which is what makes Claude
// Code hand the message to the AI (it reads stderr on exit 2), so the AI fixes
// the finding on the edit that caused it, before the person hears about it.
// Only the app's own node_modules are used; nothing here needs installing.

import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = process.env.CLAUDE_PROJECT_DIR || path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const src = path.join(root, "src");
const CODE = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs"]);

function payload() {
  try {
    return JSON.parse(readFileSync(0, "utf8") || "{}");
  } catch {
    return {};
  }
}

function underSrc(file) {
  const rel = path.relative(src, file);
  return rel && !rel.startsWith("..") && !path.isAbsolute(rel);
}

function firstJson(text) {
  const start = (text || "").indexOf("[");
  if (start < 0) return null;
  try {
    return JSON.parse(text.slice(start));
  } catch {
    return null;
  }
}

function run(bin, args, files) {
  const script = path.join(root, "node_modules", ...bin.split("/"));
  if (!existsSync(script)) return { problem: `${bin.split("/")[0]} is not installed; run npm install.` };
  const proc = spawnSync(process.execPath, [script, ...args, ...files], { cwd: root, encoding: "utf8", maxBuffer: 32 * 1024 * 1024 });
  return proc;
}

function rel(file) {
  return path.relative(root, file).split(path.sep).join("/");
}

function eslint(files) {
  const proc = run("eslint/bin/eslint.js", ["--format", "json", "--no-warn-ignored"], files);
  if (proc.problem) return { problem: proc.problem };
  const results = firstJson(proc.stdout);
  if (proc.status === 2 || !results) return { problem: "ESLint did not run: " + (proc.stderr || proc.stdout).trim().split("\n").slice(0, 6).join(" / ") };
  const found = [];
  for (const r of results)
    for (const m of r.messages)
      if (m.severity === 2) found.push([m.ruleId || (m.fatal ? "parse error" : "eslint"), `  ${rel(r.filePath)}:${m.line ?? 0}:${m.column ?? 0}  ${m.message.trim()}`]);
  return { found };
}

function stylelint(files) {
  const proc = run("stylelint/bin/stylelint.mjs", ["--formatter", "json", "--allow-empty-input"], files);
  if (proc.problem) return { problem: proc.problem };
  const results = firstJson(proc.stdout) || firstJson(proc.stderr);
  if (!results) return { problem: "Stylelint did not run: " + (proc.stderr || proc.stdout).trim().split("\n").slice(0, 6).join(" / ") };
  const found = [];
  for (const r of results) {
    for (const w of r.warnings) if (w.severity === "error") found.push([w.rule || "stylelint", `  ${rel(r.source)}:${w.line ?? 0}:${w.column ?? 0}  ${w.text.trim()}`]);
    for (const w of r.parseErrors || []) found.push(["parse error", `  ${rel(r.source)}:${w.line ?? 0}  ${w.text.trim()}`]);
  }
  return { found };
}

/** Lints the given files; returns the message to show, or "" when clean. */
function lint(files) {
  files = files.filter((f) => underSrc(f) && existsSync(f));
  const code = files.filter((f) => CODE.has(path.extname(f).toLowerCase()));
  const css = files.filter((f) => f.toLowerCase().endsWith(".css"));
  const found = [];
  const problems = [];
  for (const [tool, batch] of [[eslint, code], [stylelint, css]]) {
    if (!batch.length) continue;
    const got = tool(batch);
    if (got.problem) problems.push(got.problem);
    else found.push(...got.found);
  }
  if (problems.length) return "livetools: " + problems.join("; ");
  if (!found.length) return "";
  // Group by rule: the rule name, then each finding indented under it.
  found.sort((a, b) => a[0].localeCompare(b[0]));
  const lines = [];
  let heading;
  for (const [rule, line] of found) {
    if (rule !== heading) lines.push((heading = rule));
    lines.push(line);
  }
  return (
    "The design-system lint fails on the file you just edited. Fix the cause rather than working around it: " +
    "use the Livetools part the message names, and if no token fits, define one in src/app-tokens.css. " +
    "Never add a disable comment or switch a rule off.\n\n" +
    lines.join("\n")
  );
}

function changedUnderSrc() {
  const proc = spawnSync("git", ["status", "--porcelain", "--untracked-files=all", "--", "src"], { cwd: root, encoding: "utf8" });
  if (proc.status !== 0) return [];
  return proc.stdout
    .split("\n")
    .filter((l) => l.trim() && !l.startsWith(" D") && !l.startsWith("D "))
    .map((l) => l.slice(3).replace(/^.* -> /, "").replace(/^"|"$/g, ""))
    .map((p) => path.join(root, p));
}

function finish(message) {
  if (!message) process.exit(0);
  process.stderr.write(message + "\n");
  process.exit(2);
}

const mode = process.argv[2];
const data = payload();
if (mode === "after-edit") {
  const edited = data.tool_input?.file_path || data.tool_response?.filePath;
  if (!edited) process.exit(0);
  finish(lint([path.resolve(data.cwd || root, edited)]));
} else if (mode === "before-stop") {
  // Set when this hook already stopped the turn once; without it a finding the
  // AI cannot fix would stop the turn from ever ending.
  if (data.stop_hook_active) process.exit(0);
  const message = lint(changedUnderSrc());
  finish(message && message.replace("the file you just edited", "files changed in this session"));
} else {
  process.exit(0);
}
