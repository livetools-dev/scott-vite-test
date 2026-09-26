// The duplicate-library check, the last step of `npm run check`.
//
// Two copies of React, or of either behaviour library the Livetools parts are
// built on, break every part at once: hooks stop working and menus, dialogs and
// fields misbehave in ways that look like a bug in the part. This reads the
// installed tree and fails with a sentence if any of these is installed at more
// than one version. It needs nothing but Node.

import { execSync } from "node:child_process";

const WATCHED = ["react", "react-dom", "@base-ui/react", "react-aria-components"];

let tree;
try {
  // npm ls exits non-zero on an extraneous or missing package but still prints the tree.
  tree = JSON.parse(execSync("npm ls --all --json", { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"], maxBuffer: 64 * 1024 * 1024 }));
} catch (error) {
  try {
    tree = JSON.parse(error.stdout);
  } catch {
    console.error("The duplicate-library check could not read the installed packages. Run npm install, then try again.");
    process.exit(1);
  }
}

const versions = new Map(WATCHED.map((name) => [name, new Set()]));

function walk(node) {
  for (const [name, child] of Object.entries(node.dependencies ?? {})) {
    if (versions.has(name) && child.version) versions.get(name).add(child.version);
    walk(child);
  }
}
walk(tree);

const doubled = [...versions].filter(([, found]) => found.size > 1);
if (doubled.length) {
  for (const [name, found] of doubled) {
    console.error(`More than one copy of ${name} is installed (${[...found].join(", ")}). Two copies break every Livetools part, so this app will not work until only one is left.`);
  }
  process.exit(1);
}
console.log("One copy each of " + WATCHED.join(", ") + ".");
