// The app's whole lint config: the Livetools app rules, extended from the
// package and never copied (plan phase 5). See @livetools/ui's src/lint/eslint.ts.
import livetools from "@livetools/ui/eslint";

export default [...livetools.configs.recommended];
